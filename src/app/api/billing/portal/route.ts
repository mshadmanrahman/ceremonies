import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { teams, teamMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const maxDuration = 30;

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

  const stripeKey = process.env.STRIPE_SECRET_KEY!;
  const returnUrl = `https://ceremonies.dev/dashboard/team/${teamId}`;

  try {
    const body = [
      `customer=${team.stripeCustomerId}`,
      `return_url=${returnUrl}`,
    ].join("&");

    const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const session = await res.json();

    if (!res.ok) {
      console.error("[billing] Portal error:", session.error);
      return NextResponse.json({ error: session.error?.message ?? "Stripe error" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[billing] Portal failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
