import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { estimationSessions, estimationResults } from "@/lib/db/schema";
import { canSaveSession } from "@/lib/plan-limits";

/**
 * POST /api/estimation/save
 *
 * Persists an estimation session to Neon Postgres.
 * Requires Clerk auth (userId becomes createdBy).
 * teamId is optional until Team CRUD is built.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save sessions" },
      { status: 401 }
    );
  }

  const body = (await req.json()) as {
    roomCode: string;
    teamId?: string;
    participantCount: number;
    history: ReadonlyArray<{
      ticket: { ref: string; title: string };
      finalEstimate: string;
      participantCount: number;
      completedAt: number;
    }>;
  };

  // Check plan limits
  const sessionLimit = await canSaveSession(body.teamId ?? null, userId);
  if (!sessionLimit.allowed) {
    return NextResponse.json(
      { error: "Session limit reached", limit: sessionLimit.max, current: sessionLimit.current, plan: sessionLimit.plan, upgrade: true },
      { status: 403 }
    );
  }

  const db = getDb();

  const [session] = await db
    .insert(estimationSessions)
    .values({
      teamId: body.teamId ?? null,
      roomCode: body.roomCode,
      createdBy: userId,
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
