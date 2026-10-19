import { AbsoluteFill } from "remotion";
import { C, F } from "../theme";
import { tw, useSeconds } from "../time";
import { Backdrop, Finish } from "../ui/Backdrop";
import { Cre, Key, Open, Stakes } from "./scenes-a";
import { Consensus, Deliver, Fetch } from "./scenes-b";
import { End, Guards, Product, Proof } from "./scenes-c";
import { CT } from "./time";

/// "Ingot × Chainlink": how the index gets written. Two minutes, timed to its narration
/// (chainlink/build_timeline.py writes src/chainlink-timeline.json).
export const CHAINLINK = CT;

const SCENES: Record<string, React.FC> = { open: Open, stakes: Stakes, key: Key, cre: Cre, fetch: Fetch, consensus: Consensus, deliver: Deliver, guards: Guards, product: Product, proof: Proof, end: End };

/// Captions for a muted feed: short phrases, timed by length within each line.
type Seg = { text: string; start: number; end: number };
const SEGS: Seg[] = CT.lines.flatMap((l) => {
  const parts: string[] = [];
  for (const sentence of l.caption.match(/.+?(?:[.!?:](?=\s|$)|$)/g) ?? [l.caption]) {
    let cur = "";
    for (const w of sentence.trim().split(" ")) {
      if ((cur + " " + w).trim().length > 54 && cur) {
        parts.push(cur.trim());
        cur = w;
      } else cur = `${cur} ${w}`;
    }
    if (cur.trim()) parts.push(cur.trim());
  }
  const total = parts.reduce((a, p) => a + p.length, 0);
  let t = l.start;
  return parts.map((p) => {
    const d = (p.length / total) * (l.end - l.start);
    const seg = { text: p, start: t, end: t + d };
    t += d;
    return seg;
  });
});

const Captions: React.FC = () => {
  const t = useSeconds();
  const seg = SEGS.find((s) => t >= s.start - 0.05 && t < s.end + 0.2);
  if (!seg) return null;
  const o = Math.min(tw(t, seg.start - 0.05, seg.start + 0.12), 1 - tw(t, seg.end, seg.end + 0.2));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ fontFamily: F.sans, fontSize: 27, fontWeight: 450, color: C.ink, padding: "8px 18px", borderRadius: 6, background: "rgba(9,8,7,0.55)" }}>{seg.text}</div>
    </div>
  );
};

/// Scenes overlap by a beat so every cut is a dissolve.
export const ChainlinkFilm: React.FC = () => {
  const t = useSeconds();
  return (
    <AbsoluteFill style={{ background: C.void }}>
      <Backdrop />
      {CT.scenes.map((s) => {
        if (t < s.start - 0.05 || t > s.end + 0.5) return null;
        const S = SCENES[s.id];
        const fadeOut = s.id === "end" ? 1 : Math.max(0, Math.min(1, (s.end + 0.5 - t) / 0.5));
        const fadeIn = s.id === "open" ? 1 : Math.max(0, Math.min(1, (t - s.start + 0.05) / 0.45));
        return (
          <AbsoluteFill key={s.id} style={{ opacity: Math.min(fadeIn, fadeOut) }}>
            <S />
          </AbsoluteFill>
        );
      })}
      <Captions />
      <Finish />
    </AbsoluteFill>
  );
};
