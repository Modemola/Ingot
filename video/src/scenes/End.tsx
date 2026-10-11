import { AbsoluteFill } from "remotion";
import { REPO, SITE } from "../data";
import { C, F, OUT } from "../theme";
import { line, scene, tw, useSeconds } from "../time";
import { IngotMark } from "../ui/Marks";
import { Rise } from "../ui/Type";

export const End: React.FC = () => {
  const t = useSeconds();
  const s = scene("end");
  const L19 = line("L19");
  const inn = tw(t, s.start + 0.2, s.start + 1.6, 0, 1, OUT);
  const black = tw(t, s.end - 1.4, s.end - 0.2);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", width: 1000, height: 1000, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,182,97,0.16), transparent 62%)", opacity: inn }} />
      <div style={{ transform: `translateY(${-130 + (1 - inn) * 24}px) scale(${0.9 + 0.1 * inn})`, opacity: inn }}>
        <IngotMark size={190} sweep={tw(t, s.start + 0.8, s.start + 2.4, -1.2, 1.2)} />
      </div>
      <div style={{ position: "absolute", top: 560, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <Rise text="Ingot" t={t} at={L19.start - 0.6} size={120} align="center" />
        <Rise text="Compute, priced & hedged." t={t} at={L19.start + 0.4} size={48} align="center" accent={["priced", "hedged."]} color={C.ink2} />
        <div style={{ marginTop: 34, display: "flex", gap: 34, fontFamily: F.mono, fontSize: 22, letterSpacing: "0.06em", opacity: tw(t, L19.start + 1.4, L19.start + 2.0) }}>
          <span style={{ color: C.goldSoft }}>{SITE}</span>
          <span style={{ color: C.muted }}>·</span>
          <span style={{ color: C.ink2 }}>{REPO}</span>
        </div>
        <div style={{ marginTop: 10, fontFamily: F.mono, fontSize: 15, letterSpacing: "0.3em", color: C.muted, opacity: tw(t, L19.start + 2.0, L19.start + 2.6) }}>
          METROPOLIS · ONCHAIN FINANCE & TRADING
        </div>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: black }} />
    </AbsoluteFill>
  );
};
