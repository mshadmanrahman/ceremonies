"use client";

import { ErrorFallback } from "@/components/shared/error-fallback";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      title="Something broke"
      message="This page hit an error. We've been notified."
      retryLabel="Try again"
      onRetry={reset}
    />
  );
}
