#!/bin/sh
# One command: voice → events → mix → subtitles → render (1080×1920) → mux.  sh build.sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -x "$HERE/bin/ffmpeg" ] && export PATH="$HERE/bin:$PATH"
cd "$LIB"
[ -s "$HERE/voices/dur.json" ] || "$LIB/.venv/bin/python" core/tts/tts.py "$HERE/lines.json" "$HERE/voices"
node core/render/events.mjs "$HERE" --size 1080x1920
"$LIB/.venv/bin/python" "$HERE/mix.py"
node "$HERE/tools/cues.mjs" "$HERE/out/cues.json"
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/out/cues.json" "$HERE/disfagia.srt"
node core/render/video.mjs "$HERE" --fps 24 --workers ${WORKERS:-4} --size 1080x1920 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/disfagia.mp4" 24 0
