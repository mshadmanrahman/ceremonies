import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  retros,
  retroCards,
  retroGroups,
  actionItems,
} from "@/lib/db/schema";
import type { RetroState } from "@/lib/state-machines/retro";
import { canSaveSession } from "@/lib/plan-limits";

/**
 * POST /api/retros/save
 *
 * Called by the PartyKit server when a retro closes.
 * Persists the entire retro state to Neon Postgres.
 * This enables The Haunting (loading previous action items).
 *
 * Authenticated via X-Internal-Secret header (server-to-server only).
 */
export async function POST(req: Request) {
  const internalSecret = req.headers.get("X-Internal-Secret");
  if (!internalSecret || internalSecret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = (await req.json()) as {
    roomCode: string;
    teamId: string;
    createdBy?: string | null;
    state: RetroState;
  };

  const { roomCode, state } = body;
  // Normalize empty string teamId to null (PartyKit sends "" when no team)
  const teamId = body.teamId || null;
  // Normalize missing/null createdBy so the NOT NULL constraint never fails.
  // Retros started before Clerk fully loaded will land as "anonymous" rather
  // than silently dropping the row.
  const createdBy = body.createdBy || "anonymous";

  // Check plan limits
  const sessionLimit = await canSaveSession(teamId, createdBy);
  if (!sessionLimit.allowed) {
    return NextResponse.json(
      { error: "Session limit reached", limit: sessionLimit.max, current: sessionLimit.current, upgrade: true },
      { status: 403 }
    );
  }

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
