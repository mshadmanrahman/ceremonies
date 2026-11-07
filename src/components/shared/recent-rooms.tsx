"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  parseRecentRooms,
  readRecentRoomsRaw,
  updateRoomStatus,
  type RecentRoom,
} from "@/lib/recent-rooms";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const PHASE_LABEL: Record<RecentRoom["phase"], string> = {
  lobby: "Lobby",
  haunting: "Haunting",
  writing: "Writing",
  grouping: "Grouping",
  labeling: "Labeling",
  voting: "Voting",
  discussing: "Discussing",
  committing: "Committing",
  closed: "Closed",
};

function timeAgo(ts: number): string {
  const minutes = Math.round((Date.now() - ts) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

type LiveStatus = Pick<RecentRoom, "phase" | "paused" | "title">;

function statusUrl(roomId: string): string {
  const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "127.0.0.1:1999";
  const protocol = /^(localhost|127\.0\.0\.1)/.test(host) ? "http" : "https";
  return `${protocol}://${host}/parties/retro/${roomId}?status`;
}

/** Open retros this browser has joined. Renders nothing when there are none. */
export function RecentRooms() {
  // Server render has no storage, so it shows nothing; the client fills in.
  const raw = useSyncExternalStore(subscribe, readRecentRoomsRaw, () => null);
  // The stored phase is from this browser's last visit. A room someone else
  // closed later would linger forever, so ask the room for its live phase.
  const [live, setLive] = useState<Readonly<Record<string, LiveStatus>>>({});
  const storedOpen = useMemo(
    () =>
      parseRecentRooms(raw).filter(
        (r) => r.phase !== "closed" && r.phase !== "lobby",
      ),
    [raw],
  );
  const openIds = storedOpen.map((r) => r.id).join(",");

  useEffect(() => {
    if (!openIds) return;
    let cancelled = false;
    for (const id of openIds.split(",")) {
      fetch(statusUrl(id))
        .then((res) => (res.ok ? (res.json() as Promise<LiveStatus>) : null))
        .then((status) => {
          if (cancelled || !status?.phase) return;
          updateRoomStatus(id, status.phase, status.paused, status.title ?? null);
          setLive((prev) => ({ ...prev, [id]: status }));
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [openIds]);

  const rooms = useMemo(
    () =>
      storedOpen
        .map((r) => (live[r.id] ? { ...r, ...live[r.id] } : r))
        .filter((r) => r.phase !== "closed" && r.phase !== "lobby")
        .slice(0, 5),
    [storedOpen, live],
  );

  if (rooms.length === 0) return null;

  return (
    <section aria-labelledby="recent-rooms-heading" className="w-full max-w-md">
      <h2
        id="recent-rooms-heading"
        className="text-sm font-bold text-muted-foreground"
      >
        Your open retros
      </h2>
      <ul className="mt-2 space-y-2">
        {rooms.map((r) => (
          <li key={r.id}>
            <Link
              href={`/retro/${r.id}`}
              className="flex items-center justify-between gap-3 rounded-md border-2 border-border bg-card px-4 py-3 text-left shadow-hard-sm transition-colors hover:border-foreground/40"
            >
              <span className="min-w-0">
                {r.title ? (
                  <span className="text-sm font-bold break-words">{r.title}</span>
                ) : (
                  <span className="font-mono text-sm font-bold">{r.id}</span>
                )}
                <span className="ml-2 text-sm text-muted-foreground">
                  {r.paused ? "Paused" : PHASE_LABEL[r.phase]} ·{" "}
                  {timeAgo(r.visitedAt)}
                </span>
              </span>
              <span className="text-sm font-bold text-coffee underline underline-offset-4">
                Resume
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
