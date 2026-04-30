/**
 * Anonymous typing indicator tests.
 *
 * Two scenarios:
 *   1. Participant A starts typing. Participant B receives a typing_update with
 *      participantIds containing A's id. A stops typing. B's indicator clears.
 *      Names must never appear in any typing_update broadcast.
 *   2. A disconnects mid-typing. B's typing indicator clears within one tick.
 *
 * Usage: node tests/retro-typing-indicator.mjs [host] [roomId]
 *
 * Requires a running PartyKit dev server and the "ws" npm package.
 */

import WebSocket from "ws";

const HOST = process.argv[2] || "127.0.0.1:1999";
const BASE_ROOM = process.argv[3] || `typing-${Date.now().toString(36)}`;

const log = (msg) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function assert(condition, msg) {
  if (condition) {
    log(`PASS: ${msg}`);
  } else {
    log(`FAIL: ${msg}`);
    failures++;
  }
}

function connectRoom(name, roomId) {
  return new Promise((resolve, reject) => {
    const qs = new URLSearchParams({ name });
    const url = `ws://${HOST}/parties/retro/${roomId}?${qs.toString()}`;
    const ws = new WebSocket(url);
    let resolved = false;
    let latestState = null;
    let latestTypingIds = [];
    const typingUpdates = [];

    ws.on("message", (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === "sync") {
        latestState = data.state;
        if (!resolved) {
          resolved = true;
          resolve({
            ws,
            id: data.you,
            name,
            getState: () => latestState,
            getTypingIds: () => latestTypingIds,
            getTypingUpdates: () => typingUpdates,
          });
        }
      } else if (data.type === "update") {
        latestState = data.state;
      } else if (data.type === "typing_update") {
        latestTypingIds = data.participantIds;
        typingUpdates.push({ participantIds: [...data.participantIds], ts: Date.now() });
      }
    });

    ws.on("error", (err) => { if (!resolved) reject(err); });
    setTimeout(() => { if (!resolved) reject(new Error(`Timeout for "${name}"`)); }, 5000);
  });
}

function waitFor(getVal, predicate, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      const val = getVal();
      if (predicate(val)) return resolve(val);
      if (Date.now() > deadline) return reject(new Error("waitFor timeout"));
      setTimeout(check, 100);
    };
    check();
  });
}

// ── Scenario 1: A types, B sees indicator; A stops, indicator clears; no names in broadcast ──
async function testTypingIndicatorBasic() {
  log("--- Scenario 1: typing indicator appears and clears ---");
  const roomId = `${BASE_ROOM}-s1`;
  const a = await connectRoom("Alice", roomId);
  const b = await connectRoom("Bob", roomId);
  log(`A=${a.id} B=${b.id}`);

  // Send TYPING_START from A
  a.ws.send(JSON.stringify({ type: "TYPING_START" }));
  await waitFor(b.getTypingIds, (ids) => ids.length > 0);

  const idsAfterStart = b.getTypingIds();
  assert(idsAfterStart.includes(a.id), "B sees A's participantId in typing_update");
  assert(!idsAfterStart.includes("Alice"), "B does not see A's name in typing_update");

  // Verify no name appears in any typing_update B has received
  const allUpdates = b.getTypingUpdates();
  const nameLeaked = allUpdates.some((u) =>
    u.participantIds.some((id) => id === "Alice" || id === "Bob")
  );
  assert(!nameLeaked, "No name (Alice/Bob) appeared in any typing_update broadcast");

  // Send TYPING_STOP from A
  a.ws.send(JSON.stringify({ type: "TYPING_STOP" }));
  await waitFor(b.getTypingIds, (ids) => ids.length === 0);

  assert(b.getTypingIds().length === 0, "indicator clears after TYPING_STOP");

  a.ws.close();
  b.ws.close();
}

// ── Scenario 2: A disconnects mid-typing; B's indicator clears ──
async function testTypingClearsOnDisconnect() {
  log("--- Scenario 2: indicator clears when typer disconnects ---");
  const roomId = `${BASE_ROOM}-s2`;
  const a = await connectRoom("Alice2", roomId);
  const b = await connectRoom("Bob2", roomId);

  // A starts typing but does not stop
  a.ws.send(JSON.stringify({ type: "TYPING_START" }));
  await waitFor(b.getTypingIds, (ids) => ids.length > 0);
  assert(b.getTypingIds().includes(a.id), "B sees A typing before disconnect");

  // A disconnects without sending TYPING_STOP
  a.ws.close();

  // B's indicator should clear when the server processes onClose
  await waitFor(b.getTypingIds, (ids) => ids.length === 0, 5000);
  assert(b.getTypingIds().length === 0, "indicator clears after A disconnects mid-typing");

  b.ws.close();
}

async function run() {
  log(`Base room: ${BASE_ROOM}`);

  await testTypingIndicatorBasic();
  await sleep(200);
  await testTypingClearsOnDisconnect();

  log("=".repeat(50));
  log("TYPING INDICATOR TESTS COMPLETE");
  log("=".repeat(50));
  if (failures === 0) {
    log("ALL CHECKS PASSED");
    process.exit(0);
  } else {
    log(`${failures} CHECK(S) FAILED`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
