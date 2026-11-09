#!/bin/sh
# One command: voice → events → mix → subtitles → render → mux.  Run from anywhere: sh build.sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
# ffmpeg 7+ is needed by mux.sh; a local bin/ffmpeg (e.g. from the imageio-ffmpeg wheel) is used when present
[ -x "$HERE/bin/ffmpeg" ] && export PATH="$HERE/bin:$PATH"
cd "$LIB"
[ -s "$HERE/fonts/Jost.ttf" ] || curl -fsSL -o "$HERE/fonts/Jost.ttf" "https://raw.githubusercontent.com/google/fonts/86aced91de05cd4f96a06838124cca45be337b2b/ofl/jost/Jost%5Bwght%5D.ttf"
[ -s "$HERE/voices/dur.json" ] || "$LIB/.venv/bin/python" core/tts/tts.py "$HERE/lines.json" "$HERE/voices"
node core/render/events.mjs "$HERE"
"$LIB/.venv/bin/python" "$HERE/mix.py"
node "$HERE/tools/cues.mjs" "$HERE/out/cues.json"
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/out/cues.json" "$HERE/igiene-mani.srt"
node core/render/video.mjs "$HERE" --fps 24 --workers ${WORKERS:-4} --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/igiene-mani.mp4" 24 0
