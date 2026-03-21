import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { teams, teamMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function getMembership(userId: string, teamId: string) {
  const db = getDb();
  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);
  return membership ?? null;
}

/**
 * GET /api/teams/[teamId]
 * Team details + member list.
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
  const membership = await getMembership(userId, teamId);
  if (!membership) {
    return NextResponse.json({ error: "Not a team member" }, { status: 403 });
  }

  const db = getDb();
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const members = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));

  return NextResponse.json({ ...team, members, myRole: membership.role });
}

/**
 * PATCH /api/teams/[teamId]
 * Rename team (owner only).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;
  const membership = await getMembership(userId, teamId);
  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  }

  const { name } = (await req.json()) as { name: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "Team name is required" }, { status: 400 });
  }

  const db = getDb();
  const [updated] = await db
    .update(teams)
    .set({ name: name.trim() })
    .where(eq(teams.id, teamId))
    .returning();

  return NextResponse.json(updated);
}

/**
 * DELETE /api/teams/[teamId]
 * Delete team (owner only). Cascades to members.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;
  const membership = await getMembership(userId, teamId);
  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  }

  const db = getDb();
  await db.delete(teams).where(eq(teams.id, teamId));

  return NextResponse.json({ deleted: true });
}
