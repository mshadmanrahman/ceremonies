import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { teamMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireJiraPlan, JiraGatedError } from "@/lib/jira/plan-guard";
import { searchIssues } from "@/lib/jira/client";

/**
 * GET /api/jira/[teamId]/search?q={query}
 *
 * Searches Jira issues for autocomplete in estimation rooms.
 * Requires team membership and Pro plan.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";

  if (query.length < 2) {
    return NextResponse.json({ issues: [] });
  }

  const db = getDb();

  // Check membership
  const [membership] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (!membership) {
    return NextResponse.json({ error: "Not a team member" }, { status: 403 });
  }

  try {
    await requireJiraPlan(teamId);
  } catch (err) {
    if (err instanceof JiraGatedError) {
      return NextResponse.json({ issues: [], gated: true });
    }
    throw err;
  }

  try {
    const issues = await searchIssues(teamId, query, 8);
    return NextResponse.json({ issues });
  } catch (err) {
    console.error("[jira] Search failed:", err);
    return NextResponse.json(
      { error: "Jira search failed", issues: [] },
      { status: 502 }
    );
  }
}
