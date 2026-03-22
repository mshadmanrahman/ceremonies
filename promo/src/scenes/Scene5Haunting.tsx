import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../styles";
import { GhostIcon } from "../../../src/components/shared/icons";

const actionItems = [
  { text: "Reduce standups to 3x/week", assignee: "Shadman", done: true },
  { text: "Async retro pre-write Tuesdays", assignee: "Emma", done: true },
  { text: "Fix top 5 flaky tests this sprint", assignee: "Lars", done: false },
];

export const Scene5Haunting: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ghost float animation
  const ghostY = Math.sin(frame * 0.08) * 12;
  const ghostOpacity = spring({ frame, fps, config: { damping: 20, stiffness: 60 } });

  return (
    <AbsoluteFill style={{ background: colors.bg, justifyContent: "center", alignItems: "center" }}>
      {/* Ghost mascot */}
      <div
        style={{
          fontSize: 72,
          transform: `translateY(${ghostY}px)`,
          opacity: ghostOpacity,
          marginBottom: 24,
        }}
      >
        <div style={{ color: colors.coffee }}><GhostIcon size={72} /></div>
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: 48,
          fontWeight: 700,
          color: colors.text,
          marginBottom: 8,
          opacity: interpolate(frame, [10, 20], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        The Haunting
      </div>
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: 20,
          color: colors.textMuted,
          marginBottom: 40,
          opacity: interpolate(frame, [15, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        Last retro's promises open the next one.
      </div>

      {/* Action items from previous retro */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 600, width: "100%" }}>
        {actionItems.map((item, i) => {
          const itemDelay = 25 + i * 12;
          const itemSpring = spring({
            frame: frame - itemDelay,
            fps,
            config: { damping: 14, stiffness: 100 },
          });

          // "Done" button animation
          const buttonDelay = itemDelay + 25;
          const buttonSpring = spring({
            frame: frame - buttonDelay,
            fps,
            config: { damping: 12, stiffness: 100 },
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: colors.bgCard,
                border: `2px solid ${colors.border}`,
                borderRadius: 4,
                padding: "16px 20px",
                boxShadow: `0 3px 0 0 ${colors.border}`,
                opacity: itemSpring,
                transform: `translateX(${(1 - itemSpring) * -30}px)`,
              }}
            >
              {/* Checkbox */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  border: `2px solid ${item.done ? colors.happy : colors.sad}`,
                  background: item.done && buttonSpring > 0.5 ? colors.happy : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transform: `scale(${buttonSpring > 0.5 ? 1 : 0.8})`,
                }}
              >
                {item.done && buttonSpring > 0.5 && (
                  <span style={{ color: colors.bg, fontSize: 18, fontWeight: 700 }}>✓</span>
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 18,
                    color: item.done && buttonSpring > 0.5 ? colors.textMuted : colors.text,
                    textDecoration: item.done && buttonSpring > 0.5 ? "line-through" : "none",
                  }}
                >
                  {item.text}
                </div>
                <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textDim, marginTop: 2 }}>
                  @{item.assignee}
                </div>
              </div>

              {/* Status badge */}
              {buttonSpring > 0.5 && (
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "4px 12px",
                    borderRadius: 10,
                    background: item.done ? `${colors.happy}20` : `${colors.sad}20`,
                    color: item.done ? colors.happy : colors.sad,
                    opacity: buttonSpring,
                  }}
                >
                  {item.done ? "Done" : "Still haunting 👻"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
