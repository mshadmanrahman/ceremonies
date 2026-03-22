import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(key, {
      typescript: true,
      maxNetworkRetries: 1,
      timeout: 10000, // 10s timeout for serverless
      httpAgent: undefined, // ensure no proxy interference
    });
  }
  return stripeInstance;
}
