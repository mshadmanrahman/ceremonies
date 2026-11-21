export class JiraGatedError extends Error {
  constructor() {
    super("Jira integration is not available for this team");
    this.name = "JiraGatedError";
  }
}

/**
 * Ceremonies is free with no plan tiers, so every team may use Jira.
 * Kept as a no-op because the Jira search route still calls it.
 */
export async function requireJiraPlan(_teamId: string): Promise<void> {}
