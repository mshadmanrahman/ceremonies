"use client";

import { useState, useMemo } from "react";
import type {
  CardGroup,
  RetroCard,
  ActionItem,
  Participant,
  CardCategory,
} from "@/lib/state-machines/retro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HappyIcon, SadIcon, ConfusedIcon, GhostIcon } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import { Plus, Xmark, User, Check } from "iconoir-react";

interface DiscussActPhaseProps {
  readonly groups: ReadonlyArray<CardGroup>;
  readonly cards: ReadonlyArray<RetroCard>;
  readonly rankedGroupIds: ReadonlyArray<string>;
  readonly actionItems: ReadonlyArray<ActionItem>;
  readonly participants: ReadonlyArray<Participant>;
  readonly isFacilitator: boolean;
  readonly onAddItem: (text: string, assignees: ReadonlyArray<string>, groupId: string | null) => void;
  readonly onRemoveItem: (itemId: string) => void;
  readonly onClose: () => void;
}

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

export function DiscussActPhase({
  groups,
  cards,
  rankedGroupIds,
  actionItems,
  participants,
  isFacilitator,
  onAddItem,
  onRemoveItem,
  onClose,
}: DiscussActPhaseProps) {
  const rankedGroups = useMemo(
    () =>
      rankedGroupIds
        .map((id) => groups.find((g) => g.id === id))
        .filter(Boolean) as ReadonlyArray<CardGroup>,
    [rankedGroupIds, groups]
  );

  // Also include unranked groups (0 votes) at the bottom
  const unrankedGroups = useMemo(
    () => groups.filter((g) => !rankedGroupIds.includes(g.id)),
    [groups, rankedGroupIds]
  );

  const allGroups = [...rankedGroups, ...unrankedGroups];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-display text-3xl tracking-ceremony">
          Discuss & Act
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Talk through each topic. Write action items as you go. This is your retro snapshot.
        </p>
      </div>

      {/* Ranked topics with stagger animation */}
      <div className="space-y-6">
        {allGroups.map((group, i) => {
          const groupCards = group.cardIds
            .map((id) => cards.find((c) => c.id === id))
            .filter(Boolean) as ReadonlyArray<RetroCard>;
          const groupActions = actionItems.filter((a) => a.groupId === group.id);

          return (
            <TopicSection
              key={group.id}
              group={group}
              groupCards={groupCards}
              groupActions={groupActions}
              participants={participants}
              isFacilitator={isFacilitator}
              rank={i + 1}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveItem}
              animationDelay={i * 100}
            />
          );
        })}
      </div>

      {/* General action items (not tied to a topic) */}
      <GeneralActions
        actionItems={actionItems.filter((a) => !a.groupId)}
        participants={participants}
        isFacilitator={isFacilitator}
        onAddItem={onAddItem}
        onRemoveItem={onRemoveItem}
      />

      {/* Close retro */}
      {isFacilitator && (
        <div className="text-center pt-4 pb-8">
          <Button onClick={onClose} className="h-12 px-8" size="lg">
            <Check width={18} height={18} />
            Close retro
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            {actionItems.length} action item{actionItems.length !== 1 ? "s" : ""} will haunt you next time
          </p>
        </div>
      )}
    </div>
  );
}

// ── Topic Section (one per ranked group) ──

function TopicSection({
  group,
  groupCards,
  groupActions,
  participants,
  isFacilitator,
  rank,
  onAddItem,
  onRemoveItem,
  animationDelay,
}: {
  group: CardGroup;
  groupCards: ReadonlyArray<RetroCard>;
  groupActions: ReadonlyArray<ActionItem>;
  participants: ReadonlyArray<Participant>;
  isFacilitator: boolean;
  rank: number;
  onAddItem: (text: string, assignees: ReadonlyArray<string>, groupId: string | null) => void;
  onRemoveItem: (itemId: string) => void;
  animationDelay: number;
}) {
  return (
    <div
      className="stagger-in rounded-md border-2 border-border bg-card shadow-hard overflow-hidden"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Topic header */}
      <div className="flex items-center justify-between border-b-2 border-border bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 font-mono text-xs font-bold text-primary">
            {rank}
          </span>
          <h3 className="font-display text-lg tracking-ceremony">
            {group.label}
          </h3>
        </div>
        <span className="rounded-md bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary">
          {group.voteCount} vote{group.voteCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Cards in this group */}
      <div className="px-5 py-4 space-y-2">
        {groupCards.map((card) => {
          const Icon = CATEGORY_ICON[card.category];
          return (
            <div
              key={card.id}
              className="flex items-start gap-2 rounded-md border border-border bg-background p-3 text-sm"
            >
              <Icon size={18} className={cn("mt-0.5 shrink-0", CATEGORY_COLOR[card.category])} />
              <span>{card.text}</span>
            </div>
          );
        })}
      </div>

      {/* Action items for this topic */}
      <div className="border-t-2 border-dashed border-border bg-muted/20 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <GhostIcon size={16} className="text-coffee" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Action items
          </span>
          {groupActions.length > 0 && (
            <span className="rounded-md bg-coffee/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-coffee">
              {groupActions.length}
            </span>
          )}
        </div>

        {/* Existing actions */}
        {groupActions.map((item) => (
          <ActionItemRow
            key={item.id}
            item={item}
            isFacilitator={isFacilitator}
            onRemove={() => onRemoveItem(item.id)}
          />
        ))}

        {/* Add action input */}
        <InlineActionInput
          participants={participants}
          groupId={group.id}
          onAdd={onAddItem}
        />
      </div>
    </div>
  );
}

// ── General Actions (not tied to a group) ──

function GeneralActions({
  actionItems,
  participants,
  isFacilitator,
  onAddItem,
  onRemoveItem,
}: {
  actionItems: ReadonlyArray<ActionItem>;
  participants: ReadonlyArray<Participant>;
  isFacilitator: boolean;
  onAddItem: (text: string, assignees: ReadonlyArray<string>, groupId: string | null) => void;
  onRemoveItem: (itemId: string) => void;
}) {
  return (
    <div className="rounded-md border-2 border-dashed border-border bg-muted/20 p-5">
      <div className="flex items-center gap-2 mb-3">
        <GhostIcon size={16} className="text-coffee" />
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          General action items
        </span>
      </div>

      {actionItems.map((item) => (
        <ActionItemRow
          key={item.id}
          item={item}
          isFacilitator={isFacilitator}
          onRemove={() => onRemoveItem(item.id)}
        />
      ))}

      <InlineActionInput
        participants={participants}
        groupId={null}
        onAdd={onAddItem}
      />
    </div>
  );
}

// ── Inline Action Input ──

function InlineActionInput({
  participants,
  groupId,
  onAdd,
}: {
  participants: ReadonlyArray<Participant>;
  groupId: string | null;
  onAdd: (text: string, assignees: ReadonlyArray<string>, groupId: string | null) => void;
}) {
  const [text, setText] = useState("");
  const [assignees, setAssignees] = useState<ReadonlyArray<string>>([]);
  const [showAssignees, setShowAssignees] = useState(false);

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed, assignees, groupId);
    setText("");
    setAssignees([]);
    setShowAssignees(false);
  };

  const toggleAssignee = (name: string) => {
    setAssignees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an action item..."
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          onFocus={() => setShowAssignees(true)}
          className="h-9 border border-border bg-card text-xs shadow-none"
        />
        <Button
          onClick={handleAdd}
          disabled={!text.trim()}
          size="sm"
          className="h-9 gap-1 text-xs"
        >
          <Plus width={14} height={14} />
        </Button>
      </div>

      {/* Assignee picker (shown on focus) */}
      {showAssignees && text.trim() && (
        <div className="flex flex-wrap gap-1">
          {participants.map((p) => {
            const isSelected = assignees.includes(p.name);
            return (
              <button
                key={p.id}
                onClick={() => toggleAssignee(p.name)}
                className={cn(
                  "flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-foreground/30"
                )}
              >
                <User width={10} height={10} />
                {p.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Action Item Row ──

function ActionItemRow({
  item,
  isFacilitator,
  onRemove,
}: {
  item: ActionItem;
  isFacilitator: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="group mb-2 flex items-start gap-2 rounded-md border border-border bg-card p-2.5">
      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border">
        <div className="h-1.5 w-1.5 rounded-sm bg-coffee/50" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">{item.text}</p>
        {item.assignees.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.assignees.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary"
              >
                <User width={8} height={8} />
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
          aria-label="Remove"
        >
          <Xmark width={14} height={14} />
        </button>
      )}
    </div>
  );
}
