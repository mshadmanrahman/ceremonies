import Link from "next/link";
import { GhostIcon, HappyIcon, SadIcon, ConfusedIcon } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import { NavArrowLeft } from "iconoir-react";

// ── Types ──

type CardCategory = "happy" | "sad" | "confused";

interface SummaryCard {
  id: string;
  text: string;
  category: CardCategory;
}

interface SummaryActionItem {
  id: string;
  text: string;
  assignees: string[];
  groupId: string | null;
}

interface SummaryGroup {
  id: string;
  label: string;
  voteCount: number;
  rank: number | null;
  cards: SummaryCard[];
  actionItems: SummaryActionItem[];
}

export interface ClosedRetroSummaryProps {
  roomCode: string;
  closedAt: Date | null;
  groups: SummaryGroup[];
  generalActionItems: SummaryActionItem[];
}

// ── Icon + color maps ──

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

// ── Main component ──

export function ClosedRetroSummary({
  roomCode,
  closedAt,
  groups,
  generalActionItems,
}: ClosedRetroSummaryProps) {
  const closedDateString = closedAt
    ? closedAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const rankedGroups = [...groups].sort((a, b) => {
    if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
    if (a.rank !== null) return -1;
    if (b.rank !== null) return 1;
    return b.voteCount - a.voteCount;
  });

  return (
    <div className="mx-auto min-h-svh max-w-3xl px-4 py-6 sm:py-8">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          <NavArrowLeft width={16} height={16} />
          Back to dashboard
        </Link>
      </div>

      {/* Header */}
      <header className="mb-6">
        <div className="flex items-baseline gap-3">
          <GhostIcon size={32} className="text-coffee shrink-0" />
          <div>
            <h1 className="font-display text-3xl tracking-ceremony sm:text-4xl">
              Retro {roomCode}
            </h1>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              {closedDateString ? `Closed ${closedDateString}` : "Closed"}
            </p>
          </div>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-md border-2 border-border bg-muted/40 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          <span className="text-xs font-bold text-muted-foreground">
            This retro is closed. These action items will haunt your next retro.
          </span>
        </div>
      </header>

      <div className="h-0.5 bg-border mb-8" />

      {/* Groups */}
      <div className="space-y-6">
        {rankedGroups.map((group, i) => (
          <GroupCard key={group.id} group={group} rank={i + 1} />
        ))}
      </div>

      {/* General action items */}
      {generalActionItems.length > 0 && (
        <div className="mt-6 rounded-md border-2 border-dashed border-border bg-muted/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <GhostIcon size={16} className="text-coffee" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              General action items
            </span>
          </div>
          {generalActionItems.map((item) => (
            <ActionItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Group card ──

function GroupCard({ group, rank }: { group: SummaryGroup; rank: number }) {
  const hasContent = group.cards.length > 0 || group.actionItems.length > 0;
  if (!hasContent && group.voteCount === 0) return null;

  return (
    <div className="rounded-md border-2 border-border bg-card shadow-hard overflow-hidden">
      {/* Group header */}
      <div className="flex items-center justify-between border-b-2 border-border bg-muted/30 px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 font-mono text-xs font-bold text-primary">
            {rank}
          </span>
          <h3 className="min-w-0 break-words font-display text-lg tracking-ceremony">
            {group.label}
          </h3>
        </div>
        <span className="rounded-md bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary">
          {group.voteCount} vote{group.voteCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Cards */}
      {group.cards.length > 0 && (
        <div className="px-5 py-4 space-y-2">
          {group.cards.map((card) => {
            const Icon = CATEGORY_ICON[card.category];
            return (
              <div
                key={card.id}
                className="flex items-start gap-2 rounded-md border border-border bg-background p-3 text-sm"
              >
                <Icon
                  size={18}
                  className={cn("mt-0.5 shrink-0", CATEGORY_COLOR[card.category])}
                />
                <span>{card.text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Action items */}
      {group.actionItems.length > 0 && (
        <div className={cn("border-t-2 border-dashed border-border bg-muted/20 px-5 py-4", group.cards.length === 0 && "border-t-0")}>
          <div className="flex items-center gap-2 mb-3">
            <GhostIcon size={16} className="text-coffee" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Action items
            </span>
            <span className="rounded-md bg-coffee/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-coffee">
              {group.actionItems.length}
            </span>
          </div>
          {group.actionItems.map((item) => (
            <ActionItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Action item row ──

function ActionItemRow({ item }: { item: SummaryActionItem }) {
  return (
    <div className="flex items-start gap-2 text-sm mb-2 last:mb-0">
      <GhostIcon size={14} className="mt-0.5 shrink-0 text-coffee" />
      <div>
        <span className="font-medium">{item.text}</span>
        {item.assignees.length > 0 && (
          <span className="ml-1.5 text-xs text-muted-foreground">
            ({item.assignees.join(", ")})
          </span>
        )}
      </div>
    </div>
  );
}
