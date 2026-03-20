/**
 * Ceremony icons.
 *
 * Utility icons: iconoir-react (consistent 1.5px stroke, 24x24 viewbox)
 * Mascot icons: custom SVGs (Owl + Ghost are unique to Ceremonies)
 */

// Re-export iconoir icons with ceremony-specific names
export {
  Hourglass as HourglassIcon,
  Eye as EyesIcon,
  ChatBubble as ChatIcon,
  CheckCircle as CheckCircleIcon,
  Sparks as CrystalBallIcon,
  SunLight as SunIcon,
  HalfMoon as MoonIcon,
} from "iconoir-react";

// Card icon: iconoir doesn't have a playing card, so we keep a clean custom one
export function CardsIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Back card */}
      <rect x="2" y="4" width="13" height="17" rx="2" />
      {/* Front card */}
      <rect x="9" y="3" width="13" height="17" rx="2" />
      {/* Diamond suit on front card */}
      <path d="M15.5 8.5 L17 11 L15.5 13.5 L14 11Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Ceremony Mascots (custom, no library equivalent) ──

interface MascotProps {
  readonly size?: number;
  readonly className?: string;
}

export function OwlIcon({ size = 40, className }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Head + body as one rounded shape */}
      <path d="M12 24 C12 14 17 8 24 8 C31 8 36 14 36 24 L36 36 C36 38 34 40 32 40 L16 40 C14 40 12 38 12 36 Z" />
      {/* Ear tufts */}
      <path d="M14 13 L17 18" />
      <path d="M34 13 L31 18" />
      {/* Left eye */}
      <circle cx="19" cy="22" r="4.5" />
      {/* Right eye */}
      <circle cx="29" cy="22" r="4.5" />
      {/* Left pupil */}
      <circle cx="20" cy="21.5" r="2" fill="currentColor" stroke="none" />
      {/* Right pupil */}
      <circle cx="30" cy="21.5" r="2" fill="currentColor" stroke="none" />
      {/* Beak */}
      <path d="M22 27 L24 30 L26 27" />
      {/* Belly line */}
      <path d="M18 34 Q24 37 30 34" />
    </svg>
  );
}

export function GhostIcon({ size = 40, className }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Body outline */}
      <path d="M12 26 C12 16 17.4 10 24 10 C30.6 10 36 16 36 26 L36 38 L32 34 L28 38 L24 34 L20 38 L16 34 L12 38 Z" />
      {/* Left eye */}
      <circle cx="19" cy="23" r="2.5" fill="currentColor" stroke="none" />
      {/* Right eye */}
      <circle cx="29" cy="23" r="2.5" fill="currentColor" stroke="none" />
      {/* Mouth */}
      <path d="M21 29 Q24 32 27 29" />
    </svg>
  );
}
