import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { teamMembers, teamJiraConnections } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/jira/[teamId]/status
 *
 * Returns Jira connection status for a team.
 * Requires team membership.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;

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

  const [conn] = await db
    .select({
      siteName: teamJiraConnections.siteName,
      siteUrl: teamJiraConnections.siteUrl,
      connectedBy: teamJiraConnections.connectedBy,
      connectedAt: teamJiraConnections.connectedAt,
    })
    .from(teamJiraConnections)
    .where(eq(teamJiraConnections.teamId, teamId))
    .limit(1);

  if (!conn) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    siteName: conn.siteName,
    siteUrl: conn.siteUrl,
    connectedBy: conn.connectedBy,
    connectedAt: conn.connectedAt,
  });
}
