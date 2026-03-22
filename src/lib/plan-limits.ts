import { getDb } from "@/lib/db";
import { teams, teamMembers, estimationSessions, retros } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";

export type Plan = "free" | "pro";

export const PLAN_LIMITS = {
  free: { maxTeams: 1, maxMembers: 5, maxSavedSessions: 10 },
  pro: { maxTeams: -1, maxMembers: -1, maxSavedSessions: -1 },
} as const;

export function getPlanLimits(plan: Plan) {
  return PLAN_LIMITS[plan];
}

export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

/** Check if a user can create another team. */
export async function canCreateTeam(userId: string): Promise<{ allowed: boolean; current: number; max: number }> {
  const db = getDb();

  // Count teams user owns
  const [result] = await db
    .select({ count: count() })
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.role, "owner")));

  const current = result?.count ?? 0;

  // Check the plan of the user's existing team (if any)
  // For team creation limits, we check if any of their teams is pro
  const userTeams = await db
    .select({ plan: teams.plan })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.role, "owner")));

  const hasPro = userTeams.some((t) => t.plan === "pro");
  const limits = getPlanLimits(hasPro ? "pro" : "free");

  return {
    allowed: isUnlimited(limits.maxTeams) || current < limits.maxTeams,
    current,
    max: limits.maxTeams,
  };
}

/** Check if a team can add another member. */
export async function canAddMember(teamId: string): Promise<{ allowed: boolean; current: number; max: number; plan: Plan }> {
  const db = getDb();

  const [team] = await db
    .select({ plan: teams.plan })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  const plan = (team?.plan ?? "free") as Plan;
  const limits = getPlanLimits(plan);

  const [result] = await db
    .select({ count: count() })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));

  const current = result?.count ?? 0;

  return {
    allowed: isUnlimited(limits.maxMembers) || current < limits.maxMembers,
    current,
    max: limits.maxMembers,
    plan,
  };
}

/** Check if a team can save another session (estimation or retro). */
export async function canSaveSession(teamId: string | null, userId: string): Promise<{ allowed: boolean; current: number; max: number; plan: Plan }> {
  const db = getDb();

  // If no team, use user's default team plan
  let plan: Plan = "free";
  if (teamId) {
    const [team] = await db
      .select({ plan: teams.plan })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);
    plan = (team?.plan ?? "free") as Plan;
  }

  const limits = getPlanLimits(plan);

  // Count total saved sessions (estimation + retro) for this team or user
  const [estCount] = teamId
    ? await db.select({ count: count() }).from(estimationSessions).where(eq(estimationSessions.teamId, teamId))
    : await db.select({ count: count() }).from(estimationSessions).where(eq(estimationSessions.createdBy, userId));

  const [retroCount] = teamId
    ? await db.select({ count: count() }).from(retros).where(eq(retros.teamId, teamId))
    : await db.select({ count: count() }).from(retros).where(eq(retros.createdBy, userId));

  const current = (estCount?.count ?? 0) + (retroCount?.count ?? 0);

  return {
    allowed: isUnlimited(limits.maxSavedSessions) || current < limits.maxSavedSessions,
    current,
    max: limits.maxSavedSessions,
    plan,
  };
}
