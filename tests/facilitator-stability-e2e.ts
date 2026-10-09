import assert from "node:assert/strict";

/**
 * Facilitator stability e2e for estimation and retro rooms.
 *
 * Runs against a live PartyServer worker (`npx wrangler dev`, port 1999):
 *   npx tsx tests/facilitator-stability-e2e.ts [host]
 *
 * Each step talks to the room over real WebSockets, then reads the room
 * state back with GET /parties/:party/:room (the servers' onRequest).
 */

const HOST = process.argv[2] || "127.0.0.1:1999";
const RUN = Date.now().toString(36);

type State = {
  facilitatorId: string | null;
  participants: { id: string }[];
  ticket?: { ref: string } | null;
  phase?: string;
};

async function getState(party: string, room: string): Promise<State> {
  const res = await fetch(`http://${HOST}/parties/${party}/${room}`);
  assert.equal(res.status, 200, `GET state for ${party}/${room}`);
  return (await res.json()) as State;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Poll until the predicate holds, or return the last state after the timeout. */
async function settle(
  party: string,
  room: string,
  predicate: (s: State) => boolean = () => false,
  timeoutMs = 600,
): Promise<State> {
  const end = Date.now() + timeoutMs;
  let state = await getState(party, room);
  while (!predicate(state) && Date.now() < end) {
    await sleep(50);
    state = await getState(party, room);
  }
  return state;
}

async function connect(party: string, room: string, query: string): Promise<WebSocket> {
  const ws = new WebSocket(`ws://${HOST}/parties/${party}/${room}?${query}`);
  await new Promise<void>((resolve, reject) => {
    ws.addEventListener("message", () => resolve(), { once: true });
    ws.addEventListener("error", () => reject(new Error(`connect failed: ${query}`)), { once: true });
  });
  return ws;
}

async function close(ws: WebSocket) {
  // Under local `wrangler dev` the reciprocal close frame can stall, so don't
  // wait on it forever; the server's onClose has run once state settles.
  await new Promise<void>((resolve) => {
    ws.addEventListener("close", () => resolve(), { once: true });
    setTimeout(resolve, 300);
    ws.close();
  });
}

function send(ws: WebSocket, event: unknown) {
  ws.send(JSON.stringify(event));
}

async function testEstimationFacilitatorStability() {
  const P = "main";
  const R = `est-stability-${RUN}`;

  const a = await connect(P, R, "name=Facilitator&anonId=fac-1");
  let s = await settle(P, R, (x) => x.facilitatorId === "fac-1");
  assert.equal(s.facilitatorId, "fac-1", "first estimation joiner is facilitator");

  const b = await connect(P, R, "name=Teammate&anonId=team-1");
  s = await settle(P, R);
  assert.equal(s.facilitatorId, "fac-1", "later estimation joiner must not steal facilitator");

  await close(a);
  s = await settle(P, R);
  assert.equal(s.facilitatorId, "fac-1", "estimation facilitator remains assigned while disconnected");

  send(b, {
    type: "LOAD_TICKET",
    ticket: { ref: "BUG-1", title: "Should not load" },
    facilitatorId: "team-1",
  });
  s = await settle(P, R);
  assert.equal(s.ticket ?? null, null, "non-facilitator cannot act after facilitator disconnects");

  const a2 = await connect(P, R, "name=Facilitator&anonId=fac-1");
  s = await settle(P, R);
  assert.equal(s.facilitatorId, "fac-1", "estimation facilitator reclaims on reconnect via stable id");

  send(a2, {
    type: "LOAD_TICKET",
    ticket: { ref: "BUG-2", title: "Can load" },
    facilitatorId: "fac-1",
  });
  s = await settle(P, R, (x) => x.ticket?.ref === "BUG-2");
  assert.equal(s.ticket?.ref, "BUG-2", "reconnected facilitator can continue ceremony");

  const a3 = await connect(P, R, "name=Facilitator&anonId=fac-1");
  await close(a2);
  s = await settle(P, R);
  assert(
    s.participants.some((p) => p.id === "fac-1"),
    "estimation overlapping reconnect does not remove still-connected participant",
  );

  send(a3, { type: "TRANSFER_FACILITATION", targetId: "team-1", facilitatorId: "fac-1" });
  s = await settle(P, R, (x) => x.facilitatorId === "team-1");
  assert.equal(s.facilitatorId, "team-1", "estimation transfer is explicit and works");

  await close(a3);
  await close(b);
}

async function testRetroFacilitatorStability() {
  const P = "retro";
  const R = `retro-stability-${RUN}`;

  const a = await connect(P, R, "name=Facilitator&anonId=fac-1&userId=creator");
  let s = await settle(P, R, (x) => x.facilitatorId === "fac-1");
  assert.equal(s.facilitatorId, "fac-1", "first retro joiner is facilitator");

  send(a, { type: "START_RETRO", facilitatorId: "fac-1", createdBy: "creator", previousActions: [] });
  s = await settle(P, R, (x) => x.phase === "writing");
  assert.equal(s.phase, "writing", "retro starts end-to-end from facilitator");

  const b = await connect(P, R, "name=Teammate&anonId=team-1");
  s = await settle(P, R);
  assert.equal(s.facilitatorId, "fac-1", "later retro joiner must not steal facilitator");

  const creatorSecondBrowser = await connect(P, R, "name=CreatorOtherBrowser&anonId=creator-other&userId=creator");
  s = await settle(P, R);
  assert.equal(s.facilitatorId, "fac-1", "creator identity joining later must not override active facilitator");

  await close(a);
  s = await settle(P, R);
  assert.equal(s.facilitatorId, "fac-1", "retro facilitator remains assigned while disconnected");

  send(b, { type: "ADVANCE_PHASE", facilitatorId: "team-1" });
  s = await settle(P, R);
  assert.equal(s.phase, "writing", "non-facilitator cannot advance after facilitator disconnects");

  const a2 = await connect(P, R, "name=Facilitator&anonId=fac-1&userId=creator");
  s = await settle(P, R);
  assert.equal(s.facilitatorId, "fac-1", "retro facilitator reclaims on reconnect via stable id");

  send(a2, { type: "ADVANCE_PHASE", facilitatorId: "fac-1" });
  s = await settle(P, R, (x) => x.phase === "grouping");
  assert.equal(s.phase, "grouping", "reconnected facilitator can continue retro");

  const a3 = await connect(P, R, "name=Facilitator&anonId=fac-1&userId=creator");
  await close(a2);
  s = await settle(P, R);
  assert(
    s.participants.some((p) => p.id === "fac-1"),
    "retro overlapping reconnect does not remove still-connected participant",
  );

  send(a3, { type: "TRANSFER_FACILITATION", targetId: "team-1", facilitatorId: "fac-1" });
  s = await settle(P, R, (x) => x.facilitatorId === "team-1");
  assert.equal(s.facilitatorId, "team-1", "retro transfer is explicit and works");

  await close(creatorSecondBrowser);
  await close(a3);
  await close(b);
}

async function main() {
  await testEstimationFacilitatorStability();
  await testRetroFacilitatorStability();
  console.log("✅ facilitator stability e2e passed for estimation and retro");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
