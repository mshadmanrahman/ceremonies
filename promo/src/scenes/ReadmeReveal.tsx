/**
 * ReadmeReveal — A compact card-reveal GIF for the GitHub README.
 *
 * 150 frames @ 30 fps = 5 seconds, 800×450px.
 * Phase 1 (0-50):   Card deck appears, "5" gets selected
 * Phase 2 (50-100):  Vote cards flip to reveal values
 * Phase 3 (100-150): "Consensus!" celebration + confetti
 */
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Sequence,
} from "remotion";
import { colors, fonts } from "../styles";

const CARD_VALUES = ["☕", "1", "2", "3", "5", "8", "13", "?"];

const PhaseBadge: React.FC<{ label: string; accent?: boolean }> = ({
  label,
  accent,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 14px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      fontFamily: fonts.body,
      textTransform: "uppercase" as const,
      letterSpacing: "0.12em",
      background: accent ? `${colors.primary}22` : colors.bgSurface,
      color: accent ? colors.primary : colors.textMuted,
    }}
  >
    {label}
  </div>
);

/* ── Phase 1: Card Deck ── */
const CardDeckPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: colors.bg,
        padding: 20,
      }}
    >
      <div style={{ position: "absolute", top: 16 }}>
        <PhaseBadge label="Vote Now" accent />
      </div>

      <div
        style={{
          position: "absolute",
          top: 44,
          fontFamily: fonts.display,
          fontSize: 16,
          color: colors.text,
          opacity: interpolate(frame, [8, 16], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        INS-2608: Rework "Show Less" filter behavior
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          flexWrap: "wrap" as const,
          maxWidth: 600,
          marginTop: 20,
        }}
      >
        {CARD_VALUES.map((card, i) => {
          const s = spring({
            frame: frame - i * 2,
            fps,
            config: { damping: 18, stiffness: 80 },
          });
          const isSelected = card === "5" && frame > 25;

          return (
            <div
              key={card}
              style={{
                width: 52,
                height: 72,
                borderRadius: 4,
                border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                background: isSelected ? colors.primary : colors.bgCard,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.body,
                fontSize: card === "☕" || card === "?" ? 20 : 24,
                fontWeight: 700,
                color: isSelected ? colors.bg : colors.text,
                transform: `scale(${s}) ${isSelected ? "translateY(-6px)" : ""}`,
                opacity: s,
                boxShadow: `0 3px 0 0 ${isSelected ? "#c06200" : colors.border}`,
              }}
            >
              {card}
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 16,
          fontFamily: fonts.body,
          fontSize: 13,
          color: colors.textMuted,
          opacity: interpolate(frame, [30, 38], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        Modified Fibonacci with ☕ for trivial
      </div>
    </AbsoluteFill>
  );
};

/* ── Phase 2: Vote Reveal ── */
const VoteRevealPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const players = [
    { name: "Shadman", vote: "5" },
    { name: "Emma", vote: "5" },
    { name: "Lars", vote: "3" },
    { name: "Priya", vote: "5" },
    { name: "Alex", vote: "8" },
  ];

  const revealStart = 12;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: colors.bg,
      }}
    >
      <div style={{ position: "absolute", top: 16 }}>
        <PhaseBadge label="Revealed" />
      </div>

      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
        {players.map((player, i) => {
          const flipSpring = spring({
            frame: frame - revealStart - i * 3,
            fps,
            config: { damping: 12, stiffness: 100 },
          });
          const showVote = flipSpring > 0.5;

          return (
            <div key={player.name} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 58,
                  height: 80,
                  borderRadius: 4,
                  border: `2px solid ${colors.border}`,
                  background: showVote ? colors.bgCard : colors.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: fonts.body,
                  fontSize: 28,
                  fontWeight: 700,
                  color: showVote ? colors.text : colors.bg,
                  boxShadow: `0 3px 0 0 ${colors.border}`,
                  transform: `scaleX(${Math.abs(flipSpring - 0.5) * 2})`,
                }}
              >
                {showVote ? player.vote : "✓"}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontFamily: fonts.body,
                  fontSize: 11,
                  color: player.name === "Shadman" ? colors.primary : colors.textMuted,
                  fontWeight: player.name === "Shadman" ? 700 : 400,
                  opacity: showVote ? 1 : 0,
                }}
              >
                {player.name}
                {player.name === "Shadman" && (
                  <span style={{ display: "block", fontSize: 9, color: `${colors.primary}99` }}>
                    you
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ── Phase 3: Consensus Celebration ── */
const ConsensusPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const confettiColors = [
    colors.primary,
    colors.accent,
    colors.happy,
    colors.confused,
    "#ff6b9d",
  ];

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: colors.bg,
      }}
    >
      <div style={{ position: "absolute", top: 16 }}>
        <PhaseBadge label="Agreed" accent />
      </div>

      <div
        style={{
          fontFamily: fonts.display,
          fontSize: 40,
          fontWeight: 700,
          color: colors.happy,
          transform: `scale(${titleSpring})`,
          textAlign: "center",
        }}
      >
        Consensus!
      </div>

      <div
        style={{
          marginTop: 12,
          fontFamily: fonts.body,
          fontSize: 52,
          fontWeight: 700,
          color: colors.primary,
          opacity: interpolate(frame, [8, 14], [0, 1], {
            extrapolateRight: "clamp",
          }),
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: `2px solid ${colors.primary}`,
          borderRadius: 8,
          padding: "8px 36px",
          background: `${colors.primary}15`,
        }}
      >
        5
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.textMuted,
          opacity: interpolate(frame, [12, 18], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        story points
      </div>

      {/* Confetti burst */}
      {Array.from({ length: 14 }).map((_, i) => {
        const cSpring = spring({
          frame: frame - 4,
          fps,
          config: { damping: 30, stiffness: 60 },
        });
        const angle = (i / 14) * Math.PI * 2;
        const radius = 120 + (i % 3) * 40;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "45%",
              width: i % 2 === 0 ? 8 : 6,
              height: i % 2 === 0 ? 8 : 12,
              borderRadius: i % 3 === 0 ? "50%" : 2,
              background: confettiColors[i % confettiColors.length],
              transform: `translate(${Math.cos(angle) * radius * cSpring}px, ${Math.sin(angle) * radius * cSpring}px) rotate(${i * 45 + frame * 3}deg)`,
              opacity: interpolate(cSpring, [0, 0.5, 1], [0, 1, 0.2]),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ── Main composition ── */
export const ReadmeReveal: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      {/* Phase 1: Card deck (0-50) */}
      <Sequence from={0} durationInFrames={50}>
        <CardDeckPhase />
      </Sequence>

      {/* Phase 2: Vote reveal (50-100) */}
      <Sequence from={50} durationInFrames={50}>
        <VoteRevealPhase />
      </Sequence>

      {/* Phase 3: Consensus (100-150) */}
      <Sequence from={100} durationInFrames={50}>
        <ConsensusPhase />
      </Sequence>
    </AbsoluteFill>
  );
};
