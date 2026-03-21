import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../styles";

export const Scene2HeroReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Wipe transition from left
  const wipeProgress = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Mascots bounce in from sides
  const owlSpring = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 100 } });
  const ghostSpring = spring({ frame: frame - 14, fps, config: { damping: 12, stiffness: 100 } });

  // Title fade
  const titleOpacity = interpolate(frame, [18, 28], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [18, 28], [30, 0], { extrapolateRight: "clamp" });

  // Squiggly underline draw
  const underlineProgress = interpolate(frame, [30, 45], [0, 1], { extrapolateRight: "clamp" });

  // Tagline
  const taglineOpacity = interpolate(frame, [40, 50], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage: "radial-gradient(circle, #f5f0eb 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Wipe overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: colors.primary,
          transform: `translateX(${(wipeProgress - 1) * 100}%)`,
          opacity: interpolate(wipeProgress, [0.8, 1], [1, 0], { extrapolateRight: "clamp" }),
          zIndex: 10,
        }}
      />

      {/* Mascots */}
      <div style={{ display: "flex", gap: 40, marginBottom: 20 }}>
        {/* Owl */}
        <div
          style={{
            fontSize: 80,
            transform: `translateX(${(1 - owlSpring) * -200}px) rotate(-6deg) scale(${owlSpring})`,
            opacity: owlSpring,
          }}
        >
          🦉
        </div>
        {/* Ghost */}
        <div
          style={{
            fontSize: 80,
            transform: `translateX(${(1 - ghostSpring) * 200}px) rotate(6deg) scale(${ghostSpring})`,
            opacity: ghostSpring,
          }}
        >
          👻
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 96,
            fontWeight: 700,
            color: colors.text,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Agile ceremonies,
        </div>
        <div style={{ position: "relative", display: "inline-block" }}>
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 96,
              fontWeight: 700,
              color: colors.primary,
              letterSpacing: "-0.02em",
            }}
          >
            done right.
          </div>
          {/* Squiggly underline */}
          <svg
            style={{
              position: "absolute",
              bottom: -8,
              left: 0,
              width: "100%",
              height: 16,
              overflow: "visible",
            }}
            viewBox="0 0 200 12"
            preserveAspectRatio="none"
          >
            <path
              d="M2 8 Q 15 2, 30 8 Q 45 14, 60 8 Q 75 2, 90 8 Q 105 14, 120 8 Q 135 2, 150 8 Q 165 14, 180 8 Q 195 2, 198 8"
              stroke={colors.primary}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity={0.5}
              strokeDasharray={400}
              strokeDashoffset={400 * (1 - underlineProgress)}
            />
          </svg>
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          marginTop: 30,
          fontFamily: fonts.body,
          fontSize: 32,
          color: colors.textMuted,
          textAlign: "center",
        }}
      >
        Estimation and retros in one place. Open source.
      </div>
    </AbsoluteFill>
  );
};
