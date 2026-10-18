import { Easing } from "remotion";
import timeline from "../chainlink-timeline.json";
import { tw } from "../time";

export type CLine = { id: string; scene: string; start: number; end: number; text: string; caption: string };
export const CT = timeline as { fps: number; duration: number; frames: number; scenes: { id: string; start: number; end: number }[]; lines: CLine[] };

export const scene = (id: string) => CT.scenes.find((s) => s.id === id)!;
export const L = (id: string) => CT.lines.find((l) => l.id === id)!;

/// When a word is spoken, estimated from where it sits in the line's text. Good to a beat, which is
/// all a cut or a pop needs.
export function wordT(id: string, word: string, nth = 0) {
  const l = L(id);
  const text = l.text.toLowerCase();
  let i = -1;
  for (let k = 0; k <= nth; k++) i = text.indexOf(word.toLowerCase(), i + 1);
  if (i < 0) throw new Error(`"${word}" is not in ${id}`);
  return l.start + (i / text.length) * (l.end - l.start);
}

/// A small overshoot for things that arrive: the film's one playful easing.
export const BACK = Easing.bezier(0.34, 1.56, 0.64, 1);

/// 0→1 with overshoot, for pops.
export const pop = (t: number, at: number, dur = 0.55) => tw(t, at, at + dur, 0, 1, BACK);
