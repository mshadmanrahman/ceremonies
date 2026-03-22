import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { teams, teamMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session for managing subscription.
 * Only the team owner can access billing management.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = (await req.json()) as { teamId: string };
  if (!teamId) {
    return NextResponse.json({ error: "teamId is required" }, { status: 400 });
  }

  const db = getDb();

  // Verify user is team owner
  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  }

  // Get team's Stripe customer ID
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 });
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ceremonies.dev";

  const session = await stripe.billingPortal.sessions.create({
    customer: team.stripeCustomerId,
    return_url: `${appUrl}/dashboard/team/${teamId}`,
  });

  return NextResponse.json({ url: session.url });
}
