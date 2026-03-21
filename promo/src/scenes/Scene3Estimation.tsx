import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { colors, fonts } from "../styles";

const CARDS = ["☕", "1", "2", "3", "4", "5", "8", "13", "?"];

const CardComponent: React.FC<{
  label: string;
  index: number;
  selected?: boolean;
  revealed?: boolean;
  delay: number;
}> = ({ label, index, selected, revealed, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120 } });
  const isHighlighted = selected && frame > delay + 20;

  return (
    <div
      style={{
        width: 80,
        height: 110,
        borderRadius: 4,
        border: `2px solid ${isHighlighted ? colors.primary : colors.border}`,
        background: isHighlighted ? colors.primary : colors.bgCard,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.body,
        fontSize: label === "☕" || label === "?" ? 32 : 36,
        fontWeight: 700,
        color: isHighlighted ? colors.bg : colors.text,
        transform: `scale(${enterSpring}) ${isHighlighted ? "translateY(-8px)" : ""}`,
        opacity: enterSpring,
        boxShadow: `0 4px 0 0 ${isHighlighted ? "#c06200" : colors.border}`,
        transition: "all 0.2s",
      }}
    >
      {revealed !== undefined ? (revealed ? label : "?") : label}
    </div>
  );
};

// Sub-scene: Card Deck spread
const CardDeck: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", maxWidth: 850 }}>
      {CARDS.map((card, i) => (
        <CardComponent key={card} label={card} index={i} delay={i * 3} selected={card === "5"} />
      ))}
    </div>
  );
};

// Sub-scene: Vote reveal
const VoteReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const players = [
    { name: "Shadman", vote: "5" },
    { name: "Emma", vote: "5" },
    { name: "Lars", vote: "3" },
    { name: "Priya", vote: "5" },
    { name: "Alex", vote: "8" },
  ];

  const revealFrame = 30;
  const isRevealed = frame > revealFrame;

  // Confetti burst effect (simple circles)
  const confettiColors = [colors.primary, colors.accent, colors.happy, colors.confused, "#ff6b9d"];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Player votes */}
      <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
        {players.map((player, i) => {
          const flipSpring = spring({
            frame: frame - revealFrame - i * 2,
            fps,
            config: { damping: 12, stiffness: 100 },
          });
          const showVote = isRevealed ? flipSpring > 0.5 : false;

          return (
            <div key={player.name} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 90,
                  height: 120,
                  borderRadius: 4,
                  border: `2px solid ${colors.border}`,
                  background: showVote ? colors.bgCard : colors.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: fonts.body,
                  fontSize: 40,
                  fontWeight: 700,
                  color: showVote ? colors.text : colors.bg,
                  boxShadow: `0 4px 0 0 ${colors.border}`,
                  transform: `scaleX(${Math.abs(flipSpring - 0.5) * 2})`,
                }}
              >
                {showVote ? player.vote : "?"}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: fonts.body,
                  fontSize: 16,
                  color: colors.textMuted,
                  opacity: isRevealed ? 1 : 0,
                }}
              >
                {player.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Consensus text */}
      {isRevealed && (
        <div
          style={{
            position: "absolute",
            bottom: 120,
            fontFamily: fonts.display,
            fontSize: 42,
            color: colors.happy,
            opacity: interpolate(frame, [revealFrame + 20, revealFrame + 30], [0, 1], {
              extrapolateRight: "clamp",
            }),
            transform: `scale(${spring({
              frame: frame - revealFrame - 20,
              fps,
              config: { damping: 10, stiffness: 80 },
            })})`,
          }}
        >
          Consensus: 5 points
        </div>
      )}

      {/* Confetti particles */}
      {isRevealed &&
        Array.from({ length: 20 }).map((_, i) => {
          const confettiSpring = spring({
            frame: frame - revealFrame - 15,
            fps,
            config: { damping: 30, stiffness: 60 },
          });
          const angle = (i / 20) * Math.PI * 2;
          const radius = 200 + (i % 3) * 80;
          const x = Math.cos(angle) * radius * confettiSpring;
          const y = Math.sin(angle) * radius * confettiSpring - 100;
          const rotation = i * 45 + frame * 3;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "40%",
                width: i % 2 === 0 ? 12 : 8,
                height: i % 2 === 0 ? 12 : 16,
                borderRadius: i % 3 === 0 ? "50%" : 2,
                background: confettiColors[i % confettiColors.length],
                transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                opacity: interpolate(
                  confettiSpring,
                  [0, 0.5, 1],
                  [0, 1, 0.3],
                ),
              }}
            />
          );
        })}
    </AbsoluteFill>
  );
};

export const Scene3Estimation: React.FC = () => {
  const frame = useCurrentFrame();

  // Text overlay
  const overlayOpacity = interpolate(frame, [5, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      {/* Phase 1: Card deck (first half) */}
      <Sequence from={0} durationInFrames={90}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
          {/* Phase banner */}
          <div
            style={{
              position: "absolute",
              top: 40,
              fontFamily: fonts.body,
              fontSize: 18,
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Estimation Room
          </div>

          {/* Ticket reference */}
          <div
            style={{
              position: "absolute",
              top: 80,
              fontFamily: fonts.display,
              fontSize: 28,
              color: colors.text,
              opacity: interpolate(frame, [15, 25], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            INS-2608: Rework "Show Less" filter behavior
          </div>

          <div style={{ marginTop: 40 }}>
            <CardDeck />
          </div>

          {/* Text overlay */}
          <div
            style={{
              position: "absolute",
              bottom: 60,
              fontFamily: fonts.body,
              fontSize: 24,
              color: colors.textMuted,
              opacity: overlayOpacity,
              textAlign: "center",
            }}
          >
            Modified Fibonacci with coffee cup ☕ for trivial
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Phase 2: Vote reveal (second half) */}
      <Sequence from={90} durationInFrames={90}>
        <AbsoluteFill style={{ background: colors.bg }}>
          <div
            style={{
              position: "absolute",
              top: 40,
              width: "100%",
              textAlign: "center",
              fontFamily: fonts.body,
              fontSize: 18,
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            The Big Reveal
          </div>
          <VoteReveal />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
