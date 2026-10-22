"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FIELD_NOTES_URL =
  "https://shadmanrahman.substack.com/about?ref=ceremonies";

type Status = "idle" | "sending" | "done" | "error";

interface FieldNotesSignupProps {
  /** Opening words, e.g. "Retro done." */
  readonly lead: string;
}

/**
 * One quiet line plus an email field, shown to the facilitator once a
 * session ends. Posts to /api/subscribe (Product Field Notes on Substack).
 */
export function FieldNotesSignup({ lead }: FieldNotesSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async () => {
    if (!email.includes("@")) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="rounded-md border-2 border-dashed border-border bg-muted/20 p-4 text-sm">
      <p className="text-muted-foreground">
        {lead} The PM who built Ceremonies writes about running better ones
        in{" "}
        <a
          href={FIELD_NOTES_URL}
          target="_blank"
          rel="noopener"
          className="font-bold text-foreground underline underline-offset-4"
        >
          Product Field Notes
        </a>
        .
      </p>
      {status === "done" ? (
        <p className="mt-3 font-bold" role="status">
          Check your inbox to confirm.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          className="mt-3 flex gap-2"
        >
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            aria-label="Email for Product Field Notes"
            className="flex-1"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Sending..." : "Get the notes"}
          </Button>
        </form>
      )}
      {status === "error" && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          That didn&apos;t go through. Try again, or subscribe on the site.
        </p>
      )}
    </div>
  );
}
