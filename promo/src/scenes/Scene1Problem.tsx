import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../styles";

const lines = [
  { text: "You just finished a retro.", highlight: false },
  { text: "...nobody remembers what you agreed on.", highlight: false },
  { text: "Your estimation tool is a separate app.", highlight: false },
  { text: "There has to be a better way.", highlight: true },
];

export const Scene1Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      {/* Dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage: "radial-gradient(circle, #1a120b 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 32,
          maxWidth: 900,
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {lines.map((line, i) => {
          const delay = i * 18;
          const lineSpring = spring({
            frame: frame - delay,
            fps,
            config: { damping: 20, stiffness: 60 },
          });

          return (
            <div
              key={i}
              style={{
                opacity: lineSpring,
                transform: `translateY(${(1 - lineSpring) * 25}px)`,
                fontFamily: line.highlight ? fonts.display : fonts.body,
                fontSize: line.highlight ? 52 : 38,
                fontWeight: line.highlight ? 700 : 400,
                color: line.highlight ? colors.primary : colors.text,
                letterSpacing: "-0.01em",
                lineHeight: 1.4,
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
