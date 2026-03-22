import { Composition, Sequence, Audio, interpolate, useCurrentFrame, useVideoConfig, spring, AbsoluteFill } from "remotion";
import { Scene1Problem } from "./scenes/Scene1Problem";
import { Scene2HeroReveal } from "./scenes/Scene2HeroReveal";
import { Scene3Estimation } from "./scenes/Scene3Estimation";
import { Scene4Retro } from "./scenes/Scene4Retro";
import { Scene5Haunting } from "./scenes/Scene5Haunting";
import { Scene6Closer } from "./scenes/Scene6Closer";
import { colors, fonts, fontImports } from "./styles";

// Font loader: injects Google Fonts into the Remotion render
const FontLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    {fontImports.map((url) => (
      <link key={url} rel="stylesheet" href={url} />
    ))}
    {children}
  </>
);
import musicFile from "./music.mp3";

// Crossfade wrapper: fades in at start and out at end of each scene
const Crossfade: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
  fadeIn?: number;
  fadeOut?: number;
}> = ({ children, durationInFrames, fadeIn = 10, fadeOut = 10 }) => {
  const frame = useCurrentFrame();

  let opacity = 1;
  if (fadeIn > 0) {
    opacity = Math.min(opacity, interpolate(frame, [0, fadeIn], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }));
  }
  if (fadeOut > 0) {
    opacity = Math.min(opacity, interpolate(frame, [durationInFrames - fadeOut, durationInFrames], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }));
  }

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// --- LANDSCAPE (16:9, 1920x1080) ---
// Tighter timing: ~48s total to keep energy up
const FADE = 12; // crossfade overlap frames

const scenes = [
  { duration: 200 },  // Scene 1: Problem (6.7s)
  { duration: 160 },  // Scene 2: Hero Reveal (5.3s)
  { duration: 240 },  // Scene 3: Estimation (8s)
  { duration: 320 },  // Scene 4: Retro - 4 sub-scenes (10.7s)
  { duration: 200 },  // Scene 5: Haunting (6.7s)
  { duration: 280 },  // Scene 6: Closer (9.3s)
] as const;

// Calculate start frames with overlap
function getStarts() {
  const starts: number[] = [0];
  for (let i = 1; i < scenes.length; i++) {
    starts.push(starts[i - 1] + scenes[i - 1].duration - FADE);
  }
  return starts;
}

const starts = getStarts();
const TOTAL_FRAMES = starts[starts.length - 1] + scenes[scenes.length - 1].duration;

const PromoLandscape: React.FC = () => {
  const frame = useCurrentFrame();

  const musicVolume = interpolate(
    frame,
    [0, 30, TOTAL_FRAMES - 60, TOTAL_FRAMES],
    [0, 0.7, 0.7, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <FontLoader>
      <AbsoluteFill style={{ background: colors.bg }}>
        <Audio src={musicFile} volume={musicVolume} />

        <Sequence from={starts[0]} durationInFrames={scenes[0].duration}>
          <Crossfade durationInFrames={scenes[0].duration} fadeIn={0} fadeOut={FADE}>
            <Scene1Problem />
          </Crossfade>
        </Sequence>

        <Sequence from={starts[1]} durationInFrames={scenes[1].duration}>
          <Crossfade durationInFrames={scenes[1].duration} fadeIn={FADE} fadeOut={FADE}>
            <Scene2HeroReveal />
          </Crossfade>
        </Sequence>

        <Sequence from={starts[2]} durationInFrames={scenes[2].duration}>
          <Crossfade durationInFrames={scenes[2].duration} fadeIn={FADE} fadeOut={FADE}>
            <Scene3Estimation />
          </Crossfade>
        </Sequence>

        <Sequence from={starts[3]} durationInFrames={scenes[3].duration}>
          <Crossfade durationInFrames={scenes[3].duration} fadeIn={FADE} fadeOut={FADE}>
            <Scene4Retro />
          </Crossfade>
        </Sequence>

        <Sequence from={starts[4]} durationInFrames={scenes[4].duration}>
          <Crossfade durationInFrames={scenes[4].duration} fadeIn={FADE} fadeOut={FADE}>
            <Scene5Haunting />
          </Crossfade>
        </Sequence>

        <Sequence from={starts[5]} durationInFrames={scenes[5].duration}>
          <Crossfade durationInFrames={scenes[5].duration} fadeIn={FADE} fadeOut={0}>
            <Scene6Closer />
          </Crossfade>
        </Sequence>
      </AbsoluteFill>
    </FontLoader>
  );
};

// --- VERTICAL REELS (9:16, 1080x1920) ---
// Native vertical layout: NOT a scaled landscape. Redesigned for portrait.
import { OwlIcon, GhostIcon, HappyIcon, SadIcon, ConfusedIcon } from "../../src/components/shared/icons";

// Shorter, punchier reels: 5 scenes, ~35s
const reelsScenes = [
  { duration: 150 },  // Problem (5s)
  { duration: 150 },  // Hero (5s)
  { duration: 200 },  // Estimation (6.7s)
  { duration: 200 },  // Retro highlights (6.7s)
  { duration: 200 },  // Closer + CTA (6.7s)
] as const;

const REELS_FADE = 10;

function getReelsStarts() {
  const s: number[] = [0];
  for (let i = 1; i < reelsScenes.length; i++) {
    s.push(s[i - 1] + reelsScenes[i - 1].duration - REELS_FADE);
  }
  return s;
}

const reelsStarts = getReelsStarts();
const REELS_TOTAL = reelsStarts[reelsStarts.length - 1] + reelsScenes[reelsScenes.length - 1].duration;

// Vertical scene: Problem
const ReelsProblem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = [
    "You just finished a retro.",
    "...nobody remembers\nwhat you agreed on.",
    "There has to be\na better way.",
  ];

  return (
    <AbsoluteFill style={{ background: colors.bg, justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 48, alignItems: "center", textAlign: "center" }}>
        {lines.map((line, i) => {
          const s = spring({ frame: frame - i * 20, fps, config: { damping: 20, stiffness: 60 } });
          const isLast = i === lines.length - 1;
          return (
            <div key={i} style={{
              opacity: s,
              transform: `translateY(${(1 - s) * 30}px)`,
              fontFamily: isLast ? fonts.display : fonts.body,
              fontSize: isLast ? 56 : 42,
              fontWeight: isLast ? 700 : 400,
              color: isLast ? colors.primary : colors.text,
              lineHeight: 1.3,
              whiteSpace: "pre-line",
            }}>
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Vertical scene: Hero
const ReelsHero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const owlSpring = spring({ frame: frame - 5, fps, config: { damping: 12, stiffness: 100 } });
  const ghostSpring = spring({ frame: frame - 12, fps, config: { damping: 12, stiffness: 100 } });
  const titleOpacity = interpolate(frame, [20, 30], [0, 1], { extrapolateRight: "clamp" });
  const tagOpacity = interpolate(frame, [35, 45], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: colors.bg, justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div style={{ display: "flex", gap: 40, marginBottom: 40 }}>
        <div style={{ color: colors.primary, transform: `rotate(-8deg) scale(${owlSpring})`, opacity: owlSpring }}>
          <OwlIcon size={100} />
        </div>
        <div style={{ color: colors.coffee, transform: `rotate(8deg) scale(${ghostSpring})`, opacity: ghostSpring }}>
          <GhostIcon size={100} />
        </div>
      </div>
      <div style={{ opacity: titleOpacity, textAlign: "center" }}>
        <div style={{ fontFamily: fonts.display, fontSize: 72, fontWeight: 700, color: colors.text, lineHeight: 1.1 }}>
          Agile ceremonies,
        </div>
        <div style={{ fontFamily: fonts.display, fontSize: 72, fontWeight: 700, color: colors.primary, lineHeight: 1.1 }}>
          done right.
        </div>
      </div>
      <div style={{ opacity: tagOpacity, marginTop: 28, fontFamily: fonts.body, fontSize: 30, color: colors.textMuted, textAlign: "center", maxWidth: 800 }}>
        Estimation and retros in one place.
      </div>
    </AbsoluteFill>
  );
};

// Vertical scene: Estimation (card deck → vote reveal → consensus celebration)
const ReelsEstimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Card deck (0-70)
  const cards = ["☕", "1", "2", "3", "5", "8", "13"];
  // Phase 2: Vote reveal (70-130)
  const revealStart = 70;
  const isRevealPhase = frame > revealStart;
  const players = [
    { name: "You", vote: "5" },
    { name: "Emma", vote: "5" },
    { name: "Lars", vote: "3" },
    { name: "Priya", vote: "5" },
  ];
  // Phase 3: Consensus (130+)
  const consensusStart = 130;
  const isConsensus = frame > consensusStart;

  const confettiColors = [colors.primary, colors.accent, colors.happy, colors.confused, "#ff6b9d"];

  return (
    <AbsoluteFill style={{ background: colors.bg, justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div style={{ fontFamily: fonts.body, fontSize: 22, color: colors.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 24 }}>
        Estimation Room
      </div>

      {/* Phase 1: Card deck */}
      {!isRevealPhase && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const, justifyContent: "center", maxWidth: 700 }}>
          {cards.map((c, i) => {
            const s = spring({ frame: frame - i * 3, fps, config: { damping: 18, stiffness: 80 } });
            const sel = c === "5";
            return (
              <div key={c} style={{
                width: 90, height: 120, borderRadius: 6,
                border: `3px solid ${sel && frame > 30 ? colors.primary : colors.border}`,
                background: sel && frame > 30 ? colors.primary : colors.bgCard,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: fonts.body, fontSize: c === "☕" ? 36 : 42, fontWeight: 700,
                color: sel && frame > 30 ? colors.bg : colors.text,
                transform: `scale(${s})`, opacity: s,
                boxShadow: `0 4px 0 0 ${colors.border}`,
              }}>
                {c}
              </div>
            );
          })}
        </div>
      )}

      {/* Phase 2: Vote reveal cards */}
      {isRevealPhase && !isConsensus && (
        <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
          {players.map((p, i) => {
            const flipSpring = spring({ frame: frame - revealStart - i * 4, fps, config: { damping: 12, stiffness: 100 } });
            const showVote = flipSpring > 0.5;
            return (
              <div key={p.name} style={{ textAlign: "center" }}>
                <div style={{
                  width: 100, height: 140, borderRadius: 6,
                  border: `3px solid ${colors.border}`,
                  background: showVote ? colors.bgCard : colors.primary,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: fonts.body, fontSize: 48, fontWeight: 700,
                  color: showVote ? colors.text : colors.bg,
                  boxShadow: `0 4px 0 0 ${colors.border}`,
                  transform: `scaleX(${Math.abs(flipSpring - 0.5) * 2})`,
                }}>
                  {showVote ? p.vote : "?"}
                </div>
                <div style={{ marginTop: 10, fontFamily: fonts.body, fontSize: 18, color: colors.textMuted, opacity: showVote ? 1 : 0 }}>
                  {p.name}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Phase 3: Consensus celebration */}
      {isConsensus && (
        <>
          <div style={{
            fontFamily: fonts.display, fontSize: 64, fontWeight: 700, color: colors.happy,
            transform: `scale(${spring({ frame: frame - consensusStart, fps, config: { damping: 10, stiffness: 80 } })})`,
            textAlign: "center",
          }}>
            Consensus!
          </div>
          <div style={{
            marginTop: 16,
            fontFamily: fonts.body, fontSize: 80, fontWeight: 700, color: colors.primary,
            opacity: interpolate(frame, [consensusStart + 10, consensusStart + 18], [0, 1], { extrapolateRight: "clamp" }),
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            border: `3px solid ${colors.primary}`, borderRadius: 12,
            padding: "12px 48px", background: `${colors.primary}15`,
          }}>
            5
          </div>
          <div style={{
            marginTop: 12, fontFamily: fonts.body, fontSize: 22, color: colors.textMuted,
            opacity: interpolate(frame, [consensusStart + 15, consensusStart + 22], [0, 1], { extrapolateRight: "clamp" }),
          }}>
            story points
          </div>

          {/* Confetti */}
          {Array.from({ length: 16 }).map((_, i) => {
            const cSpring = spring({ frame: frame - consensusStart - 5, fps, config: { damping: 30, stiffness: 60 } });
            const angle = (i / 16) * Math.PI * 2;
            const radius = 180 + (i % 3) * 60;
            return (
              <div key={i} style={{
                position: "absolute", left: "50%", top: "45%",
                width: i % 2 === 0 ? 12 : 8, height: i % 2 === 0 ? 12 : 16,
                borderRadius: i % 3 === 0 ? "50%" : 2,
                background: confettiColors[i % confettiColors.length],
                transform: `translate(${Math.cos(angle) * radius * cSpring}px, ${Math.sin(angle) * radius * cSpring}px) rotate(${i * 45 + frame * 3}deg)`,
                opacity: interpolate(cSpring, [0, 0.5, 1], [0, 1, 0.2]),
              }} />
            );
          })}
        </>
      )}
    </AbsoluteFill>
  );
};

// Vertical scene: Retro highlights
const ReelsRetro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phases = [
    { label: "Silent Write", desc: "True anonymous cards", icon: "write", start: 0 },
    { label: "Group & Vote", desc: "Drag, cluster, reveal", icon: "vote", start: 50 },
    { label: "The Haunting", desc: "Action items follow you", icon: "ghost", start: 100 },
  ];

  return (
    <AbsoluteFill style={{ background: colors.bg, justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div style={{ fontFamily: fonts.body, fontSize: 22, color: colors.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 40 }}>
        Retro Room
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%", maxWidth: 700 }}>
        {phases.map((phase, i) => {
          const s = spring({ frame: frame - phase.start, fps, config: { damping: 16, stiffness: 80 } });
          return (
            <div key={i} style={{
              opacity: s, transform: `translateX(${(1 - s) * 40}px)`,
              display: "flex", alignItems: "center", gap: 24,
              background: colors.bgCard, border: `3px solid ${colors.border}`,
              borderRadius: 8, padding: "24px 28px",
              boxShadow: `0 4px 0 0 ${colors.border}`,
            }}>
              <div style={{ color: i === 2 ? colors.coffee : colors.primary, flexShrink: 0 }}>
                {i === 0 && <HappyIcon size={48} />}
                {i === 1 && <SadIcon size={48} />}
                {i === 2 && <GhostIcon size={48} />}
              </div>
              <div>
                <div style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 700, color: colors.text }}>
                  {phase.label}
                </div>
                <div style={{ fontFamily: fonts.body, fontSize: 22, color: colors.textMuted, marginTop: 4 }}>
                  {phase.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Vertical scene: Closer
const ReelsCloser: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const owlSpring = spring({ frame: frame - 5, fps, config: { damping: 12, stiffness: 80 } });

  return (
    <AbsoluteFill style={{ background: colors.bg, justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div style={{ color: colors.primary, transform: `scale(${owlSpring})`, opacity: owlSpring, marginBottom: 40 }}>
        <OwlIcon size={120} />
      </div>
      <div style={{
        fontFamily: fonts.display, fontSize: 64, fontWeight: 700, color: colors.primary,
        opacity: interpolate(frame, [15, 25], [0, 1], { extrapolateRight: "clamp" }),
        letterSpacing: "-0.02em", textAlign: "center",
      }}>
        ceremonies.dev
      </div>
      <div style={{
        fontFamily: fonts.body, fontSize: 28, color: colors.textMuted, textAlign: "center",
        marginTop: 20, maxWidth: 700,
        opacity: interpolate(frame, [30, 40], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        Open source. Self-hostable.
      </div>
      <div style={{
        marginTop: 48, padding: "20px 56px",
        border: `3px solid ${colors.primary}`, borderRadius: 8,
        background: colors.primary, boxShadow: `0 5px 0 0 #c06200`,
        opacity: interpolate(frame, [50, 60], [0, 1], { extrapolateRight: "clamp" }),
        transform: `scale(${spring({ frame: frame - 50, fps, config: { damping: 12, stiffness: 100 } })})`,
      }}>
        <div style={{ fontFamily: fonts.body, fontSize: 28, fontWeight: 700, color: colors.bg }}>
          Try it now — it's free
        </div>
      </div>
    </AbsoluteFill>
  );
};

const PromoReels: React.FC = () => {
  const frame = useCurrentFrame();

  const musicVolume = interpolate(
    frame,
    [0, 30, REELS_TOTAL - 60, REELS_TOTAL],
    [0, 0.7, 0.7, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const ReelsCrossfade: React.FC<{ children: React.ReactNode; dur: number; fadeIn?: number; fadeOut?: number }> = ({ children, dur, fadeIn = REELS_FADE, fadeOut = REELS_FADE }) => {
    const f = useCurrentFrame();
    let o = 1;
    if (fadeIn > 0) o = Math.min(o, interpolate(f, [0, fadeIn], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    if (fadeOut > 0) o = Math.min(o, interpolate(f, [dur - fadeOut, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
  };

  return (
    <FontLoader>
    <AbsoluteFill style={{ background: colors.bg }}>
      <Audio src={musicFile} volume={musicVolume} />

      <Sequence from={reelsStarts[0]} durationInFrames={reelsScenes[0].duration}>
        <ReelsCrossfade dur={reelsScenes[0].duration} fadeIn={0}>
          <ReelsProblem />
        </ReelsCrossfade>
      </Sequence>

      <Sequence from={reelsStarts[1]} durationInFrames={reelsScenes[1].duration}>
        <ReelsCrossfade dur={reelsScenes[1].duration}>
          <ReelsHero />
        </ReelsCrossfade>
      </Sequence>

      <Sequence from={reelsStarts[2]} durationInFrames={reelsScenes[2].duration}>
        <ReelsCrossfade dur={reelsScenes[2].duration}>
          <ReelsEstimation />
        </ReelsCrossfade>
      </Sequence>

      <Sequence from={reelsStarts[3]} durationInFrames={reelsScenes[3].duration}>
        <ReelsCrossfade dur={reelsScenes[3].duration}>
          <ReelsRetro />
        </ReelsCrossfade>
      </Sequence>

      <Sequence from={reelsStarts[4]} durationInFrames={reelsScenes[4].duration}>
        <ReelsCrossfade dur={reelsScenes[4].duration} fadeOut={0}>
          <ReelsCloser />
        </ReelsCrossfade>
      </Sequence>
    </AbsoluteFill>
    </FontLoader>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Full promo - Landscape */}
      <Composition
        id="CeremoniesPromo"
        component={PromoLandscape}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Full promo - Vertical Reels (native portrait layout) */}
      <Composition
        id="CeremoniesReels"
        component={PromoReels}
        durationInFrames={REELS_TOTAL}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Individual scenes for preview */}
      <Composition id="Scene1-Problem" component={Scene1Problem} durationInFrames={200} fps={30} width={1920} height={1080} />
      <Composition id="Scene2-HeroReveal" component={Scene2HeroReveal} durationInFrames={160} fps={30} width={1920} height={1080} />
      <Composition id="Scene3-Estimation" component={Scene3Estimation} durationInFrames={240} fps={30} width={1920} height={1080} />
      <Composition id="Scene4-Retro" component={Scene4Retro} durationInFrames={320} fps={30} width={1920} height={1080} />
      <Composition id="Scene5-Haunting" component={Scene5Haunting} durationInFrames={200} fps={30} width={1920} height={1080} />
      <Composition id="Scene6-Closer" component={Scene6Closer} durationInFrames={280} fps={30} width={1920} height={1080} />
    </>
  );
};
