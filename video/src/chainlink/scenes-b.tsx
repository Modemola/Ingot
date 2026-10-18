import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { C, F, INOUT, OUT } from "../theme";
import { tw, useSeconds } from "../time";
import { At, B, Cross, Hex, Label, Panel, Pill, Price, Stamp, Tick, Wire, enter } from "./kit";
import { L, pop, scene, wordT } from "./time";

/// Five nodes in a row: the DON, drawn so the eye can follow each one.
const NODES = [480, 720, 960, 1200, 1440];
const NODE_Y = 600;
/// What each node computed from the live feed. Node 4 is the one that gets fed bad data.
const HONEST = ["$3.756", "$3.761", "$3.752", "$3.758", "$3.757"];
const LIAR = 3;

/// A handful of the real quotes in the feed (on-demand H100, USD per GPU-hour).
const QUOTES = [
  ["Lambda", "$3.29"],
  ["RunPod", "$2.89"],
  ["CoreWeave", "$6.16"],
  ["Nebius", "$4.50"],
  ["Crusoe", "$4.50"],
  ["Hyperstack", "$2.50"],
  ["DataCrunch", "$4.21"],
  ["AWS", "$6.88"],
];

// ---------------------------------------------------------------------------------------------
// 5 · Every node fetches and computes on its own
// ---------------------------------------------------------------------------------------------
export const Fetch: React.FC = () => {
  const t = useSeconds();
  const s = scene("fetch");
  const fetchAt = wordT("L8", "fetches");
  const httpAt = wordT("L8", "h t t p");
  const methodAt = wordT("L9", "median") - 0.3;
  const trimAt = wordT("L9", "trimmed");
  return (
    <AbsoluteFill>
      <At x={960} y={150}>
        <div style={enter(t, s.start + 0.2)}>
          <Label color={C.muted}>Each node, independently</Label>
        </div>
      </At>
      {/* the quotes */}
      <At x={960} y={250}>
        <div style={{ display: "flex", gap: 14 }}>
          {QUOTES.map(([name, px], i) => (
            <div key={name} style={{ transform: `scale(${pop(t, fetchAt - 0.3 + i * 0.09)})`, opacity: tw(t, fetchAt - 0.3 + i * 0.09, fetchAt + i * 0.09) }}>
              <Pill>
                <span style={{ color: C.muted }}>{name}</span>
                <span style={{ color: C.ink }}>{px}</span>
              </Pill>
            </div>
          ))}
        </div>
      </At>
      {/* the HTTP capability: a bus, and a drop to every node */}
      <Wire x1={360} y1={340} x2={1560} y2={340} t={t} at={fetchAt + 0.4} dur={0.8} color={B.blue} opacity={0.8} />
      {NODES.map((x, i) => (
        <Wire key={x} x1={x} y1={340} x2={x} y2={NODE_Y - 80} t={t} at={fetchAt + 0.9 + i * 0.08} dur={0.4} color={B.blue} opacity={0.8} runner={[fetchAt + 1.3 + i * 0.25, fetchAt + 2.0 + i * 0.25]} />
      ))}
      <At x={1560} y={312}>
        <div style={{ ...enter(t, httpAt - 0.2), transform: "translateX(-100%)" }}>
          <Label color={B.soft} size={14} style={{ textAlign: "right" }}>HTTP capability</Label>
        </div>
      </At>
      {NODES.map((x, i) => {
        const valAt = trimAt + 0.5 + i * 0.12;
        return (
          <At key={x} x={x} y={NODE_Y}>
            <Hex size={150} t={t} at={s.start + 0.2 + i * 0.07}>
              <div style={{ position: "relative", height: 34, width: 120, textAlign: "center" }}>
                <div style={{ position: "absolute", inset: 0, fontFamily: F.mono, fontSize: 15, letterSpacing: "0.2em", color: B.soft, opacity: 1 - tw(t, valAt - 0.2, valAt) }}>NODE {i + 1}</div>
                <div style={{ position: "absolute", inset: 0, fontFamily: F.mono, fontSize: 28, color: C.goldSoft, opacity: tw(t, valAt, valAt + 0.3), transform: `translateY(${(1 - tw(t, valAt, valAt + 0.4, 0, 1, OUT)) * 8}px)` }}>{HONEST[i]}</div>
              </div>
            </Hex>
          </At>
        );
      })}
      {/* the methodology */}
      <At x={960} y={835}>
        <div style={{ ...enter(t, methodAt), display: "flex", alignItems: "center", gap: 22 }}>
          <Panel style={{ padding: "18px 26px", display: "flex", alignItems: "center", gap: 18 }}>
            <Label size={14} color={C.muted}>per provider</Label>
            <span style={{ fontFamily: F.display, fontSize: 32, color: C.ink, fontStyle: "italic" }}>median</span>
          </Panel>
          <span style={{ fontFamily: F.mono, fontSize: 26, color: C.gold, opacity: tw(t, trimAt - 0.3, trimAt) }}>→</span>
          <div style={{ opacity: tw(t, trimAt - 0.3, trimAt + 0.2) }}>
            <Panel style={{ padding: "18px 26px", display: "flex", alignItems: "center", gap: 18 }}>
              <Label size={14} color={C.muted}>across providers</Label>
              <span style={{ fontFamily: F.display, fontSize: 32, color: C.ink, fontStyle: "italic" }}>10% trimmed mean</span>
            </Panel>
          </div>
        </div>
      </At>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// 6 · One node lies; the median shrugs
// ---------------------------------------------------------------------------------------------
const SORTED = [2, 0, 4, 1, LIAR]; // node indices, by value once the liar reports $99
const SLOT_Y = 860;
const slotX = (k: number) => 600 + k * 180;

export const Consensus: React.FC = () => {
  const t = useSeconds();
  const badAt = wordT("L10", "bad data");
  const ninetyAt = wordT("L10", "ninety-nine");
  const medianAt = wordT("L11", "median") - 0.2;
  const outvotedAt = wordT("L11", "outvoted");
  const isBad = tw(t, badAt, badAt + 0.3);
  const shake = t > ninetyAt && t < ninetyAt + 0.5 ? Math.sin(t * 80) * 6 * (1 - (t - ninetyAt) / 0.5) : 0;
  const fly = tw(t, medianAt, medianAt + 0.6, 0, 1, INOUT);
  const lit = tw(t, medianAt + 1.4, medianAt + 1.8);
  const out = tw(t, outvotedAt, outvotedAt + 0.4);
  return (
    <AbsoluteFill>
      <At x={960} y={330}>
        <Title t={t} />
      </At>
      {NODES.map((x, i) => {
        const liar = i === LIAR;
        return (
          <At key={x} x={x + (liar ? shake : 0)} y={NODE_Y}>
            <div style={{ opacity: liar ? 1 - 0.6 * out : 1 }}>
              <Hex size={150} t={t} at={-10} color={liar && isBad > 0.5 ? C.critical : B.bright}>
                <div style={{ position: "relative", height: 34, width: 120, textAlign: "center" }}>
                  <div style={{ position: "absolute", inset: 0, fontFamily: F.mono, fontSize: 28, color: liar ? interpolateColor(isBad) : C.goldSoft, opacity: 1 - 0.65 * fly }}>{liar && t > ninetyAt ? "$99.00" : HONEST[i]}</div>
                </div>
              </Hex>
            </div>
          </At>
        );
      })}
      {liarLabel(t, badAt)}
      {/* the values fall into order */}
      {SORTED.map((node, k) => {
        // Drop straight down, then slide into order: leftward cards pass below, rightward above,
        // so no two ever overlap on the way.
        const fromX = NODES[node];
        const toX = slotX(k);
        const pA = tw(t, medianAt, medianAt + 0.6, 0, 1, INOUT);
        const pB = tw(t, medianAt + 0.6, medianAt + 1.4, 0, 1, INOUT);
        const lane = toX < fromX ? 1 : -1;
        const x = interpolate(pB, [0, 1], [fromX, toX]);
        const y = interpolate(pA, [0, 1], [NODE_Y, SLOT_Y]) + lane * Math.sin(Math.PI * pB) * 62;
        const value = node === LIAR ? "$99.00" : HONEST[node];
        const median = k === 2;
        return (
          <At key={node} x={x} y={y}>
            <div style={{ opacity: tw(t, medianAt, medianAt + 0.2) * (node === LIAR ? 1 - 0.55 * out : 1), position: "relative" }}>
              <Panel accent={median && lit > 0 ? C.gold : node === LIAR ? "rgba(224,104,77,0.6)" : C.hair2} style={{ width: 150, padding: "16px 0", textAlign: "center", boxShadow: median && lit > 0 ? `0 0 ${40 * lit}px -6px rgba(232,182,97,0.7)` : undefined }}>
                <Price value={value} size={28} color={node === LIAR ? C.critical : median ? C.goldSoft : C.ink2} glow={median && lit > 0.5} />
              </Panel>
              {median && (
                <div style={{ position: "absolute", left: 0, right: 0, top: -44, textAlign: "center", opacity: lit }}>
                  <Label color={C.gold} size={14}>median</Label>
                </div>
              )}
              {node === LIAR && (
                <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                  <Stamp text="OUTVOTED" t={t} at={outvotedAt} size={22} />
                </div>
              )}
            </div>
          </At>
        );
      })}
      <At x={960} y={SLOT_Y + 92}>
        <div style={{ opacity: tw(t, medianAt + 1.2, medianAt + 1.7) }}>
          <Label size={13}>sorted · lowest to highest</Label>
        </div>
      </At>
    </AbsoluteFill>
  );

  function Title({ t }: { t: number }) {
    return (
      <div style={{ ...enter(t, scene("consensus").start + 0.2), display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <Label color={C.muted}>Across nodes</Label>
        <div style={{ fontFamily: F.display, fontSize: 54, fontWeight: 300, color: C.ink }}>
          Consensus is a <span style={{ fontStyle: "italic", color: B.soft }}>median</span>, not an average
        </div>
      </div>
    );
  }
};

function interpolateColor(p: number) {
  return p > 0.5 ? C.critical : C.goldSoft;
}

function liarLabel(t: number, at: number) {
  const x = NODES[LIAR];
  return (
    <At x={x} y={NODE_Y + 108}>
      <div style={{ ...enter(t, at + 0.2), whiteSpace: "nowrap" }}>
        <Label color={C.critical} size={14}>fed bad data</Label>
      </div>
    </At>
  );
}

// ---------------------------------------------------------------------------------------------
// 7 · One signed report, forwarded and checked at the door
// ---------------------------------------------------------------------------------------------
const STOP = { don: 330, fwd: 960, rcv: 1590 };
const PIPE_Y = 430;

export const Deliver: React.FC = () => {
  const t = useSeconds();
  const s = scene("deliver");
  const reportAt = L("L12").start + 0.2;
  const sigAt = wordT("L12", "signed");
  const toFwd = wordT("L13", "forwarder") - 0.4;
  const verifyAt = wordT("L13", "verifies");
  const toRcv = wordT("L13", "delivers");
  const senderAt = wordT("L14", "sender");
  const workflowAt = wordT("L14", "workflow");
  const strangerAt = wordT("L14", "anyone else") - 0.4;
  const awayAt = wordT("L14", "politely");
  const leg1 = tw(t, toFwd, toFwd + 1.0, 0, 1, INOUT);
  const leg2 = tw(t, toRcv, toRcv + 1.1, 0, 1, INOUT);
  const cardX = STOP.don + (STOP.fwd - STOP.don) * leg1 + (STOP.rcv - STOP.fwd) * leg2;
  const verified = tw(t, verifyAt + 0.2, verifyAt + 0.6);
  const landed = tw(t, toRcv + 1.0, toRcv + 1.3);
  // The stranger: walks up, is refused, walks off.
  const sIn = tw(t, strangerAt, strangerAt + 0.8, 0, 1, OUT);
  const sOut = tw(t, awayAt + 0.5, awayAt + 1.3, 0, 1, INOUT);
  const strangerX = 1400 + 660 * (1 - sIn) + 760 * sOut;
  return (
    <AbsoluteFill>
      {/* the stops */}
      <Wire x1={STOP.don + 110} y1={PIPE_Y} x2={STOP.fwd - 170} y2={PIPE_Y} t={t} at={toFwd - 0.6} dur={0.6} color={B.blue} opacity={0.7} />
      <Wire x1={STOP.fwd + 170} y1={PIPE_Y} x2={STOP.rcv - 170} y2={PIPE_Y} t={t} at={toRcv - 0.6} dur={0.6} color={C.goldDeep} opacity={0.8} />
      <At x={STOP.don} y={PIPE_Y}>
        <div style={{ ...enter(t, s.start + 0.2), display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", width: 200, height: 170 }}>
            {[
              [100, 52],
              [52, 122],
              [148, 122],
            ].map(([x, y], i) => (
              <At key={i} x={x} y={y}>
                <Hex size={78} t={t} at={s.start + 0.2 + i * 0.1} glow={0.6} />
              </At>
            ))}
          </div>
          <Label color={B.soft} size={15}>DON</Label>
        </div>
      </At>
      <At x={STOP.fwd} y={PIPE_Y}>
        <div style={enter(t, toFwd - 0.6)}>
          <Panel accent={verified > 0.5 ? B.bright : C.hair2} style={{ width: 330, padding: "26px 28px", textAlign: "center", boxShadow: verified > 0.5 ? `0 0 50px -14px ${B.glow}` : undefined }}>
            <Label color={B.soft} size={14}>Chainlink</Label>
            <div style={{ marginTop: 10, fontFamily: F.display, fontSize: 40, fontWeight: 300, color: C.ink }}>Forwarder</div>
            <div style={{ marginTop: 8, fontFamily: F.sans, fontSize: 20, color: C.ink2 }}>verifies the signatures</div>
          </Panel>
        </div>
      </At>
      <At x={STOP.rcv} y={PIPE_Y}>
        <div style={enter(t, toRcv - 0.6)}>
          <Panel accent={landed > 0.5 ? C.gold : C.hair2} style={{ width: 340, padding: "26px 28px", textAlign: "center", boxShadow: landed > 0.5 ? "0 0 50px -14px rgba(232,182,97,0.6)" : undefined }}>
            <Label color={C.gold} size={14}>On Monad</Label>
            <div style={{ marginTop: 10, fontFamily: F.display, fontSize: 36, fontWeight: 300, color: C.ink }}>IngotIndexReceiver</div>
            <div style={{ marginTop: 8, fontFamily: F.sans, fontSize: 20, color: C.ink2 }}>onReport()</div>
          </Panel>
        </div>
      </At>

      {/* the report */}
      <At x={cardX} y={PIPE_Y - 190}>
        <div style={{ ...enter(t, reportAt), transform: `translateY(${(1 - tw(t, reportAt, reportAt + 0.7, 0, 1, OUT)) * 16}px) scale(${1 - 0.15 * landed})` }}>
          <Panel accent={C.hair2} style={{ width: 250, padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Label size={12} color={C.muted}>Report</Label>
              <Label size={12} color={B.soft}>ecdsa</Label>
            </div>
            <Price value="$3.7570" size={34} style={{ marginTop: 6 }} />
            <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
              {[0, 1, 2, 3, 4].map((i) => {
                const on = pop(t, sigAt + i * 0.08, 0.4);
                return <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: verified > 0.5 ? C.good : B.bright, transform: `scale(${on})`, boxShadow: `0 0 8px ${verified > 0.5 ? "rgba(127,209,166,0.7)" : B.glow}` }} />;
              })}
              <span style={{ marginLeft: 6, fontFamily: F.mono, fontSize: 14, color: C.muted, opacity: tw(t, sigAt + 0.4, sigAt + 0.8) }}>signed</span>
            </div>
          </Panel>
        </div>
      </At>

      {/* the door policy */}
      <At x={STOP.rcv} y={PIPE_Y + 220}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start", width: 380 }}>
          <div style={{ ...enter(t, senderAt), display: "flex", gap: 14, alignItems: "center" }}>
            <Tick t={t} at={senderAt + 0.15} />
            <span style={{ fontFamily: F.sans, fontSize: 22, color: C.ink2 }}>sender is the forwarder</span>
          </div>
          <div style={{ ...enter(t, workflowAt), display: "flex", gap: 14, alignItems: "center" }}>
            <Tick t={t} at={workflowAt + 0.15} />
            <span style={{ fontFamily: F.sans, fontSize: 22, color: C.ink2 }}>workflow owner is pinned</span>
          </div>
        </div>
      </At>

      {/* someone else tries the door */}
      {t > strangerAt && (
        <At x={strangerX} y={PIPE_Y + 400}>
          <div style={{ opacity: sIn * (1 - sOut), display: "flex", alignItems: "center", gap: 16 }}>
            <Pill color={C.muted} style={{ fontSize: 18 }}>
              0xC0FFEE…7a2 <span style={{ color: C.hair2 }}>·</span> onReport()
            </Pill>
            <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: tw(t, awayAt - 0.4, awayAt) }}>
              <Cross t={t} at={awayAt - 0.4} />
              <span style={{ fontFamily: F.mono, fontSize: 18, color: C.critical, whiteSpace: "nowrap" }}>revert NotForwarder()</span>
            </div>
          </div>
        </At>
      )}
    </AbsoluteFill>
  );
};
