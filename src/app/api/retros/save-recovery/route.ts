import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { retros, retroCards, retroGroups, actionItems } from "@/lib/db/schema";
import { normalizeTitle, type RetroState } from "@/lib/state-machines/retro";
import { eq } from "drizzle-orm";

/**
 * POST /api/retros/save-recovery
 *
 * Client-authenticated fallback for when the PartyKit → DB save fails silently.
 * The ClosedPhase component calls this with the full in-memory state when the
 * user clicks "Save to history". Deduplicates by roomCode — safe to call twice.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to save" }, { status: 401 });
  }

  const body = await req.json() as { roomCode: string; state: RetroState };
  const { roomCode, state } = body;
  if (!roomCode || !state) {
    return NextResponse.json({ error: "roomCode and state required" }, { status: 400 });
  }

  const db = getDb();

  // Deduplicate: if already saved, return the existing retroId
  const existing = await db
    .select({ id: retros.id })
    .from(retros)
    .where(eq(retros.roomCode, roomCode))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ retroId: existing[0].id, alreadySaved: true });
  }

  const [retro] = await db
    .insert(retros)
    .values({
      teamId: state.teamId ?? null,
      roomCode,
      title: normalizeTitle(state.title),
      status: "closed",
      createdBy: userId,
      closedAt: new Date(),
      cardCount: state.cards.length,
      groupCount: state.groups.length,
      actionCount: state.actionItems.length,
    })
    .returning();

  const groupIdMap = new Map<string, string>();
  const cardIdToGroupId = new Map<string, string>();

  if (state.groups.length > 0) {
    const rankedGroupIds = state.rankedGroupIds ?? [];
    const insertedGroups = await db
      .insert(retroGroups)
      .values(
        state.groups.map((group, i) => ({
          retroId: retro.id,
          label: group.label,
          voteCount: group.voteCount,
          rank: rankedGroupIds.indexOf(group.id) + 1 || i + 1,
        }))
      )
      .returning();

    state.groups.forEach((group, i) => {
      groupIdMap.set(group.id, insertedGroups[i].id);
      for (const cardId of group.cardIds ?? []) {
        cardIdToGroupId.set(cardId, insertedGroups[i].id);
      }
    });
  }

  if (state.cards.length > 0) {
    await db.insert(retroCards).values(
      state.cards.map((card) => ({
        retroId: retro.id,
        category: card.category as "happy" | "sad" | "confused",
        text: card.text,
        anonymousId: card.anonymousId,
        groupId: cardIdToGroupId.get(card.id) ?? null,
      }))
    );
  }

  if (state.actionItems.length > 0) {
    await db.insert(actionItems).values(
      state.actionItems.map((item) => ({
        retroId: retro.id,
        groupId: item.groupId ? groupIdMap.get(item.groupId) ?? null : null,
        text: item.text,
        assignees: item.assignees as string[],
        done: false,
      }))
    );
  }

  return NextResponse.json({ retroId: retro.id });
}
