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
  // Accept either a valid Clerk session (browser) or the internal PartyKit secret (server-to-server)
  const internalSecret = req.headers.get("X-Internal-Secret");
  const isInternalCall =
    internalSecret &&
    internalSecret === process.env.INTERNAL_API_SECRET;

  let userId: string | null = null;
  if (isInternalCall) {
    // Authenticated via PartyKit internal secret — createdBy comes from request body
    userId = null; // resolved below after parsing body
  } else {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Sign in to save sessions" },
        { status: 401 }
      );
    }
    userId = clerkUserId;
  }

  const body = (await req.json()) as {
    roomCode: string;
    teamId?: string;
    createdBy?: string;
    participantCount: number;
    history: ReadonlyArray<{
      ticket: { ref: string; title: string };
      finalEstimate: string;
      participantCount: number;
      completedAt: number;
    }>;
  };

  if (isInternalCall) {
    // For server-to-server saves, createdBy can be a PartyKit participant ID
    // (prefixed with "partykit:") or a Clerk user ID
    userId = body.createdBy || `partykit:${body.roomCode}`;
  }

  // At this point userId is always non-null (both code paths above guard against it)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
