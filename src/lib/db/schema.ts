import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// ── Teams ──

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdBy: text("created_by").notNull(), // Clerk user ID
  plan: text("plan", { enum: ["free", "pro"] }).notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Team Members ──

export const teamMembers = pgTable("team_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(), // Clerk user ID
  role: text("role", { enum: ["owner", "facilitator", "member"] })
    .notNull()
    .default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// ── Retros ──

export const retros = pgTable("retros", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .references(() => teams.id),
  roomCode: text("room_code").notNull().unique(),
  status: text("status", { enum: ["active", "closed"] })
    .notNull()
    .default("active"),
  createdBy: text("created_by").notNull(), // Clerk user ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  // Summary stats (denormalized for fast reads)
  cardCount: integer("card_count").default(0),
  groupCount: integer("group_count").default(0),
  actionCount: integer("action_count").default(0),
});

// ── Retro Cards ──

export const retroCards = pgTable("retro_cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  retroId: uuid("retro_id")
    .notNull()
    .references(() => retros.id),
  category: text("category", { enum: ["happy", "sad", "confused"] }).notNull(),
  text: text("text").notNull(),
  anonymousId: text("anonymous_id").notNull(),
  groupId: uuid("group_id"), // null = ungrouped
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Retro Groups ──

export const retroGroups = pgTable("retro_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  retroId: uuid("retro_id")
    .notNull()
    .references(() => retros.id),
  label: text("label").notNull(),
  voteCount: integer("vote_count").default(0),
  rank: integer("rank"), // position after voting (1 = most votes)
});

// ── Action Items ──

export const actionItems = pgTable("action_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  retroId: uuid("retro_id")
    .notNull()
    .references(() => retros.id),
  groupId: uuid("group_id").references(() => retroGroups.id),
  text: text("text").notNull(),
  assignees: jsonb("assignees").$type<string[]>().default([]),
  done: boolean("done").default(false), // for The Haunting
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Team Invites ──

export const teamInvites = pgTable("team_invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  createdBy: text("created_by").notNull(), // Clerk user ID
  role: text("role", { enum: ["facilitator", "member"] })
    .notNull()
    .default("member"),
  maxUses: integer("max_uses"), // null = unlimited
  useCount: integer("use_count").notNull().default(0),
  expiresAt: timestamp("expires_at"), // null = never
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Jira Connections ──

export const teamJiraConnections = pgTable("team_jira_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .unique()
    .references(() => teams.id, { onDelete: "cascade" }),
  cloudId: text("cloud_id").notNull(),
  siteUrl: text("site_url").notNull(),
  siteName: text("site_name").notNull(),
  accessTokenEnc: text("access_token_enc").notNull(),
  refreshTokenEnc: text("refresh_token_enc").notNull(),
  tokenExpiresAt: timestamp("token_expires_at").notNull(),
  scopes: text("scopes").notNull(),
  connectedBy: text("connected_by").notNull(),
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Action Item Jira Links ──

export const actionItemJiraLinks = pgTable("action_item_jira_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  actionItemId: uuid("action_item_id")
    .notNull()
    .unique()
    .references(() => actionItems.id, { onDelete: "cascade" }),
  jiraIssueKey: text("jira_issue_key").notNull(),
  jiraIssueUrl: text("jira_issue_url").notNull(),
  jiraIssueStatus: text("jira_issue_status"),
  statusFetchedAt: timestamp("status_fetched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Estimation Sessions ──

export const estimationSessions = pgTable("estimation_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id").references(() => teams.id), // nullable until Team CRUD lands
  roomCode: text("room_code").notNull(),
  createdBy: text("created_by").notNull(), // Clerk user ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  participantCount: integer("participant_count").default(0),
});

// ── Estimation Results ──

export const estimationResults = pgTable("estimation_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => estimationSessions.id),
  ticketRef: text("ticket_ref").notNull(),
  ticketTitle: text("ticket_title"),
  finalEstimate: text("final_estimate").notNull(),
  participantCount: integer("participant_count").default(0),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  jiraIssueKey: text("jira_issue_key"),
  jiraWriteBackStatus: text("jira_write_back_status", {
    enum: ["pending", "written", "failed", "skipped"],
  }),
  jiraWriteBackAt: timestamp("jira_write_back_at"),
});
