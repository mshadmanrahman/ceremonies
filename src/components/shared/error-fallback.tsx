"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { GhostIcon } from "@/components/shared/icons";

type ErrorFallbackProps = {
  error: Error & { digest?: string };
  title: string;
  message: string;
  retryLabel: string;
  onRetry: () => void;
};

export function ErrorFallback({
  error,
  title,
  message,
  retryLabel,
  onRetry,
}: ErrorFallbackProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center space-y-6 text-center">
        <div className="ghost-float text-coffee">
          <GhostIcon size={80} />
        </div>

        <div>
          <h1 className="font-display text-4xl tracking-ceremony sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Ref: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center justify-center rounded-md border-2 border-border bg-primary px-6 text-sm font-bold text-primary-foreground shadow-hard-sm transition-all hover-lift"
          >
            {retryLabel}
          </button>
          <Link
            href="/"
            className="text-sm font-bold text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
