"""Cut the raw demo take to the narration: writes src/demo-edit.json.

    python demo/build_edit.py <take-dir>      # take-dir holds events.json + frames.json

Each beat is a stretch of the raw take (between two logged steps) and the lines spoken over it.
The footage is retimed to fit its lines (within a natural range), then every beat's breathing
room is scaled so the film lands on exactly 2:59.
"""

import json
import sys
from pathlib import Path

import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
TAKE = Path(sys.argv[1])
FPS = 30
TOTAL = 179.0
INTRO = 3.6
OUTRO = 6.4  # end card, including the last line

ev = json.loads((TAKE / "events.json").read_text())
frames = json.loads((TAKE / "frames.json").read_text())
T0 = frames[0]
marks = {}
for e in ev["events"]:
    if e["name"] != "tx":
        marks.setdefault(e["name"], e["t"] - T0)
narr = {l["id"]: l for l in json.loads((ROOT / "demo/narration.json").read_text())["lines"]}
dur = {k: sf.info(ROOT / f"demo/audio-src/{k}.wav").duration for k in narr}

# (from-mark, offset, to-mark, offset, lines, chip)
BEATS = [
    ("landing", 0.3, "to-trade", 0.4, ["D1", "D2"], ("01", "The live site")),
    ("to-trade", 0.4, "connect", -0.3, [], ("02", "Trade"), 2.6),
    ("connect", -0.3, "connected", 1.4, ["D3"], ("02", "Connect a wallet"), 2.6),
    ("index", 0.0, "index-done", 0.4, ["D4"], ("02", "The on-chain index")),
    ("faucet", -0.2, "faucet-done", 1.6, ["D5"], ("03", "Faucet · test USDC")),
    ("margin", -0.2, "deposited", 1.6, ["D6"], ("03", "Post margin")),
    ("ticket", 0.0, "filled", 0.2, ["D7"], ("04", "Go long 10 lots")),
    ("filled", 0.2, "position", 4.4, ["D8"], ("04", "Filled · marked to the index")),
    ("to-credit", 0.0, "draw", -0.2, ["D10"], ("05", "Hedged credit"), 2.0),
    ("draw", -0.2, "drawn", 2.6, ["D11"], ("05", "Draw, hedged · one transaction")),
    ("sweep", -0.6, "sweep-done", 1.6, ["D12"], ("05", "Recovery at every rate")),
    ("to-underwrite", 1.6, "vault", 0.0, ["D13"], ("06", "Underwriter vault")),
    ("vault", 0.0, "vault-deposited", 2.4, ["D14"], ("06", "Deposit · mint shares")),
    ("to-close", 0.0, "closed", 2.6, ["D15"], ("07", "Close the position")),
]
BEATS = [b for b in BEATS if b[0] in marks and b[2] in marks]

LEAD, GAP, TAIL = 0.35, 0.45, 0.6
RMIN, RMAX = 0.75, 1.9


def allocate(budget):
    """Output length per beat: enough for its words, then spare time given first to beats whose
    footage can run at natural speed, then (up to RMIN) slowed. Never past a beat's own footage."""
    info = []
    for a, oa, b, ob, ids, chip, *fast in BEATS:
        src0, src1 = marks[a] + oa, marks[b] + ob
        raw = src1 - src0
        speech = sum(dur[i] for i in ids) + GAP * max(0, len(ids) - 1)
        need = LEAD + speech + TAIL if ids else 0.0
        # waiting-heavy beats (page loads, wallet connect) run fast and take no spare time
        info.append([src0, src1, raw, need, max(need, raw / (fast[0] if fast else RMAX)), bool(fast)])
    spare = budget - sum(x[4] for x in info)
    for cap in (1.0, RMIN):  # first up to natural speed, then slower
        if spare <= 1e-6:
            break
        room = [0.0 if x[5] else max(0.0, x[2] / cap - x[4]) for x in info]
        total_room = sum(room)
        if total_room <= 0:
            continue
        k = min(1.0, spare / total_room)
        for x, r in zip(info, room):
            x[4] += r * k
        spare -= total_room * k
    return info, spare


def plan(budget):
    info, spare = allocate(budget)
    clips, lines, chips = [], [], []
    t = INTRO
    for (a, oa, b, ob, ids, chip, *fast), (src0, src1, raw, need, out, _) in zip(BEATS, info):
        rate = raw / out
        if rate > (fast[0] if fast else RMAX):  # more footage than time: keep the end, where the action lands
            rate = fast[0] if fast else RMAX
            src0 = src1 - out * rate
        clips.append({"start": round(t, 3), "end": round(t + out, 3), "src": round(src0, 3), "rate": round(rate, 4), "srcEnd": round(src0 + out * rate, 3)})
        # words sit early in the beat, with any extra time after them
        lt = t + LEAD + min(0.8, max(0.0, (out - need) * 0.15))
        for i in ids:
            lines.append({"id": i, "start": round(lt, 3), "end": round(lt + dur[i], 3), "caption": narr[i]["caption"]})
            lt += dur[i] + GAP
        chips.append({"start": round(t, 3), "end": round(t + out, 3), "step": chip[0], "text": chip[1]})
        t += out
    return clips, lines, chips, t, spare


clips, lines, chips, end, spare = plan(TOTAL - OUTRO - INTRO)
if spare > 0.05:  # not enough footage anywhere: the end card holds a little longer
    OUTRO += spare
lo = 1.0
outro = TOTAL - OUTRO
lines.append({"id": "D16", "start": round(outro + 1.0, 3), "end": round(outro + 1.0 + dur["D16"], 3), "caption": narr["D16"]["caption"]})

# merge consecutive chips with the same text
merged = []
for c in chips:
    if merged and merged[-1]["text"] == c["text"] and merged[-1]["step"] == c["step"]:
        merged[-1]["end"] = c["end"]
    else:
        merged.append(dict(c))

# transactions: where each lands in the cut, labelled by the step it completes
LABEL = {
    "faucet-done": "Faucet: 250,000 test USDC",
    "approved": "Approve USDC for the market",
    "deposited": "Deposit $20,000 as margin",
    "filled": "Long 10 lots (7,300 GPU-hours)",
    "credit-approved": "Approve USDC for the credit pool",
    "drawn": "Loan drawn, hedge opened",
    "vault-approved": "Approve USDC for the vault",
    "vault-deposited": "Deposit $10,000 into the vault",
    "closed": "Position closed",
}
txs = []
evs = ev["events"]
for k, e in enumerate(evs):
    if e["name"] != "tx":
        continue
    nxt = next((x["name"] for x in evs[k + 1:] if x["name"] != "tx"), "")
    raw = e["t"] - T0
    for c in clips:
        if c["src"] <= raw <= c["srcEnd"]:
            at = c["start"] + (raw - c["src"]) / c["rate"]
            txs.append({"at": round(at + 0.4, 3), "hash": e["hash"], "label": LABEL.get(nxt, "Transaction")})
            break
    else:
        txs.append({"at": -100, "hash": e["hash"], "label": LABEL.get(nxt, "Transaction")})

out = {
    "fps": FPS,
    "duration": TOTAL,
    "frames": int(round(TOTAL * FPS)),
    "introEnd": INTRO,
    "outroStart": round(outro, 3),
    "clips": clips,
    "lines": lines,
    "chips": merged,
    "txs": txs,
    "address": ev["address"],
}
(ROOT / "src/demo-edit.json").write_text(json.dumps(out, indent=1))
print(f"cut ends {end:.2f}s; end card {outro:.2f} to {TOTAL}s; unallocated {spare:.2f}s")
for c in clips:
    print(f"  {c['start']:7.2f} to {c['end']:7.2f}  src {c['src']:7.2f}  ×{c['rate']:.2f}")
print(f"{len(txs)} transactions, {sum(1 for x in txs if x['at'] < 0)} outside the cut")
