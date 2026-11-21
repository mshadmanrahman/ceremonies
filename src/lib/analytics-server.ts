/**
 * Server-side GA4 events via the Measurement Protocol.
 *
 * Used for events that happen where no browser is present (the PartyServer
 * Worker calling the save routes, the Stripe webhook). A no-op until both
 * NEXT_PUBLIC_GA_MEASUREMENT_ID and GA_API_SECRET are set.
 */

export type ServerEventName =
  | "ceremony_saved"
  | "checkout_started"
  | "subscription_started";

type EventParams = Record<string, string | number | boolean>;

/** Extracts the GA client id ("123.456") from a `_ga` cookie ("GA1.1.123.456"). */
export function gaClientIdFromCookie(cookieHeader: string | null): string | null {
  const match = cookieHeader?.match(/(?:^|;\s*)_ga=GA\d\.\d\.(\d+\.\d+)/);
  return match ? match[1] : null;
}

export async function trackServerEvent(
  name: ServerEventName,
  params: EventParams,
  clientId?: string | null,
): Promise<void> {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_API_SECRET?.trim();
  if (!measurementId || !apiSecret) return;

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  try {
    await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        client_id: clientId || `server.${Date.now()}`,
        events: [{ name, params: { ...params, engagement_time_msec: 1 } }],
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Analytics must never break the request it rides on.
  }
}
