"""Ingot film: procedural score, sound design, narration placement, mix and master.

Reads src/timeline.json (the same timeline the picture renders from) so every hit lands on the
frame it belongs to, and audio-src/L*.wav (the narration). Writes out/mix.wav: 48 kHz stereo,
-14 LUFS integrated, true peak <= -1 dBTP.

    python audio/mix.py            # full mix
    python audio/mix.py --stems    # also write out/stem-{vo,music,sfx}.wav
"""

import json
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt, sosfiltfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48_000
RNG = np.random.default_rng(7)

TL = json.loads((ROOT / "src/timeline.json").read_text())
DUR = TL["duration"]
N = int(DUR * SR) + SR  # a second of tail room, trimmed at the end
SCENE = {s["id"]: s for s in TL["scenes"]}
LINE = {l["id"]: l for l in TL["lines"]}


def S(name):
    return SCENE[name]["start"]


def E(name):
    return SCENE[name]["end"]


def L(name):
    return LINE[name]["start"]


def LE(name):
    return LINE[name]["end"]


def db(x):
    return 10 ** (x / 20)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def tt(n):
    return np.arange(n) / SR


def add(buf, sig, at, gain=1.0, pan=0.0):
    """Mix a mono or stereo signal into a stereo buffer at `at` seconds, equal-power pan."""
    i = int(round(at * SR))
    if i >= len(buf):
        return
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], axis=1)
    j = min(len(buf), i + len(sig))
    if i < 0:
        sig = sig[-i:]
        i = 0
    buf[i:j] += sig[: j - i] * gain


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x, axis=0)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x, axis=0)


def env_adsr(n, a, d, s, r, sustain_len=None):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    hold = n - a - d - r if sustain_len is None else int(sustain_len * SR)
    hold = max(0, hold)
    e = np.concatenate([
        np.linspace(0, 1, max(1, a)) ** 1.6,
        np.linspace(1, s, max(1, d)),
        np.full(hold, s),
        np.linspace(s, 0, max(1, r)) ** 1.4 * (s if s > 0 else 1),
    ])
    out = np.zeros(n)
    m = min(n, len(e))
    out[:m] = e[:m]
    return out


def reverb_ir(seconds=2.6, damp=5000, predelay=0.018):
    n = int(seconds * SR)
    t = tt(n)
    decay = np.exp(-t * 6.9 / seconds)
    ir = RNG.standard_normal((n, 2)) * decay[:, None]
    ir = lp(ir, damp)
    ir[: int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))[:, None]
    ir = np.concatenate([np.zeros((int(predelay * SR), 2)), ir])
    return ir / np.sqrt((ir ** 2).sum(axis=0, keepdims=True))


def reverb(x, ir):
    return np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)


# -------------------------------------------------------------------------------------------
# Instruments


def pad_voice(f, n, bright=0.5, detune=0.07):
    """Warm detuned saw stack, additive, with slow chorus drift."""
    t = tt(n)
    out = np.zeros((n, 2))
    k = 2.0 + 9.0 * bright  # harmonic roll-off
    for d, p in ((-detune, -0.6), (0.0, 0.0), (detune, 0.6)):
        fd = f * 2 ** (d / 12)
        drift = 0.0015 * np.sin(2 * np.pi * (0.13 + 0.05 * p) * t + p)
        ph = 2 * np.pi * fd * (t + np.cumsum(drift) / SR)
        sig = np.zeros(n)
        for h in range(1, 14):
            if fd * h > 9000:
                break
            sig += np.sin(h * ph + 0.7 * h * p) * (1 / h) * np.exp(-(h - 1) / k)
        a = (p + 1) * np.pi / 4
        out[:, 0] += sig * np.cos(a)
        out[:, 1] += sig * np.sin(a)
    return out / 3


def pluck(f, dur=1.6, bright=1.0):
    n = int(dur * SR)
    t = tt(n)
    sig = np.zeros(n)
    for h, amp in ((1, 1.0), (2, 0.45 * bright), (3, 0.22 * bright), (4, 0.12 * bright), (6, 0.05 * bright)):
        sig += amp * np.sin(2 * np.pi * f * h * t) * np.exp(-t * (3.2 + 2.6 * h))
    sig *= np.minimum(1, t / 0.002)
    return sig


def bell(f, dur=2.4):
    n = int(dur * SR)
    t = tt(n)
    mod = 2.4 * np.exp(-t * 3.0) * np.sin(2 * np.pi * f * 3.5 * t)
    sig = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 2.1)
    sig += 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4.5)
    sig *= np.minimum(1, t / 0.0015)
    return sig


def bass_note(f, dur):
    n = int(dur * SR)
    t = tt(n)
    sig = np.sin(2 * np.pi * f * t) + 0.38 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return sig * env_adsr(n, 0.012, 0.25, 0.7, 0.12)


def kick(level=1.0):
    n = int(0.5 * SR)
    t = tt(n)
    f = 44 + 95 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sig = np.sin(ph) * np.exp(-t * 7.5)
    click = lp(RNG.standard_normal(n) * np.exp(-t * 400), 3500)
    return (sig + 0.25 * click) * level


def hat(level=1.0, decay=38):
    n = int(0.12 * SR)
    t = tt(n)
    return hp(RNG.standard_normal(n), 7500, 4) * np.exp(-t * decay) * level


def shaker(level=1.0):
    n = int(0.09 * SR)
    t = tt(n)
    e = np.minimum(1, t / 0.012) * np.exp(-t * 45)
    return bp(RNG.standard_normal(n), 4000, 11000) * e * level


# -------------------------------------------------------------------------------------------
# Sound design


def sfx_clack():
    n = int(0.035 * SR)
    t = tt(n)
    body = bp(RNG.standard_normal(n), 1400, 5200) * np.exp(-t * 160)
    tick = np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 300)
    return body * 0.9 + tick * 0.4


def sfx_tick(f=2600, dur=0.07):
    n = int(dur * SR)
    t = tt(n)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 70) * np.minimum(1, t / 0.0008)


def sfx_click():
    """A trackpad click: two tight transients."""
    n = int(0.06 * SR)
    t = tt(n)
    a = bp(RNG.standard_normal(n), 1800, 7000) * np.exp(-t * 520)
    b = np.zeros(n)
    k = int(0.028 * SR)
    b[k:] = bp(RNG.standard_normal(n - k), 1200, 5000) * np.exp(-tt(n - k) * 700) * 0.55
    return a + b + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 90) * 0.3


def sfx_key():
    n = int(0.045 * SR)
    t = tt(n)
    return bp(RNG.standard_normal(n), 2200, 8000) * np.exp(-t * 260) + np.sin(2 * np.pi * 420 * t) * np.exp(-t * 160) * 0.25


def sfx_whoosh(dur=0.9, lo=300, hi=5000, rise=0.62):
    n = int(dur * SR)
    t = tt(n) / dur
    noise = RNG.standard_normal(n)
    # sweep a band through the noise in blocks
    out = np.zeros(n)
    blocks = 48
    for b in range(blocks):
        i0, i1 = b * n // blocks, (b + 1) * n // blocks
        x = (b + 0.5) / blocks
        c = lo * (hi / lo) ** (x / rise if x < rise else (1 - x) / (1 - rise))
        seg = bp(noise[max(0, i0 - 2000):i1], c * 0.7, min(c * 1.4, 20000))
        out[i0:i1] = seg[-(i1 - i0):]
    e = np.where(t < rise, (t / rise) ** 2, ((1 - t) / (1 - rise)) ** 1.5)
    return out * e


def sfx_air(dur=1.6):
    """Soft scene-turn swell: filtered noise breath."""
    n = int(dur * SR)
    t = tt(n) / dur
    x = lp(hp(RNG.standard_normal(n), 300), 2600)
    return x * np.sin(np.pi * t) ** 2


def sfx_impact(f=48, dur=2.8, body=1.0):
    n = int(dur * SR)
    t = tt(n)
    fr = f + 70 * np.exp(-t * 18)
    sub = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 2.1)
    crack = lp(RNG.standard_normal(n), 6000) * np.exp(-t * 40) * 0.5
    tail = lp(RNG.standard_normal(n), 900) * np.exp(-t * 3.0) * 0.18
    return (sub * body + crack + tail) * np.minimum(1, t / 0.001)


def sfx_riser(dur=2.0, f0=180, f1=1400):
    n = int(dur * SR)
    t = tt(n)
    x = t / dur
    f = f0 * (f1 / f0) ** (x ** 1.6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = (np.sin(ph) + 0.4 * np.sin(2.003 * ph)) * 0.35
    noise = hp(RNG.standard_normal(n), 2500) * 0.6
    e = x ** 2.3
    return (tone + noise * x) * e


def sfx_chime(root=81):
    sig = bell(hz(root), 2.6) * 0.7
    n = int(0.09 * SR)
    sig2 = np.concatenate([np.zeros(n), bell(hz(root + 7), 2.6)])[: len(sig)] * 0.5
    return sig + sig2


def sfx_glitch(dur=0.28):
    n = int(dur * SR)
    t = tt(n)
    sq = np.sign(np.sin(2 * np.pi * 220 * t * (1 + 3 * (RNG.random(n) > 0.97)))) * 0.5
    crushed = np.round(RNG.standard_normal(n) * 3) / 3
    gate = (np.floor(t * 70) % 2).astype(float)
    return lp(sq * 0.5 + crushed * 0.4, 5000) * gate * np.exp(-t * 9)


def sfx_low_hit():
    """A dark detuned low hit for a loss."""
    n = int(2.6 * SR)
    t = tt(n)
    f = hz(38)
    sig = np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.06 * t) + 0.3 * np.sin(2 * np.pi * f * 1.5 * 1.03 * t)
    sig *= np.exp(-t * 1.6) * np.minimum(1, t / 0.004)
    return sig + lp(RNG.standard_normal(n), 400) * np.exp(-t * 8) * 0.4


def sfx_shimmer(root=86, dur=3.0):
    n = int(dur * SR)
    out = np.zeros(n)
    for i, iv in enumerate((0, 7, 12, 16, 19, 24)):
        b = bell(hz(root + iv), dur - i * 0.07)
        k = int(i * 0.07 * SR)
        out[k:k + len(b)] += b * 0.28
    return out


# -------------------------------------------------------------------------------------------
# Score


BPM = 90
BEAT = 60 / BPM
BAR = 4 * BEAT

# chord tones (midi). D minor home; the resolve lands on D major.
DM9 = [50, 57, 60, 64, 65]   # D A C E F
BB = [46, 53, 58, 62, 65]    # Bb F Bb D F
GM = [43, 50, 58, 62, 67]    # G D Bb D G
A7 = [45, 52, 57, 61, 64]    # A E A C# E
FMAJ9 = [41, 53, 57, 60, 64, 67]
CADD9 = [48, 55, 62, 64, 67]
BBMAJ7 = [46, 53, 57, 62, 65]
DMAJ9 = [50, 57, 61, 64, 66]

# (start, end, chords per 2 bars, brightness, pad level dB)
SECTIONS = [
    ("open", 0.0, S("problem"), [DM9, DM9], 0.25),
    ("problem", S("problem"), L("L4") - 0.4, [DM9, BB, GM, A7], 0.35),
    ("problem-l4", L("L4") - 0.4, S("index"), [GM, A7], 0.3),
    ("index", S("index"), S("trade"), [DM9, FMAJ9, CADD9, BBMAJ7], 0.5),
    ("trade", S("trade"), S("credit"), [DM9, FMAJ9, CADD9, BBMAJ7], 0.62),
    ("credit-turn", S("credit"), L("L12") - 0.2, [BBMAJ7], 0.35),
    ("credit", L("L12") - 0.2, L("L14") - 0.3, [DM9, BB, FMAJ9, A7], 0.6),
    ("sweep", L("L14") - 0.3, L("L16"), [GM, A7], 0.32),
    ("resolve", L("L16"), E("credit"), [DMAJ9, FMAJ9], 0.75),
    ("vault", S("vault"), S("proof"), [BBMAJ7, FMAJ9, CADD9, DM9], 0.6),
    ("proof", S("proof"), S("end"), [DM9, BBMAJ7, FMAJ9, CADD9], 0.72),
    ("end", S("end"), DUR + 1, [FMAJ9, DMAJ9], 0.55),
]


def score():
    pad = np.zeros((N, 2))
    arp = np.zeros((N, 2))
    bass = np.zeros((N, 2))
    drums = np.zeros((N, 2))

    for name, a, b, chords, bright in SECTIONS:
        seg = 2 * BAR if len(chords) > 1 else (b - a)
        t = a
        i = 0
        while t < b - 0.05:
            ch = chords[i % len(chords)]
            length = min(seg, b - t)
            n = int((length + 2.2) * SR)
            env = env_adsr(n, 1.2 if t == a else 0.6, 0.5, 0.85, 2.0, sustain_len=max(0, length - 1.6))
            for m in ch:
                v = pad_voice(hz(m), n, bright=bright) * env[:, None]
                add(pad, v, t, gain=0.16 / np.sqrt(len(ch)))
            # bass under the chord, from the problem onwards
            if name not in ("open", "credit-turn", "end"):
                root = ch[0] - 12
                pulse = {"problem": 2, "problem-l4": 1, "index": 2, "trade": 4, "credit": 4, "sweep": 1, "resolve": 2, "vault": 2, "proof": 4}[name]
                step = BAR / pulse
                k = 0
                while k * step < length - 0.05:
                    add(bass, bass_note(hz(root), min(step * 0.92, length - k * step)), t + k * step, gain=0.19 if pulse > 1 else 0.17)
                    k += 1
            # arpeggio: 8ths in the brighter sections
            if name in ("index", "trade", "credit", "resolve", "vault", "proof"):
                notes = [ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[2] + 12, ch[4] + 12, ch[3] + 12, ch[2] + 12, ch[1] + 24]
                step = BEAT / 2
                k = 0
                while k * step < length - 0.05:
                    gt = t + k * step
                    m = notes[k % len(notes)]
                    vel = 0.9 if k % 2 == 0 else 0.6
                    if name == "index" and k % 2:
                        k += 1
                        continue
                    add(arp, pluck(hz(m), 1.2, bright=0.8 + bright * 0.4), gt, gain=0.105 * vel, pan=0.35 * np.sin(k * 1.3))
                    k += 1
            t += length
            i += 1

    # drums: a soft pulse, on a global grid so the cuts never stumble
    def grid(a, b, every):
        k0 = int(np.ceil(a / every))
        k = k0
        while k * every < b:
            yield k * every, k
            k += 1

    for a, b, kl, hl in (
        (S("index") + 2 * BAR, S("trade"), 0.42, 0.0),
        (S("trade"), S("credit"), 0.55, 0.05),
        (L("L12") + BAR, L("L14") - 0.3, 0.6, 0.06),
        (L("L16") + 0.4, E("credit"), 0.6, 0.06),
        (S("vault") + 0.6, S("proof"), 0.5, 0.045),
        (S("proof"), S("end") - 0.3, 0.62, 0.065),
    ):
        for gt, k in grid(a, b, BEAT):
            add(drums, kick(kl if k % 2 == 0 else kl * 0.7), gt, gain=0.38)
        if hl:
            for gt, k in grid(a, b, BEAT / 2):
                if k % 2:
                    add(drums, hat(hl * 1.5, 40), gt, pan=0.25)
            for gt, k in grid(a, b, BEAT / 4):
                add(drums, shaker(hl * (0.7 if k % 2 else 0.45)), gt, pan=-0.3)
    # ticking clock under the problem: the rates move every day
    for gt, k in grid(S("problem") + 0.6, L("L4") - 0.4, BEAT / 2):
        add(drums, sfx_tick(3400, 0.04), gt, gain=0.035 if k % 2 else 0.05, pan=0.2 if k % 2 else -0.2)

    ir = reverb_ir(3.0, 5200)
    dry = pad + arp * 0.85 + bass + drums
    wet = reverb(pad * 0.55 + arp * 0.9, ir) * 0.5
    # a dotted-eighth echo on the arpeggio
    d = int(BEAT * 0.75 * SR)
    echo = np.zeros_like(arp)
    echo[d:, 0] += arp[:-d, 1] * 0.32
    echo[2 * d:, 1] += arp[:-2 * d, 0] * 0.2
    music = dry + wet + echo
    return hp(music, 40)


# -------------------------------------------------------------------------------------------
# Events: every hit mirrors a moment in the picture (see the scene files for the same times).


def sound_design():
    fx = np.zeros((N, 2))
    send = np.zeros((N, 2))  # what goes to the reverb

    def put(sig, at, gain_db, pan=0.0, wet=0.25):
        add(fx, sig, at, db(gain_db), pan)
        add(send, sig, at, db(gain_db) * wet, pan)

    # --- open: the board flips to the live index
    price = "$3.7439"
    for i, ch in enumerate(price):
        st = 0.5 + i * 0.07
        flips = 7 if ch.isdigit() else 0
        for k in range(flips):
            put(sfx_clack(), st + k * 0.08, -25 + k * 0.4, pan=-0.5 + i * 0.16, wet=0.1)
        put(sfx_clack(), st + 0.08 * flips, -18, pan=-0.5 + i * 0.16, wet=0.15)
    for i in range(8):
        put(sfx_tick(3000 + 180 * i, 0.06), 1.3 + i * 0.12, -31, pan=-0.7 + i * 0.2, wet=0.4)
    reveal = LE("L2") + 0.5
    put(sfx_riser(2.1, 140, 1600), reveal - 2.1, -22, wet=0.4)
    put(sfx_impact(46, 3.4), reveal, -9, wet=0.35)
    put(sfx_shimmer(86, 3.2), reveal + 0.4, -24, wet=0.6)

    # scene turns
    for sid in ("problem", "index", "trade", "credit", "vault", "proof", "end"):
        put(sfx_air(1.4), S(sid) - 0.75, -27, wet=0.5)
    for at in (S("index") + 0.2, S("trade") + 0.2, L("L12") - 0.4, S("vault") + 0.2):
        put(sfx_whoosh(0.9, 250, 4200, 0.6), at - 0.25, -25, pan=0.2, wet=0.3)

    # --- problem
    put(sfx_whoosh(1.2, 200, 2500, 0.5), S("problem") + 0.5, -30, pan=-0.4, wet=0.4)
    put(sfx_tick(1760, 0.2), S("problem") + 7.3, -24, wet=0.5)  # the live dot
    for i in range(8):
        put(sfx_tick(2000 + 140 * i, 0.06), L("L3") + 7.6 + i * 0.12, -30, pan=-0.6 + 0.17 * i, wet=0.3)
    put(sfx_impact(52, 1.6, 0.6), L("L3") + 9.2, -19, pan=-0.3, wet=0.3)
    put(sfx_impact(60, 1.6, 0.6), L("L3") + 11.4, -18, pan=0.3, wet=0.3)
    put(sfx_low_hit(), L("L4") + 1.8, -24, wet=0.3)  # the premium nobody can measure

    # --- index: the print, opened up
    for i, dt in enumerate((1.2, 2.6, 3.9, 5.0)):
        put(sfx_tick(2400 + 200 * i, 0.06), L("L6") + dt, -26, pan=0.4, wet=0.3)
    put(sfx_chime(81), L("L6") + 6.2, -24, pan=0.35, wet=0.5)
    for k in range(5):  # the finality window counting down
        put(sfx_tick(1500, 0.05), L("L7") + 0.6 + k, -31, wet=0.3)
    put(sfx_glitch(), L("L7") + 3.5, -26, pan=0.6, wet=0.2)
    put(sfx_glitch(0.18), L("L7") + 4.8, -23, pan=0.6, wet=0.2)
    put(sfx_chime(83), L("L7") + 5.6, -22, pan=0.3, wet=0.5)

    # --- trade: type 10 lots, check the ticket, go long, one block
    for dt in (0.35, 0.6, 0.85, 1.3):
        put(sfx_key(), L("L9") + dt, -24, pan=-0.2, wet=0.1)
    for i, dt in enumerate((1.6, 2.6, 3.6, 4.8)):
        put(sfx_tick(2200 + 150 * i, 0.07), L("L9") + dt + 0.1, -27, pan=0.3, wet=0.3)
    fill = LE("L9") + 0.6
    put(sfx_click(), fill, -15, pan=-0.1, wet=0.1)
    put(sfx_impact(58, 1.4, 0.7), fill + 0.25, -17, wet=0.3)
    put(sfx_chime(86), fill + 0.3, -20, wet=0.55)
    put(sfx_tick(2900, 0.12), L("L10") + 2.6, -27, pan=-0.4, wet=0.4)

    # --- credit
    put(sfx_riser(1.8, 120, 900), L("L12") - 2.0, -26, wet=0.4)
    put(sfx_click(), L("L12") + 1.5, -17, pan=0.1, wet=0.1)   # Example
    put(sfx_click(), L("L12") + 3.2, -17, pan=-0.1, wet=0.1)  # Minimum
    for i, dt in enumerate((5.2, 6.0)):
        put(sfx_tick(2400 + 300 * i, 0.07), L("L12") + dt + 0.1, -27, pan=0.35, wet=0.3)
    draw = L("L12") + 7.6
    put(sfx_click(), draw, -15, wet=0.1)
    put(sfx_impact(55, 1.6, 0.7), draw + 0.3, -16, wet=0.3)
    put(sfx_chime(86), draw + 0.35, -20, wet=0.55)
    d0 = LE("L12") + 1.0
    for i in range(4):
        st = d0 + 0.9 + i * 0.85
        put(sfx_whoosh(0.55, 600, 6000, 0.7), st - 0.05, -27, pan=-0.6 + 0.4 * i, wet=0.25)
        put(sfx_tick(1800 + 220 * i, 0.08), st + 0.6, -24, pan=-0.6 + 0.4 * i, wet=0.3)
    put(sfx_impact(50, 1.8, 0.8), d0 + 4.4, -15, wet=0.35)  # ALL FOUR, OR NONE
    # the sweep: a slow descending tone while the unhedged line falls through the debt
    sw0, sw1 = L("L14") + 0.8, L("L15") + 5.6
    n = int((sw1 - sw0) * SR)
    x = tt(n) / (sw1 - sw0)
    f = 520 * (0.42 ** x)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * 0.15
    tone *= np.sin(np.pi * np.minimum(1, x * 1.05)) ** 0.7
    put(lp(tone, 2200), sw0, -30, wet=0.6)
    put(sfx_low_hit(), L("L15") + 4.4, -14, wet=0.35)               # −$111,967
    put(sfx_impact(50, 3.2, 1.0), L("L16") + 0.2, -11, wet=0.4)     # $274,311, hedged
    put(sfx_shimmer(86, 3.4), L("L16") + 0.3, -21, wet=0.6)

    # --- vault
    for i in range(6):
        put(sfx_tick(2600 + (300 if i % 2 == 0 else -300), 0.06), L("L17") + 2.0 + i * 0.5, -29, pan=0.5 if i % 2 == 0 else -0.5, wet=0.35)
    put(sfx_impact(46, 1.2, 0.5), L("L17") + 9.2, -22, wet=0.3)

    # --- proof
    for dt in (0.1, 2.1, 3.8, 7.6):
        put(sfx_impact(62, 1.0, 0.45), L("L18") + dt, -21, wet=0.3)
        put(sfx_tick(3200, 0.08), L("L18") + dt, -26, wet=0.3)
    put(sfx_whoosh(0.8, 400, 6000, 0.6), L("L18") + 9.0, -29, wet=0.3)

    # --- end
    put(sfx_riser(1.6, 160, 1200), S("end") - 1.0, -26, wet=0.4)
    put(sfx_impact(44, 4.0, 1.0), S("end") + 0.6, -10, wet=0.45)
    put(sfx_shimmer(86, 4.0), S("end") + 0.9, -21, wet=0.65)
    put(sfx_chime(81), LE("L19") + 0.3, -25, wet=0.7)

    ir = reverb_ir(2.4, 6500)
    return fx + reverb(send, ir) * 0.8


# -------------------------------------------------------------------------------------------
# Narration


def narration():
    vo = np.zeros(N)
    meter = pyln.Meter(SR)
    for lid, line in LINE.items():
        x, sr = sf.read(ROOT / f"audio-src/{lid}.wav")
        if x.ndim > 1:
            x = x.mean(axis=1)
        x = resample_poly(x, SR, sr)
        x = hp(x, 75)
        x = x * db(-19.0 - meter.integrated_loudness(np.pad(x, (0, max(0, SR // 2 - len(x))))))
        # gentle presence lift and de-boom
        x = x + 0.18 * bp(x, 2500, 6000) - 0.1 * bp(x, 180, 320)
        i = int(round(line["start"] * SR))
        vo[i:i + len(x)] += x[: max(0, min(len(x), N - i))]
    # a light leveling compressor
    env = np.sqrt(np.maximum(lp(vo ** 2, 12), 0) + 1e-9)
    thr = db(-24)
    gain = np.where(env > thr, (thr / env) ** (1 - 1 / 2.2), 1.0)
    vo = vo * gain * db(2.5)
    room = reverb(np.stack([vo, vo], axis=1), reverb_ir(0.9, 6000, 0.01)) * 0.06
    return np.stack([vo, vo], axis=1) * 0.98 + room, np.abs(vo)


# -------------------------------------------------------------------------------------------
# Mix + master


def keyframes(points):
    """Piecewise-linear gain curve from [(seconds, dB), ...]."""
    ts = np.array([p[0] for p in points])
    ds = np.array([p[1] for p in points])
    t = np.arange(N) / SR
    return db(np.interp(t, ts, ds))


def duck(vo_abs, depth_db=-10, attack=0.06, release=0.45, block=64):
    """Sidechain from the narration: duck fast when a word starts, recover slowly after."""
    env = lp(vo_abs, 8)
    on = np.clip(env / db(-34), 0, 1)
    nb = len(on) // block + 1
    v = np.pad(on, (0, nb * block - len(on))).reshape(nb, block).max(axis=1)
    a = np.exp(-block / (attack * SR))
    r = np.exp(-block / (release * SR))
    y = np.empty(nb)
    cur = 0.0
    for i in range(nb):
        cur = v[i] + (cur - v[i]) * (a if v[i] > cur else r)
        y[i] = cur
    out = lp(np.repeat(y, block)[: len(on)], 20)
    return db(depth_db * out)


def true_peak_limit(x, ceiling_db=-1.0, lookahead=0.004):
    """Lookahead brickwall on the 4x-oversampled peak.

    Hold the needed gain's minimum over ±lookahead, then average over a window no wider than the
    hold: every averaged value is then at most the gain needed at that sample, so nothing passes
    the ceiling, and the gain still moves smoothly.
    """
    from scipy.ndimage import minimum_filter1d, uniform_filter1d

    ceiling = db(ceiling_db)
    up = resample_poly(x, 4, 1, axis=0)
    peak = np.abs(up).max(axis=1)
    peak = np.pad(peak, (0, (-len(peak)) % 4)).reshape(-1, 4).max(axis=1)[: len(x)]
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    la = int(lookahead * SR)
    g = minimum_filter1d(need, size=2 * la + 1)
    g = uniform_filter1d(g, size=la + 1)
    return x * g[:, None]


def measure_tp(x):
    up = resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.abs(up).max() + 1e-12)


def main():
    stems = "--stems" in sys.argv
    out = ROOT / "out"
    out.mkdir(exist_ok=True)
    print("narration…")
    vo, vo_abs = narration()
    print("score…")
    music = score()
    print("sound design…")
    fx = sound_design()

    # per-scene music level, before ducking (dB)
    music_curve = keyframes([
        (0.0, -40), (1.2, -6), (LE("L1"), -6), (LE("L2") + 0.3, -3), (LE("L2") + 1.2, 1.5), (E("open") - 1.0, 0), (E("open"), -4),
        (S("problem") + 1, -5), (L("L4"), -7), (S("index"), -5), (S("trade"), -4),
        (S("credit"), -8), (L("L12"), -5), (L("L14"), -7), (L("L16"), -2.5), (L("L16") + 4, -4.5),
        (S("vault"), -4.5), (S("proof"), -3.5), (S("end"), -1.5), (DUR - 3.0, -3), (DUR - 0.2, -60), (DUR + 1, -80),
    ])
    music = music * music_curve[:, None] * duck(vo_abs, -14)[:, None]
    fx = fx * duck(vo_abs, -4)[:, None]
    fx_curve = keyframes([(0, 0), (DUR - 1.0, 0), (DUR - 0.1, -60), (DUR + 1, -80)])
    fx = fx * fx_curve[:, None]

    mix = vo * db(0) + music * db(4.5) + fx * db(-2)
    mix = mix[: int(DUR * SR)]
    mix = hp(mix, 25)

    meter = pyln.Meter(SR)
    for _ in range(3):
        lufs = meter.integrated_loudness(mix)
        mix = mix * db(-14.0 - lufs)
        mix = true_peak_limit(mix, -1.7)
    lufs = meter.integrated_loudness(mix)
    tp = measure_tp(mix)
    print(f"master: {lufs:.2f} LUFS integrated, true peak {tp:.2f} dBTP")
    # fade the very ends to silence
    f = int(0.01 * SR)
    mix[:f] *= np.linspace(0, 1, f)[:, None]
    mix[-f:] *= np.linspace(1, 0, f)[:, None]
    sf.write(out / "mix.wav", mix.astype(np.float32), SR, subtype="FLOAT")
    if stems:
        for name, x in (("vo", vo), ("music", music * db(4.5)), ("sfx", fx * db(-2))):
            sf.write(out / f"stem-{name}.wav", x[: int(DUR * SR)].astype(np.float32), SR, subtype="FLOAT")


if __name__ == "__main__":
    main()
