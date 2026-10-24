"use client";

import { ErrorFallback } from "@/components/shared/error-fallback";

// A crash here must not blank a live session. The room state lives on the
// PartyKit server, so a full reload reconnects without losing anything.
export default function RoomError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <ErrorFallback
      error={error}
      title="Lost the room"
      message="Your screen hit an error, but the session is still running and nothing was lost."
      retryLabel="Rejoin the room"
      onRetry={() => window.location.reload()}
    />
  );
}
