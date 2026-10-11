import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, F, INOUT, OUT } from "../theme";
import { line, scene, tw, useSeconds } from "../time";
import { Browser, Card } from "../ui/Frames";
import { Callout, Cursor } from "../ui/Marks";
import { Eyebrow, Rise } from "../ui/Type";

// The ticket capture is 907×2429 px; shown at 560 px wide.
const TW = 560;
const K = TW / 907;
const at = (y: number) => y * 1.214 * K; // rows measured on the 747-wide preview

export const Trade: React.FC = () => {
  const t = useSeconds();
  const s = scene("trade");
  const L8 = line("L8");
  const L9 = line("L9");
  const L10 = line("L10");
  const enter = tw(t, s.start + 0.2, s.start + 1.3, 0, 1, OUT);
  const zoom = tw(t, L8.start + 1.0, L8.end - 0.2, 0, 1, INOUT);
  const toTicket = tw(t, L9.start - 0.5, L9.start + 0.4, 0, 1, INOUT);
  const fillAt = L9.end + 0.6; // the click
  const toFill = tw(t, fillAt + 0.25, fillAt + 0.9, 0, 1, INOUT);
  const toPos = tw(t, L10.start - 0.4, L10.start + 0.5, 0, 1, INOUT);
  const scroll = tw(t, L9.start + 3.0, L9.start + 6.4, 0, 1, INOUT) * 300;

  const state = t < L9.start + 0.35 ? "00-empty" : t < L9.start + 0.8 ? "01-focus" : t < L9.start + 1.3 ? "02-one" : t < fillAt + 0.15 ? "03-ten" : "04-filled";
  const TX = 360;
  const TY = 150;

  // cursor path: into the size field, type, then down to Go long
  const sizeX = TX + 247;
  const sizeY = TY + at(540) - 0;
  const goX = TX + 330;
  const goY = TY + at(1488) - scroll;
  const cMove = tw(t, L9.end - 0.6, fillAt - 0.05, 0, 1, INOUT);
  const cx = sizeX + (goX - sizeX) * cMove;
  const cy = sizeY + (goY - sizeY) * cMove;

  const pulse = tw(t, fillAt + 0.2, fillAt + 1.6, 0, 1, OUT);

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 120, top: 70, opacity: 1 - toPos }}>
        <Eyebrow t={t} at={s.start + 0.3}>III — Trading it</Eyebrow>
      </div>

      {/* L8: the terminal, then into the ticket */}
      <div style={{ position: "absolute", left: 120, top: 104, opacity: 1 - toTicket }}>
        <Rise text="Cash-settled. 730 GPU-hour lots." t={t} at={L8.start + 0.1} size={52} accent={["730"]} />
      </div>
      <div style={{ position: "absolute", left: 320, top: 200, opacity: enter * (1 - toTicket) }}>
        <Browser src="footage/trade_top.jpg" width={1280} cam={{ x: 720 + (1100 - 720) * zoom, y: 405 + (520 - 405) * zoom, zoom: 1 + 0.9 * zoom }} />
      </div>

      {/* L9: the ticket, lifted out of the page */}
      <div style={{ position: "absolute", left: TX, top: TY, width: TW, height: 800, overflow: "hidden", opacity: toTicket * (1 - toFill), transform: `translateY(${(1 - toTicket) * 50}px)`, borderRadius: 4, boxShadow: "0 50px 120px -30px rgba(0,0,0,0.95), 0 0 90px -20px rgba(232,182,97,0.16)" }}>
        <Img src={staticFile(`footage/ticket/${state}.jpg`)} style={{ width: TW, transform: `translateY(${-scroll}px)` }} />
      </div>
      {toTicket > 0.5 && toFill < 1 && (
        <div style={{ opacity: 1 - toFill }}>
          <Callout x={TX + TW - 16} y={TY + at(868) - scroll} dx={130} label="Your fill" value="$3.7056" t={t} at={L9.start + 1.6} />
          <Callout x={TX + TW - 16} y={TY + at(1048) - scroll} dx={130} label="Margin locked" value="$5,410.21" t={t} at={L9.start + 2.6} />
          <Callout x={TX + TW - 16} y={TY + at(1136) - scroll} dx={420} label="Taker fee" value="$27.05" t={t} at={L9.start + 3.6} />
          <Callout x={TX + TW - 16} y={TY + at(1226) - scroll} dx={130} label="Worst fill · enforced on-chain" value="$3.7241" t={t} at={L9.start + 4.8} />
        </div>
      )}
      {toTicket > 0.6 && toFill < 0.5 && <Cursor x={cx} y={cy} t={t} click={fillAt} visible={tw(t, L9.start + 0.1, L9.start + 0.4)} />}
      <div style={{ position: "absolute", left: 1150, top: 820, width: 700, opacity: toTicket * (1 - toFill) * tw(t, L9.start + 5.2, L9.start + 5.9) }}>
        <Rise text="The worst fill, enforced on-chain." t={t} at={L9.start + 5.2} size={44} accent={["on-chain."]} />
      </div>

      {/* the fill lands: one block */}
      <AbsoluteFill style={{ opacity: toFill * (1 - toPos), alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `scale(${0.96 + toFill * 0.04})` }}>
          <Browser src="footage/submit/0039.jpg" width={1280} cam={{ x: 1000, y: 470, zoom: 1.35 }} />
        </div>
        {[0, 0.25, 0.5].map((d) => {
          const q = tw(t, fillAt + 0.25 + d, fillAt + 1.6 + d, 0, 1, OUT);
          return <div key={d} style={{ position: "absolute", width: 120 + 900 * q, height: 120 + 900 * q, borderRadius: "50%", border: `2px solid rgba(232,182,97,${0.6 * (1 - q)})` }} />;
        })}
        <div style={{ position: "absolute", top: 110, fontFamily: F.mono, fontSize: 22, letterSpacing: "0.3em", color: C.gold, opacity: pulse * (1 - toPos), textShadow: "0 0 18px rgba(232,182,97,0.6)" }}>
          FILLED · ONE MONAD BLOCK
        </div>
      </AbsoluteFill>

      {/* L10: marked continuously */}
      <AbsoluteFill style={{ opacity: toPos, alignItems: "center" }}>
        <div style={{ marginTop: 120 }}>
          <Rise text="Settled in under a second." t={t} at={L10.start} size={64} align="center" accent={["second."]} />
        </div>
        <div style={{ marginTop: 48, transform: `translateY(${(1 - toPos) * 40}px)` }}>
          <Card src="footage/position.jpg" width={1150} />
        </div>
        {/* the mark row, live against the index */}
        <div style={{ position: "absolute", left: 404, top: 638, width: 544, height: 44, border: `1.5px solid ${C.gold}`, borderRadius: 4, boxShadow: "0 0 24px rgba(232,182,97,0.35), inset 0 0 18px rgba(232,182,97,0.12)", opacity: tw(t, L10.start + 2.4, L10.start + 3.0) }} />
        <Callout x={404} y={660} dx={34} side="left" label="Marked to the index" t={t} at={L10.start + 2.6} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
