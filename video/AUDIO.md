# Ingot film: the audio prompt

This is the brief the soundtrack was built from. `audio/mix.py` implements it from the same
`src/timeline.json` the picture renders from, so every hit lands on its frame.

## The prompt

> Score and sound-design a 2:48 product film for Ingot, an on-chain market for GPU compute,
> narrated by one calm, close-miked voice. The picture is dark, warm and precise: black and
> gold, split-flap boards, glowing charts, real product UI. The sound should feel the same:
> expensive, restrained and exact, never "crypto hype".
>
> **Voice first, always.** The narration is the lead instrument. Level every line to the same
> loudness. Use a light leveling compressor, a small presence lift around 2.5–6 kHz, a dip in
> the boom at 180–320 Hz, and a trace of short room so it sits in the music. The music ducks
> about 12 dB under every word, fast on (60 ms) and slow off (450 ms). Between sentences it
> breathes back up. Under speech the music never comes within 12 dB of the voice. In the
> pauses it rises to about 4 dB under it.
>
> **Score.** 90 BPM on one grid for the whole film, so no cut stumbles. D minor home. Warm
> detuned pads, a soft sub-and-harmonics bass that still reads on laptop speakers, a plucked
> arpeggio with a dotted-eighth echo, and a soft kick, hats and shaker only where the story
> moves. The arc:
> - **Open:** drone and stillness under the split-flap clacks. A riser into one deep impact
>   and a bell shimmer on the logo reveal; the music steps forward here.
> - **Problem:** Dm–B♭–Gm–A. A faint ticking clock (the rates move every day). Two hits for
>   −45% and +237%, and a dark low hit under "a premium for risk they can't measure".
> - **Index:** it lifts to Dm–F–C–B♭ with sparse plucks. A tick per data row and a chime on
>   the price. The finality window ticks down; a digital glitch when the bad scrape is struck
>   out; a confirmation chime when the print goes final.
> - **Trade:** the groove arrives. Key clicks for "10 lots", a tick per ticket callout, a real
>   click on Go long, then a block-pulse thump and chime: filled in one Monad block.
> - **Credit:** a breakdown on "Here's what the market is really for", then a riser into the
>   loan. Clicks on Example, Minimum and Draw, then a thump and chime. One swish per arrow of
>   the four-step transaction and a stamp on "ALL FOUR, OR NONE". During the rate sweep the
>   groove drops out and a slow descending tone follows the unhedged line down. A dark,
>   detuned low hit on −$111,967. Then the resolve: D major, a full impact and a shimmer on
>   $274,311, and the groove comes back.
> - **Vault:** lighter, B♭–F–C–Dm. Alternating bid and ask ticks, a soft stop when the vault
>   stops adding risk.
> - **Proof:** the most confident groove. A hit and a tick on each of the four tiles.
> - **End:** a riser, the biggest impact, a long shimmer on the logo, one last chime, and a
>   clean fade to silence with the picture.
>
> **Levels per scene:** music comes forward for the open reveal (+1.5 dB), sits back under
> the problem and the sweep (−7 dB), and is at its most present for the proof and the end.
> Every SFX sits under the voice, ducked 4 dB by it, with a short shared reverb.
>
> **Master:** −14 LUFS integrated (the YouTube and X target), true peak ≤ −1 dBTP via a
> 4×-oversampled lookahead limiter, high-passed at 25 Hz, and 48 kHz stereo.

## Measured on the final mix

| | integrated |
|---|---|
| Whole film | −14.0 LUFS, true peak −1.7 dBTP (−1.0 after AAC in the share copy) |
| Voice, every scene | −13.5 to −13.9 LUFS |
| Music under speech | about 12.5 dB below the voice (RMS) |
| Music in the pauses | about 4 dB below the voice |

## Rebuild

```sh
python audio/mix.py --stems        # → out/mix.wav (+ out/stem-*.wav)
```

The narration in `audio-src/` is Kokoro-82M (voice `af_heart`), rendered from `narration.json`.
