"""Time the Chainlink film to its narration: writes src/chainlink-timeline.json, exactly 120 s.

Lines in a scene sit LINE_GAP apart; scenes sit SCENE_GAP apart; the gaps are scaled together so
the end card lands on 2:00.
"""
import json
from pathlib import Path

import soundfile as sf

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
FPS, TOTAL = 30, 120.0
INTRO, OUTRO = 1.4, 3.6  # before the first word; after the last
LINE_GAP, SCENE_GAP = 0.55, 1.35

spec = json.loads((HERE / "narration.json").read_text())
lines = spec["lines"]
dur = {l["id"]: sf.info(HERE / "audio-src" / f"{l['id']}.wav").duration for l in lines}

speech = sum(dur.values())
n_line_gaps = sum(1 for a, b in zip(lines, lines[1:]) if a["scene"] == b["scene"])
n_scene_gaps = sum(1 for a, b in zip(lines, lines[1:]) if a["scene"] != b["scene"])
spare = TOTAL - INTRO - OUTRO - speech
k = spare / (n_line_gaps * LINE_GAP + n_scene_gaps * SCENE_GAP)

t = INTRO
out_lines, scenes = [], []
for i, l in enumerate(lines):
    if i and lines[i - 1]["scene"] != l["scene"]:
        t += SCENE_GAP * k
    elif i:
        t += LINE_GAP * k
    if not scenes or scenes[-1]["id"] != l["scene"]:
        # a scene opens a beat before its first word, so the picture leads the voice
        start = 0.0 if not scenes else round(t - 0.55, 3)
        if scenes:
            scenes[-1]["end"] = start
        scenes.append({"id": l["scene"], "start": start, "end": None})
    out_lines.append({"id": l["id"], "scene": l["scene"], "start": round(t, 3), "end": round(t + dur[l["id"]], 3), "text": l["text"], "caption": l["caption"]})
    t += dur[l["id"]]
scenes[-1]["end"] = TOTAL

(ROOT / "src/chainlink-timeline.json").write_text(json.dumps({"fps": FPS, "duration": TOTAL, "frames": int(TOTAL * FPS), "scenes": scenes, "lines": out_lines}, indent=1))
print(f"speech {speech:.1f}s, gap scale {k:.2f}, last word ends {t:.2f}s")
for s in scenes:
    print(f"  {s['id']:10s} {s['start']:7.2f} to {s['end']:7.2f}  ({s['end'] - s['start']:.1f}s)")
