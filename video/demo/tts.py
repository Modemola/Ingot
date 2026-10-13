"""Narration for the demo: Kokoro-82M, voice af_heart. python demo/tts.py <model.onnx> <voices.npz>"""
import json
import sys
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

here = Path(__file__).resolve().parent
spec = json.loads((here / "narration.json").read_text())
out = here / "audio-src"
out.mkdir(exist_ok=True)
tts = Kokoro(sys.argv[1], sys.argv[2])
for line in spec["lines"]:
    samples, sr = tts.create(line["text"], voice=spec["voice"], speed=spec["speed"], lang="en-us")
    sf.write(out / f"{line['id']}.wav", samples, sr)
    print(line["id"], f"{len(samples) / sr:.2f}s")
