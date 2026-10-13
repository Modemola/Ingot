"""Sound for the product demo: narration, a light music bed, a chime per on-chain confirmation.

Reads src/demo-edit.json (the cut) and demo/audio-src/D*.wav. Writes out/demo-mix.wav at -14 LUFS,
true peak <= -1.5 dBTP. Reuses the film's instruments from audio/mix.py.
"""

import json
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "audio"))
import mix as M  # noqa: E402  (the film's synths, effects, limiter)

SR = M.SR
EDIT = json.loads((ROOT / "src/demo-edit.json").read_text())
DUR = EDIT["duration"]
N = int(DUR * SR) + SR


def add(buf, sig, at, gain=1.0, pan=0.0):
    M.add(buf, sig, at, gain, pan)


def bed():
    pad = np.zeros((N, 2))
    arp = np.zeros((N, 2))
    bass = np.zeros((N, 2))
    prog = [M.DM9, M.BBMAJ7, M.FMAJ9, M.CADD9]
    seg = 2 * M.BAR
    t, i = 0.0, 0
    end = EDIT["outroStart"]
    while t < end:
        ch = prog[i % 4]
        n = int((seg + 2.4) * SR)
        env = M.env_adsr(n, 1.4 if i == 0 else 0.7, 0.5, 0.85, 2.2, sustain_len=seg - 1.2)
        for m in ch:
            add(pad, M.pad_voice(M.hz(m), n, bright=0.5) * env[:, None], t, 0.15 / np.sqrt(len(ch)))
        if t >= EDIT["introEnd"] - 0.2:
            for k in range(4):
                add(bass, M.bass_note(M.hz(ch[0] - 12), M.BAR * 0.48), t + k * M.BAR / 2, 0.15)
            notes = [ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[4] + 12]
            for k in range(16):
                if k % 2:
                    continue
                add(arp, M.pluck(M.hz(notes[(k // 2) % 4]), 1.1, 0.9), t + k * M.BEAT / 2, 0.06, pan=0.3 * np.sin(k))
        t += seg
        i += 1
    # the resolve under the end card
    n = int((DUR - end + 2.5) * SR)
    env = M.env_adsr(n, 0.25, 0.6, 0.8, 2.5)
    for m in M.DMAJ9:
        add(pad, M.pad_voice(M.hz(m), n, bright=0.65) * env[:, None], end - 0.1, 0.17 / np.sqrt(5))
    ir = M.reverb_ir(3.0, 5200)
    d = int(M.BEAT * 0.75 * SR)
    echo = np.zeros_like(arp)
    echo[d:, 0] += arp[:-d, 1] * 0.3
    music = pad + arp + bass + M.reverb(pad * 0.55 + arp * 0.9, ir) * 0.5 + echo
    return M.hp(music, 40)


def fx():
    out = np.zeros((N, 2))
    send = np.zeros((N, 2))

    def put(sig, at, gain_db, pan=0.0, wet=0.3):
        add(out, sig, at, M.db(gain_db), pan)
        add(send, sig, at, M.db(gain_db) * wet, pan)

    put(M.sfx_impact(46, 3.2, 0.9), 0.15, -14, wet=0.4)
    put(M.sfx_shimmer(86, 3.0), 0.4, -26, wet=0.6)
    for x in EDIT["txs"]:
        put(M.sfx_chime(86), x["at"], -27, pan=0.35, wet=0.5)
    for c in EDIT["clips"][1:]:
        put(M.sfx_air(0.9), c["start"] - 0.45, -36, wet=0.4)
    put(M.sfx_riser(1.4, 160, 1200), EDIT["outroStart"] - 1.4, -30, wet=0.4)
    put(M.sfx_impact(44, 3.6, 1.0), EDIT["outroStart"] + 0.1, -13, wet=0.45)
    put(M.sfx_shimmer(86, 3.6), EDIT["outroStart"] + 0.35, -24, wet=0.65)
    return out + M.reverb(send, M.reverb_ir(2.4, 6500)) * 0.8


def narration():
    vo = np.zeros(N)
    meter = pyln.Meter(SR)
    for line in EDIT["lines"]:
        x, sr = sf.read(ROOT / f"demo/audio-src/{line['id']}.wav")
        x = M.hp(resample_poly(x, SR, sr), 75)
        x = x * M.db(-19.0 - meter.integrated_loudness(x))
        x = x + 0.18 * M.bp(x, 2500, 6000) - 0.1 * M.bp(x, 180, 320)
        i = int(round(line["start"] * SR))
        vo[i:i + len(x)] += x[: max(0, min(len(x), N - i))]
    env = np.sqrt(np.maximum(M.lp(vo ** 2, 12), 0) + 1e-9)
    thr = M.db(-24)
    vo = vo * np.where(env > thr, (thr / env) ** (1 - 1 / 2.2), 1.0) * M.db(2.5)
    room = M.reverb(np.stack([vo, vo], axis=1), M.reverb_ir(0.9, 6000, 0.01)) * 0.06
    return np.stack([vo, vo], axis=1) + room, np.abs(vo)


def main():
    vo, vo_abs = narration()
    music = bed()
    sfx = fx()
    t = np.arange(N) / SR
    curve = M.db(np.interp(t, [0, 1.0, EDIT["introEnd"], EDIT["introEnd"] + 1.5, EDIT["outroStart"], EDIT["outroStart"] + 0.5, DUR - 2.0, DUR - 0.1, DUR + 1],
                           [-30, -3, -3, -7, -7, -1, -2, -60, -80]))
    music = music * curve[:, None] * M.duck(vo_abs, -12)[:, None]
    sfx = sfx * M.duck(vo_abs, -4)[:, None] * M.db(np.interp(t, [0, DUR - 0.6, DUR], [0, 0, -60]))[:, None]
    mix = (vo + music * M.db(4.5) + sfx * M.db(-2))[: int(DUR * SR)]
    mix = M.hp(mix, 25)
    meter = pyln.Meter(SR)
    for _ in range(3):
        mix = mix * M.db(-14.0 - meter.integrated_loudness(mix))
        mix = M.true_peak_limit(mix, -1.7)
    print(f"demo mix: {meter.integrated_loudness(mix):.2f} LUFS, true peak {M.measure_tp(mix):.2f} dBTP")
    f = int(0.01 * SR)
    mix[:f] *= np.linspace(0, 1, f)[:, None]
    mix[-f:] *= np.linspace(1, 0, f)[:, None]
    (ROOT / "out").mkdir(exist_ok=True)
    sf.write(ROOT / "out/demo-mix.wav", mix.astype(np.float32), SR, subtype="FLOAT")


if __name__ == "__main__":
    main()
