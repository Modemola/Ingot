import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F, INOUT, OUT } from "../theme";
import { tw, useSeconds } from "../time";
import { IngotMark } from "../ui/Marks";
import { At, B, Head, Label, Panel, Pill, Price, Tick, Wire, enter } from "./kit";
import { L, pop, scene, wordT } from "./time";

// ---------------------------------------------------------------------------------------------
// 8 · A quorum is not a blank check
// ---------------------------------------------------------------------------------------------
const Band: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const p = tw(t, at, at + 1.2, 0, 1, INOUT);
  const pts = Array.from({ length: 40 }, (_, i) => {
    const x = 10 + i * 8.7;
    const y = 70 + Math.sin(i * 0.55 + t * 1.6) * 16 + Math.sin(i * 1.7) * 5;
    return `${x},${y}`;
  });
  return (
    <svg width="360" height="140" viewBox="0 0 360 140">
      <rect x="0" y="34" width={360 * p} height="72" fill="rgba(232,182,97,0.08)" />
      <line x1="0" y1="34" x2={360 * p} y2="34" stroke={C.goldDeep} strokeDasharray="4 6" />
      <line x1="0" y1="106" x2={360 * p} y2="106" stroke={C.goldDeep} strokeDasharray="4 6" />
      <polyline points={pts.slice(0, Math.max(1, Math.round(40 * p))).join(" ")} fill="none" stroke={C.goldSoft} strokeWidth="2.5" />
    </svg>
  );
};

const Interval: React.FC<{ t: number; at: number }> = ({ t, at }) => (
  <svg width="360" height="140" viewBox="0 0 360 140">
    <line x1="10" y1="70" x2="350" y2="70" stroke={C.hair2} strokeWidth="1.5" />
    {[0, 1, 2, 3].map((i) => {
      const x = 30 + i * 100;
      const p = pop(t, at + 0.2 + i * 0.22, 0.45);
      return (
        <g key={i} transform={`translate(${x} 70) scale(${p})`}>
          <circle r="9" fill={C.goldSoft} />
        </g>
      );
    })}
    {[0, 1, 2].map((i) => (
      <text key={i} x={80 + i * 100} y="108" fill={C.muted} fontFamily="GeistMono" fontSize="14" textAnchor="middle" opacity={tw(t, at + 0.5 + i * 0.22, at + 0.8 + i * 0.22)}>
        ≥ min
      </text>
    ))}
  </svg>
);

const Finality: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const p = tw(t, at + 0.2, at + 2.4, 0, 1, INOUT);
  return (
    <svg width="360" height="140" viewBox="0 0 360 140">
      <rect x="10" y="58" width="340" height="24" rx="12" fill="rgba(243,236,223,0.05)" stroke={C.hair2} />
      <rect x="10" y="58" width={340 * p} height="24" rx="12" fill={p >= 1 ? C.gold : "rgba(232,182,97,0.45)"} />
      <text x="10" y="114" fill={C.muted} fontFamily="GeistMono" fontSize="14">provisional</text>
      <text x="350" y="114" fill={p >= 1 ? C.gold : C.muted} fontFamily="GeistMono" fontSize="14" textAnchor="end">final</text>
    </svg>
  );
};

const GUARDS = [
  { word: "deviation", title: "Deviation band", note: "no wild jumps", Art: Band },
  { word: "minimum", title: "Minimum interval", note: "no rapid fire", Art: Interval },
  { word: "finality", title: "Finality delay", note: "time to revoke", Art: Finality },
];

export const Guards: React.FC = () => {
  const t = useSeconds();
  const l15 = L("L15");
  return (
    <AbsoluteFill>
      <At x={960} y={250}>
        <Head text="A quorum still isn't a blank check." accent={["blank", "check"]} t={t} at={l15.start - 0.1} size={78} />
      </At>
      {GUARDS.map((g, i) => {
        const at = wordT("L15", g.word) - 0.15;
        const { Art } = g;
        return (
          <At key={g.title} x={480 + i * 480} y={640}>
            <div style={enter(t, at, undefined, 26)}>
              <Panel style={{ width: 420, padding: "28px 30px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Label size={13} color={C.muted}>IngotIndex</Label>
                  <Tick t={t} at={at + 1.0} size={24} />
                </div>
                <div style={{ marginTop: 10, fontFamily: F.display, fontSize: 38, fontWeight: 300, color: C.ink }}>{g.title}</div>
                <div style={{ marginTop: 4, fontFamily: F.sans, fontSize: 20, color: C.ink2 }}>{g.note}</div>
                <div style={{ marginTop: 18 }}>
                  <Art t={t} at={at} />
                </div>
              </Panel>
            </div>
          </At>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// 9 · What the price does next
// ---------------------------------------------------------------------------------------------
const Spark: React.FC = () => (
  <svg width="120" height="44" viewBox="0 0 120 44">
    <polyline points="2,34 18,30 32,32 46,22 60,24 74,14 88,18 102,10 118,12" fill="none" stroke={C.goldSoft} strokeWidth="2.5" strokeLinejoin="round" />
  </svg>
);
const Done: React.FC = () => (
  <svg width="120" height="44" viewBox="0 0 120 44">
    <rect x="2" y="8" width="44" height="30" rx="5" fill="none" stroke={C.goldSoft} strokeWidth="2.5" />
    <line x1="2" y1="17" x2="46" y2="17" stroke={C.goldSoft} strokeWidth="2.5" />
    <path d="M60 24 L72 34 L92 12" fill="none" stroke={C.good} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Whole: React.FC<{ fill: number }> = ({ fill }) => (
  <svg width="120" height="44" viewBox="0 0 120 44">
    <rect x="2" y="14" width="116" height="16" rx="8" fill="rgba(243,236,223,0.06)" stroke={C.hair2} />
    <rect x="2" y="14" width={116 * fill} height="16" rx="8" fill={C.gold} />
  </svg>
);

export const Product: React.FC = () => {
  const t = useSeconds();
  const s = scene("product");
  const rows = [
    { at: wordT("L16", "marks"), k: "Marks your trades", v: "every position, continuously", art: <Spark /> },
    { at: wordT("L16", "settles"), k: "Settles each contract", v: "the average over its window", art: <Done /> },
    { at: wordT("L16", "hedged"), k: "Hedged loans, made whole", v: "lender recovery at any rate", art: <Whole fill={tw(t, wordT("L16", "whole"), wordT("L16", "whole") + 1.0, 0, 1, OUT)} /> },
  ];
  return (
    <AbsoluteFill>
      <At x={480} y={540}>
        <div style={{ ...enter(t, s.start + 0.2), display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
          <Label size={15} color={B.soft}>Agreed by the DON</Label>
          <Price value="$3.7570" size={92} />
          <Label size={15}>Ingot H100 index</Label>
        </div>
      </At>
      {rows.map((r, i) => {
        const y = 340 + i * 200;
        return (
          <React.Fragment key={r.k}>
            <Wire x1={760} y1={540} x2={1010} y2={y} t={t} at={r.at - 0.35} dur={0.45} color="rgba(232,182,97,0.4)" />
            <At x={1340} y={y}>
              <div style={enter(t, r.at - 0.05, undefined, 18)}>
                <Panel style={{ width: 640, padding: "24px 30px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 300, color: C.ink }}>{r.k}</div>
                    <div style={{ marginTop: 4, fontFamily: F.sans, fontSize: 19, color: C.muted }}>{r.v}</div>
                  </div>
                  {r.art}
                </Panel>
              </div>
            </At>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// 10 · The receipts: a real CRE CLI run
// ---------------------------------------------------------------------------------------------
const RUN: { at: () => number; text: React.ReactNode }[] = [
  { at: () => wordT("L17", "compiled"), text: <><span style={{ color: C.good }}>✓</span> Workflow compiled</> },
  { at: () => wordT("L17", "compiled") + 0.7, text: <><span style={{ color: C.muted }}>[SIMULATION]</span> Running trigger <span style={{ color: B.soft }}>cron-trigger@1.0.0</span></> },
  { at: () => wordT("L17", "fetched"), text: <><span style={{ color: C.muted }}>[USER LOG]</span> node print <span style={{ color: C.goldSoft }}>$3.7570</span>/GPU-hour from 24 venues, 38 quotes</> },
  { at: () => wordT("L17", "agreed"), text: <><span style={{ color: C.muted }}>[USER LOG]</span> DON agreed <span style={{ color: C.goldSoft }}>$3.7570</span>/GPU-hour</> },
  { at: () => wordT("L17", "write"), text: <><span style={{ color: C.muted }}>[USER LOG]</span> report written to IngotIndexReceiver on Monad testnet: tx <span style={{ color: C.good }}>SUCCESS</span></> },
  { at: () => wordT("L17", "dry run"), text: <><span style={{ color: C.good }}>✓</span> Workflow Simulation Result: {"{"} <span style={{ color: C.goldSoft }}>"price": 3.75697</span> {"}"}</> },
];

export const Proof: React.FC = () => {
  const t = useSeconds();
  const s = scene("proof");
  const cmd = "cre workflow simulate ./index-workflow --target staging-settings";
  const typeAt = s.start + 0.5;
  const typed = Math.floor(tw(t, typeAt, typeAt + 1.4, 0, 1, (x) => x) * cmd.length);
  const okAt = wordT("L18", "next") - 0.2;
  const liveAt = wordT("L18", "live");
  return (
    <AbsoluteFill>
      <At x={960} y={160}>
        <div style={enter(t, s.start + 0.1)}>
          <Label color={C.muted}>The receipts · CRE CLI v1.38.0</Label>
        </div>
      </At>
      <At x={960} y={490}>
        <div style={enter(t, s.start + 0.2, undefined, 22)}>
          <Panel style={{ width: 1360, padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "16px 22px", borderBottom: `1px solid ${C.hair}` }}>
              {["#3a332c", "#3a332c", "#3a332c"].map((c, i) => (
                <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
              ))}
              <span style={{ marginLeft: 14, fontFamily: F.mono, fontSize: 15, color: C.muted }}>oracle/</span>
            </div>
            <div style={{ padding: "26px 32px 30px", fontFamily: F.mono, fontSize: 23, lineHeight: 1.75, color: C.ink2, minHeight: 360 }}>
              <div>
                <span style={{ color: C.gold }}>$ </span>
                <span style={{ color: C.ink }}>{cmd.slice(0, typed)}</span>
                {typed < cmd.length && <span style={{ display: "inline-block", width: 12, height: 26, background: C.ink2, transform: "translateY(5px)", marginLeft: 2 }} />}
              </div>
              {RUN.map((r, i) => {
                const at = r.at();
                return (
                  <div key={i} style={{ opacity: tw(t, at, at + 0.25), transform: `translateX(${(1 - tw(t, at, at + 0.4, 0, 1, OUT)) * -10}px)` }}>
                    {r.text}
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </At>
      <At x={960} y={835}>
        <div style={{ display: "flex", gap: 18 }}>
          <div style={{ transform: `scale(${pop(t, okAt)})` }}>
            <Pill color={C.good} bg="rgba(127,209,166,0.06)">✓ simulated end to end · write was a dry run</Pill>
          </div>
          <div style={{ transform: `scale(${pop(t, liveAt)})` }}>
            <Pill color={B.soft} bg={B.wash}>→ next: a live DON</Pill>
          </div>
        </div>
      </At>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// 11 · End card
// ---------------------------------------------------------------------------------------------
export const End: React.FC = () => {
  const t = useSeconds();
  const s = scene("end");
  const l19 = L("L19");
  const sweep = tw(t, s.start + 0.6, s.start + 2.0, -1, 1, INOUT);
  const fade = 1 - tw(t, 118.6, 119.9);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <At x={960} y={420}>
        <div style={{ ...enter(t, s.start + 0.2), display: "flex", alignItems: "center", gap: 30 }}>
          <IngotMark size={86} sweep={sweep} />
          <span style={{ fontFamily: F.display, fontSize: 84, fontWeight: 300, color: C.ink, letterSpacing: "-0.02em" }}>Ingot</span>
          <span style={{ fontFamily: F.mono, fontSize: 40, color: C.muted, margin: "0 6px", opacity: tw(t, s.start + 0.6, s.start + 1.0) }}>×</span>
          <span style={{ fontFamily: F.display, fontSize: 84, fontWeight: 300, color: B.soft, letterSpacing: "-0.02em", opacity: tw(t, s.start + 0.8, s.start + 1.3) }}>Chainlink</span>
        </div>
      </At>
      <At x={960} y={590}>
        <Head text="One price. No single key." accent={["No", "single", "key"]} t={t} at={wordT("L19", "one price") - 0.1} size={64} />
      </At>
      <At x={960} y={720}>
        <div style={{ ...enter(t, l19.end - 0.4), display: "flex", gap: 28, alignItems: "center" }}>
          <Label color={C.ink2} size={17}>ingotx.vercel.app</Label>
          <span style={{ color: C.hair2 }}>·</span>
          <Label color={C.muted} size={17}>CRE workflow · oracle/</Label>
        </div>
      </At>
    </AbsoluteFill>
  );
};

