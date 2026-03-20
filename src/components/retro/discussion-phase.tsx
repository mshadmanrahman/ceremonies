"use client";

import { useEffect, useMemo } from "react";
import type {
  CardGroup,
  RetroCard,
  DiscussionState,
  CardCategory,
} from "@/lib/state-machines/retro";
import { Button } from "@/components/ui/button";
import { HappyIcon, SadIcon, ConfusedIcon } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import { Play, Pause, FastArrowRight } from "iconoir-react";

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

interface DiscussionPhaseProps {
  readonly groups: ReadonlyArray<CardGroup>;
  readonly cards: ReadonlyArray<RetroCard>;
  readonly rankedGroupIds: ReadonlyArray<string>;
  readonly discussion: DiscussionState;
  readonly isFacilitator: boolean;
  readonly onToggleTimer: () => void;
  readonly onNextTopic: () => void;
  readonly onAdvance: () => void;
}


function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function DiscussionPhase({
  groups,
  cards,
  rankedGroupIds,
  discussion,
  isFacilitator,
  onToggleTimer,
  onNextTopic,
  onAdvance,
}: DiscussionPhaseProps) {
  const currentGroupId = rankedGroupIds[discussion.currentGroupIndex];
  const currentGroup = groups.find((g) => g.id === currentGroupId);
  const isLastTopic = discussion.currentGroupIndex >= rankedGroupIds.length - 1;
  const timerExpired = discussion.timerRemaining <= 0;
  const timerWarning = discussion.timerRemaining <= 30 && discussion.timerRemaining > 0;

  const rankedGroups = useMemo(
    () =>
      rankedGroupIds
        .map((id) => groups.find((g) => g.id === id))
        .filter(Boolean) as ReadonlyArray<CardGroup>,
    [rankedGroupIds, groups]
  );

  const currentCards = useMemo(() => {
    if (!currentGroup) return [];
    return currentGroup.cardIds
      .map((id) => cards.find((c) => c.id === id))
      .filter(Boolean) as ReadonlyArray<RetroCard>;
  }, [currentGroup, cards]);

  if (rankedGroupIds.length === 0) {
    return (
      <div className="mx-auto max-w-lg text-center space-y-4">
        <h2 className="font-display text-3xl tracking-ceremony">Discuss</h2>
        <p className="text-sm text-muted-foreground">
          No topics received votes. Nothing to discuss.
        </p>
        {isFacilitator && (
          <Button onClick={onAdvance} className="h-11">
            Move to action items
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header + timer */}
      <div className="text-center space-y-4">
        <h2 className="font-display text-3xl tracking-ceremony">Discuss</h2>
        <p className="text-sm text-muted-foreground">
          Topic {discussion.currentGroupIndex + 1} of {rankedGroupIds.length}
        </p>

        {/* Timer ring */}
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "flex h-24 w-24 items-center justify-center rounded-full border-4 font-mono text-2xl font-bold transition-colors",
              timerExpired && "border-destructive text-destructive animate-pulse",
              timerWarning && !timerExpired && "border-warning text-warning",
              !timerWarning && !timerExpired && "border-primary text-primary"
            )}
          >
            {formatTime(discussion.timerRemaining)}
          </div>

          {isFacilitator && (
            <div className="flex gap-2">
              <Button
                onClick={onToggleTimer}
                size="sm"
                variant="outline"
                className="h-9 gap-1.5"
              >
                {discussion.timerRunning ? (
                  <>
                    <Pause width={14} height={14} /> Pause
                  </>
                ) : (
                  <>
                    <Play width={14} height={14} />{" "}
                    {timerExpired ? "Restart" : "Start"}
                  </>
                )}
              </Button>
              {!isLastTopic && (
                <Button
                  onClick={onNextTopic}
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5"
                >
                  <FastArrowRight width={14} height={14} />
                  Next topic
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Current topic */}
      {currentGroup && (
        <div className="rounded-md border-2 border-primary bg-primary/5 p-6 shadow-hard">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl tracking-ceremony">
              {currentGroup.label}
            </h3>
            <span className="rounded-md bg-primary/15 px-2.5 py-1 font-mono text-sm font-bold text-primary">
              {currentGroup.voteCount} vote{currentGroup.voteCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {currentCards.map((card) => (
              <div
                key={card.id}
                className="flex items-start gap-2 rounded-md border border-border bg-card p-3 text-sm"
              >
                {(() => {
                  const Icon = CATEGORY_ICON[card.category];
                  return <Icon size={18} className={cn("mt-0.5 shrink-0", CATEGORY_COLOR[card.category])} />;
                })()}
                {card.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic sidebar */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          All topics (by votes)
        </p>
        <div className="flex flex-wrap gap-2">
          {rankedGroups.map((group, i) => (
            <div
              key={group.id}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium",
                i === discussion.currentGroupIndex
                  ? "border-primary bg-primary/10 text-primary"
                  : i < discussion.currentGroupIndex
                    ? "border-border bg-muted text-muted-foreground line-through"
                    : "border-border text-muted-foreground"
              )}
            >
              {group.label} ({group.voteCount})
            </div>
          ))}
        </div>
      </div>

      {/* Move to commit */}
      {isFacilitator && (
        <div className="text-center pt-4">
          <Button onClick={onAdvance} className="h-11">
            Move to action items
          </Button>
        </div>
      )}
    </div>
  );
}
