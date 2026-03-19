import { cn } from "@/lib/utils";
import type { CompletedEstimate, CardValue } from "@/lib/state-machines/estimation";

const VALUE_DISPLAY: Record<CardValue, string> = {
  coffee: "☕",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "8": "8",
  "13": "13",
  question: "❓",
};

interface SessionHistoryProps {
  readonly history: ReadonlyArray<CompletedEstimate>;
}

export function SessionHistory({ history }: SessionHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Session ({history.length} estimated)
      </p>
      <div className="flex flex-wrap gap-2">
        {history.map((item, i) => (
          <div
            key={i}
            className={cn(
              "stagger-in flex items-center gap-2 rounded-lg border-2 border-border bg-card px-3 py-2",
              "shadow-hard-sm hover-lift"
            )}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className="text-xs font-medium text-muted-foreground">
              {item.ticket.ref === "Quick vote"
                ? `#${i + 1}`
                : item.ticket.ref}
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-primary/40 bg-primary/10 font-mono text-xs font-bold text-primary">
              {VALUE_DISPLAY[item.finalEstimate]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
