import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../styles";

const lines = [
  "> Your retro tool is broken.",
  "> Anonymity? Fake. (typing dots show who's writing)",
  "> Action items? Forgotten by Monday.",
  "> Estimation? A separate app. Again.",
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          maxWidth: 900,
        }}
      >
        {lines.map((line, i) => {
          const delay = i * 12; // stagger by 12 frames (~0.4s at 30fps)
          const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
            extrapolateRight: "clamp",
          });
          const translateY = interpolate(frame, [delay, delay + 8], [20, 0], {
            extrapolateRight: "clamp",
          });

          // Typewriter: reveal characters over time
          const charDelay = delay + 4;
          const charsVisible = Math.floor(
            interpolate(frame, [charDelay, charDelay + 20], [0, line.length], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          );

          // Cursor blink (only on current typing line)
          const isTyping = frame >= charDelay && charsVisible < line.length;
          const cursorOpacity = isTyping ? (Math.floor(frame / 4) % 2 === 0 ? 1 : 0) : 0;

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
                fontFamily: fonts.mono,
                fontSize: 32,
                color: i === lines.length - 1 ? colors.primary : colors.text,
                letterSpacing: "-0.01em",
                lineHeight: 1.5,
              }}
            >
              {line.slice(0, charsVisible)}
              <span style={{ opacity: cursorOpacity, color: colors.primary }}>
                _
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
