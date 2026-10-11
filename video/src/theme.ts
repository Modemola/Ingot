import { Easing } from "remotion";

/// The product's "Foundry" palette and type, so the film and the app are one object.
export const C = {
  void: "#090807",
  coal: "#0f0d0b",
  panel: "#13100d",
  ink: "#f3ecdf",
  ink2: "#c4baa9",
  muted: "#867d70",
  gold: "#e8b661",
  goldSoft: "#f6dca6",
  goldDeep: "#b98535",
  ember: "#ff9d4d",
  critical: "#e0684d",
  good: "#7fd1a6",
  hair: "rgba(243,236,223,0.10)",
  hair2: "rgba(243,236,223,0.18)",
};

export const F = {
  display: "Newsreader, Georgia, serif",
  sans: "Geist, system-ui, sans-serif",
  mono: "GeistMono, ui-monospace, monospace",
};

/// One easing family for the whole film.
export const OUT = Easing.bezier(0.16, 1, 0.3, 1); // expo-out: entrances
export const INOUT = Easing.bezier(0.65, 0, 0.35, 1); // smooth: camera and transforms
export const IN = Easing.bezier(0.7, 0, 0.84, 0); // exits
