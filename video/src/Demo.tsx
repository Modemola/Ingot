import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import edit from "./demo-edit.json";
import { C, F, INOUT, OUT } from "./theme";
import { tw } from "./time";

/// The product demo: the live site, recorded on Monad testnet, cut to the narration.
type Clip = { start: number; end: number; src: number; rate: number; zoom?: [number, number]; focus?: [number, number] };
type Line = { id: string; start: number; end: number; caption: string };
type Chip = { start: number; end: number; step: string; text: string };
type Tx = { at: number; hash: string; label: string };
export const DEMO = edit as { fps: number; duration: number; frames: number; introEnd: number; outroStart: number; clips: Clip[]; lines: Line[]; chips: Chip[]; txs: Tx[]; address: string };

const useT = () => useCurrentFrame() / DEMO.fps;

const Footage: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill>
      {DEMO.clips.map((c, i) => {
        const from = Math.round(c.start * DEMO.fps);
        const dur = Math.round((c.end - c.start) * DEMO.fps) + 8;
        const fadeIn = i === 0 ? 1 : tw(t, c.start, c.start + 0.27, 0, 1, (x) => x);
        const p = tw(t, c.start, c.end, 0, 1, INOUT);
        const [z0, z1] = c.zoom ?? [1, 1];
        const z = z0 + (z1 - z0) * p;
        const [fx, fy] = c.focus ?? [0.5, 0.5];
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <AbsoluteFill style={{ opacity: fadeIn, transform: `scale(${z})`, transformOrigin: `${fx * 100}% ${fy * 100}%` }}>
              <OffthreadVideo src={staticFile("demo/raw.mp4")} startFrom={Math.round(c.src * DEMO.fps)} playbackRate={c.rate} muted style={{ width: 1920, height: 1080 }} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

function phrases(): { text: string; start: number; end: number }[] {
  const out: { text: string; start: number; end: number }[] = [];
  for (const l of DEMO.lines) {
    const parts: string[] = [];
    for (const s of l.caption.match(/[^.!?:]+[.!?:]?/g) ?? [l.caption]) {
      let cur = "";
      for (const w of s.trim().split(" ")) {
        if ((cur + " " + w).trim().length > 60 && cur) {
          parts.push(cur.trim());
          cur = w;
        } else cur = `${cur} ${w}`;
      }
      if (cur.trim()) parts.push(cur.trim());
    }
    const total = parts.reduce((a, p) => a + p.length, 0);
    let t = l.start;
    for (const p of parts) {
      const d = (p.length / total) * (l.end - l.start);
      out.push({ text: p, start: t, end: t + d });
      t += d;
    }
  }
  return out;
}
const PHRASES = phrases();

const Captions: React.FC = () => {
  const t = useT();
  const seg = PHRASES.find((s) => t >= s.start - 0.05 && t < s.end + 0.2);
  if (!seg) return null;
  const o = Math.min(tw(t, seg.start - 0.05, seg.start + 0.12), 1 - tw(t, seg.end + 0.02, seg.end + 0.2));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 48, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ fontFamily: F.sans, fontSize: 31, fontWeight: 450, color: C.ink, padding: "10px 24px", borderRadius: 8, background: "rgba(9,8,7,0.78)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", border: "1px solid rgba(243,236,223,0.08)" }}>
        {seg.text}
      </div>
    </div>
  );
};

const StepChip: React.FC = () => {
  const t = useT();
  const c = DEMO.chips.find((x) => t >= x.start && t < x.end);
  if (!c) return null;
  const o = Math.min(tw(t, c.start, c.start + 0.4), 1 - tw(t, c.end - 0.4, c.end));
  return (
    <div style={{ position: "absolute", left: 40, bottom: 50, opacity: o, transform: `translateX(${(1 - tw(t, c.start, c.start + 0.5, 0, 1, OUT)) * -16}px)`, display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "rgba(9,8,7,0.82)", border: `1px solid rgba(232,182,97,0.35)`, borderRadius: 6, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
      <span style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: "0.22em", color: C.gold }}>{c.step}</span>
      <span style={{ width: 1, height: 16, background: "rgba(232,182,97,0.35)" }} />
      <span style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: "0.16em", color: C.ink, textTransform: "uppercase" }}>{c.text}</span>
    </div>
  );
};

const TxBadge: React.FC = () => {
  const t = useT();
  const x = [...DEMO.txs].reverse().find((e) => t >= e.at && t < e.at + 3.6);
  if (!x) return null;
  const o = Math.min(tw(t, x.at, x.at + 0.3), 1 - tw(t, x.at + 3.2, x.at + 3.6));
  return (
    <div style={{ position: "absolute", right: 40, bottom: 50, opacity: o, transform: `translateY(${(1 - tw(t, x.at, x.at + 0.45, 0, 1, OUT)) * 14}px)`, padding: "12px 18px", background: "rgba(9,8,7,0.86)", border: "1px solid rgba(127,209,166,0.45)", borderRadius: 6, boxShadow: "0 12px 40px rgba(0,0,0,0.55)", minWidth: 380 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: F.mono, fontSize: 13.5, letterSpacing: "0.2em", color: C.good }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: C.good, boxShadow: `0 0 10px ${C.good}` }} />
        CONFIRMED ON MONAD TESTNET
      </div>
      <div style={{ marginTop: 6, fontFamily: F.sans, fontSize: 19, color: C.ink }}>{x.label}</div>
      <div style={{ marginTop: 3, fontFamily: F.mono, fontSize: 15, color: C.ink2 }}>tx {x.hash.slice(0, 10)}…{x.hash.slice(-8)}</div>
    </div>
  );
};

const Intro: React.FC = () => {
  const t = useT();
  const end = DEMO.introEnd;
  const o = 1 - tw(t, end - 0.5, end);
  if (t > end) return null;
  return (
    <AbsoluteFill style={{ background: C.void, opacity: o, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(900px 520px at 50% 46%, rgba(232,182,97,0.14), transparent 70%)" }} />
      <div style={{ opacity: tw(t, 0.1, 0.8), transform: `translateY(${(1 - tw(t, 0.1, 1.0, 0, 1, OUT)) * 18}px)` }}>
        <Img src={staticFile("brand/ingot-logo-dark-transparent.svg")} style={{ width: 760 }} />
      </div>
      <div style={{ marginTop: 6, fontFamily: F.mono, fontSize: 19, letterSpacing: "0.34em", color: C.gold, opacity: tw(t, 0.7, 1.3) }}>LIVE PRODUCT DEMO · MONAD TESTNET</div>
      <div style={{ marginTop: 18, fontFamily: F.mono, fontSize: 17, letterSpacing: "0.08em", color: C.muted, opacity: tw(t, 1.0, 1.6) }}>monad-six-sooty.vercel.app</div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const t = useT();
  const s = DEMO.outroStart;
  if (t < s) return null;
  const o = tw(t, s, s + 0.6);
  const black = tw(t, DEMO.duration - 0.8, DEMO.duration - 0.05);
  const hashes = DEMO.txs.slice(0, 10);
  return (
    <AbsoluteFill style={{ background: C.void, opacity: o, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(900px 520px at 50% 40%, rgba(232,182,97,0.14), transparent 70%)" }} />
      <div style={{ marginTop: -90, opacity: tw(t, s + 0.2, s + 0.9), transform: `translateY(${(1 - tw(t, s + 0.2, s + 1.1, 0, 1, OUT)) * 16}px)` }}>
        <Img src={staticFile("brand/ingot-logo-dark-transparent.svg")} style={{ width: 640 }} />
      </div>
      <div style={{ fontFamily: F.display, fontWeight: 300, fontSize: 40, color: C.ink2, opacity: tw(t, s + 0.6, s + 1.2) }}>
        Compute, <span style={{ fontStyle: "italic", color: C.gold }}>priced</span> &amp; hedged.
      </div>
      <div style={{ marginTop: 26, display: "flex", gap: 30, fontFamily: F.mono, fontSize: 21, opacity: tw(t, s + 0.9, s + 1.5) }}>
        <span style={{ color: C.goldSoft }}>monad-six-sooty.vercel.app</span>
        <span style={{ color: C.muted }}>·</span>
        <span style={{ color: C.ink2 }}>github.com/Modemola/Ingot</span>
      </div>
      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center", fontFamily: F.mono, fontSize: 13, letterSpacing: "0.06em", color: C.muted, opacity: tw(t, s + 1.3, s + 2.0), lineHeight: 1.7 }}>
        <div style={{ letterSpacing: "0.28em", color: C.gold, marginBottom: 6 }}>EVERY TRANSACTION IN THIS DEMO · MONAD TESTNET · WALLET {DEMO.address.slice(0, 8)}…{DEMO.address.slice(-6)}</div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "2px 22px", maxWidth: 1500, margin: "0 auto" }}>
          {hashes.map((h) => (
            <span key={h.hash}>{h.hash.slice(0, 14)}…{h.hash.slice(-6)}</span>
          ))}
        </div>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: black }} />
    </AbsoluteFill>
  );
};

export const Demo: React.FC = () => (
  <AbsoluteFill style={{ background: C.void }}>
    <Footage />
    <StepChip />
    <Captions />
    <Intro />
    <Outro />
  </AbsoluteFill>
);
