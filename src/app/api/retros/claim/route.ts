import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { retros } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * PATCH /api/retros/claim
 *
 * Transfers an anonymous retro (saved with createdBy="anonymous") to the
 * authenticated user's account. Knowing the room code is treated as proof
 * of participation.
 */
export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to claim retros" }, { status: 401 });
  }

  const body = await req.json() as { roomCode?: string };
  const roomCode = body.roomCode?.trim();
  if (!roomCode) {
    return NextResponse.json({ error: "roomCode required" }, { status: 400 });
  }

  const db = getDb();

  const rows = await db
    .select()
    .from(retros)
    .where(eq(retros.roomCode, roomCode))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Retro not found" }, { status: 404 });
  }

  const retro = rows[0];

  if (retro.createdBy !== "anonymous") {
    return NextResponse.json({ error: "Retro already claimed" }, { status: 409 });
  }

  await db
    .update(retros)
    .set({ createdBy: userId })
    .where(eq(retros.id, retro.id));

  return NextResponse.json({ success: true, retroId: retro.id });
}
