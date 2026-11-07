import type { RetroPhase } from "@/lib/state-machines/retro";

/**
 * Retro rooms this browser has joined, so people can get back to an open
 * retro without the original link. Lives in localStorage only: it never
 * leaves the device and nothing breaks if storage is blocked.
 */

export interface RecentRoom {
  readonly id: string;
  readonly phase: RetroPhase;
  readonly paused: boolean;
  readonly title?: string | null; // absent on rooms stored before renaming existed
  readonly visitedAt: number;
}

const KEY = "ceremonies-recent-retros";
const MAX_ROOMS = 8;

/** Raw stored value, a stable string for useSyncExternalStore snapshots. */
export function readRecentRoomsRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function parseRecentRooms(raw: string | null): ReadonlyArray<RecentRoom> {
  try {
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentRoom[]) : [];
  } catch {
    return [];
  }
}

export function readRecentRooms(): ReadonlyArray<RecentRoom> {
  return parseRecentRooms(readRecentRoomsRaw());
}

/** Record a room's live phase without counting it as a visit. */
export function updateRoomStatus(
  id: string,
  phase: RetroPhase,
  paused: boolean,
  title: string | null,
): void {
  try {
    const next = readRecentRooms().map((r) =>
      r.id === id ? { ...r, phase, paused, title } : r,
    );
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
  }
}

export function rememberRoom(room: Omit<RecentRoom, "visitedAt">): void {
  try {
    const others = readRecentRooms().filter((r) => r.id !== room.id);
    const next = [{ ...room, visitedAt: Date.now() }, ...others].slice(
      0,
      MAX_ROOMS,
    );
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked (private mode, quota). The room still works without it.
  }
}
