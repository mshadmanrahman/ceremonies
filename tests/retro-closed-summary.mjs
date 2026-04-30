/**
 * Closed Retro Summary Tests
 *
 * Two test modes:
 *
 * 1. Unit tests (always run): validate the data-shape transform that maps
 *    raw DB rows into ClosedRetroSummaryProps. No server or DB required.
 *
 * 2. Integration tests (optional, requires DATABASE_URL + running Next.js):
 *    Seeds a fake closed retro, fetches the page HTML, asserts the
 *    summary content appears and "Join retro" button does not.
 *    Skipped automatically when DATABASE_URL or APP_HOST are missing.
 *
 * Usage:
 *   node tests/retro-closed-summary.mjs
 *   DATABASE_URL=<url> APP_HOST=http://localhost:3456 node tests/retro-closed-summary.mjs
 */

import { neon } from "@neondatabase/serverless";

const APP_HOST = process.env.APP_HOST || "http://localhost:3456";
const DATABASE_URL = process.env.DATABASE_URL;

const log = (msg) =>
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}`);
    failed++;
  }
}

// ── Data transform (mirrors the logic in page.tsx) ──

function buildSummaryGroups(groups, cards, actions) {
  return groups.map((g) => ({
    id: g.id,
    label: g.label,
    voteCount: g.voteCount ?? 0,
    rank: g.rank,
    cards: cards
      .filter((c) => c.groupId === g.id)
      .map((c) => ({ id: c.id, text: c.text, category: c.category })),
    actionItems: actions
      .filter((a) => a.groupId === g.id)
      .map((a) => ({
        id: a.id,
        text: a.text,
        assignees: a.assignees ?? [],
        groupId: a.groupId,
      })),
  }));
}

function buildGeneralActionItems(actions) {
  return actions
    .filter((a) => a.groupId === null)
    .map((a) => ({
      id: a.id,
      text: a.text,
      assignees: a.assignees ?? [],
      groupId: null,
    }));
}

// Sorts groups by rank (nulls last), then by voteCount desc
function sortGroups(groups) {
  return [...groups].sort((a, b) => {
    if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
    if (a.rank !== null) return -1;
    if (b.rank !== null) return 1;
    return b.voteCount - a.voteCount;
  });
}

// ── Unit tests ──

function runUnitTests() {
  console.log("\n=== Unit tests: data-shape transform ===\n");

  const fakeGroups = [
    { id: "g1", label: "Deployment speed", voteCount: 5, rank: 1 },
    { id: "g2", label: "Code review lag", voteCount: 3, rank: 2 },
    { id: "g3", label: "No rank group", voteCount: 1, rank: null },
  ];

  const fakeCards = [
    { id: "c1", groupId: "g1", text: "Deploy takes 40 mins", category: "sad" },
    { id: "c2", groupId: "g1", text: "Pipeline finally green", category: "happy" },
    { id: "c3", groupId: "g2", text: "PRs sit for days", category: "confused" },
  ];

  const fakeActions = [
    { id: "a1", retroId: "r1", groupId: "g1", text: "Set up faster CI", assignees: ["Alice"], done: false },
    { id: "a2", retroId: "r1", groupId: "g2", text: "Agree 24h review SLA", assignees: [], done: false },
    { id: "a3", retroId: "r1", groupId: null, text: "Book retro retrospective", assignees: ["Bob"], done: false },
  ];

  const summaryGroups = buildSummaryGroups(fakeGroups, fakeCards, fakeActions);
  const generalItems = buildGeneralActionItems(fakeActions);
  const sorted = sortGroups(summaryGroups);

  assert(summaryGroups.length === 3, "builds 3 summary groups");

  const g1 = summaryGroups.find((g) => g.id === "g1");
  assert(g1 !== undefined, "g1 present in summary groups");
  assert(g1?.cards.length === 2, "g1 has 2 cards");
  assert(g1?.actionItems.length === 1, "g1 has 1 action item");
  assert(g1?.actionItems[0]?.text === "Set up faster CI", "g1 action item text correct");
  assert(g1?.actionItems[0]?.assignees[0] === "Alice", "g1 action item assignee correct");

  const g2 = summaryGroups.find((g) => g.id === "g2");
  assert(g2?.cards.length === 1, "g2 has 1 card");
  assert(g2?.actionItems[0]?.assignees.length === 0, "g2 action item has empty assignees");

  assert(generalItems.length === 1, "exactly 1 general action item");
  assert(generalItems[0]?.text === "Book retro retrospective", "general action item text correct");
  assert(generalItems[0]?.groupId === null, "general action item groupId is null");

  // Sorting: ranked groups come first in rank order
  assert(sorted[0]?.id === "g1", "rank-1 group sorts first");
  assert(sorted[1]?.id === "g2", "rank-2 group sorts second");
  assert(sorted[2]?.id === "g3", "unranked group sorts last");

  // Null assignees fallback
  const actionsWithNullAssignees = [
    { id: "a4", retroId: "r1", groupId: null, text: "No assignees", assignees: null, done: false },
  ];
  const generalWithNull = buildGeneralActionItems(actionsWithNullAssignees);
  assert(generalWithNull[0]?.assignees.length === 0, "null assignees defaults to empty array");

  // A retro with no groups should produce no summary groups
  const emptyGroupSummary = buildSummaryGroups([], fakeCards, fakeActions);
  assert(emptyGroupSummary.length === 0, "empty groups input produces empty summary");

  // Cards not in any group should not appear in group summaries
  const ungroupedCard = { id: "c4", groupId: null, text: "Orphan card", category: "happy" };
  const mixedCards = [...fakeCards, ungroupedCard];
  const mixedSummary = buildSummaryGroups(fakeGroups, mixedCards, fakeActions);
  const allCardsInGroups = mixedSummary.flatMap((g) => g.cards);
  assert(
    !allCardsInGroups.some((c) => c.id === "c4"),
    "ungrouped cards do not appear in any group summary"
  );
}

// ── Integration tests ──

async function runIntegrationTests() {
  console.log("\n=== Integration tests: page HTML assertions ===\n");

  if (!DATABASE_URL) {
    console.log("  SKIP: DATABASE_URL not set");
    return;
  }

  const sql = neon(DATABASE_URL);
  const roomCode = `test-${Math.random().toString(36).slice(2, 8)}`;

  let retroId = null;
  let groupId = null;

  try {
    // Seed: retro row
    const [retroRow] = await sql`
      INSERT INTO retros (room_code, status, created_by, closed_at, card_count, group_count, action_count)
      VALUES (${roomCode}, 'closed', 'test-user', NOW(), 1, 1, 1)
      RETURNING id
    `;
    retroId = retroRow.id;

    // Seed: group
    const [groupRow] = await sql`
      INSERT INTO retro_groups (retro_id, label, vote_count, rank)
      VALUES (${retroId}, 'Test group label', 4, 1)
      RETURNING id
    `;
    groupId = groupRow.id;

    // Seed: card
    await sql`
      INSERT INTO retro_cards (retro_id, category, text, anonymous_id, group_id)
      VALUES (${retroId}, 'happy', 'Things went well', 'anon-1', ${groupId})
    `;

    // Seed: action item attached to group
    await sql`
      INSERT INTO action_items (retro_id, group_id, text, assignees, done)
      VALUES (${retroId}, ${groupId}, 'Follow up on deployment', '["Charlie"]', false)
    `;

    // Seed: general action item
    await sql`
      INSERT INTO action_items (retro_id, group_id, text, assignees, done)
      VALUES (${retroId}, NULL, 'General retro action', '[]', false)
    `;

    log(`Seeded closed retro room_code=${roomCode} retro_id=${retroId}`);

    // Fetch the page HTML
    const url = `${APP_HOST}/retro/${roomCode}`;
    log(`Fetching ${url}`);
    const res = await fetch(url);
    const html = await res.text();

    assert(res.ok, `page responds 200 (got ${res.status})`);
    assert(html.includes("Test group label"), "group label appears in HTML");
    assert(html.includes("Things went well"), "card text appears in HTML");
    assert(html.includes("Follow up on deployment"), "action item text appears in HTML");
    assert(html.includes("General retro action"), "general action item appears in HTML");
    assert(!html.includes("Join retro"), '"Join retro" button absent in closed summary');
    assert(html.includes(roomCode), "room code appears in HTML");
  } finally {
    // Cleanup
    if (retroId) {
      try {
        await sql`DELETE FROM action_items WHERE retro_id = ${retroId}`;
        await sql`DELETE FROM retro_cards WHERE retro_id = ${retroId}`;
        await sql`DELETE FROM retro_groups WHERE retro_id = ${retroId}`;
        await sql`DELETE FROM retros WHERE id = ${retroId}`;
        log(`Cleaned up retro_id=${retroId}`);
      } catch (cleanupErr) {
        console.error("Cleanup failed:", cleanupErr);
      }
    }
  }
}

// ── Main ──

async function main() {
  runUnitTests();

  try {
    await runIntegrationTests();
  } catch (err) {
    console.error("Integration test error:", err);
    failed++;
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
