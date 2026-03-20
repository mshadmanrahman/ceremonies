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

// ── Retro Category Icons (custom, iconoir stroke style) ──

interface CategoryIconProps {
  readonly size?: number;
  readonly className?: string;
}

/** Happy: sunburst face with wide grin */
export function HappyIcon({ size = 24, className }: CategoryIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Sun rays */}
      <line x1="16" y1="2" x2="16" y2="5" />
      <line x1="16" y1="27" x2="16" y2="30" />
      <line x1="2" y1="16" x2="5" y2="16" />
      <line x1="27" y1="16" x2="30" y2="16" />
      <line x1="6.1" y1="6.1" x2="8.2" y2="8.2" />
      <line x1="23.8" y1="23.8" x2="25.9" y2="25.9" />
      <line x1="6.1" y1="25.9" x2="8.2" y2="23.8" />
      <line x1="23.8" y1="8.2" x2="25.9" y2="6.1" />
      {/* Face circle */}
      <circle cx="16" cy="16" r="9" />
      {/* Eyes (happy crescents) */}
      <path d="M12 14 Q13 12 14 14" />
      <path d="M18 14 Q19 12 20 14" />
      {/* Big smile */}
      <path d="M11.5 18 Q16 23 20.5 18" />
    </svg>
  );
}

/** Sad: rain cloud with downturned face */
export function SadIcon({ size = 24, className }: CategoryIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Cloud shape */}
      <path d="M8 20 Q4 20 4 16.5 Q4 13 8 13 Q8 8 13 8 Q16 6 19 8 Q22 6 24 9 Q28 9 28 13 Q30 14 28 17 Q28 20 24 20 Z" />
      {/* Eyes (dots) */}
      <circle cx="13" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="15" r="1" fill="currentColor" stroke="none" />
      {/* Frown */}
      <path d="M12.5 18.5 Q16 16 19.5 18.5" />
      {/* Rain drops */}
      <line x1="11" y1="23" x2="10" y2="26" />
      <line x1="16" y1="24" x2="15" y2="27" />
      <line x1="21" y1="23" x2="20" y2="26" />
    </svg>
  );
}

/** Confused: spiral/question mark face */
export function ConfusedIcon({ size = 24, className }: CategoryIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Head circle */}
      <circle cx="16" cy="16" r="11" />
      {/* Raised eyebrow left */}
      <path d="M10 11 Q12 9 14 11" />
      {/* Normal eyebrow right */}
      <line x1="18" y1="11" x2="22" y2="11" />
      {/* Left eye */}
      <circle cx="12" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
      {/* Right eye */}
      <circle cx="20" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
      {/* Squiggle mouth */}
      <path d="M11 20 Q13 22 16 19 Q19 17 21 20" />
      {/* Spiral above head */}
      <path d="M20 4 Q23 4 22 6 Q21 8 19 7" />
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
