/**
 * Retro Monkey Test — chaotic simulation with 15 participants, ~42 cards
 *
 * Unlike the stress test which follows a clean path, this test simulates
 * real-world chaos: cards dragged everywhere, groups forming/splitting,
 * rapid concurrent actions, late joiners, etc.
 *
 * Usage: node tests/retro-monkey-test.mjs [host] [roomId]
 */

import WebSocket from "ws";

const HOST = process.argv[2] || "127.0.0.1:1999";
const ROOM_ID = process.argv[3] || `monkey-${Date.now().toString(36)}`;
const NUM_PARTICIPANTS = 15;
const CATEGORIES = ["went-well", "to-improve", "action-items"];

const log = (msg) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

let latestState = null;
const participants = [];

function connect(name) {
  return new Promise((resolve, reject) => {
    const url = `ws://${HOST}/parties/retro/${ROOM_ID}?name=${encodeURIComponent(name)}`;
    const ws = new WebSocket(url);
    ws.on("message", (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === "sync") {
        latestState = data.state;
        resolve({ ws, id: data.you, name, anonymousId: data.anonymousId });
      } else if (data.type === "update") {
        latestState = data.state;
      }
    });
    ws.on("error", reject);
    setTimeout(() => reject(new Error(`Timeout: ${name}`)), 5000);
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
      if (Date.now() - start > timeoutMs)
        return reject(new Error(`Timeout: expected "${phase}", stuck at "${latestState?.phase}"`));
      setTimeout(check, 100);
    };
    check();
  });
}

async function run() {
  log(`=== RETRO MONKEY TEST ===`);
  log(`Room: ${ROOM_ID}`);

  // ── Phase 1: Connect participants (staggered, like real users) ──
  log(`Connecting participants with staggered timing...`);
  // Connect first 10 quickly
  for (let i = 0; i < 10; i++) {
    participants.push(await connect(`User-${i + 1}`));
    await sleep(rand(20, 80)); // realistic stagger
  }
  log(`First 10 connected. Facilitator: ${participants[0].id}`);

  const fac = participants[0];
  await sleep(200);

  // ── Phase 2: Start retro ──
  send(fac.ws, { type: "START_RETRO", facilitatorId: fac.id });
  await waitForPhase("writing");
  log(`Phase: writing ✓ (${latestState.participants.length} participants)`);

  // Connect remaining 5 AFTER retro started (late joiners)
  for (let i = 10; i < NUM_PARTICIPANTS; i++) {
    participants.push(await connect(`LateJoiner-${i + 1}`));
    await sleep(rand(50, 150));
  }
  log(`Late joiners connected: ${participants.length} total`);

  // ── Phase 3: Chaotic card writing ──
  // Simulate real behavior: some people write lots, some write few
  log(`Writing cards (varying amounts per person)...`);
  const writePromises = participants.map(async (p, idx) => {
    const numCards = idx < 5 ? rand(4, 6) : rand(1, 3); // power users vs casual
    for (let c = 0; c < numCards; c++) {
      const category = CATEGORIES[rand(0, 2)];
      send(p.ws, {
        type: "ADD_CARD",
        category,
        text: `${p.name} ${category}: ${generateCardText()}`,
      });
      await sleep(rand(100, 500)); // typing time
    }
    return numCards;
  });

  const cardCounts = await Promise.all(writePromises);
  const totalCards = cardCounts.reduce((a, b) => a + b, 0);
  await sleep(1000);
  log(`Expected ~${totalCards} cards, got ${latestState.cards.length}`);

  // ── Phase 4: Advance to grouping ──
  send(fac.ws, { type: "ADVANCE_PHASE", facilitatorId: fac.id });
  await waitForPhase("grouping");
  log(`Phase: grouping ✓ (${latestState.cards.length} cards to group)`);

  // Scatter cards
  const scatterPositions = {};
  latestState.cards.forEach((card, i) => {
    scatterPositions[card.id] = {
      x: rand(50, 1100),
      y: rand(50, 700),
    };
  });
  send(fac.ws, { type: "SCATTER_CARDS", positions: scatterPositions });
  await sleep(500);

  // ── Phase 5: Chaotic grouping — multiple users dragging cards simultaneously ──
  log(`Chaotic grouping phase — multiple users dragging cards...`);
  const cardIds = latestState.cards.map((c) => c.id);

  // Create 5 "zones" where people are trying to group cards
  const zones = [
    { x: 200, y: 200, label: "Communication" },
    { x: 600, y: 200, label: "Process" },
    { x: 1000, y: 200, label: "Technical" },
    { x: 400, y: 500, label: "Team" },
    { x: 800, y: 500, label: "Tools" },
  ];

  // Multiple users drag cards simultaneously (realistic chaos)
  const dragPromises = [];
  for (let round = 0; round < 3; round++) {
    for (const p of participants.slice(0, 8)) {
      // Pick a random card and drag it to a random zone
      const cardId = cardIds[rand(0, cardIds.length - 1)];
      const zone = zones[rand(0, zones.length - 1)];
      // Simulate drag: multiple intermediate positions
      dragPromises.push(
        (async () => {
          const steps = rand(3, 6);
          const startX = rand(50, 1100);
          const startY = rand(50, 700);
          for (let s = 0; s <= steps; s++) {
            const progress = s / steps;
            const x = startX + (zone.x - startX) * progress + rand(-20, 20);
            const y = startY + (zone.y - startY) * progress + rand(-20, 20);
            send(p.ws, { type: "MOVE_CARD_POSITION", cardId, x, y });
            await sleep(rand(30, 80)); // drag speed
          }
        })()
      );
    }
    await sleep(200); // between drag rounds
  }
  await Promise.all(dragPromises);

  // Final precise grouping: move cards into tight clusters
  log(`Final grouping: creating tight clusters...`);
  const shuffledCards = [...cardIds].sort(() => Math.random() - 0.5);
  const cardsPerZone = Math.ceil(shuffledCards.length / zones.length);
  for (let z = 0; z < zones.length; z++) {
    const zone = zones[z];
    const zoneCards = shuffledCards.slice(z * cardsPerZone, (z + 1) * cardsPerZone);
    for (let j = 0; j < zoneCards.length; j++) {
      const x = zone.x + (j % 4) * 25 + rand(0, 10);
      const y = zone.y + Math.floor(j / 4) * 25 + rand(0, 10);
      send(fac.ws, { type: "MOVE_CARD_POSITION", cardId: zoneCards[j], x, y });
      if (j % 5 === 0) await sleep(20);
    }
  }

  await sleep(2000); // let proximity recomputation settle
  log(`Groups after chaotic grouping: ${latestState.groups.length}`);
  latestState.groups.forEach((g, i) => {
    log(`  G${i + 1}: ${g.cardIds.length} cards — "${g.label.slice(0, 40)}"`);
  });

  // Rename some groups
  for (let i = 0; i < Math.min(zones.length, latestState.groups.length); i++) {
    send(fac.ws, {
      type: "RENAME_GROUP",
      groupId: latestState.groups[i].id,
      label: zones[i].label,
    });
    await sleep(100);
  }
  await sleep(500);
  log(`Renamed groups:`);
  latestState.groups.forEach((g, i) => {
    log(`  G${i + 1}: "${g.label}" (${g.cardIds.length} cards)`);
  });

  // ── Phase 6: Voting ──
  send(fac.ws, { type: "ADVANCE_PHASE", facilitatorId: fac.id });
  await waitForPhase("voting");
  log(`Phase: voting ✓ (${latestState.groups.length} groups)`);

  // Chaotic voting: some vote quickly, some slowly, some change votes
  log(`Voting phase...`);
  const groupIds = latestState.groups.map((g) => g.id);
  for (const p of participants) {
    const numVotes = rand(1, 3);
    const votedFor = new Set();
    for (let v = 0; v < numVotes; v++) {
      const gid = groupIds[rand(0, groupIds.length - 1)];
      if (votedFor.has(gid)) continue;
      votedFor.add(gid);
      send(p.ws, { type: "CAST_VOTE", groupId: gid, odiedId: p.id });
      await sleep(rand(50, 200));
    }
  }
  await sleep(1000);
  log(`Votes in state: ${latestState.votes.length}`);

  // ── Phase 7: Discussion ──
  send(fac.ws, { type: "ADVANCE_PHASE", facilitatorId: fac.id });
  await waitForPhase("discussing");
  log(`Phase: discussing ✓`);
  log(`Ranked groups: ${latestState.rankedGroupIds.length}`);

  // Add multiple action items
  for (let a = 0; a < 3; a++) {
    send(fac.ws, {
      type: "ADD_ACTION_ITEM",
      facilitatorId: fac.id,
      actionItem: {
        id: `action-${Date.now()}-${a}`,
        text: `Action item #${a + 1}: ${["Fix CI pipeline", "Update docs", "Pair on auth module"][a]}`,
        assignee: participants[rand(0, participants.length - 1)].name,
        groupId: latestState.rankedGroupIds[0],
      },
    });
    await sleep(200);
  }
  log(`Action items: ${latestState.actionItems?.length ?? 0}`);

  // Navigate through topics
  for (let t = 0; t < Math.min(3, latestState.rankedGroupIds.length - 1); t++) {
    send(fac.ws, { type: "NEXT_TOPIC", facilitatorId: fac.id });
    await sleep(300);
  }
  log(`Navigated to topic ${latestState.discussion.currentGroupIndex}`);

  // ── Phase 8: Close ──
  send(fac.ws, { type: "CLOSE_RETRO", facilitatorId: fac.id });
  await waitForPhase("closed");
  log(`Phase: closed ✓`);

  // ── Results ──
  log(`\n${"=".repeat(50)}`);
  log(`MONKEY TEST RESULTS`);
  log(`${"=".repeat(50)}`);
  log(`Participants:  ${latestState.participants.length}`);
  log(`Cards:         ${latestState.cards.length}`);
  log(`Groups:        ${latestState.groups.length}`);
  log(`Votes:         ${latestState.votes.length}`);
  log(`Action Items:  ${latestState.actionItems?.length ?? 0}`);
  log(`Phase:         ${latestState.phase}`);
  log(`Renamed labels: ${Object.keys(latestState.renamedLabels || {}).length}`);

  // Invariant checks
  let passed = true;

  if (latestState.cards.length < 30) {
    log(`FAIL: Too few cards (${latestState.cards.length}, expected ~${totalCards})`);
    passed = false;
  }

  if (latestState.groups.length === 0) {
    log(`FAIL: No groups formed`);
    passed = false;
  }

  if (latestState.phase !== "closed") {
    log(`FAIL: Not closed`);
    passed = false;
  }

  // Check that all cards belong to exactly one group
  const allGroupedCardIds = latestState.groups.flatMap((g) => g.cardIds);
  const uniqueGrouped = new Set(allGroupedCardIds);
  if (allGroupedCardIds.length !== uniqueGrouped.size) {
    log(`FAIL: Duplicate card in groups (${allGroupedCardIds.length} refs, ${uniqueGrouped.size} unique)`);
    passed = false;
  } else {
    log(`OK: No duplicate cards in groups ✓`);
  }

  // Check cards not orphaned (all should be in a group after voting)
  const cardIdsSet = new Set(latestState.cards.map((c) => c.id));
  const ungrouped = [...cardIdsSet].filter((id) => !uniqueGrouped.has(id));
  if (ungrouped.length > 0) {
    log(`WARN: ${ungrouped.length} cards not in any group (may be expected if auto-group didn't cover all)`);
  } else {
    log(`OK: All cards in groups ✓`);
  }

  if ((latestState.actionItems?.length ?? 0) < 3) {
    log(`FAIL: Expected 3 action items, got ${latestState.actionItems?.length ?? 0}`);
    passed = false;
  }

  if (passed) {
    log(`\n✅ MONKEY TEST PASSED`);
  } else {
    log(`\n❌ MONKEY TEST FAILED`);
  }

  // Cleanup
  for (const p of participants) p.ws.close();
  process.exit(passed ? 0 : 1);
}

function generateCardText() {
  const subjects = ["We", "The team", "Sprint", "Deployment", "Code review", "Standup", "Pairing"];
  const verbs = ["improved", "struggled with", "nailed", "should fix", "loved", "hated", "discussed"];
  const objects = ["communication", "velocity", "quality", "testing", "CI/CD", "docs", "onboarding"];
  return `${subjects[rand(0, subjects.length - 1)]} ${verbs[rand(0, verbs.length - 1)]} ${objects[rand(0, objects.length - 1)]}`;
}

run().catch((err) => {
  console.error("FATAL:", err);
  for (const p of participants) try { p.ws.close(); } catch {}
  process.exit(1);
});
