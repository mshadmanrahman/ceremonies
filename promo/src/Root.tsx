import { Composition, Sequence, Audio, interpolate, useCurrentFrame, AbsoluteFill } from "remotion";
import { Scene1Problem } from "./scenes/Scene1Problem";
import { Scene2HeroReveal } from "./scenes/Scene2HeroReveal";
import { Scene3Estimation } from "./scenes/Scene3Estimation";
import { Scene4Retro } from "./scenes/Scene4Retro";
import { Scene5Haunting } from "./scenes/Scene5Haunting";
import { Scene6Closer } from "./scenes/Scene6Closer";
import { colors } from "./styles";
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
const FADE = 8; // crossfade overlap frames

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
  );
};

// --- VERTICAL REELS (9:16, 1080x1920) ---
// Same scenes but scaled to fit vertical. Add padding top/bottom.
const ReelsWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      {/* Scale the 16:9 content to fit 9:16 with letterboxing */}
      <AbsoluteFill
        style={{
          transform: "scale(0.5625)", // 1080/1920
          transformOrigin: "center center",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const PromoReels: React.FC = () => {
  const frame = useCurrentFrame();

  const musicVolume = interpolate(
    frame,
    [0, 30, TOTAL_FRAMES - 60, TOTAL_FRAMES],
    [0, 0.7, 0.7, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Audio src={musicFile} volume={musicVolume} />

      {/* Top branding */}
      <div
        style={{
          position: "absolute",
          top: 60,
          width: "100%",
          textAlign: "center",
          zIndex: 10,
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 28,
          fontWeight: 700,
          color: colors.primary,
          letterSpacing: "-0.02em",
        }}
      >
        🦉 ceremonies
      </div>

      {/* Scaled content area (center 60% of height) */}
      <AbsoluteFill
        style={{
          top: "15%",
          height: "70%",
          overflow: "hidden",
        }}
      >
        <AbsoluteFill
          style={{
            transform: "scale(0.56)",
            transformOrigin: "top center",
          }}
        >
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
      </AbsoluteFill>

      {/* Bottom CTA */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          width: "100%",
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 20,
            color: colors.textMuted,
            opacity: interpolate(frame, [TOTAL_FRAMES - 90, TOTAL_FRAMES - 60], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          ceremonies.dev
        </div>
      </div>
    </AbsoluteFill>
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

      {/* Full promo - Vertical Reels */}
      <Composition
        id="CeremoniesReels"
        component={PromoReels}
        durationInFrames={TOTAL_FRAMES}
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
