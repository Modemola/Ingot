import { AbsoluteFill } from "remotion";
import { LIVE_PRINTS, SNAPSHOT } from "../data";
import { C, F, INOUT, OUT } from "../theme";
import { line, scene, tw, useSeconds } from "../time";
import { Browser, SeqFrame } from "../ui/Frames";
import { Eyebrow, Rise } from "../ui/Type";

const Row: React.FC<{ k: string; v: string; t: number; at: number; big?: boolean; hl?: boolean }> = ({ k, v, t, at, big, hl }) => {
  const p = tw(t, at, at + 0.7, 0, 1, OUT);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "18px 0", borderBottom: `1px dashed ${C.hair}`, opacity: p, transform: `translateX(${(1 - p) * 24}px)` }}>
      <span style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: "0.2em", color: hl ? C.gold : C.muted, textTransform: "uppercase" }}>{k}</span>
      <span style={{ fontFamily: F.mono, fontSize: big ? 44 : 26, color: hl ? C.goldSoft : C.ink, textShadow: hl ? "0 0 22px rgba(232,182,97,0.45)" : "none" }}>{v}</span>
    </div>
  );
};

export const Index: React.FC = () => {
  const t = useSeconds();
  const s = scene("index");
  const L5 = line("L5");
  const L6 = line("L6");
  const L7 = line("L7");
  const enter = tw(t, s.start + 0.2, s.start + 1.4, 0, 1, OUT);
  const toDetail = tw(t, L6.start - 0.4, L6.start + 0.6, 0, 1, INOUT);
  const toFinal = tw(t, L7.start - 0.4, L7.start + 0.5, 0, 1, INOUT);
  const zoom = tw(t, L5.start + 1.2, L5.end - 0.3, 0, 1, INOUT);
  const cam = { x: 720 + (444 - 720) * zoom, y: 405 + (450 - 405) * zoom, zoom: 1 + 1.0 * zoom };
  const ix = SNAPSHOT.index;

  // L7: the newest print waits out its finality delay.
  const ring = tw(t, L7.start + 0.6, L7.start + 5.6, 0, 1, (x) => x);
  const final = t > L7.start + 5.6;
  const recent = LIVE_PRINTS.slice(-6);

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 120, top: 70, opacity: 1 - toFinal }}>
        <Eyebrow t={t} at={s.start + 0.3}>II: The index</Eyebrow>
      </div>
      <div style={{ position: "absolute", left: 120, top: 104, opacity: 1 - toDetail }}>
        <Rise text="An on-chain index for one H100 GPU-hour." t={t} at={L5.start + 0.1} size={52} accent={["H100"]} />
      </div>

      {/* the live terminal */}
      <div style={{ position: "absolute", left: 320, top: 200, opacity: enter * (1 - toDetail), transform: `translateY(${(1 - enter) * 80 + toDetail * -30}px) scale(${1 - toDetail * 0.05})` }}>
        <Browser src="footage/trade_top.jpg" width={1280} cam={cam} />
      </div>

      {/* one print, opened up */}
      <div style={{ position: "absolute", left: 110, top: 270, opacity: toDetail * (1 - toFinal), transform: `translateX(${(1 - toDetail) * -60}px)` }}>
        <SeqFrame dir="chart" count={150} progress={tw(t, L6.start, L6.end, 0, 1, INOUT)} width={1000} />
      </div>
      <div style={{ position: "absolute", left: 1180, top: 250, width: 640, opacity: toDetail * (1 - toFinal) }}>
        <div style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: "0.24em", color: C.gold, marginBottom: 6, opacity: tw(t, L6.start, L6.start + 0.5) }}>PRINT #99 · LIVE ON MONAD</div>
        <Row k="Methodology" v={`${ix.methodologyHash.slice(0, 8)}…${ix.methodologyHash.slice(-4)}`} t={t} at={L6.start + 1.2} />
        <Row k="Quotes" v={`${ix.latestSamples}`} t={t} at={L6.start + 2.6} />
        <Row k="Venues" v={`${ix.latestVenues}`} t={t} at={L6.start + 3.9} />
        <Row k="Finality" v={`${ix.finalityDelaySec} s`} t={t} at={L6.start + 5.0} />
        <Row k="Price · USD/GPU-hr" v={`$${ix.latestPrice.toFixed(4)}`} t={t} at={L6.start + 6.2} big hl />
      </div>

      {/* provisional, then final */}
      <AbsoluteFill style={{ opacity: toFinal }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center" }}>
          <Rise text="Provisional, then final." t={t} at={L7.start} size={76} align="center" accent={["final."]} />
        </div>
        <div style={{ position: "absolute", left: 260, right: 260, top: 520, height: 2, background: C.hair2 }} />
        {recent.map(([d, p], i) => {
          const x = 300 + i * 220;
          const last = i === recent.length - 1;
          const o = tw(t, L7.start + 0.1 + i * 0.08, L7.start + 0.6 + i * 0.08);
          const col = last ? (final ? C.gold : C.ember) : C.goldDeep;
          return (
            <div key={d} style={{ position: "absolute", left: x, top: 520, opacity: o }}>
              {last && (
                <svg width={120} height={120} style={{ position: "absolute", left: -60, top: -60 }}>
                  <circle cx={60} cy={60} r={44} fill="none" stroke={C.hair2} strokeWidth={3} />
                  <circle cx={60} cy={60} r={44} fill="none" stroke={final ? C.gold : C.ember} strokeWidth={3.5} strokeDasharray={`${2 * Math.PI * 44 * ring} 999`} transform="rotate(-90 60 60)" strokeLinecap="round" />
                </svg>
              )}
              <div style={{ position: "absolute", left: -11, top: -11, width: 22, height: 22, borderRadius: 11, background: col, boxShadow: `0 0 ${last ? 30 : 12}px ${col}` }} />
              <div style={{ position: "absolute", left: 0, top: 80, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
                <div style={{ fontFamily: F.mono, fontSize: 28, color: last ? C.goldSoft : C.ink2 }}>${p.toFixed(4)}</div>
                <div style={{ fontFamily: F.mono, fontSize: 14, letterSpacing: "0.12em", color: C.muted, marginTop: 6 }}>{d.slice(5)} UTC</div>
              </div>
              {last && (
                <div style={{ position: "absolute", left: 0, top: -112, transform: "translateX(-50%)", fontFamily: F.mono, fontSize: 18, letterSpacing: "0.24em", color: final ? C.gold : C.ember, whiteSpace: "nowrap" }}>
                  {final ? "FINAL · SETTLEABLE" : `PROVISIONAL · ${Math.ceil(60 * (1 - ring))}s`}
                </div>
              )}
            </div>
          );
        })}
        {/* a bad scrape: struck out inside the window, before it ever counts */}
        <div style={{ position: "absolute", left: 300 + 6 * 220, top: 520, opacity: tw(t, L7.start + 3.5, L7.start + 4.0) * (1 - tw(t, L7.start + 6.8, L7.start + 7.4)) }}>
          <div style={{ position: "absolute", left: -13, top: -13, width: 26, height: 26, borderRadius: 13, border: `2px dashed ${C.critical}`, background: "rgba(224,104,77,0.12)" }} />
          <div style={{ position: "absolute", left: -24, top: -1, width: 48 * tw(t, L7.start + 4.8, L7.start + 5.2, 0, 1, OUT), height: 3, background: C.critical, transform: "rotate(-35deg)", boxShadow: `0 0 12px ${C.critical}` }} />
          <div style={{ position: "absolute", left: 0, top: 80, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
            <div style={{ fontFamily: F.mono, fontSize: 28, color: C.critical, textDecoration: t > L7.start + 5.0 ? "line-through" : "none" }}>bad scrape</div>
            <div style={{ fontFamily: F.mono, fontSize: 14, letterSpacing: "0.2em", color: C.critical, marginTop: 6, opacity: tw(t, L7.start + 5.0, L7.start + 5.5) }}>REVOKED</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
