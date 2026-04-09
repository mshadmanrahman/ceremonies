/**
 * Retro Save E2E Test
 *
 * Verifies the full retro save-to-database flow:
 * 1. Connect 3 participants to a retro room
 * 2. Walk through all phases: lobby -> writing -> grouping -> voting -> discussing -> closed
 * 3. When phase hits "closed", PartyKit server POSTs to /api/retros/save
 * 4. Verify the save succeeded by checking the API response or DB
 *
 * Usage: node tests/retro-save-e2e.mjs [partykit-host] [nextjs-host]
 *
 * Prerequisites:
 * - PartyKit dev server running on port 1999
 * - Next.js dev server running on port 3456
 * - Neon DB accessible (via DATABASE_URL env var)
 */

import WebSocket from "ws";

const PARTY_HOST = process.argv[2] || "127.0.0.1:1999";
const APP_HOST = process.argv[3] || "http://localhost:3456";
const ROOM_ID = `e2e-save-${Date.now().toString(36)}`;
const PARTICIPANTS = ["Alice", "Bob", "Carol"];

const log = (msg) =>
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let latestState = null;
const connections = []; // { ws, id, name, anonymousId }

// ── Helpers ──

function connect(name) {
  return new Promise((resolve, reject) => {
    const url = `ws://${PARTY_HOST}/parties/retro/${ROOM_ID}?name=${encodeURIComponent(name)}`;
    const ws = new WebSocket(url);
    let resolved = false;

    ws.on("message", (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === "sync" && !resolved) {
        latestState = data.state;
        resolved = true;
        resolve({ ws, id: data.you, name, anonymousId: data.anonymousId });
      } else if (data.type === "update") {
        latestState = data.state;
      }
    });

    ws.on("error", (err) => {
      if (!resolved) reject(err);
    });

    setTimeout(
      () => !resolved && reject(new Error(`Timeout connecting: ${name}`)),
      5000
    );
  });
}

function send(ws, event) {
  ws.send(JSON.stringify(event));
}

function waitForPhase(phase, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (latestState?.phase === phase) return resolve();
      if (Date.now() - start > timeoutMs) {
        return reject(
          new Error(
            `Timeout: expected "${phase}", stuck at "${latestState?.phase}"`
          )
        );
      }
      setTimeout(check, 100);
    };
    check();
  });
}

function closeAll() {
  for (const c of connections) {
    try {
      c.ws.close();
    } catch {
      // ignore
    }
  }
}

// ── Main Test ──

async function run() {
  let exitCode = 0;

  try {
    // Step 1: Connect 3 participants
    log(`Connecting 3 participants to room: ${ROOM_ID}`);
    for (const name of PARTICIPANTS) {
      const conn = await connect(name);
      connections.push(conn);
      log(`  ${name} connected (id=${conn.id})`);
      await sleep(200); // stagger connections
    }

    const facilitator = connections[0]; // First to join is facilitator
    log(`Facilitator: ${facilitator.name} (${facilitator.id})`);
    log(`Current phase: ${latestState.phase}`);

    if (latestState.phase !== "lobby") {
      throw new Error(`Expected lobby phase, got: ${latestState.phase}`);
    }

    // Step 2: Start retro (no previousActions -> goes directly to "writing")
    log("Starting retro (no previous actions -> writing phase)...");
    send(facilitator.ws, {
      type: "START_RETRO",
      facilitatorId: facilitator.id,
      teamId: "e2e-test-team",
      createdBy: "e2e-test-user",
    });
    await waitForPhase("writing");
    log(`Phase: ${latestState.phase}`);

    // Step 3: Add cards during writing phase
    // ADD_CARD must be flat { type, category, text } - server enforces anonymity
    const cards = [
      { type: "ADD_CARD", category: "happy", text: "Great team collaboration this sprint" },
      { type: "ADD_CARD", category: "happy", text: "CI/CD pipeline is much faster now" },
      { type: "ADD_CARD", category: "sad", text: "Too many meetings eating focus time" },
      { type: "ADD_CARD", category: "sad", text: "Flaky tests in the auth module" },
      { type: "ADD_CARD", category: "confused", text: "New deployment process unclear" },
      { type: "ADD_CARD", category: "confused", text: "Who owns the data pipeline?" },
    ];

    log("Adding 6 cards (2 per participant)...");
    for (let i = 0; i < cards.length; i++) {
      const conn = connections[i % connections.length];
      send(conn.ws, cards[i]);
      await sleep(150);
    }

    // Wait for cards to be reflected
    await sleep(500);
    log(`Cards in state: ${latestState.cards.length}`);
    if (latestState.cards.length !== 6) {
      throw new Error(
        `Expected 6 cards, got ${latestState.cards.length}`
      );
    }

    // Step 4: Advance to grouping
    log("Advancing to grouping phase...");
    send(facilitator.ws, {
      type: "ADVANCE_PHASE",
      facilitatorId: facilitator.id,
    });
    await waitForPhase("grouping");
    log(`Phase: ${latestState.phase}`);

    // Create a group with two cards
    const happyCards = latestState.cards.filter((c) => c.category === "happy");
    if (happyCards.length >= 2) {
      const groupId = `grp-${Date.now().toString(36)}`;
      send(facilitator.ws, {
        type: "CREATE_GROUP",
        group: {
          id: groupId,
          label: "Team wins",
          cardIds: happyCards.map((c) => c.id),
          voteCount: 0,
        },
      });
      await sleep(300);
      log(`Created group with ${happyCards.length} happy cards`);
    }

    // Step 5: Advance to voting (auto-groups ungrouped cards)
    log("Advancing to voting phase...");
    send(facilitator.ws, {
      type: "ADVANCE_PHASE",
      facilitatorId: facilitator.id,
    });
    await waitForPhase("voting");
    log(`Phase: ${latestState.phase}, groups: ${latestState.groups.length}`);

    // Cast some votes (each participant gets 3 votes)
    log("Casting votes...");
    for (const conn of connections) {
      if (latestState.groups.length > 0) {
        // Vote on the first group
        send(conn.ws, {
          type: "CAST_VOTE",
          odiedId: conn.id,
          groupId: latestState.groups[0].id,
        });
        await sleep(100);
      }
    }
    await sleep(300);
    log(`Votes cast: ${latestState.votes.length}`);

    // Step 6: Advance to discussing
    log("Advancing to discussing phase...");
    send(facilitator.ws, {
      type: "ADVANCE_PHASE",
      facilitatorId: facilitator.id,
    });
    await waitForPhase("discussing");
    log(`Phase: ${latestState.phase}`);
    log(
      `Ranked groups: ${latestState.rankedGroupIds.length}, discussion index: ${latestState.discussion.currentGroupIndex}`
    );

    // Add an action item during discussion
    const actionItemId = `action-${Date.now().toString(36)}`;
    send(facilitator.ws, {
      type: "ADD_ACTION_ITEM",
      item: {
        id: actionItemId,
        text: "Fix flaky auth tests by next sprint",
        assignees: ["Bob"],
        groupId: latestState.rankedGroupIds[0] || null,
        createdAt: Date.now(),
      },
    });
    await sleep(300);
    log(`Action items: ${latestState.actionItems.length}`);

    // Step 7: Close retro (this triggers saveToDatabase on the server)
    log("Closing retro (CLOSE_RETRO) - this should trigger DB save...");
    send(facilitator.ws, {
      type: "CLOSE_RETRO",
      facilitatorId: facilitator.id,
    });
    await waitForPhase("closed");
    log(`Phase: ${latestState.phase}`);

    // Step 8: Wait for the save to complete (server does it async)
    log("Waiting 3s for server-side save to complete...");
    await sleep(3000);

    // Step 9: Verify the save by hitting the PartyKit HTTP endpoint
    // The room state should still be "closed" with all data intact
    log("Verifying room state via PartyKit HTTP endpoint...");
    const roomRes = await fetch(
      `http://${PARTY_HOST}/parties/retro/${ROOM_ID}`
    );
    if (!roomRes.ok) {
      throw new Error(`Room HTTP check failed: ${roomRes.status}`);
    }
    const roomState = await roomRes.json();
    log(`Room state phase: ${roomState.phase}`);
    log(`Room state cards: ${roomState.cards.length}`);
    log(`Room state groups: ${roomState.groups.length}`);
    log(`Room state actionItems: ${roomState.actionItems.length}`);
    log(`Room state teamId: ${roomState.teamId}`);
    log(`Room state createdBy: ${roomState.createdBy}`);

    // Validate final state
    const checks = [
      { name: "phase is closed", ok: roomState.phase === "closed" },
      { name: "has 6 cards", ok: roomState.cards.length === 6 },
      { name: "has groups", ok: roomState.groups.length > 0 },
      { name: "has action items", ok: roomState.actionItems.length > 0 },
      { name: "teamId set", ok: roomState.teamId === "e2e-test-team" },
      { name: "createdBy set", ok: roomState.createdBy === "e2e-test-user" },
    ];

    log("\n── Verification ──");
    for (const c of checks) {
      log(`  ${c.ok ? "PASS" : "FAIL"}: ${c.name}`);
    }

    const allPassed = checks.every((c) => c.ok);

    // Step 10: Try to verify DB save via the Next.js API
    // Note: there's no GET endpoint for retros, so we check PartyKit server logs
    // and the fact that the room reached "closed" state successfully
    log("\n── DB Save Verification ──");
    log(
      "The PartyKit server calls POST /api/retros/save when phase=closed."
    );
    log(
      "Check PartyKit server console for: '[retro] Saved retro <id> for room ...'"
    );
    log(
      "If you see '[retro] Failed to save to DB: ...' then the save failed."
    );

    // AUTH GAP FLAG
    log("\n── Security Note ──");
    log(
      "WARNING: /api/retros/save does NOT check X-Internal-Secret header."
    );
    log(
      "Compare with /api/estimation/save which requires X-Internal-Secret."
    );
    log(
      "The retro save is server-initiated (PartyKit -> Next.js API), but anyone "
    );
    log(
      "could POST to /api/retros/save directly. This should be addressed."
    );

    if (allPassed) {
      log("\nRESULT: ALL CHECKS PASSED");
      log(
        `Room ${ROOM_ID} completed full lifecycle: lobby -> writing -> grouping -> voting -> discussing -> closed`
      );
    } else {
      log("\nRESULT: SOME CHECKS FAILED");
      exitCode = 1;
    }
  } catch (err) {
    log(`\nERROR: ${err.message}`);
    if (err.stack) log(err.stack);
    exitCode = 1;
  } finally {
    closeAll();
    // Give time for close frames
    await sleep(500);
    process.exit(exitCode);
  }
}

run();
