import { getDb } from "@/lib/db";
import { teams } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export class JiraGatedError extends Error {
  constructor() {
    super("Jira integration requires Pro plan");
    this.name = "JiraGatedError";
  }
}

/** Throws JiraGatedError if the team is not on Pro plan. */
export async function requireJiraPlan(teamId: string): Promise<void> {
  const db = getDb();
  const [team] = await db
    .select({ plan: teams.plan })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team || team.plan !== "pro") {
    throw new JiraGatedError();
  }
}
