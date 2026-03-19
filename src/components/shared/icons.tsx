/**
 * Custom ceremony icons. Retro, bold, geometric.
 * No Apple emojis. These are ours.
 */

interface IconProps {
  readonly size?: number;
  readonly className?: string;
}

export function OwlIcon({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      {/* Body */}
      <circle cx="24" cy="28" r="16" fill="currentColor" opacity="0.15" />
      {/* Head */}
      <circle cx="24" cy="20" r="12" fill="currentColor" opacity="0.25" />
      {/* Eyes */}
      <circle cx="19" cy="18" r="5" fill="currentColor" opacity="0.3" />
      <circle cx="29" cy="18" r="5" fill="currentColor" opacity="0.3" />
      <circle cx="19" cy="18" r="3" fill="currentColor" />
      <circle cx="29" cy="18" r="3" fill="currentColor" />
      {/* Pupils */}
      <circle cx="20" cy="17" r="1.2" fill="var(--background)" />
      <circle cx="30" cy="17" r="1.2" fill="var(--background)" />
      {/* Beak */}
      <path d="M22 22 L24 25 L26 22" fill="currentColor" opacity="0.6" />
      {/* Ear tufts */}
      <path d="M15 12 L17 16 L13 15Z" fill="currentColor" opacity="0.4" />
      <path d="M33 12 L31 16 L35 15Z" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function GhostIcon({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      {/* Body */}
      <path
        d="M12 28C12 18.06 17.37 12 24 12C30.63 12 36 18.06 36 28V38L32 34L28 38L24 34L20 38L16 34L12 38V28Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M12 28C12 18.06 17.37 12 24 12C30.63 12 36 18.06 36 28V38L32 34L28 38L24 34L20 38L16 34L12 38V28Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Eyes */}
      <circle cx="20" cy="24" r="2.5" fill="currentColor" />
      <circle cx="28" cy="24" r="2.5" fill="currentColor" />
      {/* Mouth */}
      <ellipse cx="24" cy="30" rx="2" ry="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function CardsIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Back card */}
      <rect x="3" y="4" width="12" height="16" rx="2" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2" />
      {/* Front card */}
      <rect x="9" y="4" width="12" height="16" rx="2" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="2" />
      {/* Diamond suit */}
      <path d="M15 9 L17 12 L15 15 L13 12Z" fill="currentColor" />
    </svg>
  );
}

export function HourglassIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M7 4H17V8L12 12L7 8V4Z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 20H17V16L12 12L7 16V20Z" fill="currentColor" opacity="0.35" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <line x1="6" y1="4" x2="18" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="6" y1="20" x2="18" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function EyesIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="8" cy="12" r="4" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="12" r="4" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="11.5" r="1.5" fill="currentColor" />
      <circle cx="17" cy="11.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function ChatIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 6C4 4.9 4.9 4 6 4H18C19.1 4 20 4.9 20 6V14C20 15.1 19.1 16 18 16H8L4 20V6Z"
        fill="currentColor"
        opacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CrystalBallIcon({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="22" r="14" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2.5" />
      {/* Sparkles inside */}
      <circle cx="20" cy="18" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="28" cy="22" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="22" cy="26" r="0.8" fill="currentColor" opacity="0.3" />
      {/* Base */}
      <path d="M16 36H32L30 32H18L16 36Z" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <line x1="15" y1="36" x2="33" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
