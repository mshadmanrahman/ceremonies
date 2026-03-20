import type { RetroPhase } from "@/lib/state-machines/retro";
import { cn } from "@/lib/utils";

const PHASE_LABELS: Record<RetroPhase, string> = {
  lobby: "Lobby",
  haunting: "The Haunting",
  writing: "Silent Write",
  grouping: "Group & Label",
  voting: "Vote",
  discussing: "Discuss",
  committing: "Commit",
  closed: "Done",
};

const PHASE_STEPS: ReadonlyArray<RetroPhase> = [
  "haunting",
  "writing",
  "grouping",
  "voting",
  "discussing",
  "committing",
];

export function PhaseIndicator({ phase }: { phase: RetroPhase }) {
  const currentIdx = PHASE_STEPS.indexOf(phase);

  if (phase === "lobby" || phase === "closed") {
    return (
      <span className="rounded-md bg-muted px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {PHASE_LABELS[phase]}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {PHASE_STEPS.map((step, i) => {
        const isActive = step === phase;
        const isPast = i < currentIdx;
        return (
          <div key={step} className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex h-5 items-center rounded-md px-2 text-[9px] font-bold uppercase tracking-widest transition-colors",
                isActive && "bg-primary text-primary-foreground",
                isPast && "bg-primary/20 text-primary",
                !isActive && !isPast && "bg-muted text-muted-foreground/50"
              )}
            >
              {PHASE_LABELS[step]}
            </div>
            {i < PHASE_STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-2",
                  isPast ? "bg-primary/40" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
