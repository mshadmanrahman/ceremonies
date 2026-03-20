"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "iconoir-react";
import {
  type CardValue,
  type EstimationState,
} from "@/lib/state-machines/estimation";

const QUICK_VALUES: { value: CardValue; label: string }[] = [
  { value: "coffee", label: "☕" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "8", label: "8" },
  { value: "13", label: "13" },
];

interface FacilitatorControlsProps {
  readonly state: EstimationState;
  readonly isFacilitator: boolean;
  readonly nudgeReceived?: boolean;
  readonly onReveal: () => void;
  readonly onDiscuss: () => void;
  readonly onAgree: (value: string) => void;
  readonly onNextTicket: () => void;
  readonly onRevote: () => void;
}

export function FacilitatorControls({
  state,
  isFacilitator,
  nudgeReceived,
  onReveal,
  onDiscuss,
  onAgree,
  onNextTicket,
  onRevote,
}: FacilitatorControlsProps) {
  const [showPicker, setShowPicker] = useState(false);

  if (!isFacilitator) return null;

  const voteCount = state.votes.length;
  const participantCount = state.participants.length;
  const allVoted = participantCount > 0 && voteCount >= participantCount;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main controls — no border wrapper, just buttons */}
      <div
        className={cn(
          "flex items-center gap-3",
          nudgeReceived && "nudge-shake"
        )}
      >
        {state.phase === "voting" && (
          <>
            <span className="font-mono text-sm font-bold tabular-nums text-muted-foreground">
              {voteCount}/{participantCount}
            </span>
            <Button
              onClick={onReveal}
              size="sm"
              className={cn(
                allVoted && "bg-primary text-primary-foreground"
              )}
              variant={allVoted ? "default" : "outline"}
            >
              {nudgeReceived
                ? "Team says REVEAL!"
                : allVoted
                  ? "Reveal cards"
                  : "Reveal early"}
            </Button>
          </>
        )}

        {state.phase === "revealed" && (
          <>
            <Button onClick={onRevote} size="sm" variant="outline">
              Re-vote
            </Button>
            <Button onClick={onDiscuss} size="sm" variant="outline">
              Discuss
            </Button>
            <Button
              onClick={() => setShowPicker(true)}
              size="sm"
            >
              Set estimate
            </Button>
          </>
        )}

        {state.phase === "discussing" && (
          <>
            <Button onClick={onRevote} size="sm" variant="outline">
              Re-vote
            </Button>
            <Button
              onClick={() => setShowPicker(true)}
              size="sm"
            >
              Set estimate
            </Button>
          </>
        )}

        {state.phase === "agreed" && (
          <Button onClick={onNextTicket} size="sm">
            Next
          </Button>
        )}

        {/* Escape hatch — styled as a visible link, not hidden text */}
        {state.phase !== "waiting" && state.phase !== "voting" && (
          <button
            onClick={onNextTicket}
            className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            <Plus width={14} height={14} />
            New round
          </button>
        )}
      </div>

      {/* Estimate picker */}
      {showPicker && (
        <div className="stagger-in flex flex-col items-center gap-3 rounded-md border-2 border-primary/40 bg-card p-4 shadow-hard">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Pick the final estimate
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_VALUES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => {
                  onAgree(value);
                  setShowPicker(false);
                }}
                className={cn(
                  "flex h-12 w-12 items-center justify-center",
                  "rounded-lg border-2 border-border bg-card",
                  "font-mono text-lg font-bold",
                  "shadow-hard-sm",
                  "transition-[transform,box-shadow,border-color,background-color]",
                  "hover:translate-y-[1px] hover:border-primary hover:bg-primary/10",
                  "hover:shadow-[0_2px_0_0_var(--shadow-color)]",
                  "active:translate-y-[3px] active:shadow-none"
                )}
                style={{ transitionDuration: "var(--duration-micro)", transitionTimingFunction: "var(--ease-ceremony)" }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
