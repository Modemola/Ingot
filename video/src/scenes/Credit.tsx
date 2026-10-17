import { AbsoluteFill, Img, staticFile } from "remotion";
import { LOAN } from "../data";
import { C, F, INOUT, OUT } from "../theme";
import { line, scene, tw, useSeconds } from "../time";
import { Browser } from "../ui/Frames";
import { Callout, Cursor } from "../ui/Marks";
import { Eyebrow, Rise } from "../ui/Type";

// credit_form.jpg is 960×2712 (rows measured on its 708-wide preview, ×1.356).
const FW = 480;
const FK = FW / 960;
const fy = (y: number) => y * 1.356 * FK;
// recovery frames are 1941×2781 (rows measured on the 1396-wide preview, ×1.39).
const RW = 900;
const RK = RW / 1941;
const ry = (y: number) => y * 1.39 * RK;

const LANES = [
  ["Borrower", "a GPU operator"],
  ["HedgedCredit", "lender pool"],
  ["IngotMarket", "margin engine"],
  ["Underwriter vault", "takes the other side"],
] as const;
const MSGS = [
  [0, 1, "open(100,000 GPU-hrs, margin)", "margin posted"],
  [1, 2, "trade(−100,000 GPU-hrs, ≥ min fill)", "short at the forward"],
  [2, 3, "fill against the vault", "vault takes the long"],
  [1, 0, `transfer $${LOAN.principal.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, "principal, 70% of hedged revenue"],
] as const;

export const Credit: React.FC = () => {
  const t = useSeconds();
  const s = scene("credit");
  const [L11, L12, L13, L14, L15, L16] = ["L11", "L12", "L13", "L14", "L15", "L16"].map(line);

  // L11
  const head = tw(t, L11.start - 0.2, L11.start + 0.3) * (1 - tw(t, L11.end + 0.2, L11.end + 0.7));
  // L12: page → form → draw
  const page = tw(t, L12.start - 0.4, L12.start + 0.5, 0, 1, OUT) * (1 - tw(t, L12.start + 1.8, L12.start + 2.4));
  const exampleClick = L12.start + 1.5;
  const form = tw(t, L12.start + 1.9, L12.start + 2.5, 0, 1, OUT);
  const minClick = L12.start + 3.2;
  const scroll = tw(t, L12.start + 4.2, L12.start + 6.4, 0, 1, INOUT) * 470;
  const drawClick = L12.start + 7.6;
  const drawn = tw(t, drawClick + 0.3, drawClick + 0.9, 0, 1, INOUT);
  const formOut = tw(t, L12.end + 0.2, L12.end + 0.8);
  const pushDraw = tw(t, drawClick + 0.3, L12.end + 0.8, 0, 1, INOUT);
  const formOpacity = form * (1 - drawn);
  const FX = 330;
  const FY = 150;
  const cur = (() => {
    const pts: [number, number, number][] = [
      [L12.start + 1.0, 980, 640],
      [exampleClick, 944, 598],
      [minClick, FX + 330, FY + fy(902)],
      [L12.start + 6.6, FX + 300, FY + fy(1616) - 470 + 6],
      [drawClick, FX + 240, FY + fy(1616) - 470 + 6],
    ];
    let x = pts[0][1];
    let y = pts[0][2];
    for (let i = 1; i < pts.length; i++) {
      const p = tw(t, pts[i - 1][0] + 0.15, pts[i][0], 0, 1, INOUT);
      x += (pts[i][1] - pts[i - 1][1]) * p;
      y += (pts[i][2] - pts[i - 1][2]) * p;
    }
    return { x, y, click: t < minClick ? exampleClick : t < drawClick - 0.5 ? minClick : drawClick };
  })();

  // L13: the one-transaction diagram
  const dia = tw(t, L12.end + 0.4, L12.end + 1.2, 0, 1, OUT) * (1 - tw(t, L14.start - 0.6, L14.start));
  const d0 = L12.end + 1.0;
  // L14–L16: recovery
  const rec = tw(t, L14.start - 0.3, L14.start + 0.6, 0, 1, OUT) * (1 - tw(t, s.end - 0.8, s.end));
  const sweep = tw(t, L14.start + 0.8, L15.start + 5.6, 0, 1, INOUT) - 0.5 * tw(t, L16.start + 0.6, L16.start + 6.0, 0, 1, INOUT);
  const frame = Math.round(sweep * 219);
  const recZoom = 1 + 0.08 * tw(t, L16.start, L16.end, 0, 1, INOUT);
  const RX = 150;
  const RY = 150;

  return (
    <AbsoluteFill>
      {/* L11 */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: head }}>
        <Eyebrow t={t} at={s.start + 0.2}>IV — Hedged credit</Eyebrow>
        <div style={{ marginTop: 30 }}>
          <Rise text="Here's what the market is for." t={t} at={L11.start} size={104} align="center" accent={["for."]} />
        </div>
      </AbsoluteFill>

      {/* L12: the credit desk */}
      <div style={{ position: "absolute", left: 320, top: 190, opacity: page }}>
        <Browser src="footage/credit_top.jpg" url="ingotx.vercel.app/credit" width={1280} cam={{ x: 470, y: 560, zoom: 1.5 }} />
      </div>
      <div style={{ position: "absolute", left: FX, top: FY, width: FW, height: 820, overflow: "hidden", opacity: formOpacity, borderRadius: 4, boxShadow: "0 50px 120px -30px rgba(0,0,0,0.95), 0 0 90px -20px rgba(232,182,97,0.16)" }}>
        <Img src={staticFile("footage/credit_form.jpg")} style={{ width: FW, transform: `translateY(${-scroll}px)` }} />
      </div>
      <div style={{ position: "absolute", left: 1250, top: 200, width: 580, opacity: formOpacity }}>
        <Rise text="A loan, and the hedge that protects it." t={t} at={L12.start + 2.3} size={54} accent={["hedge"]} />
      </div>
      {formOpacity > 0.05 && (
        <div style={{ opacity: formOpacity }}>
          <Callout x={FX + FW - 18} y={FY + fy(1112) - scroll} dx={140} label="Hedge, opened with the loan" value="100,000 GPU-hrs short" t={t} at={L12.start + 5.2} />
          <Callout x={FX + FW - 18} y={FY + fy(1274) - scroll} dx={140} label="Operator receives" value={`$${LOAN.principal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} t={t} at={L12.start + 6.0} />
        </div>
      )}
      {page + form > 0.5 && drawn < 0.6 && <Cursor x={cur.x} y={cur.y} t={t} click={cur.click} visible={tw(t, L12.start + 0.8, L12.start + 1.1)} />}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: drawn * (1 - formOut) }}>
        <Browser src="footage/draw/0039.jpg" url="ingotx.vercel.app/credit" width={1280} cam={{ x: 720 - 320 * pushDraw, y: 405 + 300 * pushDraw, zoom: 1 + 0.25 * pushDraw }} />
        <div style={{ position: "absolute", top: 100, fontFamily: F.mono, fontSize: 22, letterSpacing: "0.3em", color: C.gold, textShadow: "0 0 18px rgba(232,182,97,0.6)" }}>DRAWN · AND HEDGED · IN THE SAME BLOCK</div>
      </div>

      {/* L13: four steps, one transaction */}
      <AbsoluteFill style={{ opacity: dia }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 96, display: "flex", justifyContent: "center" }}>
          <Rise text="One transaction. All four, or none." t={t} at={d0} size={58} align="center" accent={["All", "four,", "none."]} />
        </div>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <marker id="head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={C.gold} />
            </marker>
            <linearGradient id="txg" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={C.gold} stopOpacity="0.13" />
              <stop offset="1" stopColor={C.gold} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <rect x={150} y={330} width={1620} height={560} rx={8} fill="url(#txg)" stroke={C.gold} strokeOpacity={0.4 * tw(t, d0 + 0.2, d0 + 0.9)} strokeDasharray="7 9" opacity={tw(t, d0, d0 + 0.8)} />
          {LANES.map(([n, sub], i) => {
            const x = 300 + i * 440;
            const o = tw(t, d0 + i * 0.1, d0 + 0.6 + i * 0.1);
            return (
              <g key={n} opacity={o}>
                <text x={x} y={260} textAnchor="middle" fill={C.ink} fontFamily="Newsreader" fontWeight={300} fontSize={36}>{n}</text>
                <text x={x} y={296} textAnchor="middle" fill={C.muted} fontFamily="GeistMono" fontSize={15} letterSpacing={3}>{sub.toUpperCase()}</text>
                <line x1={x} x2={x} y1={318} y2={910} stroke={C.hair2} strokeDasharray="2 8" />
              </g>
            );
          })}
          {MSGS.map(([a, b, call, note], i) => {
            const y = 400 + i * 128;
            const x1 = 300 + a * 440;
            const x2 = 300 + b * 440;
            const st = d0 + 0.9 + i * 0.85;
            const p = tw(t, st, st + 0.6, 0, 1, OUT);
            const xe = x1 + (x2 - x1) * p;
            const mid = (x1 + x2) / 2;
            const dot = tw(t, st, st + 0.6, 0, 1, INOUT);
            return (
              <g key={i}>
                <circle cx={x1} cy={y} r={7} fill={C.gold} opacity={tw(t, st - 0.1, st + 0.1)} />
                {p > 0.01 && <line x1={x1} y1={y} x2={xe + (x2 > x1 ? -8 : 8) * p} y2={y} stroke={C.gold} strokeWidth={2.4} markerEnd={p > 0.95 ? "url(#head)" : undefined} />}
                {p > 0 && p < 1 && <circle cx={x1 + (x2 - x1) * dot} cy={y} r={5} fill="#fff4dc" style={{ filter: "drop-shadow(0 0 8px rgba(246,220,166,0.95))" }} />}
                <g opacity={tw(t, st + 0.3, st + 0.8)}>
                  <text x={mid} y={y - 18} textAnchor="middle" fill={C.ink} fontFamily="GeistMono" fontSize={21}>{call}</text>
                  <text x={mid} y={y + 36} textAnchor="middle" fill={C.ink2} fontFamily="Geist" fontSize={18}>{note}</text>
                  <text x={Math.min(x1, x2) + 14} y={y - 48} fill={C.gold} fontFamily="GeistMono" fontSize={14} letterSpacing={2}>{String(i + 1).padStart(2, "0")}</text>
                </g>
              </g>
            );
          })}
        </svg>
        <div style={{ position: "absolute", right: 170, bottom: 160, fontFamily: F.mono, fontSize: 18, letterSpacing: "0.3em", color: C.gold, opacity: tw(t, d0 + 4.4, d0 + 5.0), transform: `scale(${1.15 - 0.15 * tw(t, d0 + 4.4, d0 + 5.0, 0, 1, OUT)})`, border: `1.5px solid ${C.gold}`, padding: "10px 16px" }}>
          ALL FOUR, OR NONE
        </div>
      </AbsoluteFill>

      {/* L14–L16: sweep the settlement rate */}
      <AbsoluteFill style={{ opacity: rec }}>
        <div style={{ position: "absolute", left: RX, top: RY, width: RW, height: 800, overflow: "hidden", borderRadius: 4, boxShadow: "0 50px 120px -30px rgba(0,0,0,0.95), 0 0 90px -20px rgba(232,182,97,0.16)", transform: `scale(${recZoom})`, transformOrigin: "50% 40%" }}>
          <Img src={staticFile(`footage/recovery/${String(frame).padStart(4, "0")}.jpg`)} style={{ width: RW, transform: `translateY(${-ry(206)}px)` }} />
        </div>
        <div style={{ position: "absolute", left: 1140, top: 190, width: 680 }}>
          <Eyebrow t={t} at={L14.start}>HedgedCredit.project() · on chain</Eyebrow>
          <div style={{ marginTop: 22 }}>
            <Rise text="Sweep the settlement rate." t={t} at={L14.start + 0.1} size={56} accent={["settlement"]} />
          </div>
          <div style={{ marginTop: 70, opacity: tw(t, L15.start + 4.4, L15.start + 5.0), transform: `translateY(${(1 - tw(t, L15.start + 4.4, L15.start + 5.2)) * 20}px)` }}>
            <div style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: "0.24em", color: C.critical }}>UNHEDGED · AT $1.10 / GPU-HR</div>
            <div style={{ fontFamily: F.mono, fontSize: 76, color: C.critical, marginTop: 8 }}>−${LOAN.shortfallAt110.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
            <div style={{ fontFamily: F.sans, fontSize: 22, color: C.ink2, marginTop: 6 }}>short of the debt</div>
          </div>
          <div style={{ marginTop: 50, opacity: tw(t, L16.start + 0.2, L16.start + 0.8), transform: `translateY(${(1 - tw(t, L16.start + 0.2, L16.start + 1.0)) * 20}px)` }}>
            <div style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: "0.24em", color: C.gold }}>HEDGED · AT EVERY RATE</div>
            <div style={{ fontFamily: F.mono, fontSize: 76, color: C.goldSoft, marginTop: 8, textShadow: "0 0 30px rgba(232,182,97,0.5)" }}>${LOAN.recoveryHedged.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
            <div style={{ fontFamily: F.sans, fontSize: 22, color: C.ink2, marginTop: 6 }}>the full debt, recovered</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
