import { AbsoluteFill } from "remotion";
import { BACKFILL, BASIS, LIVE_PRINTS } from "../data";
import { C, F, INOUT, OUT } from "../theme";
import { line, scene, tw, useSeconds } from "../time";
import { Eyebrow, Rise } from "../ui/Type";

// 78 daily prints, then the 22 live ones, on one clock.
const POINTS = [
  ...BACKFILL.map(([d, p]) => [Date.parse(`${d}T00:00:00Z`), p] as const),
  ...LIVE_PRINTS.map(([d, p]) => [Date.parse(`${d.replace(" ", "T")}:00Z`), p] as const),
];
const T0 = POINTS[0][0];
const T1 = POINTS[POINTS.length - 1][0];
const W = 1500;
const H = 380;
const LO = 3.0;
const HI = 4.0;
const px = (ts: number) => ((ts - T0) / (T1 - T0)) * W;
const py = (p: number) => H - ((p - LO) / (HI - LO)) * H;
// Step function: a print holds until the next.
// Basis axis: −60% … +250%
const AX0 = -60;
const AX1 = 250;
const bx = (b: number) => ((b - AX0) / (AX1 - AX0)) * 1400;
// Label rows, nearest the axis first; each name takes the first row where it clears the others.
const ROWS = [-42, 24, -68, 50];
const LABEL_ROW = (() => {
  const taken: [number, number][][] = ROWS.map(() => []);
  return BASIS.map(([name, b]) => {
    const half = (name.length * 10.2 + 16) / 2;
    const [a, z] = [bx(b) - half, bx(b) + half];
    const row = ROWS.findIndex((_, r) => taken[r].every(([x0, x1]) => z < x0 || a > x1));
    taken[row === -1 ? 0 : row].push([a, z]);
    return ROWS[row === -1 ? 0 : row];
  });
})();

const PATH = POINTS.map(([ts, p], i) => (i === 0 ? `M${px(ts)},${py(p)}` : `H${px(ts)} V${py(p)}`)).join(" ");

export const Problem: React.FC = () => {
  const t = useSeconds();
  const s = scene("problem");
  const L3 = line("L3");
  const L4 = line("L4");
  const draw = tw(t, s.start + 0.6, s.start + 7.5, 0, 1, INOUT);
  const toBasis = tw(t, L3.start + 6.6, L3.start + 7.8, 0, 1, INOUT);
  const toL4 = tw(t, L4.start - 0.5, L4.start + 0.3, 0, 1, INOUT);
  const last = POINTS[POINTS.length - 1];

  const lowAt = L3.start + 9.2;
  const highAt = L3.start + 11.4;

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 210, top: 120, opacity: (1 - toL4) * (1 - toBasis) }}>
        <Eyebrow t={t} at={s.start + 0.3}>I — The problem</Eyebrow>
      </div>

      {/* the index, drawing itself */}
      <div style={{ position: "absolute", left: 210, top: 250, opacity: (1 - toBasis * 0.5) * (1 - toL4), transform: `translateY(${-toBasis * 150}px) scale(${1 - toBasis * 0.25})`, transformOrigin: "0 0" }}>
        <div style={{ fontFamily: F.display, fontSize: 40, color: C.ink, fontWeight: 300, opacity: tw(t, s.start + 0.5, s.start + 1.3) }}>
          H100 on-demand rental index <span style={{ color: C.muted, fontSize: 26 }}>· 100 prints · Jul 6 → Oct 11</span>
        </div>
        <svg width={W + 220} height={H + 60} style={{ marginTop: 28, overflow: "visible" }}>
          <defs>
            <linearGradient id="pfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={C.gold} stopOpacity="0.22" />
              <stop offset="1" stopColor={C.gold} stopOpacity="0" />
            </linearGradient>
            <clipPath id="pclip">
              <rect x="0" y="-20" width={W * draw + 2} height={H + 40} />
            </clipPath>
            <filter id="pglow" x="-10%" y="-50%" width="120%" height="200%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {[3.25, 3.5, 3.75].map((g) => (
            <g key={g}>
              <line x1={0} x2={W} y1={py(g)} y2={py(g)} stroke={C.hair} />
              <text x={W + 16} y={py(g) + 6} fill={C.muted} fontFamily="GeistMono" fontSize={17}>${g.toFixed(2)}</text>
            </g>
          ))}
          <g clipPath="url(#pclip)">
            <path d={`${PATH} V${H} H0 Z`} fill="url(#pfill)" />
            <path d={PATH} fill="none" stroke={C.gold} strokeWidth={3} filter="url(#pglow)" />
          </g>
          <circle cx={px(last[0])} cy={py(last[1])} r={7 + Math.sin(t * 4) * 1.5} fill={C.goldSoft} opacity={tw(t, s.start + 7.3, s.start + 7.8)} />
          <text x={px(last[0]) - 8} y={py(last[1]) - 22} textAnchor="end" fill={C.goldSoft} fontFamily="GeistMono" fontSize={24} opacity={tw(t, s.start + 7.4, s.start + 8)}>
            live ${last[1].toFixed(4)}
          </text>
          <line x1={px(Date.parse("2026-09-21T00:00:00Z"))} x2={px(Date.parse("2026-09-21T00:00:00Z"))} y1={0} y2={H} stroke={C.hair2} strokeDasharray="3 7" opacity={draw > 0.8 ? 1 : 0} />
          <text x={px(Date.parse("2026-09-21T00:00:00Z")) + 10} y={H - 10} fill={C.muted} fontFamily="GeistMono" fontSize={15} opacity={draw > 0.8 ? 1 : 0}>
            BACKFILL ← → LIVE ON MONAD
          </text>
        </svg>
      </div>

      {/* what providers actually charge against it */}
      <div style={{ position: "absolute", left: 260, top: 545, width: 1400, opacity: toBasis * (1 - toL4) }}>
        <div style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: "0.24em", color: C.muted, marginBottom: 76 }}>
          WHAT 8 OF 23 PROVIDERS CHARGE VS THE INDEX · 78-DAY MEAN
        </div>
        <div style={{ position: "relative", height: 150 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 60, height: 1, background: C.hair2 }} />
          <div style={{ position: "absolute", left: bx(-45.3), width: (bx(237.2) - bx(-45.3)) * tw(t, lowAt, highAt + 0.6, 0, 1, INOUT), top: 57, height: 7, background: `linear-gradient(90deg, ${C.critical}, ${C.gold} 25%, ${C.ember})`, opacity: 0.55, borderRadius: 4 }} />
          <div style={{ position: "absolute", left: bx(0), top: -14, height: 148, width: 2, background: C.gold, boxShadow: "0 0 18px rgba(232,182,97,0.8)" }} />
          <div style={{ position: "absolute", left: bx(0), top: -44, transform: "translateX(-50%)", fontFamily: F.mono, fontSize: 16, letterSpacing: "0.2em", color: C.gold }}>INDEX</div>
          {BASIS.map(([name, b], i) => {
            const p = tw(t, L3.start + 7.6 + i * 0.12, L3.start + 8.6 + i * 0.12, 0, 1, OUT);
            const row = LABEL_ROW[i];
            return (
              <div key={name} style={{ position: "absolute", left: bx(b), top: 60, opacity: p, zIndex: 1 }}>
                <div style={{ position: "absolute", left: -8, top: -8, width: 16, height: 16, borderRadius: 8, background: b < 0 ? C.critical : b > 50 ? C.ember : C.ink2, boxShadow: "0 0 14px rgba(0,0,0,0.6)" }} />
                <div style={{ position: "absolute", left: 0, top: row - 9, transform: "translateX(-50%)", whiteSpace: "nowrap", fontFamily: F.mono, fontSize: 14, color: C.ink2, letterSpacing: "0.12em", textAlign: "center", background: C.void, padding: "1px 6px" }}>
                  {name.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, fontFamily: F.display, fontWeight: 300 }}>
          <div style={{ opacity: tw(t, lowAt, lowAt + 0.6), transform: `translateY(${(1 - tw(t, lowAt, lowAt + 0.8)) * 16}px)` }}>
            <span style={{ fontSize: 84, color: C.critical, fontFamily: F.mono }}>−45%</span>
            <span style={{ fontSize: 32, color: C.ink2, marginLeft: 18 }}>below the index</span>
          </div>
          <div style={{ opacity: tw(t, highAt, highAt + 0.6), transform: `translateY(${(1 - tw(t, highAt, highAt + 0.8)) * 16}px)`, textAlign: "right" }}>
            <span style={{ fontSize: 32, color: C.ink2, marginRight: 18 }}>above it</span>
            <span style={{ fontSize: 84, color: C.ember, fontFamily: F.mono }}>+237%</span>
          </div>
        </div>
      </div>

      {/* the consequence */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: toL4 }}>
        <Rise text="So lenders charge for risk they can't measure." t={t} at={L4.start} size={78} align="center" accent={["can't", "measure."]} maxWidth={1300} />
        <div style={{ marginTop: 56, width: 760, height: 8, background: C.hair, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${40 * tw(t, L4.start + 0.6, L4.start + 1.6)}%`, height: "100%", background: C.ink2, display: "inline-block" }} />
          <div style={{ width: `${45 * tw(t, L4.start + 1.8, L4.start + 4.0, 0, 1, INOUT)}%`, height: "100%", background: `linear-gradient(90deg, ${C.critical}, ${C.ember})`, display: "inline-block" }} />
        </div>
        <div style={{ width: 760, display: "flex", justifyContent: "space-between", marginTop: 14, fontFamily: F.mono, fontSize: 16, letterSpacing: "0.2em" }}>
          <span style={{ color: C.muted, opacity: tw(t, L4.start + 0.8, L4.start + 1.4) }}>BASE RATE</span>
          <span style={{ color: C.critical, opacity: tw(t, L4.start + 2.4, L4.start + 3.0) }}>+ PREMIUM FOR THE UNKNOWN</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
