import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { teamMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canAddMember } from "@/lib/plan-limits";

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
 * POST /api/teams/[teamId]/members
 * Add a member (owner or facilitator only).
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
  const membership = await getMembership(userId, teamId);
  if (!membership || membership.role === "member") {
    return NextResponse.json({ error: "Facilitator or owner access required" }, { status: 403 });
  }

  const { userId: newUserId, role = "member" } = (await req.json()) as {
    userId: string;
    role?: "facilitator" | "member";
  };

  if (!newUserId?.trim()) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Check plan limits
  const memberLimit = await canAddMember(teamId);
  if (!memberLimit.allowed) {
    return NextResponse.json(
      { error: "Member limit reached", limit: memberLimit.max, current: memberLimit.current, plan: memberLimit.plan, upgrade: true },
      { status: 403 }
    );
  }

  // Check if already a member
  const existing = await getMembership(newUserId, teamId);
  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  const db = getDb();
  const [member] = await db
    .insert(teamMembers)
    .values({
      teamId,
      userId: newUserId.trim(),
      role: role === "facilitator" ? "facilitator" : "member",
    })
    .returning();

  return NextResponse.json(member, { status: 201 });
}

/**
 * DELETE /api/teams/[teamId]/members
 * Remove a member by userId in body (owner only).
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
  const membership = await getMembership(userId, teamId);
  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  }

  const { userId: targetUserId } = (await req.json()) as { userId: string };
  if (targetUserId === userId) {
    return NextResponse.json({ error: "Cannot remove yourself as owner" }, { status: 400 });
  }

  const db = getDb();
  await db
    .delete(teamMembers)
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, targetUserId))
    );

  return NextResponse.json({ removed: true });
}
