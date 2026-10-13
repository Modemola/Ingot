"""A quiet bed for the CRE simulation video: out/cre-bed.wav, -20 LUFS."""
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "audio"))
import mix as M  # noqa: E402

DUR = 80.0
N = int(DUR * M.SR) + M.SR
pad = np.zeros((N, 2))
arp = np.zeros((N, 2))
prog = [M.DM9, M.BBMAJ7, M.FMAJ9, M.CADD9]
seg = 2 * M.BAR
t, i = 0.0, 0
while t < DUR - 6:
    ch = prog[i % 4]
    n = int((seg + 2.4) * M.SR)
    env = M.env_adsr(n, 1.5 if i == 0 else 0.7, 0.5, 0.85, 2.2, sustain_len=seg - 1.2)
    for m in ch:
        M.add(pad, M.pad_voice(M.hz(m), n, bright=0.45) * env[:, None], t, 0.15 / np.sqrt(len(ch)))
    if t > 4:
        for k in range(0, 16, 2):
            M.add(arp, M.pluck(M.hz(ch[1 + (k // 2) % 4] + 12), 1.1, 0.8), t + k * M.BEAT / 2, 0.045, pan=0.3 * np.sin(k))
    t += seg
    i += 1
n = int(8.5 * M.SR)
env = M.env_adsr(n, 0.3, 0.6, 0.8, 3.0)
for m in M.DMAJ9:
    M.add(pad, M.pad_voice(M.hz(m), n, bright=0.6) * env[:, None], DUR - 8.0, 0.17 / np.sqrt(5))
mix = pad + arp + M.reverb(pad * 0.5 + arp * 0.9, M.reverb_ir(3.0, 5200)) * 0.5
mix = M.hp(mix, 40)[: int(DUR * M.SR)]
tt = np.arange(len(mix)) / M.SR
mix *= M.db(np.interp(tt, [0, 1.5, DUR - 2.5, DUR - 0.1], [-40, 0, 0, -60]))[:, None]
fx = np.zeros((N, 2))
M.add(fx, M.sfx_impact(46, 3.0, 0.8), 0.1, M.db(-12))
M.add(fx, M.sfx_shimmer(86, 3.0), 0.4, M.db(-24))
mix = mix + fx[: len(mix)]
meter = pyln.Meter(M.SR)
mix = mix * M.db(-20.0 - meter.integrated_loudness(mix))
mix = M.true_peak_limit(mix, -3.0)
sf.write(ROOT / "out/cre-bed.wav", mix.astype(np.float32), M.SR, subtype="FLOAT")
print("bed", round(meter.integrated_loudness(mix), 2), "LUFS")
