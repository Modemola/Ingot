"""Sound for the Chainlink film: narration, a light bouncing bed, and a sound for every event.

Reads src/chainlink-timeline.json and chainlink/audio-src/L*.wav. Writes out/chainlink-mix.wav at
-14 LUFS. Reuses the film's instruments and effects from audio/mix.py. Event times are computed
the same way the picture computes them (src/chainlink/time.ts: wordT), so sound and picture agree.
"""

import json
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import resample_poly

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / "audio"))
import mix as M  # noqa: E402

SR = M.SR
TL = json.loads((ROOT / "src/chainlink-timeline.json").read_text())
DUR = TL["duration"]
N = int(DUR * SR) + SR
LINES = {l["id"]: l for l in TL["lines"]}
SCENES = {s["id"]: s for s in TL["scenes"]}

BPM = 104
BEAT = 60 / BPM
BAR = 4 * BEAT


def word(line_id, w, nth=0):
    """The same estimate the picture uses: a word's position in the line's text."""
    l = LINES[line_id]
    text = l["text"].lower()
    i = -1
    for _ in range(nth + 1):
        i = text.find(w.lower(), i + 1)
    assert i >= 0, (line_id, w)
    return l["start"] + i / len(text) * (l["end"] - l["start"])


def S(name):
    return SCENES[name]["start"]


def add(buf, sig, at, gain_db=0.0, pan=0.0):
    M.add(buf, sig, at, M.db(gain_db), pan)


# -------------------------------------------------------------------------------------------
# The bed: I–V–vi–IV in F, plucked, with a soft groove that sits out for the one-key gag.


PROG = [M.FMAJ9, M.CADD9, M.DM9, M.BBMAJ7]


def bed():
    pad = np.zeros((N, 2))
    pl = np.zeros((N, 2))
    bass = np.zeros((N, 2))
    drums = np.zeros((N, 2))
    key0, key1 = S("key"), S("cre") + 0.4  # the groove drops out for the key, back for CRE
    end = S("end")
    groove_in = S("stakes") - BAR / 2
    t, i = 0.0, 0
    while t < end:
        ch = PROG[i % 4] if not (key0 - 0.2 <= t < key1) else M.DM9
        n = int((BAR + 2.0) * SR)
        env = M.env_adsr(n, 0.9 if i == 0 else 0.35, 0.4, 0.8, 1.8, sustain_len=BAR - 0.6)
        for m in ch:
            add(pad, M.pad_voice(M.hz(m), n, bright=0.55) * env[:, None], t, -17 - 10 * np.log10(len(ch)))
        in_gag = key0 - 0.2 <= t < key1
        for k in range(8):
            at = t + k * BEAT / 2 + (0.035 if k % 2 else 0)  # a touch of swing
            if at >= end:
                break
            note = ch[1 + (k * 3) % (len(ch) - 1)] + 12
            if t >= 1.6 and not (in_gag and k % 2):
                add(pl, M.pluck(M.hz(note), 0.9, 0.9), at, -25 if not in_gag else -30, pan=0.35 * np.sin(k * 1.3 + i))
            if t >= groove_in and not in_gag:
                if k in (0, 4):
                    add(drums, M.kick(0.9), at, -20)
                if k % 2 == 1:
                    add(drums, M.hat(0.8, 46), at, -33, pan=0.2)
                add(drums, M.shaker(0.7), at + BEAT / 4, -40, pan=-0.25)
        if t >= groove_in and not in_gag:
            add(bass, M.bass_note(M.hz(ch[0] - 12 if ch[0] > 45 else ch[0]), BAR * 0.46), t, -19)
            add(bass, M.bass_note(M.hz(ch[0] - 12 if ch[0] > 45 else ch[0]), BAR * 0.22), t + BEAT * 2.5, -23)
        t += BAR
        i += 1
    # the resolve under the end card
    n = int((DUR - end + 2.0) * SR)
    env = M.env_adsr(n, 0.2, 0.6, 0.85, 3.2)
    for m in M.FMAJ9 + [72, 76]:
        add(pad, M.pad_voice(M.hz(m), n, bright=0.7) * env[:, None], end - 0.05, -18)
    ir = M.reverb_ir(2.6, 6000)
    music = pad + pl + bass + drums * 0.9 + M.reverb(pad * 0.5 + pl * 0.8, ir) * 0.45
    return M.hp(music, 32)


# -------------------------------------------------------------------------------------------
# Events: every pop, flap and stamp the picture makes.


def fx():
    out = np.zeros((N, 2))
    send = np.zeros((N, 2))

    def put(sig, at, gain_db, pan=0.0, wet=0.25):
        add(out, sig, at, gain_db, pan)
        add(send, sig, at, gain_db + 20 * np.log10(max(wet, 1e-3)), pan)

    pop = lambda f=1800: M.sfx_tick(f, 0.09)  # noqa: E731

    # 1 · open: a soft arrival, then the split-flap
    put(M.sfx_impact(46, 2.6, 0.7), 0.1, -17, wet=0.4)
    put(M.sfx_shimmer(84, 2.6), 0.3, -29, wet=0.6)
    flap = word("L2", "ours") + 0.2
    for i in range(7):
        for k in range(7 if i not in (0, 2) else 1):
            put(M.sfx_clack(), flap + i * 0.07 + k * 0.08, -27, pan=-0.3 + i * 0.1, wet=0.1)
    put(pop(2400), word("L2", "right now"), -30, wet=0.3)

    # 2 · stakes: a tick per card; a soft swell for the question
    for w, pan in (("marks", -0.4), ("triggers", 0.0), ("settles", 0.4)):
        put(pop(1500), word("L3", w) + 0.05, -26, pan)
    put(M.sfx_air(1.4), LINES["L4"]["start"] - 0.7, -30, wet=0.4)

    # 3 · the key: two pops, a cheerful tick, then the glitch
    put(pop(1700), word("L5", "one key"), -25, -0.2)
    put(pop(2100), word("L5", "one server"), -25, 0.2)
    put(M.sfx_chime(84), word("L5", "works perfectly") + 0.1, -33, wet=0.4)
    brk = word("L5", "doesn't") + 0.15
    put(M.sfx_glitch(0.32), brk, -22, wet=0.15)
    put(M.sfx_low_hit(), brk, -24, wet=0.3)
    for k in range(9):  # the price running away
        put(M.sfx_tick(1400 + k * 180, 0.05), brk + 0.08 + k * 0.1, -34, 0.4)

    # 4 · CRE: the dial sweeps, fires, wakes the network
    cron = word("L7", "cron")
    for k in range(12):
        put(M.sfx_tick(3000, 0.04), cron - 0.2 + k * 1.1 / 12, -36, -0.5 + k / 12)
    put(M.sfx_chime(81), cron + 0.9, -27, -0.3, wet=0.5)
    put(M.sfx_whoosh(0.9, 400, 4500), word("L7", "wakes"), -32, wet=0.3)
    don = word("L7", "decentralized") - 0.5
    for i in range(7):
        put(pop(1300 + i * 110), don + 0.1 + i * 0.12, -28, -0.6 + i * 0.2, wet=0.35)

    # 5 · fetch: quotes pop in, data runs down the wires, values land
    f8 = word("L8", "fetches")
    for i in range(8):
        put(M.sfx_tick(2200 + i * 90, 0.05), f8 - 0.3 + i * 0.09, -32, -0.6 + i * 0.17)
    put(M.sfx_whoosh(0.8, 600, 6000), f8 + 0.4, -34, wet=0.2)
    for i in range(5):
        put(M.sfx_tick(900, 0.06), f8 + 1.95 + i * 0.25, -32, -0.5 + i * 0.25)
    trim = word("L9", "trimmed")
    for i in range(5):
        put(pop(1900 + i * 70), trim + 0.5 + i * 0.12, -28, -0.5 + i * 0.25, wet=0.3)

    # 6 · consensus: the liar, the sort, the stamp
    put(M.sfx_glitch(0.22), word("L10", "bad data"), -27, 0.3)
    put(M.sfx_glitch(0.3), word("L10", "ninety-nine"), -24, 0.3)
    med = word("L11", "median") - 0.2
    for k in range(5):  # the drop, then the slide into order
        put(M.sfx_tick(1100 + k * 60, 0.05), med + 0.55 + k * 0.02, -32, -0.4 + k * 0.2)
    put(M.sfx_whoosh(0.9, 300, 3500, 0.5), med + 0.6, -31, wet=0.25)
    for k in range(5):
        put(M.sfx_clack(), med + 1.38 + k * 0.03, -29, -0.4 + k * 0.2)
    put(M.sfx_chime(86), med + 1.45, -29, wet=0.5)
    out_at = word("L11", "outvoted")
    put(M.sfx_impact(70, 0.9, 0.6), out_at, -22, 0.3, wet=0.2)
    put(M.sfx_clack(), out_at, -18, 0.3)

    # 7 · deliver: signatures, two legs, arrival, the door
    sig = word("L12", "signed")
    for i in range(5):
        put(pop(2000 + i * 150), sig + i * 0.08, -29, -0.3 + i * 0.15)
    put(M.sfx_whoosh(1.0, 300, 4000), word("L13", "forwarder") - 0.4, -27, -0.4)
    put(M.sfx_chime(83), word("L13", "verifies") + 0.3, -28, 0.0, wet=0.4)
    put(M.sfx_whoosh(1.1, 300, 4000), word("L13", "delivers"), -27, 0.4)
    put(M.sfx_chime(88), word("L13", "delivers") + 1.05, -26, 0.4, wet=0.5)
    put(pop(1600), word("L14", "sender") + 0.15, -26, 0.4)
    put(pop(1900), word("L14", "workflow") + 0.15, -26, 0.4)
    away = word("L14", "politely")
    put(M.sfx_air(0.8), word("L14", "anyone else") - 0.4, -32, 0.6)
    put(M.sfx_glitch(0.18), away - 0.4, -27, 0.5)
    put(M.sfx_whoosh(0.8, 500, 3000), away + 0.5, -33, 0.8)

    # 8 · guards: each panel lands, each check ticks
    for w in ("deviation", "minimum", "finality"):
        at = word("L15", w) - 0.15
        put(M.sfx_air(0.7), at - 0.1, -34)
        put(pop(1800), at + 1.0, -27)

    # 9 · product: a tick per row
    for w, pan in (("marks", 0.3), ("settles", 0.4), ("hedged", 0.5)):
        put(pop(1500), word("L16", w), -27, pan)
    put(M.sfx_chime(86), word("L16", "whole") + 0.9, -31, 0.4, wet=0.4)

    # 10 · proof: the command typed, the run's lines
    t0 = S("proof") + 0.5
    for k in range(24):
        put(M.sfx_key(), t0 + k * 1.4 / 24 + 0.012 * np.sin(k * 7.1), -34, 0.1 * np.sin(k))
    for w in ("compiled", "fetched", "agreed", "write", "dry run"):
        put(M.sfx_tick(2600, 0.05), word("L17", w), -32, 0.1)
    put(pop(2000), word("L18", "next") - 0.2, -27, -0.15)
    put(pop(2400), word("L18", "live"), -27, 0.15)

    # 11 · end: a riser into the card, one clean hit
    end = S("end")
    put(M.sfx_riser(1.4, 160, 1200), end - 1.4, -31, wet=0.4)
    put(M.sfx_impact(44, 3.2, 0.9), end + 0.1, -16, wet=0.45)
    put(M.sfx_shimmer(86, 3.4), end + 0.35, -26, wet=0.6)
    return out + M.reverb(send, M.reverb_ir(2.2, 6500)) * 0.8


# -------------------------------------------------------------------------------------------


def narration():
    vo = np.zeros(N)
    meter = pyln.Meter(SR)
    for l in TL["lines"]:
        x, sr = sf.read(HERE / "audio-src" / f"{l['id']}.wav")
        x = M.hp(resample_poly(x, SR, sr), 75)
        x = x * M.db(-19.0 - meter.integrated_loudness(x))
        x = x + 0.18 * M.bp(x, 2500, 6000) - 0.1 * M.bp(x, 180, 320)
        i = int(round(l["start"] * SR))
        vo[i:i + len(x)] += x[: max(0, min(len(x), N - i))]
    env = np.sqrt(np.maximum(M.lp(vo ** 2, 12), 0) + 1e-9)
    thr = M.db(-24)
    vo = vo * np.where(env > thr, (thr / env) ** (1 - 1 / 2.2), 1.0) * M.db(2.5)
    room = M.reverb(np.stack([vo, vo], axis=1), M.reverb_ir(0.8, 6000, 0.01)) * 0.05
    return np.stack([vo, vo], axis=1) + room, np.abs(vo)


def main():
    vo, vo_abs = narration()
    music = bed()
    sfx = fx()
    t = np.arange(N) / SR
    end = S("end")
    curve = M.db(np.interp(t, [0, 1.2, end - 0.2, end + 0.4, DUR - 2.2, DUR - 0.1, DUR + 1], [-30, -2, -2, 0, -1, -60, -80]))
    music = music * curve[:, None] * M.duck(vo_abs, -11)[:, None]
    sfx = sfx * M.duck(vo_abs, -3)[:, None] * M.db(np.interp(t, [0, DUR - 0.6, DUR], [0, 0, -60]))[:, None]
    mix = (vo + music * M.db(6.5) + sfx * M.db(1.0))[: int(DUR * SR)]
    mix = M.hp(mix, 25)
    meter = pyln.Meter(SR)
    for _ in range(3):
        mix = mix * M.db(-14.0 - meter.integrated_loudness(mix))
        mix = M.true_peak_limit(mix, -2.6)
    print(f"chainlink mix: {meter.integrated_loudness(mix):.2f} LUFS, true peak {M.measure_tp(mix):.2f} dBTP")
    # how loud each layer sits, for the record
    for name, x in (("voice", vo), ("music", music * M.db(6.5)), ("fx", sfx * M.db(1.0))):
        print(f"  {name:6s} {meter.integrated_loudness(x[: int(DUR * SR)]):.1f} LUFS (pre-normalisation)")
    f = int(0.01 * SR)
    mix[:f] *= np.linspace(0, 1, f)[:, None]
    mix[-f:] *= np.linspace(1, 0, f)[:, None]
    (ROOT / "out").mkdir(exist_ok=True)
    sf.write(ROOT / "out/chainlink-mix.wav", mix.astype(np.float32), SR, subtype="FLOAT")


if __name__ == "__main__":
    main()
