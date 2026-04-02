import type * as Party from "partykit/server";
import {
  createInitialState,
  transition,
  type RetroState,
  type RetroEvent,
  type RetroCard,
} from "../src/lib/state-machines/retro";

/**
 * PartyKit server for retro rooms.
 *
 * Same architecture as estimation: clients send events, server runs
 * transition(), broadcasts new state. Server is single source of truth.
 *
 * ANONYMITY: During writing phase, the server strips the sender's
 * real identity and assigns a random anonymousId. The mapping is
 * NEVER broadcast. No typing indicators are sent.
 */

interface ConnectionState {
  participantId: string;
  participantName: string;
  anonymousId: string; // unique per connection, never revealed
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default class RetroServer implements Party.Server {
  state: RetroState;
  timerInterval: ReturnType<typeof setInterval> | null = null;

  constructor(readonly room: Party.Room) {
    this.state = createInitialState("");
  }

  async onStart() {
    const saved = await this.room.storage.get<RetroState>("state");
    if (saved) {
      // Migrate old state that may not have cardPositions
      this.state = {
        ...saved,
        cardPositions: saved.cardPositions ?? {},
      };
      // Resume timer if it was running
      if (this.state.phase === "discussing" && this.state.discussion.timerRunning) {
        this.startTimerInterval();
      }
    }
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url);
    const name = url.searchParams.get("name") ?? "Anonymous";
    const participantId = conn.id;
    const anonymousId = generateId();

    conn.setState({
      participantId,
      participantName: name,
      anonymousId,
    } satisfies ConnectionState);

    // Add participant
    this.state = transition(this.state, {
      type: "PARTICIPANT_JOIN",
      participant: { id: participantId, name, joinedAt: Date.now() },
    });

    // Assign facilitator if needed
    const facilitatorStillHere = this.isFacilitatorConnected();
    if (!this.state.facilitatorId || !facilitatorStillHere) {
      this.state = { ...this.state, facilitatorId: participantId };
    }

    await this.persist();

    // Send full state + identity to new connection
    conn.send(
      JSON.stringify({
        type: "sync",
        state: this.state,
        you: participantId,
        anonymousId, // so client knows which cards are "theirs"
      })
    );

    // Broadcast updated state to everyone
    this.broadcast();
  }

  async onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    if (typeof message !== "string") return;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(message) as Record<string, unknown>;
    } catch {
      return;
    }

    const connState = sender.state as ConnectionState | undefined;
    if (!connState) return;

    // ── Cursor position (transient, not persisted) ──
    if (parsed.type === "CURSOR_MOVE") {
      // Broadcast cursor to everyone except sender
      this.room.broadcast(
        JSON.stringify({
          type: "cursor",
          participantId: connState.participantId,
          name: connState.participantName,
          x: parsed.x,
          y: parsed.y,
        }),
        [sender.id]
      );
      return;
    }

    let event = parsed as RetroEvent;

    // ── Anonymity enforcement for ADD_CARD ──
    // Client sends category + text. Server assigns anonymous ID and card ID.
    if (event.type === "ADD_CARD") {
      const clientEvent = event as unknown as {
        type: "ADD_CARD";
        category: RetroCard["category"];
        text: string;
      };
      event = {
        type: "ADD_CARD",
        card: {
          id: generateId(),
          category: clientEvent.category,
          text: clientEvent.text,
          anonymousId: connState.anonymousId,
          createdAt: Date.now(),
        },
      };
    }

    // Inject anonymousId for EDIT_CARD (only author can edit)
    if (event.type === "EDIT_CARD") {
      event = { ...event, anonymousId: connState.anonymousId };
    }

    // Inject anonymousId for REMOVE_CARD (only author can remove)
    if (event.type === "REMOVE_CARD") {
      event = { ...event, anonymousId: connState.anonymousId };
    }

    // Inject sender's real ID for votes (for dedup / limit)
    if (event.type === "CAST_VOTE" || event.type === "REMOVE_VOTE") {
      event = { ...event, odiedId: connState.participantId };
    }

    // Inject facilitatorId for facilitator actions
    if ("facilitatorId" in event && connState) {
      event = { ...event, facilitatorId: connState.participantId };
    }

    const nextState = transition(this.state, event);

    if (nextState !== this.state) {
      // Handle timer lifecycle
      const wasDiscussing = this.state.phase === "discussing";
      const isDiscussing = nextState.phase === "discussing";

      if (isDiscussing && nextState.discussion.timerRunning && !this.timerInterval) {
        this.startTimerInterval();
      } else if (isDiscussing && !nextState.discussion.timerRunning && this.timerInterval) {
        this.stopTimerInterval();
      } else if (!isDiscussing && this.timerInterval) {
        this.stopTimerInterval();
      }

      this.state = nextState;
      await this.persist();
      this.broadcast();

      // Save to DB when retro closes
      if (nextState.phase === "closed" && this.state.teamId) {
        this.saveToDatabase().catch((err) =>
          console.error("[retro] Failed to save to DB:", err)
        );
      }
    }
  }

  async onClose(conn: Party.Connection) {
    const connState = conn.state as ConnectionState | undefined;
    if (connState) {
      this.state = transition(this.state, {
        type: "PARTICIPANT_LEAVE",
        participantId: connState.participantId,
      });

      // Reassign facilitator if needed
      if (this.state.facilitatorId === connState.participantId) {
        const next = this.getFirstConnectedParticipantId(connState.participantId);
        if (next) {
          this.state = { ...this.state, facilitatorId: next };
        }
      }

      await this.persist();
      this.broadcast();
    }
  }

  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method === "GET") {
      return new Response(JSON.stringify(this.state), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (req.method === "POST") {
      const body = (await req.json()) as { action?: string };
      if (body.action === "reset") {
        this.state = createInitialState("");
        this.stopTimerInterval();
        await this.persist();
        this.broadcast();
        return new Response("OK");
      }
    }
    return new Response("Not found", { status: 404 });
  }

  // ── Timer ──

  private startTimerInterval() {
    this.stopTimerInterval();
    this.timerInterval = setInterval(async () => {
      const nextState = transition(this.state, { type: "TICK_TIMER" });
      if (nextState !== this.state) {
        this.state = nextState;
        // Only persist every 5 seconds to reduce writes
        if (this.state.discussion.timerRemaining % 5 === 0) {
          await this.persist();
        }
        this.broadcast();
      }
      // Auto-stop when timer hits 0
      if (this.state.discussion.timerRemaining <= 0) {
        this.state = {
          ...this.state,
          discussion: { ...this.state.discussion, timerRunning: false },
        };
        this.stopTimerInterval();
        await this.persist();
        this.broadcast();
      }
    }, 1000);
  }

  private stopTimerInterval() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ── DB Persistence ──

  private async saveToDatabase() {
    // Call the Next.js API route to persist the retro
    const apiHost = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3456";
    const res = await fetch(`${apiHost}/api/retros/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomCode: this.room.id,
        teamId: this.state.teamId,
        createdBy: this.state.createdBy,
        state: this.state,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Save failed (${res.status}): ${text}`);
    }
    const data = await res.json();
    console.log(`[retro] Saved retro ${data.retroId} for room ${this.room.id}`);
  }

  // ── Helpers ──

  private isFacilitatorConnected(): boolean {
    for (const conn of this.room.getConnections()) {
      const cs = conn.state as ConnectionState | undefined;
      if (cs?.participantId === this.state.facilitatorId) return true;
    }
    return false;
  }

  private getFirstConnectedParticipantId(excludeId?: string): string | null {
    for (const conn of this.room.getConnections()) {
      const cs = conn.state as ConnectionState | undefined;
      if (cs && cs.participantId !== excludeId) return cs.participantId;
    }
    return null;
  }

  private broadcast() {
    const message = JSON.stringify({ type: "update", state: this.state });
    this.room.broadcast(message);
  }

  private async persist() {
    await this.room.storage.put("state", this.state);
  }
}

RetroServer satisfies Party.Worker;
