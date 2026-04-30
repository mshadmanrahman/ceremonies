import { getDb } from "@/lib/db";
import {
  retros,
  retroGroups,
  retroCards,
  actionItems,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  ClosedRetroSummary,
  type ClosedRetroSummaryProps,
} from "@/components/retro/closed-retro-summary";
import { RetroRoomClient } from "./retro-room-client";

export default async function RetroRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomCode } = await params;

  // Check whether this retro is closed before rendering the live room.
  // If the DB query fails or returns nothing, fall through to the live room.
  let closedSummaryProps: ClosedRetroSummaryProps | null = null;

  try {
    const db = getDb();

    const [retro] = await db
      .select()
      .from(retros)
      .where(eq(retros.roomCode, roomCode))
      .limit(1);

    if (retro?.status === "closed") {
      const groups = await db
        .select()
        .from(retroGroups)
        .where(eq(retroGroups.retroId, retro.id));

      const cards = await db
        .select()
        .from(retroCards)
        .where(eq(retroCards.retroId, retro.id));

      const actions = await db
        .select()
        .from(actionItems)
        .where(eq(actionItems.retroId, retro.id));

      const summaryGroups = groups.map((g) => ({
        id: g.id,
        label: g.label,
        voteCount: g.voteCount ?? 0,
        rank: g.rank,
        cards: cards
          .filter((c) => c.groupId === g.id)
          .map((c) => ({
            id: c.id,
            text: c.text,
            category: c.category,
          })),
        actionItems: actions
          .filter((a) => a.groupId === g.id)
          .map((a) => ({
            id: a.id,
            text: a.text,
            assignees: (a.assignees as string[]) ?? [],
            groupId: a.groupId,
          })),
      }));

      const generalActionItems = actions
        .filter((a) => a.groupId === null)
        .map((a) => ({
          id: a.id,
          text: a.text,
          assignees: (a.assignees as string[]) ?? [],
          groupId: null,
        }));

      closedSummaryProps = {
        roomCode,
        closedAt: retro.closedAt,
        groups: summaryGroups,
        generalActionItems,
      };
    }
  } catch {
    // DB unavailable or no row found: fall through to the live room
  }

  if (closedSummaryProps) {
    return <ClosedRetroSummary {...closedSummaryProps} />;
  }

  return <RetroRoomClient params={params} />;
}
