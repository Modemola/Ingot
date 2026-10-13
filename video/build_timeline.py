"""Lay the narration out on the film's clock and write timeline.json.

Picture (Remotion) and sound (mix.py) both read timeline.json, so a line moving shifts its scene,
its captions and its sound cues together. Times are seconds.
"""
import json, wave, contextlib

FPS = 60
V = "/home/user/Monad/video"
n = json.load(open(f"{V}/narration.json"))
dur = {}
for sc in n["scenes"]:
    for l in sc["lines"]:
        with contextlib.closing(wave.open(f"{V}/audio-src/{l['id']}.wav")) as w:
            dur[l["id"]] = w.getnframes() / w.getframerate()

# Each scene: lead-in before its first line, gaps after each line (keyed by line id), tail.
PLAN = {
    "open":    {"lead": 1.8, "gaps": {"L1": 0.55}, "tail": 5.2},     # logo reveal after L2
    "problem": {"lead": 0.8, "gaps": {"L3": 0.7}, "tail": 1.4},
    "index":   {"lead": 0.9, "gaps": {"L5": 0.6, "L6": 0.7}, "tail": 1.2},
    "trade":   {"lead": 0.8, "gaps": {"L8": 0.6, "L9": 2.6}, "tail": 1.4},   # fill lands between L9 and L10
    "credit":  {"lead": 0.8, "gaps": {"L11": 0.6, "L12": 1.8, "L13": 1.8, "L14": 0.3, "L15": 1.0}, "tail": 2.0},
    "vault":   {"lead": 0.9, "gaps": {}, "tail": 1.6},
    "proof":   {"lead": 0.8, "gaps": {}, "tail": 1.4},
    "end":     {"lead": 1.6, "gaps": {}, "tail": 5.0},
}

t = 0.0
scenes, lines = [], []
for sc in n["scenes"]:
    p = PLAN[sc["id"]]
    start = t
    t += p["lead"]
    for l in sc["lines"]:
        lines.append({"id": l["id"], "scene": sc["id"], "start": round(t, 3), "end": round(t + dur[l["id"]], 3),
                      "screen": l.get("screen", ""), "caption": l["caption"]})
        t += dur[l["id"]] + p["gaps"].get(l["id"], 0.0)
    t += p["tail"]
    scenes.append({"id": sc["id"], "start": round(start, 3), "end": round(t, 3)})

total = t
out = {"fps": FPS, "duration": round(total, 3), "frames": int(round(total * FPS)), "scenes": scenes, "lines": lines}
json.dump(out, open(f"{V}/src/timeline.json", "w"), indent=2)
for s in scenes:
    print(f"{s['id']:8s} {s['start']:7.2f} -> {s['end']:7.2f}  ({s['end']-s['start']:.1f}s)")
print("TOTAL", round(total, 2), "s =", f"{int(total//60)}:{total%60:05.2f}")
