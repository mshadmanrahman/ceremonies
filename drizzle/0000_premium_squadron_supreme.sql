CREATE TABLE "action_item_jira_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action_item_id" uuid NOT NULL,
	"jira_issue_key" text NOT NULL,
	"jira_issue_url" text NOT NULL,
	"jira_issue_status" text,
	"status_fetched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "action_item_jira_links_action_item_id_unique" UNIQUE("action_item_id")
);
--> statement-breakpoint
CREATE TABLE "action_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retro_id" uuid NOT NULL,
	"group_id" uuid,
	"text" text NOT NULL,
	"assignees" jsonb DEFAULT '[]'::jsonb,
	"done" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimation_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"ticket_ref" text NOT NULL,
	"ticket_title" text,
	"final_estimate" text NOT NULL,
	"participant_count" integer DEFAULT 0,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"jira_issue_key" text,
	"jira_write_back_status" text,
	"jira_write_back_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "estimation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"room_code" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"participant_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "retro_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retro_id" uuid NOT NULL,
	"category" text NOT NULL,
	"text" text NOT NULL,
	"anonymous_id" text NOT NULL,
	"group_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retro_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retro_id" uuid NOT NULL,
	"label" text NOT NULL,
	"vote_count" integer DEFAULT 0,
	"rank" integer
);
--> statement-breakpoint
CREATE TABLE "retros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"room_code" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"card_count" integer DEFAULT 0,
	"group_count" integer DEFAULT 0,
	"action_count" integer DEFAULT 0,
	CONSTRAINT "retros_room_code_unique" UNIQUE("room_code")
);
--> statement-breakpoint
CREATE TABLE "team_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"code" text NOT NULL,
	"created_by" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"max_uses" integer,
	"use_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "team_jira_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"cloud_id" text NOT NULL,
	"site_url" text NOT NULL,
	"site_name" text NOT NULL,
	"access_token_enc" text NOT NULL,
	"refresh_token_enc" text NOT NULL,
	"token_expires_at" timestamp NOT NULL,
	"scopes" text NOT NULL,
	"connected_by" text NOT NULL,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_jira_connections_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_by" text NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "action_item_jira_links" ADD CONSTRAINT "action_item_jira_links_action_item_id_action_items_id_fk" FOREIGN KEY ("action_item_id") REFERENCES "public"."action_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_retro_id_retros_id_fk" FOREIGN KEY ("retro_id") REFERENCES "public"."retros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_group_id_retro_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."retro_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimation_results" ADD CONSTRAINT "estimation_results_session_id_estimation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."estimation_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimation_sessions" ADD CONSTRAINT "estimation_sessions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retro_cards" ADD CONSTRAINT "retro_cards_retro_id_retros_id_fk" FOREIGN KEY ("retro_id") REFERENCES "public"."retros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retro_groups" ADD CONSTRAINT "retro_groups_retro_id_retros_id_fk" FOREIGN KEY ("retro_id") REFERENCES "public"."retros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retros" ADD CONSTRAINT "retros_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_jira_connections" ADD CONSTRAINT "team_jira_connections_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;