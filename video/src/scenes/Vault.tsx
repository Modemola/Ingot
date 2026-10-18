import { AbsoluteFill } from "remotion";
import { C, F, INOUT, OUT } from "../theme";
import { line, scene, tw, useSeconds } from "../time";
import { Browser } from "../ui/Frames";
import { Eyebrow, Rise } from "../ui/Type";

export const Vault: React.FC = () => {
  const t = useSeconds();
  const s = scene("vault");
  const L17 = line("L17");
  const enter = tw(t, s.start + 0.2, s.start + 1.2, 0, 1, OUT);
  const out = tw(t, s.end - 0.7, s.end);
  // health falls toward maintenance as the vault takes on one-sided risk
  const stretch = tw(t, L17.start + 6.2, L17.start + 9.4, 0, 1, INOUT);
  const health = 0.82 - 0.66 * stretch;
  const stopped = t > L17.start + 9.2;
  const quotes = [0, 1, 2, 3, 4, 5];

  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <div style={{ position: "absolute", left: 120, top: 70 }}>
        <Eyebrow t={t} at={s.start + 0.3}>V — The other side</Eyebrow>
      </div>
      <div style={{ position: "absolute", left: 120, top: 104 }}>
        <Rise text="The vault takes the other side." t={t} at={L17.start} size={52} accent={["other", "side."]} />
      </div>
      <div style={{ position: "absolute", left: 110, top: 250, opacity: enter, transform: `translateY(${(1 - enter) * 60}px)` }}>
        <Browser src="footage/underwrite_top.jpg" url="ingotx.vercel.app/underwrite" width={1040} cam={{ x: 720, y: 405, zoom: 1 }} />
      </div>

      {/* quotes both ways off the mark */}
      <div style={{ position: "absolute", left: 1220, top: 280, width: 600, height: 600 }}>
        <svg width={620} height={420} style={{ overflow: "visible" }}>
          <line x1={40} x2={580} y1={200} y2={200} stroke={C.hair2} />
          <text x={310} y={232} textAnchor="middle" fill={C.muted} fontFamily="GeistMono" fontSize={15} letterSpacing={3} opacity={tw(t, L17.start + 1.0, L17.start + 1.6)}>MARK</text>
          {quotes.map((i) => {
            const st = L17.start + 2.0 + i * 0.5;
            const p = tw(t, st, st + 0.9, 0, 1, OUT);
            const up = i % 2 === 0;
            const dim = stopped && up ? 0.15 : 1;
            return (
              <g key={i} opacity={p * dim}>
                <line x1={310} x2={310 + (up ? 1 : -1) * (60 + i * 26)} y1={200} y2={up ? 120 - i * 6 : 280 + i * 6} stroke={up ? C.ember : C.good} strokeWidth={2} />
                <circle cx={310 + (up ? 1 : -1) * (60 + i * 26)} cy={up ? 120 - i * 6 : 280 + i * 6} r={6} fill={up ? C.ember : C.good} />
              </g>
            );
          })}
          <circle cx={310} cy={200} r={34} fill={C.panel} stroke={C.gold} strokeWidth={2} opacity={tw(t, L17.start + 0.6, L17.start + 1.2)} />
          <text x={310} y={206} textAnchor="middle" fill={C.goldSoft} fontFamily="GeistMono" fontSize={16} opacity={tw(t, L17.start + 0.6, L17.start + 1.2)}>VAULT</text>
          <text x={520} y={90} fill={C.ember} fontFamily="GeistMono" fontSize={15} letterSpacing={2} opacity={tw(t, L17.start + 2.6, L17.start + 3.2) * (stopped ? 0.25 : 1)}>ASK</text>
          <text x={60} y={330} fill={C.good} fontFamily="GeistMono" fontSize={15} letterSpacing={2} opacity={tw(t, L17.start + 2.6, L17.start + 3.2)}>BID</text>
        </svg>
        <div style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: "0.22em", color: C.muted, marginTop: 6, opacity: tw(t, L17.start + 4.0, L17.start + 4.6) }}>
          EARNS THE SPREAD + THE TAKER FEES
        </div>
        {/* margined like any trader */}
        <div style={{ marginTop: 34, opacity: tw(t, L17.start + 5.4, L17.start + 6.0) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.mono, fontSize: 15, letterSpacing: "0.2em", color: C.muted }}>
            <span>VAULT MARGIN HEALTH</span>
            <span style={{ color: stopped ? C.critical : C.good }}>{stopped ? "AT MAINTENANCE" : "HEALTHY"}</span>
          </div>
          <div style={{ position: "relative", marginTop: 12, height: 12, background: C.hair, borderRadius: 6 }}>
            <div style={{ width: `${health * 100}%`, height: "100%", borderRadius: 6, background: health < 0.25 ? C.critical : `linear-gradient(90deg, ${C.goldDeep}, ${C.gold})` }} />
            <div style={{ position: "absolute", left: "18%", top: -8, width: 2, height: 28, background: C.critical }} />
          </div>
          <div style={{ marginTop: 22, fontFamily: F.display, fontSize: 34, color: C.ink, fontWeight: 300, opacity: stopped ? tw(t, L17.start + 9.2, L17.start + 9.8) : 0 }}>
            Risk-adding quotes <span style={{ fontStyle: "italic", color: C.critical }}>stop.</span> Closing still fills.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
