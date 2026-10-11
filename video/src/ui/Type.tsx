import { C, F, OUT } from "../theme";
import { tw } from "../time";

/// A headline that rises word by word through a mask, the way the site's headlines do.
export const Rise: React.FC<{
  text: string;
  t: number;
  at: number;
  size?: number;
  accent?: string[];
  stagger?: number;
  out?: number;
  align?: "left" | "center";
  color?: string;
  weight?: number;
  lineHeight?: number;
  maxWidth?: number;
}> = ({ text, t, at, size = 84, accent = [], stagger = 0.06, out, align = "left", color = C.ink, weight = 300, lineHeight = 1.04, maxWidth }) => {
  const words = text.split(" ");
  const gone = out === undefined ? 0 : tw(t, out, out + 0.6, 0, 1);
  return (
    <div
      style={{
        fontFamily: F.display,
        fontWeight: weight,
        fontSize: size,
        lineHeight,
        letterSpacing: "-0.02em",
        color,
        textAlign: align,
        maxWidth,
        opacity: 1 - gone,
        transform: `translateY(${-gone * 24}px)`,
      }}
    >
      {words.map((w, i) => {
        const p = tw(t, at + i * stagger, at + i * stagger + 0.9, 0, 1, OUT);
        const isAccent = accent.includes(w.replace(/[.,]/g, ""));
        return (
          <span key={i}>
            <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.12em", marginBottom: "-0.12em" }}>
              <span
                style={{
                  display: "inline-block",
                  transform: `translateY(${(1 - p) * 105}%) rotate(${(1 - p) * 3}deg)`,
                  opacity: p,
                  fontStyle: isAccent ? "italic" : "normal",
                  background: isAccent ? `linear-gradient(100deg, ${C.goldSoft}, ${C.gold} 45%, ${C.goldDeep})` : undefined,
                  WebkitBackgroundClip: isAccent ? "text" : undefined,
                  backgroundClip: isAccent ? "text" : undefined,
                  color: isAccent ? "transparent" : undefined,
                }}
              >
                {w}
              </span>
            </span>
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
};

export const Eyebrow: React.FC<{ children: React.ReactNode; t: number; at: number; color?: string }> = ({ children, t, at, color = C.gold }) => (
  <div
    style={{
      fontFamily: F.mono,
      fontSize: 18,
      letterSpacing: "0.26em",
      textTransform: "uppercase",
      color,
      opacity: tw(t, at, at + 0.6),
      transform: `translateY(${(1 - tw(t, at, at + 0.8)) * 10}px)`,
    }}
  >
    {children}
  </div>
);

/// A number that counts up to its value, in tabular mono.
export const Count: React.FC<{ value: number; t: number; at: number; dur?: number; decimals?: number; prefix?: string; suffix?: string; style?: React.CSSProperties }> = ({ value, t, at, dur = 1.2, decimals = 0, prefix = "", suffix = "", style }) => {
  const v = value * tw(t, at, at + dur);
  const s = v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span style={{ fontFamily: F.mono, fontVariantNumeric: "tabular-nums", ...style }}>{prefix}{s}{suffix}</span>;
};
