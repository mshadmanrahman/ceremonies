import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { teamMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * PATCH /api/teams/[teamId]/members/[memberId]
 * Change a member's role (owner only).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ teamId: string; memberId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, memberId } = await params;

  // Verify caller is owner
  const db = getDb();
  const [callerMembership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (!callerMembership || callerMembership.role !== "owner") {
    return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  }

  const { role } = (await req.json()) as { role: "owner" | "facilitator" | "member" };
  if (!["owner", "facilitator", "member"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const [updated] = await db
    .update(teamMembers)
    .set({ role })
    .where(eq(teamMembers.id, memberId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
