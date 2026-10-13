import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import code from "./cre-code.json";
import term from "./cre-terminal.json";
import { C, F, OUT } from "./theme";
import { tw } from "./time";

/// The Chainlink CRE bounty video: the workflow's code, then the CRE CLI simulating it.
/// The terminal is the exact text of a real `cre workflow simulate` run, replayed line for line.
export const CRE_FPS = 30;
export const CRE_DURATION = 80;

const INTRO = 4.5;
const CODE_EACH = 6.2;
const TERM = INTRO + CODE_EACH * code.length; // terminal starts
const END = TERM + 43; // end card starts

// When each output line of the simulate run appears, seconds after the command is entered.
const RUN0 = [0.5, 1.9, 2.4, 2.6, 2.8, 3.0, 3.7, 3.7, 4.9, 6.5, 10.3, 13.8, 17.8, 17.9, 18.0, 18.1, 18.2, 18.3, 18.5, 18.9, 19.0, 19.2, 19.4, 19.45, 19.5, 19.55, 19.6];
const RUN0_AT = TERM + 4.0;
const CMD0_AT = TERM + 0.8;
const CMD1_AT = TERM + 31.0;
const RUN1_AT = TERM + 33.0;

const CAPTIONS: [number, number, string][] = [
  [RUN0_AT + 1.9, RUN0_AT + 4.9, "The CRE CLI compiles the TypeScript workflow to WASM"],
  [RUN0_AT + 4.9, RUN0_AT + 6.5, "The cron trigger fires on the CLI's simulated DON"],
  [RUN0_AT + 6.5, RUN0_AT + 10.3, "Each node fetches the live venue feed: $3.7570 per GPU-hour, from 24 venues and 38 quotes"],
  [RUN0_AT + 10.3, RUN0_AT + 13.8, "The nodes reach consensus: the median across nodes becomes the price"],
  [RUN0_AT + 13.8, RUN0_AT + 18.0, "One DON-signed report, written to IngotIndexReceiver on Monad testnet: SUCCESS"],
  [RUN0_AT + 18.0, CMD1_AT, "Simulation complete. The workflow returns the agreed price and its timestamp"],
  [RUN1_AT + 0.6, END, "Deployment access requested from Chainlink, to run it on a live DON"],
];

const useT = () => useCurrentFrame() / CRE_FPS;

const KEYWORDS = /\b(const|function|return|new|export|async|for|try|await)\b/g;
function Code({ text }: { text: string }) {
  if (/^\s*\/\//.test(text)) return <span style={{ color: C.muted }}>{text}</span>;
  const parts = text.split(/("[^"]*")/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('"') ? (
          <span key={i} style={{ color: "#a9d18e" }}>{p}</span>
        ) : (
          <span key={i}>
            {p.split(KEYWORDS).map((q, j) => (j % 2 ? <span key={j} style={{ color: C.gold }}>{q}</span> : <React.Fragment key={j}>{q}</React.Fragment>))}
          </span>
        ),
      )}
    </>
  );
}

const CodeCards: React.FC = () => {
  const t = useT();
  if (t < INTRO - 0.4 || t > TERM + 0.4) return null;
  return (
    <AbsoluteFill>
      {code.map((card, i) => {
        const s = INTRO + i * CODE_EACH;
        const o = Math.min(tw(t, s - 0.2, s + 0.4), 1 - tw(t, s + CODE_EACH - 0.4, s + CODE_EACH + 0.1));
        if (o <= 0) return null;
        return (
          <AbsoluteFill key={i} style={{ opacity: o, alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 1500 }}>
              <div style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: "0.26em", color: C.gold }}>
                {String(i + 1).padStart(2, "0")} · oracle/workflow.ts
              </div>
              <div style={{ marginTop: 12, fontFamily: F.display, fontWeight: 300, fontSize: 50, color: C.ink, transform: `translateY(${(1 - tw(t, s, s + 0.6, 0, 1, OUT)) * 14}px)` }}>{card.title}</div>
              <div style={{ marginTop: 34, padding: "26px 30px", background: "#0d0b09", border: `1px solid ${C.hair2}`, borderRadius: 10, boxShadow: "0 40px 100px -30px rgba(0,0,0,0.9)" }}>
                {card.lines.map(([n, line], k) => (
                  <div key={k} style={{ display: "flex", fontFamily: F.mono, fontSize: 22, lineHeight: 1.6, whiteSpace: "pre", opacity: tw(t, s + 0.3 + k * 0.05, s + 0.6 + k * 0.05) }}>
                    <span style={{ width: 64, color: "#5b5348", textAlign: "right", marginRight: 26, flexShrink: 0 }}>{n ?? ""}</span>
                    <span style={{ color: C.ink2 }}><Code text={String(line)} /></span>
                  </div>
                ))}
              </div>
            </div>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

type Row = { text: string; kind: "prompt" | "out" };
const COLS = 148;
const ROWS = 27;

function colour(line: string): string {
  if (line.includes("[USER LOG]")) return C.goldSoft;
  if (line.startsWith("✓")) return C.good;
  if (line.startsWith("!")) return "#e7c26b";
  if (line.startsWith("✗")) return C.critical;
  if (/^[╭│╰]/.test(line)) return "#9a9184";
  if (line.includes("[SIMULATION]")) return "#b9b1a4";
  return C.ink2;
}

const Terminal: React.FC = () => {
  const t = useT();
  if (t < TERM - 0.5 || t > END + 0.5) return null;
  const rows: Row[] = [];
  const typed = (cmd: string, at: number, dur: number) => cmd.slice(0, Math.max(0, Math.min(cmd.length, Math.floor(((t - at) / dur) * cmd.length))));
  // run 0
  const c0 = term.runs[0].command;
  rows.push({ text: term.prompt + (t >= CMD0_AT ? typed(c0, CMD0_AT, 2.6) : ""), kind: "prompt" });
  term.runs[0].output.forEach((line, i) => {
    if (t >= RUN0_AT + RUN0[i]) rows.push({ text: line, kind: "out" });
  });
  // run 1
  if (t >= CMD1_AT - 0.6) {
    const c1 = term.runs[1].command;
    rows.push({ text: term.prompt + (t >= CMD1_AT ? typed(c1, CMD1_AT, 1.1) : ""), kind: "prompt" });
    term.runs[1].output.forEach((line, i) => {
      if (t >= RUN1_AT + i * 0.12) rows.push({ text: line, kind: "out" });
    });
  }
  // a terminal scrolls: keep the newest rows that fit, counting wrapped lines
  const visible: Row[] = [];
  let used = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    const h = Math.max(1, Math.ceil(rows[i].text.length / COLS));
    if (used + h > ROWS) break;
    visible.unshift(rows[i]);
    used += h;
  }
  const last = rows[rows.length - 1];
  const cursorOn = Math.floor(t * 2) % 2 === 0;
  const o = Math.min(tw(t, TERM - 0.5, TERM), 1 - tw(t, END, END + 0.5));
  return (
    <AbsoluteFill style={{ opacity: o, alignItems: "center" }}>
      <div style={{ marginTop: 48, width: 1840, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.hair2}`, boxShadow: "0 50px 120px -30px rgba(0,0,0,0.95)" }}>
        <div style={{ height: 40, background: "#1b1814", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, fontFamily: F.sans, fontSize: 15, color: C.ink2 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: "#2f5f9e" }} />
          Windows PowerShell — C:\Users\HP\Ingot\oracle
        </div>
        <div style={{ height: 800, background: "#0c0b0a", padding: "18px 22px", fontFamily: `${F.mono}, "DejaVu Sans Mono", monospace`, fontSize: 18.5, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
          {visible.map((r, i) => (
            <div key={i} style={{ color: r.kind === "prompt" ? "#e8e2d6" : colour(r.text), minHeight: "1.55em" }}>
              {r.kind === "prompt" ? (
                <>
                  <span style={{ color: "#a59d90" }}>{term.prompt}</span>
                  {r.text.slice(term.prompt.length)}
                </>
              ) : (
                r.text
              )}
              {r === last && cursorOn && <span style={{ background: "#e8e2d6", color: "#0c0b0a" }}> </span>}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Caption: React.FC = () => {
  const t = useT();
  const c = CAPTIONS.find(([a, b]) => t >= a && t < b);
  if (!c) return null;
  const o = Math.min(tw(t, c[0], c[0] + 0.3), 1 - tw(t, c[1] - 0.3, c[1]));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 52, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 26px", background: "rgba(9,8,7,0.92)", border: "1px solid rgba(232,182,97,0.45)", borderRadius: 8, boxShadow: "0 16px 50px rgba(0,0,0,0.6)" }}>
        <span style={{ width: 9, height: 9, borderRadius: 5, background: C.gold, boxShadow: `0 0 12px ${C.gold}` }} />
        <span style={{ fontFamily: F.sans, fontSize: 28, color: C.ink }}>{c[2]}</span>
      </div>
    </div>
  );
};

const Card: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const t = useT();
  if (t < from - 0.1 || t > to + 0.1) return null;
  const o = Math.min(tw(t, from, from + 0.6), 1 - tw(t, to - 0.6, to));
  return <AbsoluteFill style={{ opacity: o, alignItems: "center", justifyContent: "center" }}>{children}</AbsoluteFill>;
};

export const Cre: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: C.void }}>
      <AbsoluteFill style={{ background: "radial-gradient(1100px 600px at 50% 40%, rgba(232,182,97,0.08), transparent 70%)" }} />
      <Card from={0} to={INTRO}>
        <Img src={staticFile("brand/ingot-logo-dark-transparent.svg")} style={{ width: 620, opacity: tw(t, 0.1, 0.8) }} />
        <div style={{ marginTop: 8, fontFamily: F.display, fontWeight: 300, fontSize: 46, color: C.ink, opacity: tw(t, 0.6, 1.2) }}>
          The H100 index, published by a <span style={{ fontStyle: "italic", color: C.gold }}>Chainlink CRE</span> workflow
        </div>
        <div style={{ marginTop: 22, fontFamily: F.mono, fontSize: 19, letterSpacing: "0.26em", color: C.muted, opacity: tw(t, 1.0, 1.6) }}>
          SIMULATED WITH THE CRE CLI v1.38.0 · TARGET MONAD TESTNET
        </div>
      </Card>
      <CodeCards />
      <Terminal />
      <Caption />
      <Card from={END} to={CRE_DURATION}>
        <Img src={staticFile("brand/ingot-mark.svg")} style={{ width: 150, marginBottom: 10 }} />
        <div style={{ fontFamily: F.display, fontWeight: 300, fontSize: 52, color: C.ink, textAlign: "center", maxWidth: 1500 }}>
          No single key prints the price. <span style={{ fontStyle: "italic", color: C.gold }}>A DON does.</span>
        </div>
        <div style={{ marginTop: 26, fontFamily: F.sans, fontSize: 26, color: C.ink2, textAlign: "center", maxWidth: 1400, lineHeight: 1.5 }}>
          Every node fetches the venues and applies the published methodology; the DON takes the median and signs one report for IngotIndexReceiver on Monad.
        </div>
        <div style={{ marginTop: 34, display: "flex", gap: 30, fontFamily: F.mono, fontSize: 20, color: C.muted }}>
          <span style={{ color: C.goldSoft }}>github.com/Modemola/Ingot</span>
          <span>·</span>
          <span>oracle/ · docs/ORACLE.md</span>
          <span>·</span>
          <span>receiver 0xEcD7…D254</span>
        </div>
      </Card>
    </AbsoluteFill>
  );
};
