import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { teamInvites, teamMembers, teams } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/invites/[code]
 * Preview an invite (no auth required). Returns team name and invite details.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const db = getDb();

  const [invite] = await db
    .select()
    .from(teamInvites)
    .where(eq(teamInvites.code, code))
    .limit(1);

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }

  if (invite.maxUses && invite.useCount >= invite.maxUses) {
    return NextResponse.json({ error: "Invite has reached its usage limit" }, { status: 410 });
  }

  const [team] = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(eq(teams.id, invite.teamId))
    .limit(1);

  if (!team) {
    return NextResponse.json({ error: "Team no longer exists" }, { status: 404 });
  }

  return NextResponse.json({
    teamName: team.name,
    role: invite.role,
    teamId: team.id,
  });
}

/**
 * POST /api/invites/[code]
 * Accept an invite. Requires auth. Adds user to team.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to join a team" }, { status: 401 });
  }

  const { code } = await params;
  const db = getDb();

  const [invite] = await db
    .select()
    .from(teamInvites)
    .where(eq(teamInvites.code, code))
    .limit(1);

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }

  if (invite.maxUses && invite.useCount >= invite.maxUses) {
    return NextResponse.json({ error: "Invite has reached its usage limit" }, { status: 410 });
  }

  // Check if already a member
  const [existing] = await db
    .select()
    .from(teamMembers)
    .where(
      and(eq(teamMembers.teamId, invite.teamId), eq(teamMembers.userId, userId))
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({
      alreadyMember: true,
      teamId: invite.teamId,
    });
  }

  // Add to team
  await db.insert(teamMembers).values({
    teamId: invite.teamId,
    userId,
    role: invite.role,
  });

  // Increment use count
  await db
    .update(teamInvites)
    .set({ useCount: invite.useCount + 1 })
    .where(eq(teamInvites.id, invite.id));

  return NextResponse.json({
    joined: true,
    teamId: invite.teamId,
    role: invite.role,
  });
}
