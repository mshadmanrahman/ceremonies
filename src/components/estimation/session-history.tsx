import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
    <div className="mt-auto pt-8">
      <Separator />
      <div className="px-1 py-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Today&apos;s session ({history.length} estimated)
        </p>
        <div className="flex flex-wrap gap-2">
          {history.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5"
            >
              <span className="text-xs text-muted-foreground">
                {item.ticket.ref === "Quick vote"
                  ? `Vote ${i + 1}`
                  : item.ticket.ref}
              </span>
              <Badge variant="secondary" className="px-1.5 py-0 text-xs font-mono">
                {VALUE_DISPLAY[item.finalEstimate]}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
