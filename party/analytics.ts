/**
 * Once-only flags for activation analytics, kept in Durable Object storage
 * apart from room state so they are never broadcast.
 *
 * onConnect runs on every reconnect, so the server decides "first time" and
 * the client fires the GA4 event when the sync message says so.
 */

const CREATED_KEY = "analytics:created";
const seenKey = (participantId: string) => `analytics:seen:${participantId}`;

export interface SyncAnalytics {
  roomCreated: boolean;
  firstJoin: boolean;
}

/** Marks rooms that already had state before tracking shipped, so they never count as created. */
export async function markExistingRoom(storage: DurableObjectStorage): Promise<void> {
  if (!(await storage.get<boolean>(CREATED_KEY))) {
    await storage.put(CREATED_KEY, true);
  }
}

export async function claimSyncAnalytics(
  storage: DurableObjectStorage,
  participantId: string,
): Promise<SyncAnalytics> {
  const [created, seen] = await Promise.all([
    storage.get<boolean>(CREATED_KEY),
    storage.get<boolean>(seenKey(participantId)),
  ]);
  const writes: Record<string, boolean> = {};
  if (!created) writes[CREATED_KEY] = true;
  if (!seen) writes[seenKey(participantId)] = true;
  if (Object.keys(writes).length > 0) await storage.put(writes);
  return { roomCreated: !created, firstJoin: !seen };
}
