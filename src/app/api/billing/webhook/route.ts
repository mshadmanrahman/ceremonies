import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { teams } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

/**
 * POST /api/billing/webhook
 * Handles Stripe webhook events for subscription lifecycle.
 * No auth required (verified via Stripe signature).
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[billing] Webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getDb();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const teamId = session.metadata?.teamId;
      if (!teamId) break;

      await db
        .update(teams)
        .set({
          plan: "pro",
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        })
        .where(eq(teams.id, teamId));

      console.log(`[billing] Team ${teamId} upgraded to Pro`);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const teamId = subscription.metadata?.teamId;
      if (!teamId) break;

      const isActive = subscription.status === "active" || subscription.status === "trialing";
      await db
        .update(teams)
        .set({ plan: isActive ? "pro" : "free" })
        .where(eq(teams.id, teamId));

      console.log(`[billing] Team ${teamId} subscription updated: ${subscription.status}`);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const teamId = subscription.metadata?.teamId;
      if (!teamId) break;

      await db
        .update(teams)
        .set({
          plan: "free",
          stripeSubscriptionId: null,
        })
        .where(eq(teams.id, teamId));

      console.log(`[billing] Team ${teamId} downgraded to Free (subscription cancelled)`);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const subscriptionId = "subscription" in invoice ? String(invoice.subscription) : "unknown";
      console.warn(`[billing] Payment failed for subscription ${subscriptionId}`);
      break;
    }

    default:
      // Unhandled event type
      break;
  }

  return NextResponse.json({ received: true });
}
