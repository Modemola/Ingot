import "./fonts";
import { AbsoluteFill, Composition } from "remotion";
import { Credit } from "./scenes/Credit";
import { End } from "./scenes/End";
import { Index } from "./scenes/Index";
import { Open } from "./scenes/Open";
import { Problem } from "./scenes/Problem";
import { Proof } from "./scenes/Proof";
import { Trade } from "./scenes/Trade";
import { Vault } from "./scenes/Vault";
import { DEMO, Demo } from "./Demo";
import { CRE_DURATION, CRE_FPS, Cre } from "./Cre";
import { CHAINLINK, ChainlinkFilm } from "./chainlink/Film";
import { TL, useSeconds } from "./time";
import { Backdrop, Finish } from "./ui/Backdrop";
import { Subtitles } from "./ui/Subtitles";

const SCENES: Record<string, React.FC> = { open: Open, problem: Problem, index: Index, trade: Trade, credit: Credit, vault: Vault, proof: Proof, end: End };

/// Scenes overlap by a beat so every cut is a dissolve, never a jump.
const Film: React.FC = () => {
  const t = useSeconds();
  return (
    <AbsoluteFill style={{ background: "#090807" }}>
      <Backdrop />
      {TL.scenes.map((s) => {
        if (t < s.start - 0.05 || t > s.end + 0.6) return null;
        const S = SCENES[s.id];
        const fadeOut = s.id === "end" ? 1 : Math.max(0, Math.min(1, (s.end + 0.6 - t) / 0.6));
        const fadeIn = s.id === "open" ? 1 : Math.max(0, Math.min(1, (t - s.start + 0.05) / 0.5));
        return (
          <AbsoluteFill key={s.id} style={{ opacity: Math.min(fadeIn, fadeOut) }}>
            <S />
          </AbsoluteFill>
        );
      })}
      <Subtitles />
      <Finish />
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={TL.frames} fps={TL.fps} width={1920} height={1080} />
    <Composition id="Demo" component={Demo} durationInFrames={DEMO.frames} fps={DEMO.fps} width={1920} height={1080} />
    <Composition id="Cre" component={Cre} durationInFrames={CRE_DURATION * CRE_FPS} fps={CRE_FPS} width={1920} height={1080} />
    <Composition id="Chainlink" component={ChainlinkFilm} durationInFrames={CHAINLINK.frames} fps={CHAINLINK.fps} width={1920} height={1080} />
  </>
);
