/**
 * 2026-05-07 post-incident cleanup and drift audit
 * Context: 2026-04-30 production incident traced to schema drift between
 * Drizzle schema and Neon Postgres. This script drops the recovery backup
 * table and audits every schema-declared table for column drift.
 *
 * Run: vercel env pull .env.production.local --environment=production --yes
 *      node scripts/cleanup-2026-05-07.mjs
 */

import { createRequire } from "module";
import { readFileSync } from "fs";
import { resolve } from "path";

const require = createRequire(import.meta.url);

// ── Load DATABASE_URL from .env.production.local ──

const envPath = resolve(process.cwd(), ".env.production.local");
let DATABASE_URL;
try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eqIdx = trimmed.indexOf("=");
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key === "DATABASE_URL") {
      DATABASE_URL = val;
      break;
    }
  }
} catch (err) {
  console.error(
    `ERROR: could not read ${envPath}\n` +
      `Run: vercel env pull .env.production.local --environment=production --yes\n` +
      err.message
  );
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error(`ERROR: DATABASE_URL not found in ${envPath}`);
  process.exit(1);
}

console.log("DATABASE_URL loaded from .env.production.local");

// ── Connect via @neondatabase/serverless ──

const { neon } = require("@neondatabase/serverless");
const sql = neon(DATABASE_URL);

// ── Schema column declarations (source of truth: src/lib/db/schema.ts) ──

const SCHEMA_TABLES = {
  teams: [
    "id",
    "name",
    "created_by",
    "plan",
    "stripe_customer_id",
    "stripe_subscription_id",
    "created_at",
  ],
  team_members: ["id", "team_id", "user_id", "role", "joined_at"],
  retros: [
    "id",
    "team_id",
    "room_code",
    "status",
    "created_by",
    "created_at",
    "closed_at",
    "card_count",
    "group_count",
    "action_count",
  ],
  retro_cards: [
    "id",
    "retro_id",
    "category",
    "text",
    "anonymous_id",
    "group_id",
    "created_at",
  ],
  retro_groups: ["id", "retro_id", "label", "vote_count", "rank"],
  action_items: [
    "id",
    "retro_id",
    "group_id",
    "text",
    "assignees",
    "done",
    "created_at",
  ],
  team_invites: [
    "id",
    "team_id",
    "code",
    "created_by",
    "role",
    "max_uses",
    "use_count",
    "expires_at",
    "created_at",
  ],
  team_jira_connections: [
    "id",
    "team_id",
    "cloud_id",
    "site_url",
    "site_name",
    "access_token_enc",
    "refresh_token_enc",
    "token_expires_at",
    "scopes",
    "connected_by",
    "connected_at",
    "updated_at",
  ],
  action_item_jira_links: [
    "id",
    "action_item_id",
    "jira_issue_key",
    "jira_issue_url",
    "jira_issue_status",
    "status_fetched_at",
    "created_at",
  ],
  estimation_sessions: [
    "id",
    "team_id",
    "room_code",
    "created_by",
    "created_at",
    "closed_at",
    "participant_count",
  ],
  estimation_results: [
    "id",
    "session_id",
    "ticket_ref",
    "ticket_title",
    "final_estimate",
    "participant_count",
    "completed_at",
    "jira_issue_key",
    "jira_write_back_status",
    "jira_write_back_at",
  ],
};

// Tables that may not exist in prod (not yet db:push'd after Apr 30 incident).
const HIGH_RISK_TABLES = new Set([
  "team_jira_connections",
  "action_item_jira_links",
]);

// ── Step 1: Drop backup table ──

console.log("\n## Step 1: Drop Apr 30 recovery backup table\n");

const BACKUP_TABLE = "estimation_sessions_backup_2026_04_30";

await sql`DROP TABLE IF EXISTS ${sql(BACKUP_TABLE)}`;

const backupCheck = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = ${BACKUP_TABLE}
`;

if (backupCheck.length === 0) {
  console.log(`OK: ${BACKUP_TABLE} does not exist in prod (dropped or was already absent).`);
} else {
  console.error(`WARN: ${BACKUP_TABLE} still present after DROP IF EXISTS. Investigate manually.`);
}

// ── Step 2: Column drift audit ──

console.log("\n## Step 2: Column drift audit\n");
console.log("Legend: FORWARD = declared in schema but absent in DB (missing from prod).");
console.log("        REVERSE = present in DB but not declared in schema (extra column in prod).\n");

let anyDrift = false;

for (const [tableName, schemaColumns] of Object.entries(SCHEMA_TABLES)) {
  const isHighRisk = HIGH_RISK_TABLES.has(tableName);

  // Check if the table exists at all.
  const tableExists = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
  `;

  if (tableExists.length === 0) {
    const tag = isHighRisk ? " [HIGH RISK]" : "";
    console.log(`### ${tableName}${tag}`);
    console.log(`STATUS: TABLE DOES NOT EXIST IN PROD. Run db:push (or apply migration) to create it.\n`);
    anyDrift = true;
    continue;
  }

  // Fetch live columns from information_schema.
  const liveRows = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
    ORDER BY ordinal_position
  `;
  const liveColumns = new Set(liveRows.map((r) => r.column_name));
  const schemaSet = new Set(schemaColumns);

  const forward = schemaColumns.filter((c) => !liveColumns.has(c));
  const reverse = [...liveColumns].filter((c) => !schemaSet.has(c));

  const tag = isHighRisk ? " [HIGH RISK]" : "";
  console.log(`### ${tableName}${tag}`);

  if (forward.length === 0 && reverse.length === 0) {
    console.log("STATUS: clean, no drift detected.\n");
    continue;
  }

  anyDrift = true;
  console.log("| Column | Direction | Action needed |");
  console.log("| ------ | --------- | ------------- |");
  for (const col of forward) {
    console.log(`| ${col} | FORWARD (schema only) | ALTER TABLE ${tableName} ADD COLUMN ${col} ... |`);
  }
  for (const col of reverse) {
    console.log(`| ${col} | REVERSE (DB only) | Review: drop or add to schema |`);
  }
  console.log();
}

// ── Summary ──

console.log("\n## Summary\n");
if (!anyDrift) {
  console.log("All tables match schema. No drift detected.");
} else {
  console.log("Drift or missing tables detected (see above). Address before next deploy.");
}

console.log("\nAudit complete.");
