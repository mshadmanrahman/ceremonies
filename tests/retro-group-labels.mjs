/**
 * Unit tests for auto-generated group labels.
 *
 * Verifies that:
 *   1. Cards with long text (>30 chars, >40 chars) produce group labels that
 *      equal the full card text, not a truncated version.
 *   2. The "advance to voting" auto-group path uses the full card text.
 *   3. The proximity-grouping path uses the full card text.
 *
 * These tests operate against a running PartyKit server by sending events and
 * asserting on the returned state — consistent with the project's test pattern.
 *
 * Usage: node tests/retro-group-labels.mjs [host] [roomId]
 *
 * Requires a running PartyKit dev server and the "ws" npm package.
 */

import WebSocket from "ws";

const HOST = process.argv[2] || "127.0.0.1:1999";
const ROOM_ID = process.argv[3] || `label-test-${Date.now().toString(36)}`;

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

function connect(name, userId = null) {
  return new Promise((resolve, reject) => {
    const qs = new URLSearchParams({ name });
    if (userId) qs.set("userId", userId);
    const url = `ws://${HOST}/parties/retro/${ROOM_ID}?${qs.toString()}`;
    const ws = new WebSocket(url);
    let resolved = false;
    let latestState = null;

    ws.on("message", (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === "sync") {
        latestState = data.state;
        if (!resolved) {
          resolved = true;
          resolve({ ws, id: data.you, anonymousId: data.anonymousId, getState: () => latestState });
        }
      } else if (data.type === "update") {
        latestState = data.state;
      }
    });

    ws.on("error", (err) => { if (!resolved) reject(err); });
    setTimeout(() => { if (!resolved) reject(new Error(`Timeout for "${name}"`)); }, 5000);
  });
}

function waitFor(getState, predicate, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      const state = getState();
      if (state && predicate(state)) return resolve(state);
      if (Date.now() > deadline) return reject(new Error("waitFor timeout"));
      setTimeout(check, 100);
    };
    check();
  });
}

async function run() {
  log(`Room: ${ROOM_ID}`);

  const fac = await connect("Facilitator");
  log(`Facilitator joined, id=${fac.id}`);

  // Start the retro (no previous actions, goes straight to writing)
  fac.ws.send(JSON.stringify({ type: "START_RETRO", facilitatorId: fac.id }));
  await waitFor(fac.getState, (s) => s.phase === "writing");
  log("Phase: writing");

  // ── Scenario 1: auto-group label on advance-to-voting ──
  // The old code truncated the label at 40 chars for this path.
  const longText40 = "this is a fairly long topic name that exceeds forty characters easily yes it does";
  assert(longText40.length > 40, "test text exceeds old 40-char threshold");

  fac.ws.send(JSON.stringify({ type: "ADD_CARD", category: "happy", text: longText40 }));
  await waitFor(fac.getState, (s) => s.cards.length > 0);

  // Advance to grouping, then to voting (voting auto-groups ungrouped cards)
  fac.ws.send(JSON.stringify({ type: "ADVANCE_PHASE", facilitatorId: fac.id }));
  await waitFor(fac.getState, (s) => s.phase === "grouping");
  log("Phase: grouping");

  fac.ws.send(JSON.stringify({ type: "ADVANCE_PHASE", facilitatorId: fac.id }));
  await waitFor(fac.getState, (s) => s.phase === "voting");
  log("Phase: voting");

  const state = fac.getState();
  assert(state.groups.length > 0, "at least one group exists after advance-to-voting");
  const autoGroup = state.groups.find((g) => g.cardIds.length > 0);
  assert(autoGroup !== undefined, "an auto-group was created");
  assert(
    autoGroup?.label === longText40,
    `auto-group label equals full text (got "${autoGroup?.label?.slice(0, 50)}...")`
  );

  // ── Scenario 2: proximity-group label in grouping phase ──
  // Use a separate room to test proximity grouping label via a fresh retro.
  const ROOM_2 = `${ROOM_ID}-prox`;
  const fac2 = await connect("Facilitator2");
  // Connect to second room separately
  const qs2 = new URLSearchParams({ name: "Fac2" });
  const url2 = `ws://${HOST}/parties/retro/${ROOM_2}?${qs2.toString()}`;
  const fac2b = await new Promise((resolve, reject) => {
    const ws = new WebSocket(url2);
    let latestState = null;
    let resolved = false;
    ws.on("message", (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === "sync") {
        latestState = data.state;
        if (!resolved) { resolved = true; resolve({ ws, id: data.you, getState: () => latestState }); }
      } else if (data.type === "update") { latestState = data.state; }
    });
    ws.on("error", (err) => { if (!resolved) reject(err); });
    setTimeout(() => { if (!resolved) reject(new Error("timeout")); }, 5000);
  });

  fac2b.ws.send(JSON.stringify({ type: "START_RETRO", facilitatorId: fac2b.id }));
  await waitFor(fac2b.getState, (s) => s.phase === "writing");

  const longText30 = "this topic text is longer than thirty characters absolutely";
  assert(longText30.length > 30, "test text exceeds old 30-char proximity threshold");

  fac2b.ws.send(JSON.stringify({ type: "ADD_CARD", category: "sad", text: longText30 }));
  await waitFor(fac2b.getState, (s) => s.cards.length > 0);

  // Advance to grouping
  fac2b.ws.send(JSON.stringify({ type: "ADVANCE_PHASE", facilitatorId: fac2b.id }));
  await waitFor(fac2b.getState, (s) => s.phase === "grouping");

  // Move a card to trigger proximity grouping computation
  const cardId = fac2b.getState().cards[0].id;
  fac2b.ws.send(JSON.stringify({ type: "MOVE_CARD_POSITION", cardId, x: 200, y: 200 }));
  await sleep(300);

  const state2 = fac2b.getState();
  const proxGroup = state2.groups.find((g) => g.cardIds.includes(cardId));
  assert(proxGroup !== undefined, "proximity group contains the moved card");
  assert(
    proxGroup?.label === longText30,
    `proximity group label equals full text (got "${proxGroup?.label?.slice(0, 50)}...")`
  );

  // ── Summary ──
  log("=".repeat(50));
  log("GROUP LABEL TESTS COMPLETE");
  log("=".repeat(50));
  if (failures === 0) {
    log("ALL CHECKS PASSED");
  } else {
    log(`${failures} CHECK(S) FAILED`);
  }

  try { fac.ws.close(); } catch {}
  try { fac2.ws.close(); } catch {}
  try { fac2b.ws.close(); } catch {}

  process.exit(failures === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
