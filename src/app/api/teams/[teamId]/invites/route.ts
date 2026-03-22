import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { teamMembers, teamInvites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "@/lib/invite-codes";

/**
 * GET /api/teams/[teamId]/invites
 * List active invites for a team.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;
  const db = getDb();

  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (!membership || membership.role === "member") {
    return NextResponse.json({ error: "Facilitator or owner access required" }, { status: 403 });
  }

  const invites = await db
    .select()
    .from(teamInvites)
    .where(eq(teamInvites.teamId, teamId));

  return NextResponse.json(invites);
}

/**
 * POST /api/teams/[teamId]/invites
 * Create an invite link. Owner or facilitator only.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;
  const db = getDb();

  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (!membership || membership.role === "member") {
    return NextResponse.json({ error: "Facilitator or owner access required" }, { status: 403 });
  }

  const body = (await req.json()) as {
    role?: "facilitator" | "member";
    maxUses?: number;
    expiresInDays?: number;
  };

  const code = nanoid();
  const expiresAt = body.expiresInDays
    ? new Date(Date.now() + body.expiresInDays * 86400000)
    : null;

  const [invite] = await db
    .insert(teamInvites)
    .values({
      teamId,
      code,
      createdBy: userId,
      role: body.role === "facilitator" ? "facilitator" : "member",
      maxUses: body.maxUses ?? null,
      expiresAt,
    })
    .returning();

  return NextResponse.json(invite, { status: 201 });
}

/**
 * DELETE /api/teams/[teamId]/invites
 * Revoke an invite by code.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;
  const db = getDb();

  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (!membership || membership.role === "member") {
    return NextResponse.json({ error: "Facilitator or owner access required" }, { status: 403 });
  }

  const { code } = (await req.json()) as { code: string };

  await db
    .delete(teamInvites)
    .where(and(eq(teamInvites.teamId, teamId), eq(teamInvites.code, code)));

  return NextResponse.json({ revoked: true });
}
