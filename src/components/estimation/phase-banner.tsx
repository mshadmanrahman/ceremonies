import { cn } from "@/lib/utils";
import { HourglassIcon, CardsIcon, EyesIcon, ChatIcon, CheckCircleIcon } from "@/components/shared/icons";
import type { EstimationPhase } from "@/lib/state-machines/estimation";

const PHASE_CONFIG: Record<
  EstimationPhase,
  { label: string; icon: React.ReactNode; accent: boolean }
> = {
  waiting: { label: "WAITING", icon: <HourglassIcon width={16} height={16} />, accent: false },
  voting: { label: "VOTE NOW", icon: <CardsIcon size={16} />, accent: true },
  revealed: { label: "REVEALED", icon: <EyesIcon width={16} height={16} />, accent: false },
  discussing: { label: "DISCUSS", icon: <ChatIcon width={16} height={16} />, accent: false },
  agreed: { label: "AGREED", icon: <CheckCircleIcon width={16} height={16} />, accent: true },
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
        "flex items-center gap-2 rounded-md px-3 py-1.5",
        "text-[10px] font-bold uppercase tracking-[0.12em]",
        "transition-[background-color,color]",
        config.accent
          ? "bg-primary/15 text-primary"
          : "bg-muted text-muted-foreground"
      )}
      style={{ transitionDuration: "var(--duration-normal)", transitionTimingFunction: "var(--ease-ceremony)" }}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}
