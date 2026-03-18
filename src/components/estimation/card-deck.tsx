"use client";

import { cn } from "@/lib/utils";
import { CARD_VALUES, type CardValue } from "@/lib/state-machines/estimation";

const CARD_DISPLAY: Record<CardValue, { label: string; emoji?: string }> = {
  coffee: { label: "Just do it", emoji: "☕" },
  "1": { label: "1" },
  "2": { label: "2" },
  "3": { label: "3" },
  "4": { label: "4" },
  "5": { label: "5" },
  "8": { label: "8" },
  "13": { label: "13" },
  question: { label: "No idea", emoji: "❓" },
};

interface CardDeckProps {
  readonly selected: CardValue | null;
  readonly onSelect: (value: CardValue) => void;
  readonly disabled?: boolean;
}

export function CardDeck({ selected, onSelect, disabled }: CardDeckProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {CARD_VALUES.map((value) => {
        const display = CARD_DISPLAY[value];
        const isSelected = selected === value;
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            disabled={disabled}
            className={cn(
              "flex h-20 w-14 flex-col items-center justify-center rounded-lg border-2 transition-all sm:h-24 sm:w-16",
              "hover:border-primary/50 hover:shadow-sm",
              "disabled:cursor-not-allowed disabled:opacity-40",
              isSelected
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card"
            )}
          >
            {display.emoji ? (
              <>
                <span className="text-xl">{display.emoji}</span>
                <span className="mt-1 text-[10px] text-muted-foreground">
                  {display.label}
                </span>
              </>
            ) : (
              <span
                className={cn(
                  "text-xl font-semibold tabular-nums",
                  isSelected ? "text-primary" : "text-foreground"
                )}
              >
                {display.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
