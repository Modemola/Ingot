#!/usr/bin/env bash
# The Chainlink film, end to end after the picture render:
#
#   python chainlink/tts.py <kokoro.onnx> <voices.npz>   # narration  -> chainlink/audio-src/
#   python chainlink/build_timeline.py                    # timing     -> src/chainlink-timeline.json
#   npx remotion render src/index.ts Chainlink out/chainlink-picture.mp4 --crf 12
#   python chainlink/mix.py                               # sound      -> out/chainlink-mix.wav
#   FFMPEG=/path/to/ffmpeg chainlink/finish.sh            # master + share copy
set -euo pipefail
cd "$(dirname "$0")/.."
FF="${FFMPEG:-ffmpeg}"
OUT=out

# Remotion writes full-range BT.601; every player expects limited-range BT.709.
COLOR="scale=in_color_matrix=bt601:in_range=full:out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p"
TAGS="-colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv"

# Master: 1080p30, near-transparent, AAC 320k.
"$FF" -y -hide_banner -loglevel error -i "$OUT/chainlink-picture.mp4" -i "$OUT/chainlink-mix.wav" \
  -map 0:v -map 1:a -vf "$COLOR" -c:v libx264 -preset slow -crf 16 -tune animation $TAGS \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart \
  "$OUT/ingot-chainlink-1080p.mp4"

# Share copy: two-pass to ~20 MB, grain smoothed so the bits go to the edges and type.
DUR=$( ("$FF" -hide_banner -i "$OUT/chainlink-picture.mp4" 2>&1 || true) | sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' | awk -F: '{print $1*3600+$2*60+$3}')
TARGET_MB=${TARGET_MB:-19.5}
AUDIO_K=160
VIDEO_K=$(awk -v d="$DUR" -v mb="$TARGET_MB" -v a="$AUDIO_K" 'BEGIN{printf "%d", (mb*8*1024*1024/d)/1000 - a - 8}')
echo "share: ${DUR}s at ${VIDEO_K}k video + ${AUDIO_K}k audio"
VF="hqdn3d=2.2:1.6:5:4,$COLOR"
X264="-c:v libx264 -preset veryslow -tune animation -b:v ${VIDEO_K}k -maxrate $((VIDEO_K * 3))k -bufsize $((VIDEO_K * 4))k -g 120 -bf 4 $TAGS"
cd "$OUT"
"$FF" -y -hide_banner -loglevel error -i chainlink-picture.mp4 -vf "$VF" $X264 -pass 1 -passlogfile cl-share -an -f mp4 /dev/null
"$FF" -y -hide_banner -loglevel error -i chainlink-picture.mp4 -i chainlink-mix.wav -map 0:v -map 1:a -vf "$VF" $X264 -pass 2 -passlogfile cl-share \
  -c:a aac -b:a ${AUDIO_K}k -ar 48000 -shortest -movflags +faststart ingot-chainlink.mp4
rm -f cl-share-0.log cl-share-0.log.mbtree
ls -la ingot-chainlink-1080p.mp4 ingot-chainlink.mp4
