import { Badge } from "@/components/ui/badge";
import type { EstimationPhase } from "@/lib/state-machines/estimation";

const PHASE_CONFIG: Record<
  EstimationPhase,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  waiting: { label: "Waiting for ticket", variant: "outline" },
  voting: { label: "Vote now", variant: "default" },
  revealed: { label: "Votes revealed", variant: "secondary" },
  discussing: { label: "Discussing", variant: "secondary" },
  agreed: { label: "Agreed", variant: "default" },
};

interface PhaseBannerProps {
  readonly phase: EstimationPhase;
  readonly ticketRef?: string;
}

export function PhaseBanner({ phase, ticketRef }: PhaseBannerProps) {
  const config = PHASE_CONFIG[phase];

  return (
    <div className="flex items-center gap-3">
      <Badge variant={config.variant}>{config.label}</Badge>
      {ticketRef && (
        <span className="font-mono text-sm text-muted-foreground">
          {ticketRef}
        </span>
      )}
    </div>
  );
}
