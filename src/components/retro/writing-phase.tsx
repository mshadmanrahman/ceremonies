"use client";

import { useState } from "react";
import type { RetroCard, CardCategory } from "@/lib/state-machines/retro";
import { Button } from "@/components/ui/button";
import { HappyIcon, SadIcon, ConfusedIcon } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import { Plus, Xmark } from "iconoir-react";

interface WritingPhaseProps {
  readonly cards: ReadonlyArray<RetroCard>;
  readonly myAnonymousId: string | null;
  readonly onAddCard: (category: CardCategory, text: string) => void;
  readonly onRemoveCard: (cardId: string) => void;
  readonly isFacilitator: boolean;
  readonly onAdvance: () => void;
  readonly participantCount: number;
}

const CATEGORIES: ReadonlyArray<{
  value: CardCategory;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}> = [
  {
    value: "happy",
    label: "Happy",
    icon: HappyIcon,
    colorClass: "text-happy",
    bgClass: "bg-happy/10",
    borderClass: "border-happy/30",
  },
  {
    value: "sad",
    label: "Sad",
    icon: SadIcon,
    colorClass: "text-sad",
    bgClass: "bg-sad/10",
    borderClass: "border-sad/30",
  },
  {
    value: "confused",
    label: "Confused",
    icon: ConfusedIcon,
    colorClass: "text-confused",
    bgClass: "bg-confused/10",
    borderClass: "border-confused/30",
  },
];

export function WritingPhase({
  cards,
  myAnonymousId,
  onAddCard,
  onRemoveCard,
  isFacilitator,
  onAdvance,
  participantCount,
}: WritingPhaseProps) {
  const [activeCategory, setActiveCategory] = useState<CardCategory>("happy");
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAddCard(activeCategory, trimmed);
    setText("");
  };

  const myCards = cards.filter((c) => c.anonymousId === myAnonymousId);
  const totalCards = cards.length;
  const activeCat = CATEGORIES.find((c) => c.value === activeCategory)!;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-display text-3xl tracking-ceremony">
          Silent Write
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Write your thoughts anonymously. No one can see who wrote what.
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground/60">
          {totalCards} card{totalCards !== 1 ? "s" : ""} from{" "}
          {participantCount} participant{participantCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex justify-center gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                "flex items-center gap-2 rounded-md border-2 px-5 py-3 text-sm font-bold transition-all",
                activeCategory === cat.value
                  ? `${cat.borderClass} ${cat.bgClass} ${cat.colorClass} shadow-hard-sm`
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={24} className={activeCategory === cat.value ? cat.colorClass : ""} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Input area */}
      <div className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`What made you ${activeCategory}?`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          rows={3}
          className={cn(
            "w-full resize-none rounded-md border-2 bg-card p-4 text-sm font-medium shadow-hard-sm placeholder:text-muted-foreground/50 focus:outline-none",
            activeCat.borderClass,
            `focus:${activeCat.borderClass}`
          )}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="h-10 gap-1.5"
          >
            <Plus width={16} height={16} />
            Add card
          </Button>
        </div>
      </div>

      {/* My cards */}
      {myCards.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Your cards ({myCards.length})
          </p>
          <div className="space-y-2">
            {myCards.map((card) => {
              const cat = CATEGORIES.find((c) => c.value === card.category);
              if (!cat) return null;
              const Icon = cat.icon;
              return (
                <div
                  key={card.id}
                  className={cn(
                    "group flex items-start gap-3 rounded-md border-2 p-3",
                    cat.borderClass,
                    cat.bgClass
                  )}
                >
                  <Icon size={20} className={cn("mt-0.5 shrink-0", cat.colorClass)} />
                  <p className="flex-1 text-sm">{card.text}</p>
                  <button
                    onClick={() => onRemoveCard(card.id)}
                    className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    aria-label="Remove card"
                  >
                    <Xmark width={16} height={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All cards by category */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          All cards ({totalCards})
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const catCards = cards.filter((c) => c.category === cat.value);
            return (
              <div key={cat.value} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon size={22} className={cat.colorClass} />
                  <span className={cn("text-xs font-bold", cat.colorClass)}>
                    {cat.label} ({catCards.length})
                  </span>
                </div>
                {catCards.map((card) => (
                  <div
                    key={card.id}
                    className={cn(
                      "rounded-md border-2 p-2.5 text-xs",
                      cat.borderClass,
                      cat.bgClass
                    )}
                  >
                    {card.text}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Facilitator advance */}
      {isFacilitator && (
        <div className="text-center pt-4">
          <Button onClick={onAdvance} disabled={totalCards === 0} className="h-11">
            {totalCards === 0 ? "Waiting for cards..." : "Move to grouping"}
          </Button>
        </div>
      )}
    </div>
  );
}
