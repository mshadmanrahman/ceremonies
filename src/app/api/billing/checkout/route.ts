import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { teams, teamMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";

// Allow up to 30s for Stripe API calls
export const maxDuration = 30;

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
    const stripeKey = process.env.STRIPE_SECRET_KEY!;

    // Count current members for per-seat billing
    const memberCount = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));

    // Build form body as a plain string (not URLSearchParams to avoid encoding issues)
    const body = [
      "mode=subscription",
      `line_items[0][price]=${priceId}`,
      `line_items[0][quantity]=${memberCount.length}`,
      `success_url=https://ceremonies.dev/dashboard`,
      `cancel_url=https://ceremonies.dev/dashboard`,
      `metadata[teamId]=${teamId}`,
      `metadata[userId]=${userId}`,
      `subscription_data[metadata][teamId]=${teamId}`,
    ].join("&");

    console.log(`[billing] Checkout request body: ${body}`);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const responseText = await res.text();
    console.log(`[billing] Stripe response (${res.status}): ${responseText.slice(0, 500)}`);

    const session = JSON.parse(responseText);

    if (!res.ok) {
      return NextResponse.json({ error: session.error?.message ?? "Stripe error", debug: session.error }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[billing] Checkout failed:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
