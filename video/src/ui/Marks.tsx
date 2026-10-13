import { C, F, OUT } from "../theme";
import { tw } from "../time";

/// The Ingot mark, from docs/brand/ingot-mark.svg, with an optional light sweep.
export const IngotMark: React.FC<{ size: number; sweep?: number }> = ({ size, sweep = -1 }) => (
  <svg viewBox="0 0 22 22" width={size} height={size} style={{ overflow: "visible" }}>
    <defs>
      <linearGradient id="mf" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff4dc" />
        <stop offset="0.35" stopColor="#e8b661" />
        <stop offset="1" stopColor="#9c6a26" />
      </linearGradient>
      <linearGradient id="mt" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fffaf0" />
        <stop offset="1" stopColor="#f6dca6" />
      </linearGradient>
      <linearGradient id="ms" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a8742c" />
        <stop offset="1" stopColor="#4d3311" />
      </linearGradient>
      <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0" gradientTransform={`translate(${sweep} 0)`}>
        <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
        <stop offset="0.65" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <clipPath id="mclip">
        <path d="M4 14.5 L7 7.5 L15 7.5 L18 14.5 Z M7 7.5 L9 5 L17 5 L15 7.5 Z M15 7.5 L17 5 L20 12 L18 14.5 Z" />
      </clipPath>
    </defs>
    <path d="M4 14.5 L7 7.5 L15 7.5 L18 14.5 Z" fill="url(#mf)" />
    <path d="M7 7.5 L9 5 L17 5 L15 7.5 Z" fill="url(#mt)" />
    <path d="M15 7.5 L17 5 L20 12 L18 14.5 Z" fill="url(#ms)" />
    <rect x="0" y="0" width="22" height="22" fill="url(#sweep)" clipPath="url(#mclip)" style={{ mixBlendMode: "screen" }} />
  </svg>
);

/// The split-flap board from the landing page: each character tumbles before it lands.
export const SplitFlap: React.FC<{ text: string; t: number; at: number; size?: number; stagger?: number; flips?: number }> = ({ text, t, at, size = 96, stagger = 0.07, flips = 7 }) => {
  const glyphs = "0123456789";
  return (
    <div style={{ display: "flex", gap: size * 0.08 }}>
      {text.split("").map((ch, i) => {
        const start = at + i * stagger;
        // Only the digits roll; the dollar sign and point are printed on their flaps.
        const rolls = /[0-9]/.test(ch) ? flips : 0;
        const p = rolls ? tw(t, start, start + 0.08 * rolls, 0, 1, (x) => x) : t >= start ? 1 : 0;
        const step = Math.floor(p * flips);
        const shown = p >= 1 ? ch : ch === " " ? " " : glyphs[(i * 7 + step * 3) % glyphs.length];
        const flipPhase = p >= 1 ? 0 : (p * rolls) % 1;
        const settled = p >= 1;
        return (
          <div
            key={i}
            style={{
              width: size * 0.66,
              height: size * 1.12,
              position: "relative",
              borderRadius: size * 0.06,
              background: "linear-gradient(180deg, #1d1915 0%, #15120f 49.6%, #0b0908 50.4%, #13100d 100%)",
              border: `1px solid ${C.hair}`,
              boxShadow: "0 18px 40px -16px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: F.mono,
              fontSize: size * 0.78,
              fontWeight: 400,
              color: settled ? C.goldSoft : C.ink2,
              textShadow: settled ? "0 0 24px rgba(232,182,97,0.45)" : "none",
              transform: `perspective(400px) rotateX(${flipPhase * -14}deg)`,
              opacity: tw(t, start - 0.3, start, 0, 1),
            }}
          >
            {shown}
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "rgba(0,0,0,0.75)" }} />
          </div>
        );
      })}
    </div>
  );
};

/// A cursor, with a ring that pulses where it clicks.
export const Cursor: React.FC<{ x: number; y: number; click?: number; t: number; visible?: number }> = ({ x, y, click, t, visible = 1 }) => {
  const c = click === undefined ? 0 : tw(t, click, click + 0.5, 0, 1);
  const down = click !== undefined && t >= click && t < click + 0.12 ? 0.86 : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: visible, pointerEvents: "none" }}>
      {click !== undefined && t >= click && c < 1 && (
        <div
          style={{
            position: "absolute",
            left: -28 * c - 6,
            top: -28 * c - 6,
            width: 12 + 56 * c,
            height: 12 + 56 * c,
            borderRadius: "50%",
            border: `2px solid rgba(246,220,166,${0.9 * (1 - c)})`,
          }}
        />
      )}
      <svg width="30" height="34" viewBox="0 0 30 34" style={{ transform: `scale(${down})`, transformOrigin: "0 0", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))" }}>
        <path d="M2 2 L2 26 L8.5 20 L13 31 L17.5 29 L13 18.5 L22 18.5 Z" fill="#f3ecdf" stroke="#090807" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/// A gold leader line from a point to a label.
export const Callout: React.FC<{ x: number; y: number; dx: number; label: string; value?: string; t: number; at: number; out?: number; side?: "left" | "right" }> = ({ x, y, dx, label, value, t, at, out, side = "right" }) => {
  const p = tw(t, at, at + 0.7, 0, 1, OUT);
  const o = out === undefined ? 1 : 1 - tw(t, out, out + 0.4);
  const len = Math.abs(dx) * p;
  const dir = side === "right" ? 1 : -1;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o * Math.min(1, p * 2) }}>
      <div style={{ position: "absolute", left: -5, top: -5, width: 10, height: 10, borderRadius: 5, background: C.gold, boxShadow: "0 0 16px rgba(232,182,97,0.9)" }} />
      <div style={{ position: "absolute", top: 0, left: dir > 0 ? 0 : -len, width: len, height: 1.5, background: `linear-gradient(${dir > 0 ? 90 : 270}deg, ${C.gold}, rgba(232,182,97,0.4))` }} />
      <div
        style={{
          position: "absolute",
          top: -22,
          left: dir > 0 ? Math.abs(dx) + 14 : undefined,
          right: dir < 0 ? Math.abs(dx) + 14 : undefined,
          whiteSpace: "nowrap",
          opacity: tw(t, at + 0.35, at + 0.8),
        }}
      >
        <div style={{ fontFamily: F.mono, fontSize: 14, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold }}>{label}</div>
        {value && <div style={{ fontFamily: F.mono, fontSize: 26, color: C.ink, marginTop: 4 }}>{value}</div>}
      </div>
    </div>
  );
};
