import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { retros, actionItems } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * GET /api/retros/previous-actions?teamId=xxx
 *
 * Returns undone action items from the most recent closed retro
 * for a given team. These feed into The Haunting phase.
 */
export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("teamId");
  if (!teamId) {
    return NextResponse.json({ actions: [] });
  }

  const db = getDb();

  // Find the most recent closed retro for this team
  const [lastRetro] = await db
    .select()
    .from(retros)
    .where(and(eq(retros.teamId, teamId), eq(retros.status, "closed")))
    .orderBy(desc(retros.closedAt))
    .limit(1);

  if (!lastRetro) {
    return NextResponse.json({ actions: [] });
  }

  // Get all action items from that retro (done or not, for display)
  const actions = await db
    .select()
    .from(actionItems)
    .where(eq(actionItems.retroId, lastRetro.id));

  return NextResponse.json({
    retroId: lastRetro.id,
    closedAt: lastRetro.closedAt?.toISOString(),
    actions: actions.map((a) => ({
      id: a.id,
      text: a.text,
      assignees: a.assignees ?? [],
      done: a.done,
    })),
  });
}
