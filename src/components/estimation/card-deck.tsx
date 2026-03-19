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
    <div className="flex flex-wrap items-end justify-center gap-3">
      {CARD_VALUES.map((value, i) => {
        const display = CARD_DISPLAY[value];
        const isSelected = selected === value;
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            disabled={disabled}
            className={cn(
              "group relative flex flex-col items-center justify-center",
              "h-24 w-16 sm:h-[7.5rem] sm:w-[5rem]",
              "rounded-md border-2 font-mono",
              "transition-[transform,box-shadow,border-color,background-color]",
              "disabled:cursor-not-allowed disabled:opacity-40",
              /* Iconoir tactile: vertical shadow, press down on hover */
              isSelected
                ? [
                    "border-primary bg-primary/15 -translate-y-3",
                    "shadow-[0_var(--shadow-offset)_0_0_var(--primary)]",
                  ].join(" ")
                : [
                    "border-border bg-card shadow-hard",
                    "hover:translate-y-[calc(var(--shadow-offset)-3px)]",
                    "hover:shadow-[0_3px_0_0_var(--shadow-color)]",
                    "hover:border-primary/60",
                    "active:translate-y-[var(--shadow-offset)] active:shadow-none",
                  ].join(" ")
            )}
            style={{
              animationDelay: `${i * 30}ms`,
              transitionDuration: "var(--duration-micro)",
              transitionTimingFunction: "var(--ease-ceremony)",
            }}
          >
            {/* Selected indicator dot */}
            {isSelected && (
              <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-hard-sm" />
            )}

            {display.emoji ? (
              <>
                <span className="text-2xl sm:text-3xl">{display.emoji}</span>
                <span className="mt-1 text-[9px] font-sans font-bold uppercase tracking-wider text-muted-foreground">
                  {display.label}
                </span>
              </>
            ) : (
              <span
                className={cn(
                  "text-2xl font-bold tabular-nums sm:text-3xl",
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
