import { AbsoluteFill, Img, staticFile } from "remotion";
import { C } from "../theme";
import { useSeconds } from "../time";

/// Warm black, a slow drifting pool of gold light, vignette and a still grain: the room every
/// scene sits in.
export const Backdrop: React.FC = () => {
  const t = useSeconds();
  const x = 50 + Math.sin(t * 0.07) * 18;
  const y = 38 + Math.cos(t * 0.05) * 10;
  return (
    <AbsoluteFill style={{ background: C.void }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(1100px 700px at ${x}% ${y}%, rgba(232,182,97,0.075), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(243,236,223,0.06) 1px, transparent 1.3px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, #000 10%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, #000 10%, transparent 75%)",
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
};

export const Finish: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />
    <AbsoluteFill style={{ opacity: 0.035, mixBlendMode: "screen", pointerEvents: "none" }}>
      <Img src={staticFile("grain.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  </>
);
