import { AbsoluteFill } from "remotion";
import { BASIS, SNAPSHOT } from "../data";
import { C, F, IN, OUT } from "../theme";
import { line, tw, useSeconds } from "../time";
import { IngotMark, SplitFlap } from "../ui/Marks";
import { Eyebrow, Rise } from "../ui/Type";

// Where each provider's measured basis floats around the board.
const SPOTS = [
  [-640, -150], [640, -160], [-760, 50], [770, 30], [-560, 250], [560, 240], [-240, 330], [250, 340],
];

export const Open: React.FC = () => {
  const t = useSeconds();
  const L1 = line("L1");
  const L2 = line("L2");
  const reveal = L2.end + 0.5;
  const boardOut = tw(t, reveal - 0.3, reveal + 0.5, 0, 1, IN);
  const scatter = tw(t, L2.start, L2.end + 0.4, 0, 1, OUT);
  const price = `$${SNAPSHOT.index.latestPrice.toFixed(4)}`;
  const markIn = tw(t, reveal, reveal + 1.2, 0, 1, OUT);
  const allOut = tw(t, 12.6, 13.2, 0, 1);

  return (
    <AbsoluteFill style={{ opacity: 1 - allOut }}>
      {/* the hairline the board sits on */}
      <div style={{ position: "absolute", left: "50%", top: 640, width: 1200 * tw(t, 0.1, 1.4), height: 1, transform: "translateX(-50%)", background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, opacity: 0.5 * (1 - boardOut) }} />

      {/* the live index on the split-flap board */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: 1 - boardOut, transform: `scale(${1 - boardOut * 0.06})` }}>
        <div style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: "0.34em", color: C.muted, opacity: tw(t, 0.4, 1.0) }}>H100 · USD PER GPU-HOUR</div>
        <SplitFlap text={price} t={t} at={0.5} size={104} />
      </div>

      {/* what each provider actually charges against that index (78-day mean basis) */}
      {BASIS.map(([name, b], i) => {
        const [x, y] = SPOTS[i];
        const inn = tw(t, 1.3 + i * 0.12, 2.3 + i * 0.12);
        const drift = Math.sin(t * 0.6 + i) * 6;
        const out = 1 + scatter * 0.55;
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: 960 + x * out,
              top: 540 + y * out + drift,
              transform: "translate(-50%, -50%)",
              opacity: inn * (1 - scatter) * (1 - boardOut),
              fontFamily: F.mono,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 15, letterSpacing: "0.18em", color: C.muted, textTransform: "uppercase" }}>{name}</div>
            <div style={{ fontSize: 34, color: b < 0 ? C.critical : b > 50 ? C.ember : C.ink2, marginTop: 4 }}>
              {b > 0 ? "+" : ""}
              {b.toFixed(0)}%
            </div>
          </div>
        );
      })}

      {/* the two lines */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", opacity: 1 - boardOut }}>
        <Rise text="The most important price in AI is the price of renting a GPU." t={t} at={L1.start} size={64} align="center" maxWidth={1300} accent={["price"]} out={L2.start - 0.3} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 160, display: "flex", justifyContent: "center" }}>
        <Rise text="And nobody can hedge it." t={t} at={L2.start} size={86} align="center" accent={["hedge"]} out={reveal - 0.2} />
      </div>

      {/* the reveal */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: markIn }}>
        <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,182,97,0.20), transparent 62%)", transform: `scale(${0.6 + markIn * 0.5})` }} />
        <div style={{ transform: `translateY(${(1 - markIn) * 30 - 70}px) scale(${0.85 + markIn * 0.15})` }}>
          <IngotMark size={230} sweep={tw(t, reveal + 0.4, reveal + 1.8, -1.2, 1.2)} />
        </div>
        <div style={{ position: "absolute", top: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <Rise text="Ingot" t={t} at={reveal + 0.35} size={128} align="center" />
          <Rise text="Compute, priced & hedged." t={t} at={reveal + 0.9} size={46} align="center" accent={["priced", "hedged."]} color={C.ink2} />
          <div style={{ marginTop: 18 }}>
            <Eyebrow t={t} at={reveal + 1.6}>Live on Monad testnet</Eyebrow>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
