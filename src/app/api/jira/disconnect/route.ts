import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { teamMembers, teamJiraConnections } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { decryptToken } from "@/lib/jira/crypto";

/**
 * DELETE /api/jira/disconnect
 *
 * Disconnects Jira from a team. Revokes the token at Atlassian
 * (best effort) and deletes the connection row.
 * Only team owners can disconnect.
 */
export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { teamId?: string };
  const teamId = body.teamId;
  if (!teamId) {
    return NextResponse.json({ error: "teamId required" }, { status: 400 });
  }

  const db = getDb();

  // Check owner role
  const [membership] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (!membership || membership.role !== "owner") {
    return NextResponse.json(
      { error: "Only team owners can disconnect Jira" },
      { status: 403 }
    );
  }

  // Load connection to revoke token
  const [conn] = await db
    .select({
      accessTokenEnc: teamJiraConnections.accessTokenEnc,
    })
    .from(teamJiraConnections)
    .where(eq(teamJiraConnections.teamId, teamId))
    .limit(1);

  if (conn) {
    // Best-effort revoke at Atlassian
    try {
      const token = decryptToken(conn.accessTokenEnc);
      await fetch("https://auth.atlassian.com/oauth/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.ATLASSIAN_CLIENT_ID,
          token,
        }),
      });
    } catch {
      // Swallow -- revocation is best-effort
    }

    await db
      .delete(teamJiraConnections)
      .where(eq(teamJiraConnections.teamId, teamId));
  }

  return NextResponse.json({ disconnected: true });
}
