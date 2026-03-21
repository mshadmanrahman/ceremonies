import { Composition, Sequence, Audio, interpolate, useCurrentFrame } from "remotion";
import { Scene1Problem } from "./scenes/Scene1Problem";
import { Scene2HeroReveal } from "./scenes/Scene2HeroReveal";
import { Scene3Estimation } from "./scenes/Scene3Estimation";
import { Scene4Retro } from "./scenes/Scene4Retro";
import { Scene5Haunting } from "./scenes/Scene5Haunting";
import { Scene6Closer } from "./scenes/Scene6Closer";
import { AbsoluteFill } from "remotion";
import { colors } from "./styles";
import musicFile from "./music.mp3";

const TOTAL_FRAMES = 1650;

// Full promo: ~55 seconds at 30fps = ~1650 frames
const PromoVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // Music volume: fade in over first 1s, fade out over last 2s
  const musicVolume = interpolate(
    frame,
    [0, 30, TOTAL_FRAMES - 60, TOTAL_FRAMES],
    [0, 0.7, 0.7, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      {/* Background music */}
      <Audio src={musicFile} volume={musicVolume} />

      {/* Scene 1: The Problem (0:00 - 0:08) = 240 frames */}
      <Sequence from={0} durationInFrames={240}>
        <Scene1Problem />
      </Sequence>

      {/* Scene 2: Hero Reveal (0:08 - 0:14) = 180 frames */}
      <Sequence from={240} durationInFrames={180}>
        <Scene2HeroReveal />
      </Sequence>

      {/* Scene 3: Estimation (0:14 - 0:24) = 300 frames */}
      <Sequence from={420} durationInFrames={300}>
        <Scene3Estimation />
      </Sequence>

      {/* Scene 4: Retro (0:24 - 0:42) = 360 frames (4 sub-scenes) */}
      <Sequence from={720} durationInFrames={360}>
        <Scene4Retro />
      </Sequence>

      {/* Scene 5: The Haunting (0:36 - 0:44) = 240 frames */}
      <Sequence from={1080} durationInFrames={240}>
        <Scene5Haunting />
      </Sequence>

      {/* Scene 6: Closer (0:44 - 0:55) = 330 frames */}
      <Sequence from={1320} durationInFrames={330}>
        <Scene6Closer />
      </Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Full promo */}
      <Composition
        id="CeremomiesPromo"
        component={PromoVideo}
        durationInFrames={1650}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Individual scenes for preview */}
      <Composition id="Scene1-Problem" component={Scene1Problem} durationInFrames={240} fps={30} width={1920} height={1080} />
      <Composition id="Scene2-HeroReveal" component={Scene2HeroReveal} durationInFrames={180} fps={30} width={1920} height={1080} />
      <Composition id="Scene3-Estimation" component={Scene3Estimation} durationInFrames={300} fps={30} width={1920} height={1080} />
      <Composition id="Scene4-Retro" component={Scene4Retro} durationInFrames={360} fps={30} width={1920} height={1080} />
      <Composition id="Scene5-Haunting" component={Scene5Haunting} durationInFrames={240} fps={30} width={1920} height={1080} />
      <Composition id="Scene6-Closer" component={Scene6Closer} durationInFrames={330} fps={30} width={1920} height={1080} />
    </>
  );
};
