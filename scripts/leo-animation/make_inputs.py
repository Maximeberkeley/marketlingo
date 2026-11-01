"""Make Runway first/last frames for Leo.

Each pose PNG is placed on a 1080x1080 pure green (#00FF00) canvas. The pose's own canvas
is scaled to 810x810 and centered, the same way the app fits each PNG into Leo's box, so
every clip starts and ends on frames that line up with each other. The 135 px margin on
each side gives Leo room to jump or stretch without leaving the frame.

Usage: python3 make_inputs.py MASCOT_DIR OUT_DIR
"""
import os
import sys
from PIL import Image

CANVAS, INNER = 1080, 810
GREEN = (0, 255, 0, 255)
POSES = {
    # file name in runway-inputs : source PNG in mobile/assets/mascot
    'leo-sleeping': 'leo-sleeping.png',
    'leo-idle': 'leo-reference.png',  # same design as leo-idle.png without the smudge on the forehead
    'leo-reading': 'leo-reading-oct11.png',
    'leo-thinking': 'leo-thinking.png',
    'leo-celebrating': 'leo-celebrating.png',
    'leo-failure': 'leo-failure.png',
    'leo-waving': 'leo-waving.png',
    'leo-call': 'leo-voice-study.png',  # headset + desk, the Leo call screen
    'leo-success': 'leo-success.png',  # proud resting pose (eyes closed, paw up, sparkles)
}

src_dir, out_dir = sys.argv[1], sys.argv[2]
os.makedirs(out_dir, exist_ok=True)
for name, src in POSES.items():
    pose = Image.open(os.path.join(src_dir, src)).convert('RGBA').resize((INNER, INNER), Image.LANCZOS)
    frame = Image.new('RGBA', (CANVAS, CANVAS), GREEN)
    off = (CANVAS - INNER) // 2
    frame.alpha_composite(pose, (off, off))
    frame.convert('RGB').save(os.path.join(out_dir, f'{name}.png'), optimize=True)
    print(f'{name}.png  <- {src}')
