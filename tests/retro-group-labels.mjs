/**
 * Group label and chip-rename tests.
 *
 * Three scenarios:
 *   1. Advance-to-voting auto-group label uses the full card text (was truncated at 40 chars).
 *   2. Proximity-group label uses the full card text (was truncated at 30 chars).
 *   3. Renaming a group via RENAME_GROUP (what the summary chip calls) persists the new label
 *      in state, and survives a card move that re-triggers proximity computation.
 *
 * Usage: node tests/retro-group-labels.mjs [host] [roomId]
 *
 * Requires a running PartyKit dev server and the "ws" npm package.
 */

import WebSocket from "ws";

const HOST = process.argv[2] || "127.0.0.1:1999";
const BASE_ROOM = process.argv[3] || `labels-${Date.now().toString(36)}`;

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

function connectRoom(name, roomId, userId = null) {
  return new Promise((resolve, reject) => {
    const qs = new URLSearchParams({ name });
    if (userId) qs.set("userId", userId);
    const url = `ws://${HOST}/parties/retro/${roomId}?${qs.toString()}`;
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

function waitFor(getState, predicate, timeoutMs = 4000) {
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

// ── Scenario 1: advance-to-voting auto-group label ──
async function testAutoGroupLabel() {
  log("--- Scenario 1: auto-group full label on advance-to-voting ---");
  const roomId = `${BASE_ROOM}-s1`;
  const fac = await connectRoom("Fac1", roomId);

  fac.ws.send(JSON.stringify({ type: "START_RETRO", facilitatorId: fac.id }));
  await waitFor(fac.getState, (s) => s.phase === "writing");

  const longText = "this is a fairly long topic name that exceeds forty characters easily";
  assert(longText.length > 40, "test text exceeds old 40-char auto-group threshold");

  fac.ws.send(JSON.stringify({ type: "ADD_CARD", category: "happy", text: longText }));
  await waitFor(fac.getState, (s) => s.cards.length > 0);

  fac.ws.send(JSON.stringify({ type: "ADVANCE_PHASE", facilitatorId: fac.id }));
  await waitFor(fac.getState, (s) => s.phase === "grouping");

  fac.ws.send(JSON.stringify({ type: "ADVANCE_PHASE", facilitatorId: fac.id }));
  await waitFor(fac.getState, (s) => s.phase === "voting");

  const state = fac.getState();
  const autoGroup = state.groups.find((g) => g.cardIds.length > 0);
  assert(autoGroup !== undefined, "auto-group exists");
  assert(
    autoGroup?.label === longText,
    `auto-group label is full text (got "${autoGroup?.label?.slice(0, 50)}")`
  );

  fac.ws.close();
}

// ── Scenario 2: proximity-group label ──
async function testProximityGroupLabel() {
  log("--- Scenario 2: proximity-group full label ---");
  const roomId = `${BASE_ROOM}-s2`;
  const fac = await connectRoom("Fac2", roomId);

  fac.ws.send(JSON.stringify({ type: "START_RETRO", facilitatorId: fac.id }));
  await waitFor(fac.getState, (s) => s.phase === "writing");

  const longText = "this topic text is longer than thirty characters absolutely yes";
  assert(longText.length > 30, "test text exceeds old 30-char proximity threshold");

  fac.ws.send(JSON.stringify({ type: "ADD_CARD", category: "sad", text: longText }));
  await waitFor(fac.getState, (s) => s.cards.length > 0);

  fac.ws.send(JSON.stringify({ type: "ADVANCE_PHASE", facilitatorId: fac.id }));
  await waitFor(fac.getState, (s) => s.phase === "grouping");

  const cardId = fac.getState().cards[0].id;
  fac.ws.send(JSON.stringify({ type: "MOVE_CARD_POSITION", cardId, x: 200, y: 200 }));
  await sleep(400);

  const state = fac.getState();
  const proxGroup = state.groups.find((g) => g.cardIds.includes(cardId));
  assert(proxGroup !== undefined, "proximity group contains the card");
  assert(
    proxGroup?.label === longText,
    `proximity group label is full text (got "${proxGroup?.label?.slice(0, 50)}")`
  );

  fac.ws.close();
}

// ── Scenario 3: chip rename persists through card moves ──
async function testChipRenamePersistedThroughMove() {
  log("--- Scenario 3: group rename via chip persists after card move ---");
  const roomId = `${BASE_ROOM}-s3`;
  const fac = await connectRoom("Fac3", roomId);

  fac.ws.send(JSON.stringify({ type: "START_RETRO", facilitatorId: fac.id }));
  await waitFor(fac.getState, (s) => s.phase === "writing");

  fac.ws.send(JSON.stringify({ type: "ADD_CARD", category: "happy", text: "card alpha" }));
  fac.ws.send(JSON.stringify({ type: "ADD_CARD", category: "sad", text: "card beta" }));
  await waitFor(fac.getState, (s) => s.cards.length >= 2);

  fac.ws.send(JSON.stringify({ type: "ADVANCE_PHASE", facilitatorId: fac.id }));
  await waitFor(fac.getState, (s) => s.phase === "grouping");

  // Move two cards close together to form a proximity group
  const cards = fac.getState().cards;
  fac.ws.send(JSON.stringify({ type: "MOVE_CARD_POSITION", cardId: cards[0].id, x: 100, y: 100 }));
  fac.ws.send(JSON.stringify({ type: "MOVE_CARD_POSITION", cardId: cards[1].id, x: 140, y: 120 }));
  await sleep(400);

  const groupsBefore = fac.getState().groups;
  assert(groupsBefore.length > 0, "groups formed by proximity");

  const groupId = groupsBefore[0].id;
  const newLabel = "Our renamed group via chip";

  // Send the same RENAME_GROUP event the chip calls through onRenameGroup
  fac.ws.send(JSON.stringify({ type: "RENAME_GROUP", groupId, label: newLabel }));
  await waitFor(fac.getState, (s) => s.groups.some((g) => g.id === groupId && g.label === newLabel));

  assert(
    fac.getState().groups.find((g) => g.id === groupId)?.label === newLabel,
    "label updated to chip-renamed value"
  );

  // Move a card slightly: proximity recomputes, but renamedLabels fingerprint should restore the label
  fac.ws.send(JSON.stringify({ type: "MOVE_CARD_POSITION", cardId: cards[0].id, x: 110, y: 105 }));
  await sleep(400);

  const labelAfterMove = fac.getState().groups.find((g) =>
    g.cardIds.includes(cards[0].id) || g.cardIds.includes(cards[1].id)
  )?.label;
  assert(
    labelAfterMove === newLabel,
    `label persists after card move (got "${labelAfterMove}")`
  );

  fac.ws.close();
}

async function run() {
  log(`Base room: ${BASE_ROOM}`);

  await testAutoGroupLabel();
  await testProximityGroupLabel();
  await testChipRenamePersistedThroughMove();

  log("=".repeat(50));
  log("GROUP LABEL + CHIP RENAME TESTS COMPLETE");
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
