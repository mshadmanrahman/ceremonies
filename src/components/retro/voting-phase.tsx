"use client";

import type { CardGroup, RetroCard, CardCategory, Participant, RetroVote } from "@/lib/state-machines/retro";
import { getVotingStatus } from "@/lib/state-machines/retro";
import { Button } from "@/components/ui/button";
import { HappyIcon, SadIcon, ConfusedIcon } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import { Plus, Minus, Check, WarningTriangle } from "iconoir-react";

const CATEGORY_ICON: Record<CardCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  happy: HappyIcon,
  sad: SadIcon,
  confused: ConfusedIcon,
};

const CATEGORY_COLOR: Record<CardCategory, string> = {
  happy: "text-happy",
  sad: "text-sad",
  confused: "text-confused",
};

interface VotingPhaseProps {
  readonly groups: ReadonlyArray<CardGroup>;
  readonly cards: ReadonlyArray<RetroCard>;
  readonly participants: ReadonlyArray<Participant>;
  readonly votes: ReadonlyArray<RetroVote>;
  readonly myVoteCount: number;
  readonly maxVotes: number;
  readonly myVotesByGroup: ReadonlyMap<string, number>;
  readonly isFacilitator: boolean;
  readonly onVote: (groupId: string) => void;
  readonly onRemoveVote: (groupId: string) => void;
  readonly onAdvance: () => void;
}

export function VotingPhase({
  groups,
  cards,
  participants,
  votes,
  myVoteCount,
  maxVotes,
  myVotesByGroup,
  isFacilitator,
  onVote,
  onRemoveVote,
  onAdvance,
}: VotingPhaseProps) {
  const votesRemaining = maxVotes - myVoteCount;
  const allUsed = votesRemaining === 0;
  const votingStatus = getVotingStatus(participants, votes, maxVotes);
  const allVotesIn = votingStatus.allVoted;

  // Keep original order until reveal (don't sort by hidden votes)
  // After reveal, sort by vote count
  const sortedGroups = allVotesIn
    ? [...groups].sort((a, b) => b.voteCount - a.voteCount)
    : groups;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-display text-3xl tracking-ceremony">Vote</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Distribute {maxVotes} votes across topics that matter most to you.
        </p>

        {/* Vote dots */}
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: maxVotes }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-4 w-4 rounded-full border-2 transition-all",
                i < myVoteCount
                  ? "border-primary bg-primary scale-110"
                  : "border-border bg-transparent"
              )}
            />
          ))}
        </div>

        {/* Status message */}
        {allUsed ? (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
            <Check width={14} height={14} />
            All votes cast! You can redistribute by removing votes.
          </div>
        ) : (
          <p className="mt-3 font-mono text-sm font-bold text-primary">
            {votesRemaining} vote{votesRemaining !== 1 ? "s" : ""} remaining
          </p>
        )}
      </div>

      {/* Voting progress (visible to everyone) */}
      <div className="rounded-md border-2 border-dashed border-border bg-muted/50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {allVotesIn ? "All votes are in!" : "Voting in progress"}
          </span>
          <span className="font-mono text-xs font-bold text-muted-foreground">
            {votingStatus.voted.length}/{participants.length} voted
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-2 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              allVotesIn ? "bg-success" : "bg-primary"
            )}
            style={{
              width: `${participants.length > 0 ? (votingStatus.voted.length / participants.length) * 100 : 0}%`,
            }}
          />
        </div>

        {/* Participant status: who voted (no details about WHAT they voted) */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {participants.map((p) => {
            const hasVoted = votingStatus.voted.includes(p.name);
            return (
              <span
                key={p.id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold",
                  hasVoted
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {hasVoted ? (
                  <Check width={10} height={10} />
                ) : (
                  <WarningTriangle width={10} height={10} />
                )}
                {p.name}
              </span>
            );
          })}
        </div>

        {allVotesIn && (
          <p className="mt-2 text-center text-xs font-bold text-success consensus-enter">
            Results revealed! Groups are now sorted by votes.
          </p>
        )}
      </div>

      {/* Groups to vote on */}
      <div className="space-y-3">
        {sortedGroups.map((group) => {
          const myVotesOnThis = myVotesByGroup.get(group.id) ?? 0;
          const groupCards = group.cardIds
            .map((id) => cards.find((c) => c.id === id))
            .filter(Boolean) as ReadonlyArray<RetroCard>;

          return (
            <div
              key={group.id}
              className="rounded-md border-2 border-border bg-card p-4 shadow-hard-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-bold">{group.label}</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {groupCards.slice(0, 3).map((card) => {
                      const Icon = CATEGORY_ICON[card.category];
                      return (
                        <span
                          key={card.id}
                          className="flex items-center gap-1 text-xs text-muted-foreground"
                        >
                          <Icon size={14} className={CATEGORY_COLOR[card.category]} />
                          {card.text.slice(0, 30)}
                          {card.text.length > 30 ? "..." : ""}
                        </span>
                      );
                    })}
                    {groupCards.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{groupCards.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Vote controls */}
                <div className="flex items-center gap-2">
                  {!allVotesIn ? (
                    <>
                      {/* Before reveal: +/- buttons + YOUR count on this group */}
                      <button
                        onClick={() => onRemoveVote(group.id)}
                        disabled={myVotesOnThis === 0}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-md border-2 border-border transition-colors",
                          myVotesOnThis > 0
                            ? "hover:border-destructive hover:text-destructive"
                            : "opacity-30"
                        )}
                        aria-label="Remove vote"
                      >
                        <Minus width={14} height={14} />
                      </button>

                      {/* Show YOUR votes on this group, not the total */}
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-md border-2 font-mono text-lg font-bold",
                        myVotesOnThis > 0
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted text-muted-foreground"
                      )}>
                        {myVotesOnThis}
                      </div>

                      <button
                        onClick={() => onVote(group.id)}
                        disabled={votesRemaining === 0}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-md border-2 border-border transition-colors",
                          votesRemaining > 0
                            ? "hover:border-primary hover:text-primary"
                            : "opacity-30"
                        )}
                        aria-label="Add vote"
                      >
                        <Plus width={14} height={14} />
                      </button>
                    </>
                  ) : (
                    /* After reveal: show TOTAL vote count with animation */
                    <div className="consensus-enter flex h-10 w-10 items-center justify-center rounded-md border-2 border-primary bg-primary/10 font-mono text-lg font-bold text-primary">
                      {group.voteCount}
                    </div>
                  )}
                </div>
              </div>

              {/* My votes indicator (always visible to yourself) */}
              {myVotesOnThis > 0 && !allVotesIn && (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex gap-1">
                    {Array.from({ length: myVotesOnThis }).map((_, i) => (
                      <div
                        key={i}
                        className="h-2 w-2 rounded-full bg-primary"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold leading-none text-primary/60">
                    your vote{myVotesOnThis !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Facilitator advance: only after all votes are revealed */}
      {isFacilitator && allVotesIn && (
        <div className="text-center pt-2 consensus-enter">
          <Button onClick={onAdvance} className="h-11">
            Start discussion
          </Button>
        </div>
      )}

      {isFacilitator && !allVotesIn && (
        <p className="text-center text-xs text-muted-foreground">
          Waiting for all votes before revealing results...
        </p>
      )}
    </div>
  );
}
