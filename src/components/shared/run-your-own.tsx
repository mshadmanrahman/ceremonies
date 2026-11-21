"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Ceremony = "retro" | "estimation";

interface RunYourOwnProps {
  readonly ceremony: Ceremony;
  /** "header": one quiet link in the room header. "summary": a short block on the end screen. */
  readonly variant: "header" | "summary";
}

const LABELS: Record<Ceremony, { noun: string; action: string }> = {
  retro: { noun: "retro", action: "Start your own retro" },
  estimation: { noun: "planning poker session", action: "Start your own planning poker" },
};

/**
 * Invites people who joined someone else's room to run one for their own team.
 * The room code is generated on click, not at render, so SSR and hydration match.
 * `?via=invite` lets GA4 tie the resulting room_created back to this prompt.
 */
export function RunYourOwn({ ceremony, variant }: RunYourOwnProps) {
  const router = useRouter();
  const { noun, action } = LABELS[ceremony];

  const start = () => {
    const code = Math.random().toString(36).slice(2, 8);
    router.push(`/${ceremony}/${code}?via=invite`);
  };

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={start}
        className="text-xs font-bold text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
      >
        Run your own, free
      </button>
    );
  }

  return (
    <div className="rounded-md border-2 border-dashed border-border p-4 text-center">
      <p className="text-sm">
        Want this for your team? Run your own {noun}. It&apos;s free, and nobody
        needs an account.
      </p>
      <Button type="button" onClick={start} variant="outline" className="mt-3">
        {action}
      </Button>
    </div>
  );
}
