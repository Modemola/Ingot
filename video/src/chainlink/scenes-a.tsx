import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F, INOUT, OUT } from "../theme";
import { tw, useSeconds } from "../time";
import { SplitFlap } from "../ui/Marks";
import { At, B, Head, Hex, Label, Panel, Pill, Price, Stamp, Tick, Wire, enter } from "./kit";
import { L, pop, scene, wordT } from "./time";

// ---------------------------------------------------------------------------------------------
// 1 · One number
// ---------------------------------------------------------------------------------------------
export const Open: React.FC = () => {
  const t = useSeconds();
  const l1 = L("L1");
  const flapAt = wordT("L2", "ours") + 0.2;
  const liveAt = wordT("L2", "right now");
  return (
    <AbsoluteFill>
      <At x={960} y={250}>
        <div style={enter(t, 0.35)}>
          <Label color={C.muted}>
            Ingot <span style={{ color: C.hair2, margin: "0 14px" }}>×</span> <span style={{ color: B.soft }}>Chainlink CRE</span>
          </Label>
        </div>
      </At>
      <At x={960} y={540}>
        <Head text="Every market runs on one number." accent={["one", "number"]} t={t} at={l1.start - 0.1} out={flapAt - 0.55} size={92} />
      </At>
      {t > flapAt - 0.5 && (
        <At x={960} y={520}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
            <SplitFlap text="$3.7195" t={t} at={flapAt} size={132} />
            <div style={enter(t, flapAt + 0.6)}>
              <Label color={C.ink2} size={19}>H100 · USD per GPU-hour</Label>
            </div>
            <div style={{ ...enter(t, liveAt), display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 9, height: 9, borderRadius: 5, background: C.good, boxShadow: `0 0 ${10 + 6 * Math.sin(t * 5)}px ${C.good}`, opacity: 0.6 + 0.4 * Math.sin(t * 5) }} />
              <Label color={C.good} size={16}>Live on Monad testnet</Label>
            </div>
          </div>
        </At>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// 2 · What rides on it
// ---------------------------------------------------------------------------------------------
const STAKES = [
  { word: "marks", k: "Marks", v: "every position", icon: "01" },
  { word: "triggers", k: "Triggers", v: "every liquidation", icon: "02" },
  { word: "settles", k: "Settles", v: "every contract", icon: "03" },
];

export const Stakes: React.FC = () => {
  const t = useSeconds();
  const s = scene("stakes");
  const l4 = L("L4");
  const out = l4.start - 0.45;
  const caret = Math.floor(t * 2.2) % 2 === 0 ? 1 : 0;
  return (
    <AbsoluteFill>
      <At x={960} y={300}>
        {/* enters once the opening board has dissolved, so the two prices never overlap */}
        <div style={{ ...enter(t, s.start + 0.55, out), display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <Price value="$3.7195" size={64} />
          <Label size={15}>Ingot H100 index</Label>
        </div>
      </At>
      {STAKES.map((c, i) => {
        const at = wordT("L3", c.word) - 0.1;
        const x = 480 + i * 480;
        return (
          <React.Fragment key={c.k}>
            <Wire x1={960} y1={370} x2={x} y2={560} t={t} at={at - 0.3} dur={0.5} color="rgba(232,182,97,0.35)" opacity={1 - tw(t, out, out + 0.4)} />
            <At x={x} y={650}>
              <div style={enter(t, at, out, 24)}>
                <Panel style={{ width: 380, padding: "34px 34px 30px", textAlign: "left" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: "0.2em", color: C.gold, transform: `scale(${pop(t, at + 0.15)})`, transformOrigin: "left center" }}>{c.icon}</div>
                  <div style={{ marginTop: 18, fontFamily: F.display, fontSize: 44, fontWeight: 300, color: C.ink }}>{c.k}</div>
                  <div style={{ marginTop: 4, fontFamily: F.sans, fontSize: 24, color: C.ink2 }}>{c.v}</div>
                </Panel>
              </div>
            </At>
          </React.Fragment>
        );
      })}
      {t > out && (
        <At x={960} y={540}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <Head text="So who gets to write it?" accent={["write"]} t={t} at={l4.start - 0.15} size={104} />
            <span style={{ display: "inline-block", width: 6, height: 92, marginLeft: 14, background: C.gold, opacity: caret * tw(t, l4.start + 0.6, l4.start + 0.8), transform: "translateY(14px)" }} />
          </div>
        </At>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// 3 · One key, one server
// ---------------------------------------------------------------------------------------------
const KeyGlyph: React.FC<{ color: string }> = ({ color }) => (
  <svg width="120" height="60" viewBox="0 0 120 60">
    <circle cx="30" cy="30" r="18" fill="none" stroke={color} strokeWidth="5" />
    <path d="M48 30 H108 M92 30 V44 M104 30 V40" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
  </svg>
);

export const Key: React.FC = () => {
  const t = useSeconds();
  const s = scene("key");
  const keyAt = wordT("L5", "one key");
  const serverAt = wordT("L5", "one server");
  const fineAt = wordT("L5", "works perfectly");
  const breakAt = wordT("L5", "doesn't") + 0.15;
  const broke = tw(t, breakAt, breakAt + 0.25);
  const shake = t > breakAt && t < breakAt + 0.45 ? Math.sin(t * 90) * 7 * (1 - (t - breakAt) / 0.45) : 0;
  const keyColor = broke > 0.5 ? C.critical : C.gold;
  // After the break the price walks away: one compromised key, one rewritten number.
  const walk = tw(t, breakAt + 0.05, breakAt + 0.95, 0, 1, (x) => x * x);
  const price = 3.7195 + walk * (9.99 - 3.7195);
  return (
    <AbsoluteFill>
      <At x={760} y={520}>
        <div style={{ ...enter(t, s.start + 0.2), transform: `translateX(${shake}px)` }}>
          <Panel accent={broke > 0.5 ? "rgba(224,104,77,0.7)" : C.hair2} style={{ width: 520, height: 330, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 22, left: 26, display: "flex", gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: 5, background: i === 0 && broke > 0.5 ? C.critical : C.hair2 }} />
              ))}
            </div>
            <div style={{ transform: `scale(${pop(t, keyAt - 0.1)}) rotate(${broke * -12}deg)` }}>
              <KeyGlyph color={keyColor} />
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <div style={{ transform: `scale(${pop(t, keyAt)})` }}>
                <Pill color={C.ink}>1 key</Pill>
              </div>
              <div style={{ transform: `scale(${pop(t, serverAt)})` }}>
                <Pill color={C.ink}>1 server</Pill>
              </div>
            </div>
            {/* the crack */}
            <svg width="520" height="330" style={{ position: "absolute", inset: 0 }}>
              <path d="M300 0 L282 92 L318 150 L276 226 L304 330" fill="none" stroke={C.critical} strokeWidth="2.5" strokeDasharray="360" strokeDashoffset={360 * (1 - broke)} />
            </svg>
          </Panel>
        </div>
      </At>
      <At x={760} y={765}>
        <div style={{ ...enter(t, fineAt), display: "flex", alignItems: "center", gap: 12, opacity: tw(t, fineAt, fineAt + 0.5) * (1 - broke) }}>
          <Tick t={t} at={fineAt + 0.1} />
          <span style={{ fontFamily: F.sans, fontSize: 24, color: C.ink2 }}>works perfectly</span>
        </div>
      </At>
      <At x={1350} y={520}>
        <div style={{ ...enter(t, serverAt + 0.3), display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
          <Label size={15} color={broke > 0.5 ? C.critical : C.muted}>The index</Label>
          <Price value={`$${price.toFixed(4)}`} size={72} color={walk > 0.02 ? C.critical : C.goldSoft} glow={walk < 0.02} />
          <div style={{ height: 40, opacity: tw(t, breakAt + 0.5, breakAt + 0.9) }}>
            <Label size={15} color={C.critical}>… right up until it doesn't</Label>
          </div>
        </div>
      </At>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// 4 · Enter CRE: a cron trigger and a DON
// ---------------------------------------------------------------------------------------------
export const RING = Array.from({ length: 7 }, (_, i) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 7;
  return { x: 1290 + 205 * Math.cos(a), y: 560 + 205 * Math.sin(a) };
});

export const Cre: React.FC = () => {
  const t = useSeconds();
  const l6 = L("L6");
  const l7 = L("L7");
  const headOut = l7.start - 0.5;
  const cronAt = wordT("L7", "cron");
  const wakeAt = wordT("L7", "wakes");
  const donAt = wordT("L7", "decentralized") - 0.5;
  const spin = tw(t, cronAt - 0.2, cronAt + 0.9, 0, 1, INOUT);
  const fired = tw(t, cronAt + 0.9, cronAt + 1.2);
  return (
    <AbsoluteFill>
      <At x={960} y={500}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          <div style={enter(t, l6.start - 0.2, headOut)}>
            <Label color={B.soft}>Chainlink CRE</Label>
          </div>
          <Head text="Ingot hands the job to the Chainlink Runtime Environment." blue={["Chainlink", "Runtime", "Environment"]} t={t} at={l6.start - 0.1} out={headOut} size={80} maxWidth={1300} />
        </div>
      </At>

      {/* the cron trigger */}
      <At x={560} y={560}>
        <div style={{ ...enter(t, cronAt - 0.5), display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          <svg width="260" height="260" viewBox="0 0 260 260" style={{ overflow: "visible" }}>
            <circle cx="130" cy="130" r="118" fill="#0e0c0a" stroke={C.hair2} strokeWidth="1.5" />
            <circle cx="130" cy="130" r="118" fill="none" stroke={B.bright} strokeWidth="3" strokeDasharray={741} strokeDashoffset={741 * (1 - spin)} transform="rotate(-90 130 130)" style={{ filter: `drop-shadow(0 0 10px ${B.glow})` }} />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * Math.PI) / 6;
              return <line key={i} x1={130 + 98 * Math.sin(a)} y1={130 - 98 * Math.cos(a)} x2={130 + 108 * Math.sin(a)} y2={130 - 108 * Math.cos(a)} stroke={i === 0 ? B.soft : C.hair2} strokeWidth={i === 0 ? 3 : 2} />;
            })}
            <line x1="130" y1="130" x2={130 + 80 * Math.sin(spin * 2 * Math.PI)} y2={130 - 80 * Math.cos(spin * 2 * Math.PI)} stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
            <circle cx="130" cy="130" r="7" fill={C.ink} />
            <circle cx="130" cy="130" r={118 + fired * 40} fill="none" stroke={B.soft} strokeOpacity={0.6 * (1 - fired)} strokeWidth="2" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <Label color={C.ink2} size={16}>Cron trigger</Label>
            <div style={{ fontFamily: F.mono, fontSize: 22, color: B.soft }}>0 0 * * * *</div>
            <Label size={14}>every hour</Label>
          </div>
        </div>
      </At>

      <Wire x1={720} y1={560} x2={1040} y2={560} t={t} at={wakeAt - 0.1} dur={0.6} color={B.bright} runner={[wakeAt + 0.1, wakeAt + 0.9]} opacity={0.8} />

      {/* the DON */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <circle cx={1290} cy={560} r={205} fill="none" stroke={B.blue} strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray={1288} strokeDashoffset={1288 * (1 - tw(t, donAt, donAt + 1.4, 0, 1, INOUT))} />
        <circle cx={1290} cy={560} r={150} fill={B.wash} opacity={tw(t, donAt + 0.4, donAt + 1.4)} />
      </svg>
      {RING.map((p, i) => (
        <At key={i} x={p.x} y={p.y}>
          <Hex size={92} t={t} at={donAt + 0.1 + i * 0.12} />
        </At>
      ))}
      <At x={1290} y={560}>
        <div style={{ ...enter(t, donAt + 1.0), textAlign: "center" }}>
          <div style={{ fontFamily: F.display, fontSize: 52, fontWeight: 300, color: C.ink, lineHeight: 1 }}>DON</div>
          <Label size={13} color={B.soft} style={{ marginTop: 10 }}>oracle network</Label>
        </div>
      </At>
    </AbsoluteFill>
  );
};

