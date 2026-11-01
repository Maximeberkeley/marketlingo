#!/usr/bin/env bash
# Convert every Runway download in a folder into the app's animation pack.
# Name each Runway MP4 after its clip (leo-sleep-loop.mp4, leo-wake.mp4, ...).
# Usage: bash convert_all.sh RUNWAY_MP4_DIR OUT_DIR
# OUT_DIR gets the .webp files, clips.json and a preview-*.png per clip (previews are for
# checking only; don't ship them).
set -euo pipefail
IN="$1"; OUT="$2"; HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$OUT"
conv() {  # name, flags...
  local name="$1"; shift
  if [ -f "$IN/$name.mp4" ]; then
    python3 "$HERE/leo_clip.py" "$IN/$name.mp4" "$OUT/$name.webp" --preview "$OUT/preview-$name.png" "$@"
  else
    echo "skip $name (no $IN/$name.mp4)"
  fi
}
# Home (CourseJourney centre)
conv leo-sleep-loop   --loop
conv leo-peek         --speed 1.5
conv leo-wake         --speed 2
conv leo-doze         --speed 1.5
conv leo-reading-loop --loop
conv leo-reading-wave --speed 1.5
conv leo-done         --speed 1.2
# Leo call (LeoVoiceChatOverlay), shown larger
conv leo-call-listen  --loop --size 720
conv leo-call-think   --loop --size 720
conv leo-call-talk    --loop --size 720
# Lessons (LeoCoach reactions)
conv leo-correct       --speed 2
conv leo-wrong         --speed 1.5
conv leo-thinking-loop --loop
conv leo-hello         --speed 1.5
# Extras
conv leo-idle-loop     --loop
conv leo-play          --speed 1.5
# Lesson moments (about 2 s each)
conv leo-ready         --speed 2
conv leo-success       --speed 2
conv leo-encourage     --speed 2
conv leo-greet         --speed 2
