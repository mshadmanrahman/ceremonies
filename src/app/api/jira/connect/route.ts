import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import { getDb } from "@/lib/db";
import { teamMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireJiraPlan } from "@/lib/jira/plan-guard";
import { signState } from "@/lib/jira/state";

const SCOPES = "read:jira-user read:jira-work write:jira-work offline_access";

/**
 * GET /api/jira/connect?teamId={teamId}
 *
 * Initiates Atlassian OAuth 2.0 (3LO) flow.
 * Redirects the user's browser to Atlassian consent screen.
 * Only team owners and facilitators can connect Jira.
 */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  if (!teamId) {
    return NextResponse.json({ error: "teamId required" }, { status: 400 });
  }

  // Check membership and role
  const db = getDb();
  const [membership] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (!membership || membership.role === "member") {
    return NextResponse.json(
      { error: "Only team owners and facilitators can connect Jira" },
      { status: 403 }
    );
  }

  // Check plan
  try {
    await requireJiraPlan(teamId);
  } catch {
    return NextResponse.json(
      { error: "Jira integration requires Pro plan", upgrade: true },
      { status: 403 }
    );
  }

  const clientId = process.env.ATLASSIAN_CLIENT_ID;
  const redirectUri = process.env.ATLASSIAN_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Jira OAuth not configured" },
      { status: 500 }
    );
  }

  const state = signState({
    teamId,
    userId,
    nonce: randomBytes(16).toString("hex"),
  });

  const url = new URL("https://auth.atlassian.com/authorize");
  url.searchParams.set("audience", "api.atlassian.com");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("prompt", "consent");

  return NextResponse.redirect(url.toString());
}
