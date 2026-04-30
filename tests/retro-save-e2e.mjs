/**
 * Retro Save E2E Test
 *
 * Verifies the full retro save-to-database flow:
 * 1. Connect 3 participants to a retro room
 * 2. Walk through all phases: lobby -> writing -> grouping -> voting -> discussing -> closed
 * 3. When phase hits "closed", PartyKit server POSTs to /api/retros/save
 * 4. Verify the save succeeded by querying the DB directly (SELECT after close)
 *
 * Also runs a second case: anonymous retro (createdBy: null) to confirm the
 * row lands with created_by = 'anonymous' rather than failing a NOT NULL constraint.
 *
 * Usage: node tests/retro-save-e2e.mjs [partykit-host] [nextjs-host]
 *
 * Prerequisites:
 * - PartyKit dev server running on port 1999
 * - Next.js dev server running on port 3456
 * - Neon DB accessible (via DATABASE_URL env var)
 */

import WebSocket from "ws";
import { neon } from "@neondatabase/serverless";

const PARTY_HOST = process.argv[2] || "127.0.0.1:1999";
const APP_HOST = process.argv[3] || "http://localhost:3456";
const PARTICIPANTS = ["Alice", "Bob", "Carol"];

const log = (msg) =>
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── DB helper ──

function getDbSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL env var is required for DB assertions");
  return neon(url);
}

async function queryRetroByRoomCode(roomCode) {
  const sql = getDbSql();
  const rows = await sql`
    SELECT id, room_code, created_by, status, closed_at
    FROM retros
    WHERE room_code = ${roomCode}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

// ── WebSocket helpers ──

let latestState = null;
const connections = [];

function connect(name, roomId) {
  return new Promise((resolve, reject) => {
    const url = `ws://${PARTY_HOST}/parties/retro/${roomId}?name=${encodeURIComponent(name)}`;
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
  connections.length = 0;
}

// ── Full lifecycle runner ──

async function runRetroLifecycle(roomId, createdBy) {
  latestState = null;

  log(`Connecting 3 participants to room: ${roomId} (createdBy: ${createdBy ?? "null"})`);
  for (const name of PARTICIPANTS) {
    const conn = await connect(name, roomId);
    connections.push(conn);
    log(`  ${name} connected (id=${conn.id})`);
    await sleep(200);
  }

  const facilitator = connections[0];
  log(`Facilitator: ${facilitator.name} (${facilitator.id})`);
  log(`Current phase: ${latestState.phase}`);

  if (latestState.phase !== "lobby") {
    throw new Error(`Expected lobby phase, got: ${latestState.phase}`);
  }

  log("Starting retro...");
  send(facilitator.ws, {
    type: "START_RETRO",
    facilitatorId: facilitator.id,
    teamId: "e2e-test-team",
    createdBy,
  });
  await waitForPhase("writing");
  log(`Phase: ${latestState.phase}`);

  const cards = [
    { type: "ADD_CARD", category: "happy", text: "Great team collaboration this sprint" },
    { type: "ADD_CARD", category: "happy", text: "CI/CD pipeline is much faster now" },
    { type: "ADD_CARD", category: "sad", text: "Too many meetings eating focus time" },
    { type: "ADD_CARD", category: "sad", text: "Flaky tests in the auth module" },
    { type: "ADD_CARD", category: "confused", text: "New deployment process unclear" },
    { type: "ADD_CARD", category: "confused", text: "Who owns the data pipeline?" },
  ];

  log("Adding 6 cards...");
  for (let i = 0; i < cards.length; i++) {
    const conn = connections[i % connections.length];
    send(conn.ws, cards[i]);
    await sleep(150);
  }

  await sleep(500);
  log(`Cards in state: ${latestState.cards.length}`);
  if (latestState.cards.length !== 6) {
    throw new Error(`Expected 6 cards, got ${latestState.cards.length}`);
  }

  log("Advancing to grouping...");
  send(facilitator.ws, { type: "ADVANCE_PHASE", facilitatorId: facilitator.id });
  await waitForPhase("grouping");

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
  }

  log("Advancing to voting...");
  send(facilitator.ws, { type: "ADVANCE_PHASE", facilitatorId: facilitator.id });
  await waitForPhase("voting");

  log("Casting votes...");
  for (const conn of connections) {
    if (latestState.groups.length > 0) {
      send(conn.ws, {
        type: "CAST_VOTE",
        odiedId: conn.id,
        groupId: latestState.groups[0].id,
      });
      await sleep(100);
    }
  }
  await sleep(300);

  log("Advancing to discussing...");
  send(facilitator.ws, { type: "ADVANCE_PHASE", facilitatorId: facilitator.id });
  await waitForPhase("discussing");

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

  log("Closing retro...");
  send(facilitator.ws, { type: "CLOSE_RETRO", facilitatorId: facilitator.id });
  await waitForPhase("closed");
  log(`Phase: ${latestState.phase}`);

  log("Waiting 3s for server-side DB save to complete...");
  await sleep(3000);

  closeAll();
  return roomId;
}

// ── Test case: named user ──

async function testNamedUser() {
  log("\n==== Test 1: named user (createdBy: e2e-test-user) ====");
  const roomId = `e2e-save-${Date.now().toString(36)}`;
  await runRetroLifecycle(roomId, "e2e-test-user");

  log("Querying DB for saved retro row...");
  const row = await queryRetroByRoomCode(roomId);

  const checks = [
    { name: "row exists in DB", ok: row !== null },
    { name: "status is closed", ok: row?.status === "closed" },
    { name: "created_by is e2e-test-user", ok: row?.created_by === "e2e-test-user" },
    { name: "closed_at is set", ok: row?.closed_at != null },
  ];

  log("\n-- Verification (Test 1) --");
  for (const c of checks) {
    log(`  ${c.ok ? "PASS" : "FAIL"}: ${c.name}`);
  }
  return checks.every((c) => c.ok);
}

// ── Test case: anonymous retro (createdBy: null) ──

async function testAnonymousUser() {
  log("\n==== Test 2: anonymous retro (createdBy: null) ====");
  const roomId = `e2e-anon-${Date.now().toString(36)}`;
  // Pass null createdBy to simulate a retro started before Clerk fully loaded.
  await runRetroLifecycle(roomId, null);

  log("Querying DB for saved retro row...");
  const row = await queryRetroByRoomCode(roomId);

  const checks = [
    { name: "row exists in DB", ok: row !== null },
    { name: "status is closed", ok: row?.status === "closed" },
    // The save route must normalize null to "anonymous" before inserting.
    { name: "created_by is 'anonymous'", ok: row?.created_by === "anonymous" },
    { name: "closed_at is set", ok: row?.closed_at != null },
  ];

  log("\n-- Verification (Test 2) --");
  for (const c of checks) {
    log(`  ${c.ok ? "PASS" : "FAIL"}: ${c.name}`);
  }
  return checks.every((c) => c.ok);
}

// ── Main ──

async function run() {
  let exitCode = 0;

  try {
    const t1 = await testNamedUser();
    const t2 = await testAnonymousUser();

    const allPassed = t1 && t2;
    log(
      allPassed
        ? "\nRESULT: ALL CHECKS PASSED"
        : "\nRESULT: SOME CHECKS FAILED"
    );
    if (!allPassed) exitCode = 1;
  } catch (err) {
    log(`\nERROR: ${err.message}`);
    if (err.stack) log(err.stack);
    exitCode = 1;
  } finally {
    closeAll();
    await sleep(500);
    process.exit(exitCode);
  }
}

run();
