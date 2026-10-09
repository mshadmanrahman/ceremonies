import { Server, type Connection, type ConnectionContext } from "partyserver";
import {
  createInitialState,
  transition,
  type RetroState,
  type RetroEvent,
  type RetroCard,
} from "../src/lib/state-machines/retro";

/**
 * PartyServer (Cloudflare Durable Object) server for retro rooms.
 *
 * Same architecture as estimation: clients send events, server runs
 * transition(), broadcasts new state. Server is single source of truth.
 *
 * ANONYMITY: During writing phase, the server strips the sender's
 * real identity and assigns a random anonymousId. The mapping is NEVER
 * broadcast. Typing indicators are ephemeral: only participantIds are
 * broadcast (never names), and clients filter their own ID before showing
 * the indicator. Typing state is never persisted to storage.
 */

interface ConnectionState {
  participantId: string;
  participantName: string;
  anonymousId: string; // unique per connection, never revealed
  userId: string | null; // Clerk userId, null for anonymous participants
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export class RetroServer extends Server<Env> {
  state: RetroState = createInitialState("");
  timerInterval: ReturnType<typeof setInterval> | null = null;
  /** Ephemeral set of participantIds currently typing. Never persisted. */
  private typingParticipants: Set<string> = new Set();


  async onStart() {
    const saved = await this.ctx.storage.get<RetroState>("state");
    if (saved) {
      // Migrate old state that may not have cardPositions or renamedLabels
      this.state = {
        ...saved,
        cardPositions: saved.cardPositions ?? {},
        renamedLabels: saved.renamedLabels ?? {},
      };
      // Resume timer if it was running
      if (
        this.state.phase === "discussing" &&
        this.state.discussion.timerRunning
      ) {
        this.startTimerInterval();
      }
    }
  }

  async onConnect(conn: Connection, ctx: ConnectionContext) {
    const url = new URL(ctx.request.url);
    const name = url.searchParams.get("name") ?? "Anonymous";
    // Reuse the client's persisted anonymousId for session continuity across reconnects.
    // Also use it as the participantId so reconnects do not accidentally transfer
    // facilitation to whoever happens to join next.
    const anonymousId = url.searchParams.get("anonId") || generateId();
    const participantId = anonymousId;
    // Clerk userId forwarded by the client; null for anonymous participants
    const userId = url.searchParams.get("userId") ?? null;

    conn.setState({
      participantId,
      participantName: name,
      anonymousId,
      userId,
    } satisfies ConnectionState);

    // Add participant
    this.state = transition(this.state, {
      type: "PARTICIPANT_JOIN",
      participant: { id: participantId, name, joinedAt: Date.now() },
    });

    // Assign the facilitator when a room/session starts. After that,
    // facilitation only changes via an explicit TRANSFER_FACILITATION event.
    // The retro's creator (matched by Clerk userId) may reclaim it on reconnect,
    // unless an explicit transfer has been made. Never hand it to whoever
    // happens to reconnect first after every socket drops.
    const isCreator =
      userId !== null && userId === this.state.createdBy;
    // The creator reclaims facilitation on join (e.g. from a new device),
    // unless it was explicitly handed off, or one of the creator's own live
    // connections already holds it (a second tab must not steal from the first).
    if (
      !this.state.facilitatorId ||
      (isCreator &&
        !this.state.facilitatorLocked &&
        !this.isCreatorConnectedAsFacilitator(conn.id))
    ) {
      this.state = { ...this.state, facilitatorId: participantId };
    }

    // The facilitator is back, so nobody may claim facilitation now.
    if (this.state.facilitatorId === participantId) {
      this.state = { ...this.state, facilitatorAwaySince: null };
    }

    await this.persist();

    // Send full state + identity to new connection
    conn.send(
      JSON.stringify({
        type: "sync",
        state: this.state,
        you: participantId,
        anonymousId, // so client knows which cards are "theirs"
      }),
    );

    // Broadcast updated state to everyone
    this.broadcastState();
  }

  async onMessage(sender: Connection, message: string | ArrayBuffer) {
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
      this.broadcast(
        JSON.stringify({
          type: "cursor",
          participantId: connState.participantId,
          name: connState.participantName,
          x: parsed.x,
          y: parsed.y,
        }),
        [sender.id],
      );
      return;
    }

    // ── Typing indicators (ephemeral, never persisted, never includes names) ──
    if (parsed.type === "TYPING_START") {
      this.typingParticipants.add(connState.participantId);
      this.broadcastTyping();
      return;
    }
    if (parsed.type === "TYPING_STOP") {
      this.typingParticipants.delete(connState.participantId);
      this.broadcastTyping();
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

    // Claims use the sender's real ID and the server clock, never the client's
    if (event.type === "CLAIM_FACILITATION") {
      event = { ...event, participantId: connState.participantId, now: Date.now() };
    }

    const nextState = transition(this.state, event);

    if (nextState !== this.state) {
      // Handle timer lifecycle
      const wasDiscussing = this.state.phase === "discussing";
      const isDiscussing = nextState.phase === "discussing";

      if (
        isDiscussing &&
        nextState.discussion.timerRunning &&
        !this.timerInterval
      ) {
        this.startTimerInterval();
      } else if (
        isDiscussing &&
        !nextState.discussion.timerRunning &&
        this.timerInterval
      ) {
        this.stopTimerInterval();
      } else if (!isDiscussing && this.timerInterval) {
        this.stopTimerInterval();
      }

      this.state = nextState;
      await this.persist();
      this.broadcastState();

      // Save to DB when retro closes (teamId optional — anonymous retros save too)
      if (nextState.phase === "closed") {
        this.saveToDatabase().catch((err) => {
          console.error("[retro] Failed to save to DB:", err);
          this.broadcast(JSON.stringify({ type: "save_error" }));
        });
      }
    }
  }

  async onClose(conn: Connection) {
    const connState = conn.state as ConnectionState | undefined;
    if (connState) {
      // Remove from typing set and broadcast if they were typing when they disconnected
      if (this.typingParticipants.has(connState.participantId)) {
        this.typingParticipants.delete(connState.participantId);
        this.broadcastTyping();
      }

      // A reconnect can briefly overlap the old socket. Because participantId is
      // now stable, only remove the participant when no other live socket for the
      // same participant remains.
      if (!this.isParticipantConnected(connState.participantId)) {
        this.state = transition(this.state, {
          type: "PARTICIPANT_LEAVE",
          participantId: connState.participantId,
        });
        // Start the claim clock once the facilitator's last socket is gone.
        if (connState.participantId === this.state.facilitatorId) {
          this.state = { ...this.state, facilitatorAwaySince: Date.now() };
        }
      }

      // Do not auto-transfer facilitation when the facilitator disconnects.
      // They can reclaim it on reconnect because participantId is stable; any
      // handoff should be a deliberate TRANSFER_FACILITATION action.
      await this.persist();
      this.broadcastState();
    }
  }

  async onRequest(req: Request): Promise<Response> {
    if (req.method === "GET") {
      return new Response(JSON.stringify(this.state), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (req.method === "POST") {
      const body = (await req.json()) as { action?: string };
      if (body.action === "reset") {
        const secret = this.env.INTERNAL_API_SECRET;
        if (!secret || req.headers.get("X-Internal-Secret") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }
        this.state = createInitialState("");
        this.stopTimerInterval();
        await this.persist();
        this.broadcastState();
        return new Response("OK");
      }
      // Restore a room exported from another host (e.g. the old PartyKit deploy).
      if (body.action === "import") {
        const secret = this.env.INTERNAL_API_SECRET;
        if (!secret || req.headers.get("X-Internal-Secret") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }
        const saved = (body as { state?: RetroState }).state;
        if (!saved?.phase) {
          return new Response("Missing state", { status: 400 });
        }
        this.state = {
          ...saved,
          cardPositions: saved.cardPositions ?? {},
          renamedLabels: saved.renamedLabels ?? {},
        };
        this.stopTimerInterval();
        if (
          this.state.phase === "discussing" &&
          this.state.discussion.timerRunning
        ) {
          this.startTimerInterval();
        }
        await this.persist();
        this.broadcastState();
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
        this.broadcastState();
      }
      // Auto-stop when timer hits 0
      if (this.state.discussion.timerRemaining <= 0) {
        this.state = {
          ...this.state,
          discussion: { ...this.state.discussion, timerRunning: false },
        };
        this.stopTimerInterval();
        await this.persist();
        this.broadcastState();
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
    const apiHost =
      (this.env.NEXT_PUBLIC_APP_URL as string) ?? "http://localhost:3456";
    const secret = (this.env.INTERNAL_API_SECRET as string) ?? "";
    const res = await fetch(`${apiHost}/api/retros/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": secret,
      },
      body: JSON.stringify({
        roomCode: this.name,
        teamId: this.state.teamId,
        createdBy: this.state.createdBy,
        state: this.state,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Save failed (${res.status}): ${text}`);
    }
    const data = (await res.json()) as { retroId?: string };
    console.log(`[retro] Saved retro ${data.retroId} for room ${this.name}`);
  }

  // ── Helpers ──

  /** True when the facilitator is a live connection (other than `excludeId`) owned by the creator. */
  private isCreatorConnectedAsFacilitator(excludeId: string): boolean {
    for (const conn of this.getConnections()) {
      if (conn.id === excludeId) continue;
      const cs = conn.state as ConnectionState | undefined;
      if (
        cs?.participantId === this.state.facilitatorId &&
        cs.userId !== null &&
        cs.userId === this.state.createdBy
      ) {
        return true;
      }
    }
    return false;
  }

  private isParticipantConnected(participantId: string): boolean {
    for (const conn of this.getConnections()) {
      const cs = conn.state as ConnectionState | undefined;
      if (cs?.participantId === participantId) return true;
    }
    return false;
  }

  private broadcastState() {
    const message = JSON.stringify({ type: "update", state: this.state });
    this.broadcast(message);
  }

  /** Broadcast the current typing set to all connections. Never includes names. */
  private broadcastTyping() {
    const message = JSON.stringify({
      type: "typing_update",
      participantIds: Array.from(this.typingParticipants),
    });
    this.broadcast(message);
  }

  private async persist() {
    await this.ctx.storage.put("state", this.state);
  }
}

