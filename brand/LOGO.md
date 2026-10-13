# Ingot logo

## The prompt

> Design the logo for **Ingot**, an on-chain market that prices GPU compute, lets traders
> hedge it, and lets lenders finance it. The brand is black and warm gold: precise,
> quiet, expensive. Think a private bank or a bullion vault, not crypto.
>
> **The mark** is a single gold ingot: a real trapezoidal bar in three-quarter view, built from
> exact 3D geometry so every face agrees. It is turned so its long edge **rises to the right**,
> the way a price goes when a market works. On its top face, where a refiner strikes their
> hallmark, the bar carries **the index itself**: a step line, a price that holds until the
> next print. It is struck into the metal, a shadowed groove with a lit lip. It says *compute,
> priced*, and only Ingot could own it.
>
> **Light and material:** a top face lit almost white-gold, a front face that falls from warm
> honey to deep amber, an end face in shadowed bronze, a crisp lit edge along the top, and one
> soft sheen across the front. No outlines, no glow rings, no coins, no chips, no rockets.
>
> **The wordmark** is "Ingot" in Newsreader, the site's display serif, set light (330) at its
> display optical size. It is outlined so it needs no font, in warm ink on black and
> near-black on cream. The caps are 74% of the mark's height and centred on it, half a cap
> away.
>
> **The system:** full-colour mark, dark and light lockups, one-colour gold, white and black
> versions (the faces separated by cut lines so the form survives in one colour), an app icon
> on black with a faint warm glow, and a favicon simplified to read at 16 px. Palette: Void
> `#090807`, Gold `#e8b661`, Soft `#f6dca6`, Deep `#b98535`, Ink `#f3ecdf`.

## Files

| | |
|---|---|
| `svg/ingot-mark.svg` | full-colour mark, transparent |
| `svg/ingot-mark-small.svg` | mark without the hallmark, for small sizes |
| `svg/ingot-mark-mono-{gold,white,black}.svg` | one colour |
| `svg/ingot-logo-{dark,light,dark-transparent}.svg` | mark and wordmark lockups |
| `svg/ingot-wordmark.svg` | the wordmark alone |
| `svg/ingot-icon.svg` | app icon / avatar on black |
| `svg/favicon.svg`, `svg/favicon-16.svg` | favicons |
| `png/` | all of the above rasterised, plus `ingot-logo-sheet.png` |

## Rebuild

```sh
python brand/build.py     # SVGs (needs fonttools, brotli, uharfbuzz)
node brand/render.mjs     # PNGs
node brand/sheet.mjs      # the presentation sheet
```
