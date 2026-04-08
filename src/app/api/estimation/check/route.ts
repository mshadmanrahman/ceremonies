import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { estimationSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/estimation/check?roomCode=xxx
 *
 * Lightweight check to confirm an estimation session was saved.
 * Used by the summary screen to verify auto-save completed.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomCode = searchParams.get("roomCode");

  if (!roomCode) {
    return NextResponse.json({ error: "roomCode required" }, { status: 400 });
  }

  const db = getDb();
  const rows = await db
    .select({ id: estimationSessions.id })
    .from(estimationSessions)
    .where(eq(estimationSessions.roomCode, roomCode))
    .limit(1);

  return NextResponse.json({ found: rows.length > 0 });
}
