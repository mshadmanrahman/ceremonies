import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { teams, teamMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/teams
 * List teams where the current user is a member.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const memberships = await db
    .select({
      id: teams.id,
      name: teams.name,
      createdAt: teams.createdAt,
      role: teamMembers.role,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId));

  return NextResponse.json(memberships);
}

/**
 * POST /api/teams
 * Create a new team. Creator becomes the owner.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = (await req.json()) as { name: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "Team name is required" }, { status: 400 });
  }

  const db = getDb();

  const [team] = await db
    .insert(teams)
    .values({ name: name.trim(), createdBy: userId })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId,
    role: "owner",
  });

  return NextResponse.json(team, { status: 201 });
}
