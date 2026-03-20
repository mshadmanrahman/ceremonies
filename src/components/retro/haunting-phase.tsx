"use client";

import type { PreviousAction } from "@/lib/state-machines/retro";
import { Button } from "@/components/ui/button";
import { GhostIcon } from "@/components/shared/icons";
import { Check, Xmark } from "iconoir-react";
import { cn } from "@/lib/utils";

interface HauntingPhaseProps {
  readonly actions: ReadonlyArray<PreviousAction>;
  readonly isFacilitator: boolean;
  readonly onMark: (actionId: string, done: boolean) => void;
  readonly onAdvance: () => void;
}

export function HauntingPhase({
  actions,
  isFacilitator,
  onMark,
  onAdvance,
}: HauntingPhaseProps) {
  const allReviewed = actions.every((a) => a.done !== null);

  return (
    <div className="stagger-in mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <div className="ghost-float mx-auto mb-4 text-coffee">
          <GhostIcon size={64} />
        </div>
        <h2 className="font-display text-3xl tracking-ceremony">
          The Haunting
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          These action items survived from last retro. Did they get done?
        </p>
      </div>

      <div className="space-y-3">
        {actions.map((action) => (
          <div
            key={action.id}
            className={cn(
              "rounded-md border-2 border-border bg-card p-4 shadow-hard-sm transition-all",
              action.done === true && "border-success/40 bg-success/5",
              action.done === false && "border-destructive/40 bg-destructive/5"
            )}
          >
            <p className="text-sm font-medium">{action.text}</p>
            {action.assignees.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Assigned: {action.assignees.join(", ")}
              </p>
            )}

            {isFacilitator && action.done === null && (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMark(action.id, true)}
                  className="h-8 gap-1.5 border-success/40 text-success hover:bg-success/10"
                >
                  <Check width={14} height={14} />
                  Done
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMark(action.id, false)}
                  className="h-8 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <Xmark width={14} height={14} />
                  Not done
                </Button>
              </div>
            )}

            {action.done !== null && (
              <div className="mt-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                    action.done
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  )}
                >
                  {action.done ? (
                    <>
                      <Check width={10} height={10} /> Done
                    </>
                  ) : (
                    <>
                      <GhostIcon size={10} /> Still haunting
                    </>
                  )}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {isFacilitator && (
        <div className="text-center">
          <Button onClick={onAdvance} disabled={!allReviewed} className="h-11">
            {allReviewed ? "Start writing" : "Review all items first"}
          </Button>
        </div>
      )}

      {!isFacilitator && (
        <p className="text-center text-xs font-bold text-muted-foreground">
          Facilitator is reviewing action items...
        </p>
      )}
    </div>
  );
}
