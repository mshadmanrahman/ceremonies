import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { retros, actionItems, retroCards, retroGroups } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * GET /api/retros/previous-actions?teamId=xxx
 *
 * Returns the full summary from the most recent closed retro for a given team.
 * Includes action items (for The Haunting) AND all retro cards/groups so that
 * unresolved discussion points aren't lost between retros.
 */
export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("teamId");
  if (!teamId) {
    return NextResponse.json({ actions: [], cards: [], groups: [] });
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
    return NextResponse.json({ actions: [], cards: [], groups: [] });
  }

  // Fetch all data from that retro in parallel
  const [actions, cards, groups] = await Promise.all([
    db.select().from(actionItems).where(eq(actionItems.retroId, lastRetro.id)),
    db.select().from(retroCards).where(eq(retroCards.retroId, lastRetro.id)),
    db.select().from(retroGroups).where(eq(retroGroups.retroId, lastRetro.id)),
  ]);

  // Identify groups that had action items written for them
  const groupsWithActions = new Set(
    actions.filter((a) => a.groupId).map((a) => a.groupId)
  );

  return NextResponse.json({
    retroId: lastRetro.id,
    closedAt: lastRetro.closedAt?.toISOString(),
    actions: actions.map((a) => ({
      id: a.id,
      text: a.text,
      assignees: a.assignees ?? [],
      done: a.done,
    })),
    cards: cards.map((c) => ({
      id: c.id,
      category: c.category,
      text: c.text,
      groupId: c.groupId,
    })),
    groups: groups
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
      .map((g) => ({
        id: g.id,
        label: g.label,
        voteCount: g.voteCount ?? 0,
        rank: g.rank,
        hasActions: groupsWithActions.has(g.id),
      })),
  });
}
