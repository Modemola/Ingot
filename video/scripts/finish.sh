#!/usr/bin/env bash
# Mux the rendered picture with the mastered mix, and cut the ~25 MB share copy.
#
#   FFMPEG=/path/to/ffmpeg scripts/finish.sh
#
# needs a full ffmpeg build (libx264, aac, hqdn3d).
set -euo pipefail
cd "$(dirname "$0")/.."
FF="${FFMPEG:-ffmpeg}"
OUT=out

# Master: the 1080p60 picture untouched, AAC 320k.
"$FF" -y -hide_banner -loglevel error -i "$OUT/picture.mp4" -i "$OUT/mix.wav" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart \
  "$OUT/ingot-film-1080p60.mp4"

# Share copy: 1080p30, two-pass to ~25 MB. The film grain is noise the encoder would spend the
# whole budget on, so it is smoothed away first; everything else survives.
DUR=$("$FF" -hide_banner -i "$OUT/picture.mp4" 2>&1 | sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' | awk -F: '{print $1*3600+$2*60+$3}')
TARGET_MB=${TARGET_MB:-24.6}
AUDIO_K=128
VIDEO_K=$(awk -v d="$DUR" -v mb="$TARGET_MB" -v a="$AUDIO_K" 'BEGIN{printf "%d", (mb*8*1024*1024/d)/1000 - a - 8}')
echo "share: ${DUR}s at ${VIDEO_K}k video + ${AUDIO_K}k audio"
VF="fps=30,hqdn3d=2.2:1.6:5:4,format=yuv420p"
X264="-c:v libx264 -preset veryslow -tune animation -b:v ${VIDEO_K}k -maxrate $((VIDEO_K * 3))k -bufsize $((VIDEO_K * 4))k -g 120 -bf 4"
cd "$OUT"
"$FF" -y -hide_banner -loglevel error -i picture.mp4 -vf "$VF" $X264 -pass 1 -passlogfile share -an -f mp4 /dev/null
"$FF" -y -hide_banner -loglevel error -i picture.mp4 -i mix.wav -map 0:v -map 1:a -vf "$VF" $X264 -pass 2 -passlogfile share \
  -c:a aac -b:a ${AUDIO_K}k -ar 48000 -shortest -movflags +faststart ingot-film-share.mp4
rm -f share-0.log share-0.log.mbtree
ls -la ingot-film-1080p60.mp4 ingot-film-share.mp4
