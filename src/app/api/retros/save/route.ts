import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  retros,
  retroCards,
  retroGroups,
  actionItems,
} from "@/lib/db/schema";
import type { RetroState } from "@/lib/state-machines/retro";

/**
 * POST /api/retros/save
 *
 * Called by the PartyKit server when a retro closes.
 * Persists the entire retro state to Neon Postgres.
 * This enables The Haunting (loading previous action items).
 */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    roomCode: string;
    teamId: string;
    createdBy: string;
    state: RetroState;
  };

  const { roomCode, teamId, createdBy, state } = body;

  // Create the retro record
  const db = getDb();

  const [retro] = await db
    .insert(retros)
    .values({
      teamId,
      roomCode,
      status: "closed",
      createdBy,
      closedAt: new Date(),
      cardCount: state.cards.length,
      groupCount: state.groups.length,
      actionCount: state.actionItems.length,
    })
    .returning();

  // Save cards
  if (state.cards.length > 0) {
    await db.insert(retroCards).values(
      state.cards.map((card) => ({
        retroId: retro.id,
        category: card.category as "happy" | "sad" | "confused",
        text: card.text,
        anonymousId: card.anonymousId,
        groupId: null, // We'll link via groups
      }))
    );
  }

  // Save groups
  const groupIdMap = new Map<string, string>(); // partykit group ID → DB group ID
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
    });
  }

  // Save action items
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
