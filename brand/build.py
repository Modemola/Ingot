"""Ingot's logo, built from geometry.

The mark is a real trapezoidal ingot, projected from 3D so its faces are exactly consistent,
with the index's step line struck into its top face like a refiner's hallmark. The wordmark is
Newsreader (the site's display face) instanced at a light display weight and outlined, so the
files need no fonts.

    python brand/build.py          # → brand/svg/*.svg
"""

import math
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
OUT = ROOT / "svg"
OUT.mkdir(exist_ok=True)

INK = "#f3ecdf"
VOID = "#090807"
GOLD = "#e8b661"

# ------------------------------------------------------------------------------------------
# The ingot, in 3D

L, D, H = 1.0, 0.60, 0.34        # base length, depth, height
IX, IZ = 0.13, 0.10              # how far the top face is drawn in from the base
YAW, PITCH = math.radians(24), math.radians(34)  # turned so the long edge rises to the right


def project(p):
    x, y, z = p
    c, s = math.cos(YAW), math.sin(YAW)
    x, z = x * c + z * s, -x * s + z * c
    c, s = math.cos(PITCH), math.sin(PITCH)
    y, z = y * c - z * s, y * s + z * c
    return (x, -y)


BASE = {  # y = 0
    "lf": (-L / 2, 0, D / 2), "rf": (L / 2, 0, D / 2), "rb": (L / 2, 0, -D / 2), "lb": (-L / 2, 0, -D / 2),
}
TOP = {
    "lf": (-L / 2 + IX, H, D / 2 - IZ), "rf": (L / 2 - IX, H, D / 2 - IZ),
    "rb": (L / 2 - IX, H, -D / 2 + IZ), "lb": (-L / 2 + IX, H, -D / 2 + IZ),
}
FACES = {
    # the end you can see: with the bar turned to the right, its left end
    "right": [BASE["lb"], BASE["lf"], TOP["lf"], TOP["lb"]],
    "front": [BASE["lf"], BASE["rf"], TOP["rf"], TOP["lf"]],
    "top": [TOP["lf"], TOP["rf"], TOP["rb"], TOP["lb"]],
}


def on_top(u, v):
    """A point on the top face: u across its length, v front (0) to back (1)."""
    x0, x1 = -L / 2 + IX, L / 2 - IX
    z0, z1 = D / 2 - IZ, -D / 2 + IZ
    return (x0 + (x1 - x0) * u, H, z0 + (z1 - z0) * v)


def on_front(u, w):
    """A point on the sloped front face: u across, w bottom (0) to top (1)."""
    a = (-L / 2 + (IX) * w, H * w, D / 2 - IZ * w)
    b = (L / 2 - (IX) * w, H * w, D / 2 - IZ * w)
    return tuple(a[i] + (b[i] - a[i]) * u for i in range(3))


# The hallmark: the index's own shape, a print that holds until the next.
STEPS = [(0.00, 0.25), (0.24, 0.62), (0.50, 0.42), (0.74, 0.80), (1.00, 0.80)]


def hallmark_points():
    pts = []
    for i, (u, v) in enumerate(STEPS):
        if i:
            pts.append((u, STEPS[i - 1][1]))
        pts.append((u, v))
    # inset onto the stamp area of the top face
    return [(0.17 + 0.66 * u, 0.2 + 0.6 * v) for u, v in pts]


class Frame:
    """Fit projected geometry into a square viewBox."""

    def __init__(self, size=512, pad=0.1):
        pts = [project(p) for f in FACES.values() for p in f]
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        w, h = max(xs) - min(xs), max(ys) - min(ys)
        self.k = size * (1 - 2 * pad) / max(w, h)
        self.ox = size / 2 - (min(xs) + w / 2) * self.k
        self.oy = size / 2 - (min(ys) + h / 2) * self.k
        self.size = size

    def __call__(self, p3):
        x, y = project(p3)
        return (self.ox + x * self.k, self.oy + y * self.k)


def poly(pts):
    return "M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + " Z"


def line(pts):
    return "M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in pts)


def mark_body(F, detail=True, flat=None, idp="g"):
    """The ingot's faces. `flat` is a single colour for one-colour versions."""
    right, front, top = (poly([F(p) for p in FACES[k]]) for k in ("right", "front", "top"))
    if flat:
        # one colour: faces separated by hairline cuts so the form still reads
        cut = F.size * 0.012
        return (
            f'<g fill="{flat}" stroke="{flat}" stroke-width="0">'
            f'<path d="{right}"/><path d="{front}"/><path d="{top}"/></g>'
            f'<g fill="none" stroke="var(--cut, {VOID})" stroke-width="{cut:.2f}" stroke-linejoin="round">'
            f'<path d="{line([F(TOP["rf"]), F(TOP["lf"]), F(TOP["lb"])])}"/>'
            f'<path d="{line([F(TOP["lf"]), F(BASE["lf"])])}"/></g>'
            + (hallmark(F, flat_cut=True) if detail else "")
        )
    tf, tb = F(TOP["lf"]), F(TOP["rb"])
    ff0, ff1 = F(on_front(0.5, 1)), F(on_front(0.5, 0))
    r0, r1 = F(TOP["lf"]), F(BASE["lb"])
    defs = f"""
  <defs>
    <linearGradient id="{idp}top" gradientUnits="userSpaceOnUse" x1="{tf[0]:.1f}" y1="{tf[1]:.1f}" x2="{tb[0]:.1f}" y2="{tb[1]:.1f}">
      <stop offset="0" stop-color="#fffaf0"/><stop offset="0.45" stop-color="#fbe7bd"/><stop offset="1" stop-color="#f0cf8c"/>
    </linearGradient>
    <linearGradient id="{idp}front" gradientUnits="userSpaceOnUse" x1="{ff0[0]:.1f}" y1="{ff0[1]:.1f}" x2="{ff1[0]:.1f}" y2="{ff1[1]:.1f}">
      <stop offset="0" stop-color="#f4cd84"/><stop offset="0.55" stop-color="#d9a24e"/><stop offset="1" stop-color="#a87228"/>
    </linearGradient>
    <linearGradient id="{idp}right" gradientUnits="userSpaceOnUse" x1="{r0[0]:.1f}" y1="{r0[1]:.1f}" x2="{r1[0]:.1f}" y2="{r1[1]:.1f}">
      <stop offset="0" stop-color="#a5712a"/><stop offset="1" stop-color="#4a3010"/>
    </linearGradient>
    <linearGradient id="{idp}sheen" gradientUnits="userSpaceOnUse" x1="{F(BASE['lf'])[0]:.1f}" y1="0" x2="{F(BASE['rf'])[0]:.1f}" y2="0">
      <stop offset="0.08" stop-color="#fff" stop-opacity="0"/><stop offset="0.3" stop-color="#fff6e0" stop-opacity="0.2"/>
      <stop offset="0.55" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>"""
    edge = F.size * 0.006
    body = (
        f'<path d="{right}" fill="url(#{idp}right)"/>'
        f'<path d="{front}" fill="url(#{idp}front)"/>'
        f'<path d="{front}" fill="url(#{idp}sheen)"/>'
        f'<path d="{top}" fill="url(#{idp}top)"/>'
        # the lit front edge of the top face
        f'<path d="{line([F(TOP["lf"]), F(TOP["rf"])])}" stroke="#fffaf0" stroke-opacity="0.9" stroke-width="{edge:.2f}" fill="none" stroke-linecap="round"/>'
        f'<path d="{line([F(TOP["lf"]), F(TOP["lb"])])}" stroke="#fff4dc" stroke-opacity="0.45" stroke-width="{edge:.2f}" fill="none" stroke-linecap="round"/>'
    )
    return defs + body + (hallmark(F) if detail else "")


def hallmark(F, flat_cut=False):
    pts = [F(on_top(u, v)) for u, v in hallmark_points()]
    w = F.size * 0.018
    if flat_cut:
        return f'<path d="{line(pts)}" fill="none" stroke="var(--cut, {VOID})" stroke-width="{w * 0.9:.2f}" stroke-linejoin="miter" stroke-linecap="butt"/>'
    # struck into the metal: a shadowed groove with a lit lower lip
    lip = [(x, y + w * 0.55) for x, y in pts]
    return (
        f'<path d="{line(lip)}" fill="none" stroke="#fffdf6" stroke-opacity="0.85" stroke-width="{w * 0.7:.2f}" stroke-linejoin="miter"/>'
        f'<path d="{line(pts)}" fill="none" stroke="#a06a22" stroke-width="{w:.2f}" stroke-linejoin="miter"/>'
    )


# ------------------------------------------------------------------------------------------
# The wordmark, outlined

def wordmark_paths(text="Ingot", wght=330, opsz=72, tracking=-0.012):
    font = TTFont(REPO / "video/public/fonts/newsreader-latin-standard-normal.woff2")
    font.flavor = None
    inst = instantiateVariableFont(font, {"wght": wght, "opsz": opsz})
    tmp = OUT / ".newsreader-instance.ttf"
    inst.save(tmp)
    blob = hb.Blob.from_file_path(str(tmp))
    face = hb.Face(blob)
    hbfont = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {"kern": True, "liga": True})
    glyf = TTFont(tmp)
    gs = glyf.getGlyphSet()
    order = glyf.getGlyphOrder()
    upm = glyf["head"].unitsPerEm
    x = 0
    paths = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        pen = SVGPathPen(gs)
        gs[name].draw(TransformPen(pen, (1, 0, 0, -1, x + pos.x_offset, -pos.y_offset)))
        paths.append(pen.getCommands())
        x += pos.x_advance + tracking * upm
    tmp.unlink()
    cap = glyf["OS/2"].sCapHeight
    return " ".join(paths), x - tracking * upm, upm, cap


# ------------------------------------------------------------------------------------------
# Files


def svg(w, h, body, title="Ingot", bg=None):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
        f"<title>{title}</title>{rect}{body}</svg>\n"
    )


def write(name, text):
    (OUT / name).write_text(text)
    print("wrote", name)


def main():
    F = Frame(512, 0.09)
    write("ingot-mark.svg", svg(512, 512, mark_body(F)))
    write("ingot-mark-small.svg", svg(512, 512, mark_body(Frame(512, 0.06), detail=False, idp="s")))
    write("ingot-mark-mono-gold.svg", svg(512, 512, mark_body(F, flat=GOLD).replace("var(--cut, #090807)", VOID), bg=None))
    write("ingot-mark-mono-black.svg", svg(512, 512, mark_body(F, flat="#111").replace("var(--cut, #090807)", "#fff")))
    write("ingot-mark-mono-white.svg", svg(512, 512, mark_body(F, flat="#fff").replace("var(--cut, #090807)", VOID)))

    # app icon: the mark on the brand's black, with a faint warm glow
    glow = (
        '<defs><radialGradient id="glow" cx="50%" cy="54%" r="55%"><stop offset="0" stop-color="#e8b661" stop-opacity="0.22"/>'
        '<stop offset="1" stop-color="#e8b661" stop-opacity="0"/></radialGradient></defs>'
    )
    Fi = Frame(1024, 0.19)
    icon = glow + '<rect width="1024" height="1024" fill="url(#glow)"/>' + mark_body(Fi, idp="i")
    write("ingot-icon.svg", svg(1024, 1024, icon, bg=VOID))
    Fs = Frame(64, 0.07)
    write("favicon.svg", svg(64, 64, mark_body(Fs, detail=False, idp="f"), bg=VOID))
    write("favicon-16.svg", svg(16, 16, mark_body(Frame(16, 0.02), detail=False, idp="x")))

    # lockups: mark + wordmark. The wordmark's cap height is 60% of the mark's height, its caps
    # centred on the mark; the gap is half a cap.
    paths, adv, upm, cap = wordmark_paths()
    Fm = Frame(400, 0.0)
    pts = [Fm(p) for f in FACES.values() for p in f]
    ml, mr = min(p[0] for p in pts), max(p[0] for p in pts)
    mt, mb = min(p[1] for p in pts), max(p[1] for p in pts)
    mh = mb - mt
    s = 0.74 * mh / cap
    capH = cap * s
    pad = 0.55 * mh
    gap = 0.62 * capH
    desc = 0.24 * upm * s  # room for the g
    top = pad
    W = pad + (mr - ml) + gap + adv * s + pad
    Hh = pad + mh + pad
    base = top + mh / 2 + capH / 2
    for name, ink, bg in (("ingot-logo-dark.svg", INK, VOID), ("ingot-logo-light.svg", "#16120d", "#f7f2e8"), ("ingot-logo-dark-transparent.svg", INK, None)):
        body = f'<g transform="translate({pad - ml:.1f},{top - mt:.1f})">{mark_body(Fm, idp="l")}</g>'
        body += f'<path transform="translate({pad + (mr - ml) + gap:.1f},{base:.1f}) scale({s:.5f})" d="{paths}" fill="{ink}"/>'
        write(name, svg(round(W), round(max(Hh, base + desc + pad * 0.6)), body, bg=bg))

    # the wordmark alone
    s = 1.0
    write("ingot-wordmark.svg", svg(int(adv) + 40, int(upm * 0.95), f'<path transform="translate(20,{upm * 0.72:.0f})" d="{paths}" fill="{INK}"/>'))


if __name__ == "__main__":
    main()
