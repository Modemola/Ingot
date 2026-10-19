import React from "react";
import { C, F, INOUT, OUT } from "../theme";
import { tw } from "../time";
import { pop } from "./time";

/// Chainlink's blue, beside Ingot's gold: gold is Ingot's, blue is the oracle network's.
export const B = {
  blue: "#375BD2",
  bright: "#5b7ef0",
  soft: "#a9bcff",
  glow: "rgba(91,126,240,0.55)",
  wash: "rgba(55,91,210,0.12)",
};

export const W = 1920;
export const H = 1080;

/// A mono label, the film's small type.
export const Label: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, color = C.muted, size = 17, style }) => (
  <div style={{ fontFamily: F.mono, fontSize: size, letterSpacing: "0.24em", textTransform: "uppercase", color, ...style }}>{children}</div>
);

/// Fade-and-lift for anything that enters, and the reverse for leaving.
export function enter(t: number, at: number, out?: number, lift = 16): React.CSSProperties {
  const p = tw(t, at, at + 0.7, 0, 1, OUT);
  const q = out === undefined ? 0 : tw(t, out, out + 0.5, 0, 1, INOUT);
  return { opacity: p * (1 - q), transform: `translateY(${(1 - p) * lift - q * lift * 0.6}px)` };
}

/// Positioned at its centre.
export const At: React.FC<{ x: number; y: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, children, style }) => (
  // max-content: an absolutely placed box would otherwise wrap at the frame's right edge
  <div style={{ position: "absolute", left: x, top: y, width: "max-content", transform: "translate(-50%, -50%)", ...style }}>{children}</div>
);

/// A flat-topped hexagon: a node of the oracle network.
export const Hex: React.FC<{ size: number; t: number; at: number; color?: string; fill?: string; glow?: number; children?: React.ReactNode }> = ({ size, t, at, color = B.bright, fill = "#0e1120", glow = 1, children }) => {
  const p = pop(t, at);
  const r = size / 2;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${r + r * 0.96 * Math.cos(a)},${r + r * 0.96 * Math.sin(a)}`;
  }).join(" ");
  return (
    <div style={{ width: size, height: size, position: "relative", transform: `scale(${p})`, opacity: Math.min(1, p * 1.4) }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, overflow: "visible", filter: glow ? `drop-shadow(0 0 ${18 * glow}px ${color === B.bright ? B.glow : "rgba(224,104,77,0.6)"})` : undefined }}>
        <polygon points={pts} fill={fill} stroke={color} strokeWidth={2} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>{children}</div>
    </div>
  );
};

/// A quiet panel: the film's one card style.
export const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; accent?: string }> = ({ children, style, accent }) => (
  <div
    style={{
      background: "linear-gradient(180deg, rgba(25,21,17,0.92), rgba(15,13,11,0.92))",
      border: `1px solid ${accent ?? C.hair2}`,
      borderRadius: 14,
      boxShadow: "0 40px 90px -40px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.03)",
      ...style,
    }}
  >
    {children}
  </div>
);

/// A pill: a provider quote, a status, a check.
export const Pill: React.FC<{ children: React.ReactNode; color?: string; bg?: string; style?: React.CSSProperties }> = ({ children, color = C.ink2, bg = "rgba(243,236,223,0.04)", style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "9px 16px", borderRadius: 999, border: `1px solid ${C.hair2}`, background: bg, fontFamily: F.mono, fontSize: 19, color, whiteSpace: "nowrap", ...style }}>{children}</div>
);

/// A line drawn on from one end, with an optional dot running along it.
export const Wire: React.FC<{ x1: number; y1: number; x2: number; y2: number; t: number; at: number; dur?: number; color?: string; dash?: boolean; runner?: [number, number]; width?: number; opacity?: number }> = ({ x1, y1, x2, y2, t, at, dur = 0.7, color = C.hair2, dash, runner, width = 1.5, opacity = 1 }) => {
  const p = tw(t, at, at + dur, 0, 1, INOUT);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const r = runner ? tw(t, runner[0], runner[1], 0, 1, INOUT) : -1;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible", opacity }}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeDasharray={dash ? "2 9" : `${len} ${len}`} strokeDashoffset={dash ? 0 : len * (1 - p)} strokeLinecap="round" opacity={dash ? p : 1} />
      {r > 0 && r < 1 && <circle cx={x1 + (x2 - x1) * r} cy={y1 + (y2 - y1) * r} r={5} fill={B.soft} style={{ filter: `drop-shadow(0 0 8px ${B.glow})` }} />}
    </svg>
  );
};

/// A check that draws itself.
export const Tick: React.FC<{ t: number; at: number; size?: number; color?: string }> = ({ t, at, size = 26, color = C.good }) => {
  const p = tw(t, at, at + 0.4, 0, 1, OUT);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <circle cx={12} cy={12} r={11} fill="none" stroke={color} strokeOpacity={0.35 * p} strokeWidth={1.5} />
      <path d="M7 12.5 L10.5 16 L17 8.5" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="18" strokeDashoffset={18 * (1 - p)} />
    </svg>
  );
};

/// A cross that draws itself.
export const Cross: React.FC<{ t: number; at: number; size?: number }> = ({ t, at, size = 26 }) => {
  const p = tw(t, at, at + 0.35, 0, 1, OUT);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <circle cx={12} cy={12} r={11} fill="none" stroke={C.critical} strokeOpacity={0.4 * p} strokeWidth={1.5} />
      <path d="M8 8 L16 16 M16 8 L8 16" fill="none" stroke={C.critical} strokeWidth={2.2} strokeLinecap="round" strokeDasharray="12" strokeDashoffset={12 * (1 - p)} />
    </svg>
  );
};

/// A rubber stamp: lands big, settles, a little crooked.
export const Stamp: React.FC<{ text: string; t: number; at: number; color?: string; rotate?: number; size?: number }> = ({ text, t, at, color = C.critical, rotate = -8, size = 30 }) => {
  if (t < at) return null;
  const p = tw(t, at, at + 0.28, 0, 1, OUT);
  return (
    <div
      style={{
        fontFamily: F.mono,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: "0.22em",
        color,
        padding: "8px 18px 8px 22px",
        border: `3px solid ${color}`,
        borderRadius: 8,
        transform: `rotate(${rotate}deg) scale(${1.9 - 0.9 * p})`,
        opacity: p,
        whiteSpace: "nowrap",
        background: "rgba(9,8,7,0.6)",
      }}
    >
      {text}
    </div>
  );
};

/// A headline in the display face, with italic gold accents, entering word by word.
export const Head: React.FC<{ text: string; t: number; at: number; out?: number; size?: number; accent?: string[]; blue?: string[]; align?: "left" | "center"; maxWidth?: number }> = ({ text, t, at, out, size = 76, accent = [], blue = [], align = "center", maxWidth }) => {
  const words = text.split(" ");
  const gone = out === undefined ? 0 : tw(t, out, out + 0.5, 0, 1, INOUT);
  return (
    <div style={{ fontFamily: F.display, fontWeight: 300, fontSize: size, lineHeight: 1.06, letterSpacing: "-0.02em", color: C.ink, textAlign: align, maxWidth, opacity: 1 - gone, transform: `translateY(${-gone * 18}px)` }}>
      {words.map((w, i) => {
        const p = tw(t, at + i * 0.055, at + i * 0.055 + 0.8, 0, 1, OUT);
        const bare = w.replace(/[.,?:]/g, "");
        const gold = accent.includes(bare);
        const isBlue = blue.includes(bare);
        return (
          <React.Fragment key={i}>
            <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.14em", marginBottom: "-0.14em" }}>
              <span
                style={{
                  display: "inline-block",
                  transform: `translateY(${(1 - p) * 100}%)`,
                  opacity: p,
                  fontStyle: gold || isBlue ? "italic" : "normal",
                  color: isBlue ? B.soft : undefined,
                  background: gold ? `linear-gradient(100deg, ${C.goldSoft}, ${C.gold} 45%, ${C.goldDeep})` : undefined,
                  WebkitBackgroundClip: gold ? "text" : undefined,
                  backgroundClip: gold ? "text" : undefined,
                  WebkitTextFillColor: gold ? "transparent" : undefined,
                }}
              >
                {w}
              </span>
            </span>
            {i < words.length - 1 ? " " : ""}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/// The price, in the product's tabular mono.
export const Price: React.FC<{ value: string; size?: number; color?: string; glow?: boolean; style?: React.CSSProperties }> = ({ value, size = 64, color = C.goldSoft, glow = true, style }) => (
  <div style={{ fontFamily: F.mono, fontSize: size, fontVariantNumeric: "tabular-nums", color, letterSpacing: "-0.01em", textShadow: glow ? "0 0 30px rgba(232,182,97,0.35)" : undefined, ...style }}>{value}</div>
);
