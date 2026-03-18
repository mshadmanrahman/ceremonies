"use client";

import { Button } from "@/components/ui/button";
import type { EstimationPhase, EstimationState } from "@/lib/state-machines/estimation";

interface FacilitatorControlsProps {
  readonly state: EstimationState;
  readonly isFacilitator: boolean;
  readonly onReveal: () => void;
  readonly onDiscuss: () => void;
  readonly onAgree: (value: string) => void;
  readonly onNextTicket: () => void;
}

export function FacilitatorControls({
  state,
  isFacilitator,
  onReveal,
  onDiscuss,
  onAgree,
  onNextTicket,
}: FacilitatorControlsProps) {
  if (!isFacilitator) return null;

  const voteCount = state.votes.length;
  const participantCount = state.participants.length;
  const allVoted = participantCount > 0 && voteCount >= participantCount;

  return (
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
          >
            {allVoted ? "All votes in — Reveal" : "Reveal"}
          </Button>
        </>
      )}

      {state.phase === "revealed" && (
        <>
          <Button onClick={onDiscuss} size="sm" variant="outline">
            Discuss
          </Button>
          <Button
            onClick={() => {
              const mostCommon = getMostCommonVote(state);
              if (mostCommon) onAgree(mostCommon);
            }}
            size="sm"
          >
            Agree
          </Button>
        </>
      )}

      {state.phase === "discussing" && (
        <Button
          onClick={() => {
            const mostCommon = getMostCommonVote(state);
            if (mostCommon) onAgree(mostCommon);
          }}
          size="sm"
        >
          Agree on estimate
        </Button>
      )}

      {state.phase === "agreed" && (
        <Button onClick={onNextTicket} size="sm">
          Next ticket
        </Button>
      )}
    </div>
  );
}

function getMostCommonVote(state: EstimationState): string | null {
  if (state.votes.length === 0) return null;
  const counts = new Map<string, number>();
  for (const vote of state.votes) {
    counts.set(vote.value, (counts.get(vote.value) ?? 0) + 1);
  }
  let maxCount = 0;
  let maxValue: string | null = null;
  for (const [value, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxValue = value;
    }
  }
  return maxValue;
}
