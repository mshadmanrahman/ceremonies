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
}

export function VoteCard({ name, value, revealed }: VoteCardProps) {
  const hasVoted = value !== null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "flex h-16 w-11 items-center justify-center rounded-md border-2 font-mono text-lg font-semibold transition-all sm:h-20 sm:w-14",
          !hasVoted && !revealed && "border-dashed border-border bg-transparent",
          !hasVoted && revealed && "border-dashed border-destructive/40 bg-destructive/5",
          hasVoted && !revealed && "border-primary/50 bg-primary/10",
          hasVoted && revealed && "border-primary bg-card shadow-sm"
        )}
      >
        {!hasVoted && !revealed && (
          <span className="text-xs text-muted-foreground">...</span>
        )}
        {!hasVoted && revealed && (
          <span className="text-xs text-destructive/60">—</span>
        )}
        {hasVoted && !revealed && (
          <span className="text-primary">✓</span>
        )}
        {hasVoted && revealed && (
          <span>{VALUE_DISPLAY[value]}</span>
        )}
      </div>
      <span className="max-w-14 truncate text-xs text-muted-foreground">
        {name}
      </span>
    </div>
  );
}
