import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { estimationSessions, estimationResults } from "@/lib/db/schema";

/**
 * POST /api/estimation/save
 *
 * Called by the estimation PartyKit server when a session ends.
 * Persists session results to Neon Postgres.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    roomCode: string;
    teamId: string;
    createdBy: string;
    participantCount: number;
    history: ReadonlyArray<{
      ticket: { ref: string; title: string };
      finalEstimate: string;
      participantCount: number;
      completedAt: number;
    }>;
  };

  const db = getDb();

  const [session] = await db
    .insert(estimationSessions)
    .values({
      teamId: body.teamId,
      roomCode: body.roomCode,
      createdBy: body.createdBy,
      closedAt: new Date(),
      participantCount: body.participantCount,
    })
    .returning();

  if (body.history.length > 0) {
    await db.insert(estimationResults).values(
      body.history.map((h) => ({
        sessionId: session.id,
        ticketRef: h.ticket.ref,
        ticketTitle: h.ticket.title,
        finalEstimate: h.finalEstimate,
        participantCount: h.participantCount,
        completedAt: new Date(h.completedAt),
      }))
    );
  }

  return NextResponse.json({ sessionId: session.id });
}
