import { sendGAEvent } from "@next/third-parties/google";

/** Client-side GA4 events, sent through the gtag that layout.tsx loads. */
export type ClientEventName = "room_created" | "participant_joined";

export function trackEvent(
  name: ClientEventName,
  params: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) return;
  sendGAEvent("event", name, params);
}

/** Flags the party server attaches to a connection's first sync message. */
export interface SyncAnalytics {
  roomCreated: boolean;
  firstJoin: boolean;
}

export function trackRoomSync(
  ceremony: "retro" | "estimation",
  analytics: SyncAnalytics | undefined,
): void {
  if (!analytics) return;
  if (analytics.roomCreated) trackEvent("room_created", { ceremony });
  if (analytics.firstJoin) trackEvent("participant_joined", { ceremony });
}
