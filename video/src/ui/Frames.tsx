import { Img, staticFile } from "remotion";
import { C, F } from "../theme";

/// A browser window around real product footage. `cam` is where the camera looks, in the page's
/// own CSS pixels (the captures are a 1440×810 viewport at 8/3 device scale), and how far in.
export const Browser: React.FC<{
  src: string;
  width?: number;
  cam?: { x: number; y: number; zoom: number };
  pageW?: number;
  pageH?: number;
  url?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ src, width = 1500, cam = { x: 720, y: 405, zoom: 1 }, pageW = 1440, pageH = 810, url = "ingotx.vercel.app/trade", style, children }) => {
  const bar = 44;
  const innerW = width;
  const innerH = (width * 810) / 1440;
  const s = (innerW / 1440) * cam.zoom;
  // Keep the focus point centred, but never show past the page's edges.
  let tx = innerW / 2 - cam.x * s;
  let ty = innerH / 2 - cam.y * s;
  tx = Math.min(0, Math.max(innerW - pageW * s, tx));
  ty = Math.min(0, Math.max(innerH - pageH * s, ty));
  return (
    <div
      style={{
        width: innerW,
        borderRadius: 14,
        overflow: "hidden",
        background: C.coal,
        border: `1px solid ${C.hair2}`,
        boxShadow: "0 60px 140px -40px rgba(0,0,0,0.95), 0 0 0 1px rgba(232,182,97,0.06), 0 0 120px -30px rgba(232,182,97,0.18)",
        ...style,
      }}
    >
      <div style={{ height: bar, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", background: "#16130f", borderBottom: `1px solid ${C.hair}` }}>
        {["#3a332b", "#3a332b", "#3a332b"].map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
        ))}
        <div
          style={{
            marginLeft: 18,
            flex: 1,
            maxWidth: 560,
            height: 26,
            borderRadius: 7,
            background: "#0d0b09",
            border: `1px solid ${C.hair}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 12px",
            fontFamily: F.mono,
            fontSize: 13.5,
            color: C.ink2,
            letterSpacing: "0.01em",
          }}
        >
          <span style={{ color: C.good, fontSize: 11 }}>●</span>
          {url}
        </div>
      </div>
      <div style={{ position: "relative", width: innerW, height: innerH, overflow: "hidden" }}>
        <Img
          src={staticFile(src)}
          style={{ position: "absolute", left: 0, top: 0, width: pageW, height: pageH, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}
        />
        {children}
      </div>
    </div>
  );
};

/// A real UI element lifted out of the page and floated in the frame.
export const Card: React.FC<{ src: string; width: number; style?: React.CSSProperties; glow?: boolean }> = ({ src, width, style, glow = true }) => (
  <Img
    src={staticFile(src)}
    style={{
      width,
      display: "block",
      borderRadius: 4,
      boxShadow: glow
        ? "0 50px 120px -30px rgba(0,0,0,0.95), 0 0 0 1px rgba(232,182,97,0.10), 0 0 90px -20px rgba(232,182,97,0.16)"
        : "0 40px 100px -30px rgba(0,0,0,0.9)",
      ...style,
    }}
  />
);

/// An image sequence, advanced by `progress` (0..1) through `count` frames.
export const SeqFrame: React.FC<{ dir: string; count: number; progress: number; width: number; style?: React.CSSProperties; glow?: boolean }> = ({ dir, count, progress, width, style, glow }) => {
  const i = Math.max(0, Math.min(count - 1, Math.round(progress * (count - 1))));
  return <Card src={`footage/${dir}/${String(i).padStart(4, "0")}.jpg`} width={width} style={style} glow={glow} />;
};
