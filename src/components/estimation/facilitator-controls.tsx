"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CARD_VALUES,
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
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {state.phase === "voting" && (
          <>
            <span className="mr-2 font-mono text-sm text-muted-foreground">
              {voteCount}/{participantCount}
            </span>
            <Button
              onClick={onReveal}
              size="sm"
              variant={allVoted ? "default" : "outline"}
              className={cn(
                nudgeReceived && "animate-pulse ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              {nudgeReceived
                ? "Team wants to reveal!"
                : allVoted
                  ? "All votes in — Reveal"
                  : "Reveal"}
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

        {/* New round escape hatch */}
        {state.phase !== "waiting" && state.phase !== "voting" && (
          <Button onClick={onNextTicket} size="sm" variant="ghost">
            New round
          </Button>
        )}
      </div>

      {/* Estimate picker (facilitator selects final value) */}
      {showPicker && (
        <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">
            Pick the final estimate
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {QUICK_VALUES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => {
                  onAgree(value);
                  setShowPicker(false);
                }}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold transition-colors",
                  "hover:border-primary hover:bg-primary/5"
                )}
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
