import React from "react";
import { AbsoluteFill } from "remotion";
import { SNAPSHOT } from "../data";
import { C, F, OUT } from "../theme";
import { line, scene, tw, useSeconds } from "../time";
import { Eyebrow } from "../ui/Type";

const Tile: React.FC<{ big: string; label: string; t: number; at: number }> = ({ big, label, t, at }) => {
  const p = tw(t, at, at + 0.8, 0, 1, OUT);
  return (
    <div style={{ width: 380, padding: "34px 30px", border: `1px solid ${C.hair2}`, background: "rgba(19,16,13,0.8)", opacity: p, transform: `translateY(${(1 - p) * 30}px)`, position: "relative" }}>
      {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([r, b], i) => (
        <span key={i} style={{ position: "absolute", width: 12, height: 12, borderColor: "rgba(232,182,97,0.6)", borderStyle: "solid", borderWidth: `${b ? 0 : 1}px ${r ? 1 : 0}px ${b ? 1 : 0}px ${r ? 0 : 1}px`, left: r ? undefined : -1, right: r ? -1 : undefined, top: b ? undefined : -1, bottom: b ? -1 : undefined }} />
      ))}
      <div style={{ fontFamily: F.mono, fontSize: 92, color: C.goldSoft, lineHeight: 1, textShadow: "0 0 30px rgba(232,182,97,0.35)" }}>{big}</div>
      <div style={{ fontFamily: F.sans, fontSize: 24, color: C.ink2, marginTop: 16, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
};

export const Proof: React.FC = () => {
  const t = useSeconds();
  const s = scene("proof");
  const L18 = line("L18");
  const out = tw(t, s.end - 0.7, s.end);
  const addrs: [string, string][] = [
    ["IngotIndex", SNAPSHOT.index.address],
    ["IngotMarket", SNAPSHOT.market.address],
    ["UnderwriterVault", SNAPSHOT.vault.address],
    ["HedgedCredit", SNAPSHOT.credit.address],
  ];
  return (
    <AbsoluteFill style={{ opacity: 1 - out, alignItems: "center" }}>
      <div style={{ marginTop: 190 }}>
        <Eyebrow t={t} at={s.start + 0.2}>Built to be checked</Eyebrow>
      </div>
      <div style={{ display: "flex", gap: 28, marginTop: 60 }}>
        <Tile big="116" label="contract tests, every finding pinned by one" t={t} at={L18.start + 0.1} />
        <Tile big="3" label="adversarial security reviews" t={t} at={L18.start + 2.1} />
        <Tile big="E2E" label="this exact flow, in a browser, on every push" t={t} at={L18.start + 3.8} />
        <Tile big="78" label="days of real posted H100 prices" t={t} at={L18.start + 7.6} />
      </div>
      <div style={{ marginTop: 64, display: "flex", gap: 40, fontFamily: F.mono, fontSize: 17, letterSpacing: "0.22em", color: C.muted, opacity: tw(t, L18.start + 9.0, L18.start + 9.8) }}>
        <span>MONAD TESTNET</span><span style={{ color: C.gold }}>·</span><span>CHAINLINK CRE ORACLE PATH</span><span style={{ color: C.gold }}>·</span><span>ENVIO INDEXER</span><span style={{ color: C.gold }}>·</span><span>FOUNDRY</span>
      </div>
      <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "auto auto", columnGap: 26, rowGap: 10, fontFamily: F.mono, fontSize: 17, opacity: tw(t, L18.start + 9.6, L18.start + 10.4) }}>
        {addrs.map(([n, a]) => (
          <React.Fragment key={n}>
            <span style={{ color: C.muted, letterSpacing: "0.12em", textAlign: "right" }}>{n}</span>
            <span style={{ color: C.ink2 }}>{a}</span>
          </React.Fragment>
        ))}
      </div>
    </AbsoluteFill>
  );
};
