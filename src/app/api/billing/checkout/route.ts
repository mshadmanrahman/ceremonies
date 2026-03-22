import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { teams, teamMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout Session for upgrading a team to Pro.
 * Only the team owner can initiate checkout.
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

  // Get team
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  if (team.plan === "pro") {
    return NextResponse.json({ error: "Team is already on Pro" }, { status: 400 });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 500 });
  }

  try {
    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ceremonies.dev";

    // Count current members for per-seat billing
    const memberCount = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));

    console.log(`[billing] Creating checkout for team ${teamId}, ${memberCount.length} seats, price ${priceId}`);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: memberCount.length,
        },
      ],
      success_url: `${appUrl}/dashboard?team=${teamId}&upgraded=true`,
      cancel_url: `${appUrl}/dashboard?team=${teamId}`,
      metadata: {
        teamId,
        userId,
      },
      subscription_data: {
        metadata: {
          teamId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[billing] Checkout failed:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
