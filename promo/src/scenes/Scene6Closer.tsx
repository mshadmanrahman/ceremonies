import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../styles";

const closingLines = [
  "Open source. Self-hostable.",
  "Google + GitHub sign-in.",
  "ceremonies.dev",
];

export const Scene6Closer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Mascots enter
  const owlSpring = spring({ frame: frame - 5, fps, config: { damping: 12, stiffness: 80 } });
  const ghostSpring = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 80 } });

  // Closing lines typewriter
  const line1Start = 20;
  const line2Start = 45;
  const line3Start = 70;

  return (
    <AbsoluteFill
      style={{
        background: colors.bg,
        justifyContent: "center",
        alignItems: "center",
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

      {/* Mascots */}
      <div style={{ display: "flex", gap: 30, marginBottom: 40 }}>
        <div
          style={{
            fontSize: 64,
            transform: `rotate(-6deg) scale(${owlSpring})`,
            opacity: owlSpring,
          }}
        >
          🦉
        </div>
        <div
          style={{
            fontSize: 64,
            transform: `rotate(6deg) scale(${ghostSpring})`,
            opacity: ghostSpring,
          }}
        >
          👻
        </div>
      </div>

      {/* Closing lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        {closingLines.map((line, i) => {
          const lineStart = [line1Start, line2Start, line3Start][i];
          const opacity = interpolate(frame, [lineStart, lineStart + 8], [0, 1], {
            extrapolateRight: "clamp",
          });
          const translateY = interpolate(frame, [lineStart, lineStart + 8], [15, 0], {
            extrapolateRight: "clamp",
          });

          const isUrl = i === closingLines.length - 1;

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
                fontFamily: isUrl ? fonts.display : fonts.body,
                fontSize: isUrl ? 56 : 28,
                fontWeight: isUrl ? 700 : 400,
                color: isUrl ? colors.primary : colors.textMuted,
                letterSpacing: isUrl ? "-0.02em" : undefined,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>

      {/* CTA card */}
      <div
        style={{
          marginTop: 40,
          padding: "16px 40px",
          border: `2px solid ${colors.primary}`,
          borderRadius: 4,
          background: colors.primary,
          boxShadow: `0 4px 0 0 #a67020`,
          opacity: interpolate(frame, [85, 95], [0, 1], { extrapolateRight: "clamp" }),
          transform: `scale(${spring({
            frame: frame - 85,
            fps,
            config: { damping: 12, stiffness: 100 },
          })})`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 22,
            fontWeight: 700,
            color: colors.bg,
          }}
        >
          Start for free
        </div>
      </div>

      {/* Fade out at the very end */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: colors.bg,
          opacity: interpolate(frame, [110, 120], [0, 1], { extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};
