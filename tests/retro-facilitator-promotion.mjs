/**
 * Retro Facilitator Promotion Test
 *
 * Verifies that a participant whose Clerk userId matches state.createdBy
 * reclaims facilitator on join, even if another participant joined first.
 *
 * Scenarios tested:
 *   1. Anonymous participant A joins first and becomes facilitator (fallback).
 *   2. Creator participant B joins with userId matching state.createdBy.
 *      Facilitator should transfer to B.
 *   3. B disconnects. Facilitator should fall back to A.
 *   4. B reconnects. Facilitator should transfer back to B (creator reclaims).
 *
 * Usage: node tests/retro-facilitator-promotion.mjs [host] [roomId]
 *
 * Requires a running PartyKit dev server and the "ws" npm package.
 */

import WebSocket from "ws";

const HOST = process.argv[2] || "127.0.0.1:1999";
const ROOM_ID = process.argv[3] || `fac-promo-${Date.now().toString(36)}`;
const CREATOR_USER_ID = "creator-clerk-id-test";

const log = (msg) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Connect a participant to the room.
 * Returns { ws, id, stateAfterSync } where id is the server-assigned participantId.
 * @param {string} name Display name
 * @param {string|null} userId Clerk userId to forward (null for anonymous)
 */
function connect(name, userId = null) {
  return new Promise((resolve, reject) => {
    const qs = new URLSearchParams({ name });
    if (userId) qs.set("userId", userId);
    const url = `ws://${HOST}/parties/retro/${ROOM_ID}?${qs.toString()}`;
    const ws = new WebSocket(url);

    let resolved = false;
    // Keep a reference to the latest broadcast state for assertions after sync
    let latestState = null;

    ws.on("message", (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === "sync") {
        latestState = data.state;
        if (!resolved) {
          resolved = true;
          resolve({ ws, id: data.you, getState: () => latestState });
        }
      } else if (data.type === "update") {
        latestState = data.state;
      }
    });

    ws.on("error", (err) => {
      if (!resolved) reject(err);
    });

    setTimeout(() => {
      if (!resolved) reject(new Error(`Connection timeout for "${name}"`));
    }, 5000);
  });
}

function close(participant) {
  return new Promise((resolve) => {
    participant.ws.on("close", resolve);
    participant.ws.close();
  });
}

/** Waits until the room's facilitatorId matches expected, polling until timeout. */
function waitForFacilitator(getState, expectedId, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      const state = getState();
      if (state?.facilitatorId === expectedId) return resolve();
      if (Date.now() > deadline) {
        return reject(
          new Error(
            `Timeout: expected facilitatorId "${expectedId}", got "${state?.facilitatorId}"`
          )
        );
      }
      setTimeout(check, 100);
    };
    check();
  });
}

// Simple assertion helper
let failures = 0;
function assert(condition, msg) {
  if (condition) {
    log(`PASS: ${msg}`);
  } else {
    log(`FAIL: ${msg}`);
    failures++;
  }
}

async function run() {
  log(`Room: ${ROOM_ID}`);
  log(`Creator userId: ${CREATOR_USER_ID}`);

  // ── Step 1: Anonymous participant A joins first ──
  log("Connecting participant A (no userId)...");
  const a = await connect("Alice");
  log(`  A joined, id=${a.id}, facilitatorId=${a.getState().facilitatorId}`);

  assert(
    a.getState().facilitatorId === a.id,
    "A (first joiner, no userId) becomes facilitator"
  );

  // ── Set state.createdBy so creator promotion can fire ──
  // In real usage, the retro is started via START_RETRO which sets createdBy.
  // We send START_RETRO from A (who is current facilitator) with the creator
  // userId that B will present on join. The server records this in state.createdBy.
  a.ws.send(
    JSON.stringify({
      type: "START_RETRO",
      facilitatorId: a.id,
      createdBy: CREATOR_USER_ID,
    })
  );
  await sleep(300);
  log(`  State phase after START_RETRO: ${a.getState().phase}`);
  log(`  state.createdBy: ${a.getState().createdBy}`);

  // ── Step 2: Creator B joins with matching userId ──
  log("Connecting participant B (creator userId)...");
  const b = await connect("Bob (Creator)", CREATOR_USER_ID);
  log(`  B joined, id=${b.id}`);

  // Wait for A's state to update via broadcast
  await waitForFacilitator(a.getState, b.id);

  assert(
    b.getState().facilitatorId === b.id,
    "B (creator) becomes facilitator on join, displacing A"
  );
  assert(
    a.getState().facilitatorId === b.id,
    "A's broadcast state also shows B as facilitator"
  );

  // ── Step 3: B disconnects, facilitator falls back to A ──
  log("Disconnecting B...");
  await close(b);
  await sleep(500); // let onClose propagate and broadcast

  assert(
    a.getState().facilitatorId === a.id,
    "After B disconnects, facilitator falls back to A"
  );

  // ── Step 4: B reconnects, reclaims facilitator ──
  log("Reconnecting B (creator)...");
  const b2 = await connect("Bob (Creator)", CREATOR_USER_ID);
  log(`  B2 joined, id=${b2.id}`);

  await waitForFacilitator(a.getState, b2.id);

  assert(
    b2.getState().facilitatorId === b2.id,
    "B (creator) reclaims facilitator on reconnect"
  );
  assert(
    a.getState().facilitatorId === b2.id,
    "A's broadcast state shows B2 as facilitator after reconnect"
  );

  // ── Summary ──
  log("=".repeat(50));
  log(`FACILITATOR PROMOTION TEST COMPLETE`);
  log("=".repeat(50));
  if (failures === 0) {
    log("ALL CHECKS PASSED");
  } else {
    log(`${failures} CHECK(S) FAILED`);
  }

  // Cleanup
  try { a.ws.close(); } catch {}
  try { b2.ws.close(); } catch {}

  process.exit(failures === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
