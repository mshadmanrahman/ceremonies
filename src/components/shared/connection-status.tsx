"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { OwlIcon } from "@/components/shared/icons";

interface ConnectionStatusProps {
  readonly connected: boolean;
  readonly hasState: boolean;
  readonly timeoutMs?: number;
}

/**
 * Shows a friendly reconnect UI when:
 * 1. WebSocket never connects (PartyKit down)
 * 2. Connection drops mid-session
 *
 * Only appears after a timeout to avoid flash on normal slow connections.
 */
export function ConnectionStatus({
  connected,
  hasState,
  timeoutMs = 8000,
}: ConnectionStatusProps) {
  const [timedOut, setTimedOut] = useState(false);

  // Start timeout when component mounts without state
  useEffect(() => {
    if (hasState) {
      setTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!hasState) {
        setTimedOut(true);
      }
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [hasState, timeoutMs]);

  // Case 1: Never got initial state (PartyKit down or unreachable)
  if (timedOut && !hasState) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center space-y-6 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-md border-2 border-destructive/30 bg-destructive/5">
          <OwlIcon size={48} className="text-destructive/60" />
        </div>
        <div>
          <h2 className="font-display text-2xl tracking-ceremony">
            Connection lost
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Can't reach the real-time server. This usually resolves in a few seconds.
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          Reload page
        </Button>
      </div>
    );
  }

  // Case 2: Had state but lost connection (mid-session disconnect)
  if (!connected && hasState) {
    return (
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-md border-2 border-destructive/40 bg-card px-4 py-2.5 shadow-hard">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs font-bold text-destructive">
            Reconnecting...
          </span>
        </div>
      </div>
    );
  }

  return null;
}
