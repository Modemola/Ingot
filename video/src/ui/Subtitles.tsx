import { C, F } from "../theme";
import { TL, tw, useSeconds } from "../time";

/// Captions for a muted viewer: each line split into short phrases, timed by their length.
type Seg = { text: string; start: number; end: number };

function segments(): Seg[] {
  const out: Seg[] = [];
  for (const l of TL.lines) {
    const parts: string[] = [];
    const sentences = l.caption.match(/[^.!?:—]+[.!?:—]?/g) ?? [l.caption];
    for (const s of sentences) {
      const words = s.trim().split(" ");
      let cur = "";
      for (const w of words) {
        if ((cur + " " + w).trim().length > 58 && cur) {
          parts.push(cur.trim());
          cur = w;
        } else cur = `${cur} ${w}`;
      }
      if (cur.trim()) parts.push(cur.trim());
    }
    const total = parts.reduce((a, p) => a + p.length, 0);
    let t = l.start;
    const span = l.end - l.start;
    for (const p of parts) {
      const d = (p.length / total) * span;
      out.push({ text: p, start: t, end: t + d });
      t += d;
    }
  }
  return out;
}
const SEGS = segments();

export const Subtitles: React.FC = () => {
  const t = useSeconds();
  const seg = SEGS.find((s) => t >= s.start - 0.05 && t < s.end + 0.25);
  if (!seg) return null;
  const o = Math.min(tw(t, seg.start - 0.05, seg.start + 0.15), 1 - tw(t, seg.end + 0.05, seg.end + 0.25));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, display: "flex", justifyContent: "center", opacity: o }}>
      <div
        style={{
          fontFamily: F.sans,
          fontSize: 30,
          fontWeight: 450,
          color: C.ink,
          padding: "10px 22px",
          borderRadius: 6,
          background: "rgba(9,8,7,0.62)",
          letterSpacing: "0.005em",
          textShadow: "0 2px 12px rgba(0,0,0,0.6)",
        }}
      >
        {seg.text}
      </div>
    </div>
  );
};
