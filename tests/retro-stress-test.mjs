/**
 * Retro Stress Test — 15 participants, 42 cards
 * Tests the full retro lifecycle through grouping under load.
 *
 * Usage: node tests/retro-stress-test.mjs [host] [roomId]
 */

import WebSocket from "ws";

const HOST = process.argv[2] || "127.0.0.1:1999";
const ROOM_ID = process.argv[3] || `stress-${Date.now().toString(36)}`;
const NUM_PARTICIPANTS = 15;
const CARDS_PER_PERSON = 3; // ~42 total (15*3=45, close enough)
const CATEGORIES = ["went-well", "to-improve", "action-items"];

const log = (msg) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Track state from broadcasts
let latestState = null;
let facilitatorId = null;
const participants = [];

function connect(name) {
  return new Promise((resolve, reject) => {
    const url = `ws://${HOST}/parties/retro/${ROOM_ID}?name=${encodeURIComponent(name)}`;
    const ws = new WebSocket(url);
    let myId = null;

    ws.on("open", () => {
      // Don't resolve yet — wait for sync message
    });

    ws.on("message", (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === "sync") {
        myId = data.you;
        latestState = data.state;
        facilitatorId = data.state.facilitatorId;
        resolve({ ws, id: myId, name, anonymousId: data.anonymousId });
      } else if (data.type === "update") {
        latestState = data.state;
      }
    });

    ws.on("error", (err) => reject(err));

    setTimeout(() => reject(new Error(`Connection timeout for ${name}`)), 5000);
  });
}

function send(ws, event) {
  ws.send(JSON.stringify(event));
}

function waitForPhase(phase, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (latestState?.phase === phase) return resolve();
      if (Date.now() - start > timeoutMs) {
        return reject(new Error(`Timeout waiting for phase "${phase}" (stuck at "${latestState?.phase}")`));
      }
      setTimeout(check, 100);
    };
    check();
  });
}

async function run() {
  log(`Room: ${ROOM_ID}`);
  log(`Connecting ${NUM_PARTICIPANTS} participants...`);

  // Connect all participants
  for (let i = 0; i < NUM_PARTICIPANTS; i++) {
    const p = await connect(`Tester-${i + 1}`);
    participants.push(p);
    if (i === 0) {
      log(`  Facilitator: ${p.id} (${p.name})`);
    }
  }
  log(`Connected: ${participants.length}/${NUM_PARTICIPANTS}`);
  log(`Facilitator in state: ${latestState.facilitatorId}`);
  log(`Phase: ${latestState.phase}`);

  // Small delay to ensure all connections are fully set up on server
  await sleep(500);

  // ── Start Retro ──
  const fac = participants[0]; // first connected = facilitator
  log(`Sending START_RETRO from ${fac.id} (facilitatorId: ${fac.id})`);
  send(fac.ws, {
    type: "START_RETRO",
    facilitatorId: fac.id, // MUST include this for server's "facilitatorId" in event check
  });

  await waitForPhase("writing");
  log(`Phase: writing ✓`);

  // ── Writing Phase: Each participant adds cards ──
  log(`Adding ${NUM_PARTICIPANTS * CARDS_PER_PERSON} cards...`);
  let cardCount = 0;
  for (const p of participants) {
    for (let c = 0; c < CARDS_PER_PERSON; c++) {
      const category = CATEGORIES[c % CATEGORIES.length];
      send(p.ws, {
        type: "ADD_CARD",
        category,
        text: `${p.name}: ${category} item #${c + 1} - ${Math.random().toString(36).slice(2, 8)}`,
      });
      cardCount++;
      // Small stagger to avoid overwhelming the server
      if (cardCount % 5 === 0) await sleep(50);
    }
  }

  // Wait for all cards to arrive
  await sleep(1000);
  log(`Cards in state: ${latestState.cards.length}/${cardCount}`);

  if (latestState.cards.length < cardCount * 0.9) {
    log(`WARNING: Only ${latestState.cards.length}/${cardCount} cards arrived. Some may have been dropped.`);
  }

  // ── Advance to Grouping ──
  log(`Advancing to grouping...`);
  send(fac.ws, { type: "ADVANCE_PHASE", facilitatorId: fac.id });
  await waitForPhase("grouping");
  log(`Phase: grouping ✓`);
  log(`Card positions: ${Object.keys(latestState.cardPositions || {}).length}`);

  // ── Scatter cards (simulate client-side scatter) ──
  // The client normally calls SCATTER_CARDS on entering grouping phase
  const cards = latestState.cards;
  const positions = {};
  const CANVAS_W = 1200;
  const CANVAS_H = 800;
  const CARD_W = 200;
  const CARD_H = 100;
  const maxCols = Math.floor(CANVAS_W / (CARD_W + 8));

  cards.forEach((card, i) => {
    const col = i % maxCols;
    const row = Math.floor(i / maxCols);
    positions[card.id] = {
      x: col * (CARD_W + 8) + Math.random() * 20,
      y: row * (CARD_H + 8) + Math.random() * 20,
    };
  });

  send(fac.ws, { type: "SCATTER_CARDS", positions });
  await sleep(500);
  log(`Scattered ${Object.keys(positions).length} cards`);

  // ── Simulate grouping: move some cards close together ──
  // Create 3 clusters by moving cards within 80px of each other
  const cardIds = cards.map((c) => c.id);
  const clusterSize = Math.floor(cardIds.length / 3);

  log(`Creating 3 proximity clusters (~${clusterSize} cards each)...`);
  for (let cluster = 0; cluster < 3; cluster++) {
    const clusterX = 200 + cluster * 400;
    const clusterY = 300;
    for (let j = 0; j < clusterSize; j++) {
      const idx = cluster * clusterSize + j;
      if (idx >= cardIds.length) break;
      // Move cards within 80px of cluster center (within 120px threshold)
      const x = clusterX + (j % 4) * 30 + Math.random() * 20;
      const y = clusterY + Math.floor(j / 4) * 30 + Math.random() * 20;
      send(fac.ws, {
        type: "MOVE_CARD_POSITION",
        cardId: cardIds[idx],
        x,
        y,
      });
      if (j % 3 === 0) await sleep(30); // stagger
    }
  }

  await sleep(1500); // let proximity computation catch up
  log(`Groups formed: ${latestState.groups.length}`);
  latestState.groups.forEach((g, i) => {
    log(`  Group ${i + 1}: "${g.label.slice(0, 30)}..." (${g.cardIds.length} cards)`);
  });

  // ── Rename a group ──
  if (latestState.groups.length > 0) {
    const groupToRename = latestState.groups[0];
    send(fac.ws, {
      type: "RENAME_GROUP",
      groupId: groupToRename.id,
      label: "Stress Test Cluster #1",
    });
    await sleep(300);
    log(`Renamed group: "${latestState.groups[0].label}"`);
  }

  // ── Advance to Voting ──
  log(`Advancing to voting...`);
  send(fac.ws, { type: "ADVANCE_PHASE", facilitatorId: fac.id });
  await waitForPhase("voting");
  log(`Phase: voting ✓`);
  log(`Groups (including auto-grouped): ${latestState.groups.length}`);

  // ── Cast votes ──
  const votableGroupIds = latestState.groups.map((g) => g.id);
  let voteCount = 0;
  for (const p of participants) {
    // Each participant votes for 2 random groups
    const shuffled = [...votableGroupIds].sort(() => Math.random() - 0.5);
    for (let v = 0; v < Math.min(2, shuffled.length); v++) {
      send(p.ws, {
        type: "CAST_VOTE",
        groupId: shuffled[v],
        odiedId: p.id, // server will override with real ID
      });
      voteCount++;
    }
  }
  await sleep(1000);
  log(`Votes cast: ${voteCount}`);
  log(`Votes in state: ${latestState.votes.length}`);

  // ── Advance to Discussing ──
  log(`Advancing to discussing...`);
  send(fac.ws, { type: "ADVANCE_PHASE", facilitatorId: fac.id });
  await waitForPhase("discussing");
  log(`Phase: discussing ✓`);
  log(`Ranked groups: ${latestState.rankedGroupIds.length}`);
  log(`Current topic: group index ${latestState.discussion.currentGroupIndex}`);

  // ── Add action items ──
  send(fac.ws, {
    type: "ADD_ACTION_ITEM",
    facilitatorId: fac.id,
    actionItem: {
      id: `action-${Date.now()}`,
      text: "Follow up on stress test results",
      assignee: "Tester-1",
      groupId: latestState.rankedGroupIds[0],
    },
  });
  await sleep(300);
  log(`Action items: ${latestState.actionItems?.length ?? 0}`);

  // ── Navigate topics ──
  if (latestState.rankedGroupIds.length > 1) {
    send(fac.ws, { type: "NEXT_TOPIC", facilitatorId: fac.id });
    await sleep(300);
    log(`Advanced to topic index: ${latestState.discussion.currentGroupIndex}`);
  }

  // ── Close Retro ──
  log(`Closing retro...`);
  send(fac.ws, { type: "CLOSE_RETRO", facilitatorId: fac.id });
  await waitForPhase("closed");
  log(`Phase: closed ✓`);

  // ── Summary ──
  log(`\n${"=".repeat(50)}`);
  log(`STRESS TEST COMPLETE`);
  log(`${"=".repeat(50)}`);
  log(`Participants: ${latestState.participants.length}`);
  log(`Cards: ${latestState.cards.length}`);
  log(`Groups: ${latestState.groups.length}`);
  log(`Votes: ${latestState.votes.length}`);
  log(`Action Items: ${latestState.actionItems?.length ?? 0}`);
  log(`Final Phase: ${latestState.phase}`);

  // Verify key invariants
  let passed = true;

  if (latestState.cards.length < cardCount * 0.9) {
    log(`FAIL: Card count too low (${latestState.cards.length}/${cardCount})`);
    passed = false;
  }

  if (latestState.groups.length === 0) {
    log(`FAIL: No groups formed`);
    passed = false;
  }

  if (latestState.phase !== "closed") {
    log(`FAIL: Expected closed phase, got "${latestState.phase}"`);
    passed = false;
  }

  // Check that renamed label persisted
  const renamedGroup = latestState.groups.find((g) => g.label === "Stress Test Cluster #1");
  if (!renamedGroup) {
    log(`WARN: Renamed group label may not have persisted through proximity recalc`);
    // Check renamedLabels store
    const renamedLabelsCount = Object.keys(latestState.renamedLabels || {}).length;
    log(`  renamedLabels entries: ${renamedLabelsCount}`);
  } else {
    log(`OK: Renamed group label persisted ✓`);
  }

  if (passed) {
    log(`\n✅ ALL CHECKS PASSED`);
  } else {
    log(`\n❌ SOME CHECKS FAILED`);
  }

  // Cleanup: close all connections
  for (const p of participants) {
    p.ws.close();
  }

  process.exit(passed ? 0 : 1);
}

run().catch((err) => {
  console.error("FATAL:", err);
  // Cleanup on error
  for (const p of participants) {
    try { p.ws.close(); } catch {}
  }
  process.exit(1);
});
