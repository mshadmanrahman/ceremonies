"use client";

import { useState } from "react";
import type { ActionItem, Participant } from "@/lib/state-machines/retro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus, Xmark, Check, User } from "iconoir-react";

interface CommitPhaseProps {
  readonly actionItems: ReadonlyArray<ActionItem>;
  readonly participants: ReadonlyArray<Participant>;
  readonly isFacilitator: boolean;
  readonly onAddItem: (text: string, assignees: ReadonlyArray<string>) => void;
  readonly onRemoveItem: (itemId: string) => void;
  readonly onUpdateItem: (itemId: string, text?: string, assignees?: ReadonlyArray<string>) => void;
  readonly onClose: () => void;
}

export function CommitPhase({
  actionItems,
  participants,
  isFacilitator,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onClose,
}: CommitPhaseProps) {
  const [text, setText] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<ReadonlyArray<string>>([]);

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAddItem(trimmed, selectedAssignees);
    setText("");
    setSelectedAssignees([]);
  };

  const toggleAssignee = (name: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name]
    );
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-display text-3xl tracking-ceremony">
          Commit
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Turn discussions into action items. These will haunt you next retro.
        </p>
      </div>

      {/* Add action item */}
      <div className="space-y-3 rounded-md border-2 border-dashed border-primary/40 bg-primary/5 p-4">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to happen?"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="h-11 border-2 border-border bg-card shadow-hard-sm"
        />

        {/* Assignee picker */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Assign to
          </p>
          <div className="flex flex-wrap gap-1.5">
            {participants.map((p) => {
              const isSelected = selectedAssignees.includes(p.name);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleAssignee(p.name)}
                  className={cn(
                    "flex items-center gap-1 rounded-md border-2 px-2.5 py-1 text-xs font-medium transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  )}
                >
                  <User width={12} height={12} />
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        <Button onClick={handleAdd} disabled={!text.trim()} className="h-10 gap-1.5">
          <Plus width={16} height={16} />
          Add action item
        </Button>
      </div>

      {/* Action items list */}
      {actionItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Action items ({actionItems.length})
          </p>
          <div className="space-y-2">
            {actionItems.map((item) => (
              <ActionItemCard
                key={item.id}
                item={item}
                isFacilitator={isFacilitator}
                onRemove={() => onRemoveItem(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Close retro */}
      {isFacilitator && (
        <div className="text-center pt-4">
          <Button onClick={onClose} className="h-11">
            <Check width={16} height={16} />
            Close retro
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Action items will be saved for the next retro
          </p>
        </div>
      )}
    </div>
  );
}

function ActionItemCard({
  item,
  isFacilitator,
  onRemove,
}: {
  item: ActionItem;
  isFacilitator: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="group rounded-md border-2 border-border bg-card p-3 shadow-hard-sm">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-border">
          <div className="h-2 w-2 rounded-sm bg-primary/40" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{item.text}</p>
          {item.assignees.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.assignees.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"
                >
                  <User width={9} height={9} />
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
        {isFacilitator && (
          <button
            onClick={onRemove}
            className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            aria-label="Remove action item"
          >
            <Xmark width={16} height={16} />
          </button>
        )}
      </div>
    </div>
  );
}
