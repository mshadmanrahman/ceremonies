import type * as Party from "partykit/server";
import {
  createInitialState,
  transition,
  type EstimationState,
  type EstimationEvent,
} from "../src/lib/state-machines/estimation";

/**
 * PartyKit server for estimation rooms.
 *
 * Each room is a Durable Object that holds the estimation state.
 * Clients send events, the server runs transition(), and broadcasts
 * the new state to all connected clients.
 *
 * The server is the single source of truth. Clients never compute
 * state locally in multiplayer mode.
 */

interface ConnectionState {
  participantId: string;
  participantName: string;
}

export default class EstimationServer implements Party.Server {
  state: EstimationState;

  constructor(readonly room: Party.Room) {
    this.state = createInitialState("");
  }

  async onStart() {
    const saved = await this.room.storage.get<EstimationState>("state");
    if (saved) {
      this.state = saved;
    }
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url);
    const name = url.searchParams.get("name") ?? "Anonymous";
    const participantId = conn.id;

    conn.setState({
      participantId,
      participantName: name,
    } satisfies ConnectionState);

    // Add participant to state
    this.state = transition(this.state, {
      type: "PARTICIPANT_JOIN",
      participant: { id: participantId, name, joinedAt: Date.now() },
    });

    // If no facilitator or old facilitator is gone, assign to this person
    const facilitatorStillHere = this.isFacilitatorConnected();
    if (!this.state.facilitatorId || !facilitatorStillHere) {
      this.state = { ...this.state, facilitatorId: participantId };
    }

    await this.persist();

    // Send full state to the new connection
    conn.send(
      JSON.stringify({
        type: "sync",
        state: this.state,
        you: participantId,
      })
    );

    // Broadcast updated state to everyone
    this.broadcast();
  }

  async onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    if (typeof message !== "string") return;

    let event: EstimationEvent;
    try {
      event = JSON.parse(message) as EstimationEvent;
    } catch {
      return;
    }

    // Inject sender's ID for vote events (prevent spoofing)
    const connState = sender.state as ConnectionState | undefined;
    if (event.type === "CAST_VOTE" && connState) {
      event = {
        ...event,
        odiedId: connState.participantId,
        odiedName: connState.participantName,
      };
    }

    // Inject facilitator ID for facilitator actions (prevent spoofing)
    if ("facilitatorId" in event && connState) {
      event = { ...event, facilitatorId: connState.participantId };
    }

    const nextState = transition(this.state, event);

    // Only broadcast if state actually changed
    if (nextState !== this.state) {
      this.state = nextState;
      await this.persist();
      this.broadcast();
    }
  }

  async onClose(conn: Party.Connection) {
    const connState = conn.state as ConnectionState | undefined;
    if (connState) {
      this.state = transition(this.state, {
        type: "PARTICIPANT_LEAVE",
        participantId: connState.participantId,
      });

      // If the facilitator left, reassign to first remaining connection
      if (this.state.facilitatorId === connState.participantId) {
        const nextFacilitator = this.getFirstConnectedParticipantId(
          connState.participantId
        );
        if (nextFacilitator) {
          this.state = { ...this.state, facilitatorId: nextFacilitator };
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
    // POST /parties/main/:roomId — reset room
    if (req.method === "POST") {
      const body = (await req.json()) as { action?: string };
      if (body.action === "reset") {
        this.state = createInitialState("");
        await this.persist();
        this.broadcast();
        return new Response("OK");
      }
    }
    return new Response("Not found", { status: 404 });
  }

  private isFacilitatorConnected(): boolean {
    for (const conn of this.room.getConnections()) {
      const cs = conn.state as ConnectionState | undefined;
      if (cs?.participantId === this.state.facilitatorId) {
        return true;
      }
    }
    return false;
  }

  private getFirstConnectedParticipantId(
    excludeId?: string
  ): string | null {
    for (const conn of this.room.getConnections()) {
      const cs = conn.state as ConnectionState | undefined;
      if (cs && cs.participantId !== excludeId) {
        return cs.participantId;
      }
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

EstimationServer satisfies Party.Worker;
