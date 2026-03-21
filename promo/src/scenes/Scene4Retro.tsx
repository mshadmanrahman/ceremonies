import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { colors, fonts } from "../styles";

// 4a: Silent Write Phase
const SilentWrite: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const columns = [
    {
      emoji: "😊",
      label: "Happy",
      color: colors.happy,
      cards: ["Great sprint velocity!", "Team collaboration improved", "CI/CD pipeline is fast now"],
    },
    {
      emoji: "😢",
      label: "Sad",
      color: colors.sad,
      cards: ["Too many meetings", "Flaky tests blocking deploys"],
    },
    {
      emoji: "😕",
      label: "Confused",
      color: colors.confused,
      cards: ["Who owns the auth module?", "New deployment process unclear"],
    },
  ];

  return (
    <AbsoluteFill style={{ background: colors.bg, padding: 60 }}>
      {/* Phase label */}
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <div style={{ fontFamily: fonts.body, fontSize: 16, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Phase 1: Silent Write
        </div>
      </div>

      {/* Columns */}
      <div style={{ display: "flex", gap: 24, justifyContent: "center", flex: 1 }}>
        {columns.map((col, ci) => (
          <div key={col.label} style={{ flex: 1, maxWidth: 350, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Column header */}
            <div
              style={{
                textAlign: "center",
                padding: "12px 0",
                fontFamily: fonts.body,
                fontSize: 22,
                fontWeight: 600,
                color: col.color,
                opacity: spring({ frame: frame - ci * 5, fps, config: { damping: 15 } }),
              }}
            >
              {col.label}
            </div>

            {/* Cards */}
            {col.cards.map((card, i) => {
              const cardDelay = 20 + ci * 10 + i * 12;
              const cardSpring = spring({
                frame: frame - cardDelay,
                fps,
                config: { damping: 14, stiffness: 100 },
              });

              return (
                <div
                  key={i}
                  style={{
                    background: colors.bgCard,
                    border: `2px solid ${colors.border}`,
                    borderRadius: 4,
                    padding: "14px 16px",
                    fontFamily: fonts.body,
                    fontSize: 16,
                    color: colors.text,
                    lineHeight: 1.5,
                    boxShadow: `0 3px 0 0 ${colors.border}`,
                    opacity: cardSpring,
                    transform: `translateY(${(1 - cardSpring) * 20}px)`,
                  }}
                >
                  {card}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Text overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonts.body,
          fontSize: 24,
          color: colors.textMuted,
          opacity: interpolate(frame, [60, 70], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        True anonymous writing. No typing dots. No avatars.
      </div>
    </AbsoluteFill>
  );
};

// 4b: Canvas Grouping
const CanvasGrouping: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cards on canvas with positions
  const cards = [
    { text: "Too many meetings", x: 200, y: 180, targetX: 500, targetY: 250 },
    { text: "Flaky tests blocking deploys", x: 800, y: 350, targetX: 550, targetY: 320 },
    { text: "CI takes too long", x: 300, y: 400, targetX: 520, targetY: 390 },
    { text: "Great sprint velocity!", x: 900, y: 150, targetX: 900, targetY: 150 },
    { text: "Team collaboration improved", x: 150, y: 500, targetX: 150, targetY: 500 },
  ];

  // Cards drift toward groups
  const groupProgress = interpolate(frame, [20, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cluster boundary appears
  const boundaryOpacity = interpolate(frame, [50, 65], [0, 0.6], { extrapolateRight: "clamp" });

  // Cursor positions (two users)
  const cursor1X = interpolate(frame, [10, 50], [200, 500], { extrapolateRight: "clamp" });
  const cursor1Y = interpolate(frame, [10, 50], [180, 280], { extrapolateRight: "clamp" });
  const cursor2X = interpolate(frame, [15, 55], [800, 560], { extrapolateRight: "clamp" });
  const cursor2Y = interpolate(frame, [15, 55], [350, 320], { extrapolateRight: "clamp" });

  // Group label
  const labelOpacity = interpolate(frame, [65, 75], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: colors.bg, position: "relative" }}>
      {/* Phase label */}
      <div style={{ position: "absolute", top: 30, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: fonts.body, fontSize: 16, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Phase 2: Group & Label
        </div>
      </div>

      {/* Cluster boundary */}
      <div
        style={{
          position: "absolute",
          left: 430,
          top: 200,
          width: 220,
          height: 240,
          border: `2px dashed ${colors.primary}`,
          borderRadius: 12,
          opacity: boundaryOpacity,
        }}
      />
      {/* Group label */}
      <div
        style={{
          position: "absolute",
          left: 490,
          top: 195,
          transform: "translateY(-100%)",
          fontFamily: fonts.body,
          fontSize: 16,
          fontWeight: 600,
          color: colors.primary,
          background: colors.bg,
          padding: "2px 10px",
          opacity: labelOpacity,
        }}
      >
        Process Pain
      </div>

      {/* Cards */}
      {cards.map((card, i) => {
        const currentX = interpolate(groupProgress, [0, 1], [card.x, card.targetX]);
        const currentY = interpolate(groupProgress, [0, 1], [card.y, card.targetY]);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: currentX,
              top: currentY,
              transform: "translate(-50%, -50%)",
              background: colors.bgCard,
              border: `2px solid ${colors.border}`,
              borderRadius: 4,
              padding: "10px 14px",
              fontFamily: fonts.body,
              fontSize: 14,
              color: colors.text,
              boxShadow: `0 3px 0 0 ${colors.border}`,
              maxWidth: 200,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {card.text}
          </div>
        );
      })}

      {/* Cursors */}
      <div
        style={{
          position: "absolute",
          left: cursor1X,
          top: cursor1Y,
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderBottom: `14px solid ${colors.accent}`,
          transform: "rotate(-30deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: cursor1X + 16,
          top: cursor1Y + 14,
          fontFamily: fonts.body,
          fontSize: 11,
          color: "#fff",
          background: colors.accent,
          padding: "2px 6px",
          borderRadius: 3,
        }}
      >
        Emma
      </div>

      <div
        style={{
          position: "absolute",
          left: cursor2X,
          top: cursor2Y,
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderBottom: `14px solid ${colors.happy}`,
          transform: "rotate(-30deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: cursor2X + 16,
          top: cursor2Y + 14,
          fontFamily: fonts.body,
          fontSize: 11,
          color: "#000",
          background: colors.happy,
          padding: "2px 6px",
          borderRadius: 3,
        }}
      >
        Lars
      </div>

      {/* Text overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonts.body,
          fontSize: 24,
          color: colors.textMuted,
          opacity: interpolate(frame, [70, 80], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        Drag. Group. Everyone sees. Everyone moves.
      </div>
    </AbsoluteFill>
  );
};

// 4c: Anonymous Voting + Reveal
const VotingReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const groups = [
    { label: "Process Pain", votes: 7 },
    { label: "Testing Woes", votes: 4 },
    { label: "Communication", votes: 3 },
  ];

  const revealFrame = 50;
  const isRevealed = frame > revealFrame;

  // Progress bar
  const progressWidth = interpolate(frame, [10, 45], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: colors.bg, justifyContent: "center", alignItems: "center" }}>
      {/* Phase label */}
      <div style={{ position: "absolute", top: 30, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: fonts.body, fontSize: 16, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Phase 3: Vote
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: "50%",
          transform: "translateX(-50%)",
          width: 300,
          height: 6,
          background: colors.bgCard,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progressWidth}%`,
            height: "100%",
            background: colors.primary,
            borderRadius: 3,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 82,
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.textMuted,
        }}
      >
        {isRevealed ? "All votes in!" : `${Math.floor(progressWidth)}% voted`}
      </div>

      {/* Vote groups */}
      <div style={{ display: "flex", gap: 40, marginTop: 40 }}>
        {groups.map((group, i) => {
          const boxSpring = spring({
            frame: frame - revealFrame - i * 4,
            fps,
            config: { damping: 10, stiffness: 80 },
          });

          return (
            <div key={group.label} style={{ textAlign: "center" }}>
              {/* Mystery box / Revealed count */}
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 4,
                  border: `2px solid ${isRevealed ? colors.primary : colors.border}`,
                  background: isRevealed ? colors.bgCard : colors.bgSurface,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: fonts.display,
                  fontSize: isRevealed ? 48 : 56,
                  fontWeight: 700,
                  color: isRevealed ? colors.primary : colors.textMuted,
                  boxShadow: `0 4px 0 0 ${colors.border}`,
                  transform: isRevealed ? `scale(${boxSpring})` : undefined,
                }}
              >
                {isRevealed ? group.votes : "?"}
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontFamily: fonts.body,
                  fontSize: 16,
                  color: colors.text,
                  fontWeight: 600,
                }}
              >
                {group.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Text overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          fontFamily: fonts.body,
          fontSize: 24,
          color: colors.textMuted,
          opacity: interpolate(frame, [revealFrame + 10, revealFrame + 20], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        Vote in secret. Reveal together.
      </div>
    </AbsoluteFill>
  );
};

// 4d: Discuss & Act
const DiscussAct: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const topics = [
    {
      label: "Process Pain",
      votes: 7,
      actions: [
        { text: "Reduce standups to 3x/week", assignee: "Shadman" },
        { text: "Async retro pre-write Tuesdays", assignee: "Emma" },
      ],
    },
    {
      label: "Testing Woes",
      votes: 4,
      actions: [{ text: "Fix top 5 flaky tests this sprint", assignee: "Lars" }],
    },
  ];

  return (
    <AbsoluteFill style={{ background: colors.bg, padding: 60 }}>
      <div style={{ position: "absolute", top: 30, width: "100%", textAlign: "center", left: 0 }}>
        <div style={{ fontFamily: fonts.body, fontSize: 16, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Discuss & Act
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 50, maxWidth: 700, margin: "50px auto 0" }}>
        {topics.map((topic, ti) => {
          const topicDelay = ti * 15;
          const topicOpacity = interpolate(frame, [topicDelay, topicDelay + 10], [0, 1], { extrapolateRight: "clamp" });

          return (
            <div
              key={topic.label}
              style={{
                opacity: topicOpacity,
                border: `2px solid ${colors.border}`,
                borderRadius: 4,
                background: colors.bgCard,
                padding: 24,
                boxShadow: `0 4px 0 0 ${colors.border}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: fonts.display, fontSize: 24, color: colors.text, fontWeight: 600 }}>
                  {topic.label}
                </div>
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 14,
                    color: colors.primary,
                    background: `${colors.primary}20`,
                    padding: "4px 12px",
                    borderRadius: 12,
                  }}
                >
                  {topic.votes} votes
                </div>
              </div>

              {/* Action items */}
              {topic.actions.map((action, ai) => {
                const actionDelay = topicDelay + 15 + ai * 10;
                const actionSpring = spring({
                  frame: frame - actionDelay,
                  fps,
                  config: { damping: 14, stiffness: 100 },
                });

                return (
                  <div
                    key={ai}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 0",
                      borderTop: ai > 0 ? `1px solid ${colors.border}` : undefined,
                      opacity: actionSpring,
                      transform: `translateX(${(1 - actionSpring) * 20}px)`,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        border: `2px solid ${colors.primary}`,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ fontFamily: fonts.body, fontSize: 16, color: colors.text, flex: 1 }}>
                      {action.text}
                    </div>
                    <div
                      style={{
                        fontFamily: fonts.body,
                        fontSize: 13,
                        color: colors.accent,
                        background: `${colors.accent}15`,
                        padding: "3px 10px",
                        borderRadius: 10,
                      }}
                    >
                      @{action.assignee}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 50,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonts.body,
          fontSize: 24,
          color: colors.textMuted,
          opacity: interpolate(frame, [50, 60], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        Action items. Assigned. Tracked.
      </div>
    </AbsoluteFill>
  );
};

export const Scene4Retro: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={90}>
        <SilentWrite />
      </Sequence>
      <Sequence from={90} durationInFrames={90}>
        <CanvasGrouping />
      </Sequence>
      <Sequence from={180} durationInFrames={90}>
        <VotingReveal />
      </Sequence>
      <Sequence from={270} durationInFrames={90}>
        <DiscussAct />
      </Sequence>
    </AbsoluteFill>
  );
};
