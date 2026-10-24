"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Replaces the root layout when it crashes, so it renders its own <html> and
// uses inline styles instead of relying on globals.css or the theme provider.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6efe3",
          color: "#2d1e14",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "0 16px",
        }}
      >
        <div style={{ maxWidth: 384 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 40, fontWeight: 400, margin: 0 }}>
            Something broke
          </h1>
          <p style={{ fontSize: 14, marginTop: 12 }}>
            Ceremonies hit an error. We&apos;ve been notified.
          </p>
          {error.digest && (
            <p style={{ fontFamily: "monospace", fontSize: 12, opacity: 0.7 }}>Ref: {error.digest}</p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              height: 40,
              padding: "0 24px",
              border: "2px solid #2d1e14",
              borderRadius: 4,
              background: "#e9a03b",
              color: "#2d1e14",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
