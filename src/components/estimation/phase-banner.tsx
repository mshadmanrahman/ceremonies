import { cn } from "@/lib/utils";
import { HourglassIcon, CardsIcon, EyesIcon, ChatIcon, CheckCircleIcon } from "@/components/shared/icons";
import type { EstimationPhase } from "@/lib/state-machines/estimation";

const PHASE_CONFIG: Record<
  EstimationPhase,
  { label: string; icon: React.ReactNode; accent: boolean }
> = {
  waiting: { label: "WAITING", icon: <HourglassIcon size={16} />, accent: false },
  voting: { label: "VOTE NOW", icon: <CardsIcon size={16} />, accent: true },
  revealed: { label: "REVEALED", icon: <EyesIcon size={16} />, accent: false },
  discussing: { label: "DISCUSS", icon: <ChatIcon size={16} />, accent: false },
  agreed: { label: "AGREED", icon: <CheckCircleIcon size={16} />, accent: true },
};

interface PhaseBannerProps {
  readonly phase: EstimationPhase;
  readonly ticketRef?: string;
}

export function PhaseBanner({ phase }: PhaseBannerProps) {
  const config = PHASE_CONFIG[phase];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border-2 px-4 py-1.5",
        "text-xs font-bold uppercase tracking-wider",
        "shadow-hard-sm",
        "transition-[border-color,background-color,color]",
        config.accent
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-card text-muted-foreground"
      )}
      style={{ transitionDuration: "var(--duration-normal)", transitionTimingFunction: "var(--ease-ceremony)" }}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}
