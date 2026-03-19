"use client";

import { cn } from "@/lib/utils";
import type { CardValue } from "@/lib/state-machines/estimation";

const VALUE_DISPLAY: Record<CardValue, string> = {
  coffee: "☕",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "8": "8",
  "13": "13",
  question: "❓",
};

interface VoteCardProps {
  readonly name: string;
  readonly value: CardValue | null;
  readonly revealed: boolean;
  readonly isYou?: boolean;
  readonly index?: number;
}

export function VoteCard({ name, value, revealed, isYou, index = 0 }: VoteCardProps) {
  const hasVoted = value !== null;

  return (
    <div
      className="stagger-in flex flex-col items-center gap-2.5"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Card container with perspective for 3D flip */}
      <div className="relative h-20 w-14 sm:h-24 sm:w-16" style={{ perspective: "600px" }}>
        <div
          className={cn(
            "card-flip-inner h-full w-full",
            revealed && hasVoted && "flipped"
          )}
        >
          {/* Front face: card back (hidden vote or waiting) */}
          <div
            className={cn(
              "card-face rounded-md border-2 font-mono text-lg font-bold sm:text-xl",
              !hasVoted && "border-dashed border-muted-foreground/30 bg-transparent",
              hasVoted && !revealed && "card-waiting border-primary bg-primary/10"
            )}
            style={{ transitionDuration: "var(--duration-micro)", transitionTimingFunction: "var(--ease-ceremony)" }}
          >
            {!hasVoted && (
              <span className="text-muted-foreground/40">?</span>
            )}
            {hasVoted && !revealed && (
              <span className="text-primary text-xl font-bold">✓</span>
            )}
            {!hasVoted && revealed && (
              <span className="text-destructive/50 text-sm font-bold">--</span>
            )}
          </div>

          {/* Back face: revealed vote value */}
          {hasVoted && (
            <div className="card-face card-face-back rounded-md border-2 border-primary bg-card shadow-hard">
              <span className="text-xl font-bold sm:text-2xl">
                {VALUE_DISPLAY[value]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Player name — fixed height so all cards align regardless of "you" label */}
      <div className="flex h-8 flex-col items-center justify-start gap-0">
        <span
          className={cn(
            "max-w-18 truncate text-xs font-bold leading-tight",
            isYou ? "text-primary" : "text-muted-foreground"
          )}
        >
          {name}
        </span>
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-widest leading-tight",
            isYou ? "text-primary/60" : "invisible"
          )}
        >
          you
        </span>
      </div>
    </div>
  );
}
