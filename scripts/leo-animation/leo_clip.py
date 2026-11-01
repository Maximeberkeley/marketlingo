"""Turn a Runway clip of Leo on green into a transparent animated WebP for the app.

Usage:
  python3 leo_clip.py IN.mp4 OUT.webp [--speed 1.0] [--fps 15] [--size 480] [--loop]
                      [--quality 70] [--preview PREVIEW.png]

--speed 2   plays the clip twice as fast (a 4 s Runway clip becomes 2 s). Runway's shortest
            clip is 4 s, which is too slow for quick reactions.
--loop      the clip starts and ends on the same frame. Drops the trailing frames that
            repeat the first one, so the loop has no stutter, and reports the seam.
            Without --loop the WebP is marked to play once and hold its last frame.
--size      output width and height in px. 480 suits Home (Leo's 192 pt animation box);
            use 720 for the Leo call scene, which is shown much larger.
--fps       15 keeps files small; hand-drawn 2D cartoons are often animated at 12 fps.
--preview   writes a strip of frames over the app's light and dark backgrounds, to check edges.

Every run also records the clip in clips.json next to OUT.webp: {"leo-wake": {"ms": 2000, "loop": false}}.
The app reads one-shot durations from it.

How the key works: the background colour is sampled from the frame border, so it does not
need to be exactly #00FF00 after compression. A pixel is background when green clearly
exceeds both red and blue. Leo's own colours (orange, cream, gold, black) never do, so
they stay opaque. Edge pixels get partial alpha, their colour is un-mixed from the green,
and any leftover green spill is removed.
"""
import argparse
import json
import subprocess
import numpy as np
from PIL import Image

p = argparse.ArgumentParser()
p.add_argument('src')
p.add_argument('out')
p.add_argument('--speed', type=float, default=1.0)
p.add_argument('--fps', type=float, default=15)
p.add_argument('--size', type=int, default=480)
p.add_argument('--loop', action='store_true')
p.add_argument('--quality', type=int, default=70)
p.add_argument('--preview')
a = p.parse_args()

info = json.loads(subprocess.run(
    ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate',
     '-of', 'json', a.src], capture_output=True, text=True, check=True).stdout)['streams'][0]
W, H = info['width'], info['height']
num, den = map(int, info['r_frame_rate'].split('/'))
src_fps = num / den
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', a.src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                     capture_output=True, check=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
n_src = len(frames)

# Background colour: median of a thin border band on the first frame.
b = max(4, W // 50)
f0 = frames[0].astype(np.float32)
border = np.concatenate([f0[:b].reshape(-1, 3), f0[-b:].reshape(-1, 3), f0[:, :b].reshape(-1, 3), f0[:, -b:].reshape(-1, 3)])
key = np.median(border, axis=0)
key_dom = key[1] - max(key[0], key[2])
if key_dom < 60:
    raise SystemExit(f'Background does not look green (sampled RGB {key.round()}). Regenerate on a flat green background.')
lo, hi = 0.12 * key_dom, 0.45 * key_dom


def key_frame(rgb):
    c = rgb.astype(np.float32)
    dom = c[..., 1] - np.maximum(c[..., 0], c[..., 2])
    alpha = np.clip(1 - (dom - lo) / (hi - lo), 0, 1)
    alpha[alpha < 0.04] = 0
    alpha[alpha > 0.96] = 1
    # Un-mix the green from edge pixels: observed = a*fg + (1-a)*key.
    a3 = alpha[..., None]
    fg = np.where(a3 > 0.05, (c - (1 - a3) * key) / np.maximum(a3, 0.05), c)
    # Despill: green may not exceed the larger of red and blue.
    fg[..., 1] = np.minimum(fg[..., 1], np.maximum(fg[..., 0], fg[..., 2]) + 8)
    fg[alpha == 0] = 0  # flat colour under fully transparent pixels compresses far better
    out = np.dstack([np.clip(fg, 0, 255), alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA').resize((a.size, a.size), Image.LANCZOS)


# Resample in time: output frame i shows the source at t = i / fps * speed.
dur_src = n_src / src_fps
n_out = max(1, int(round(dur_src / a.speed * a.fps)))
idx = [min(n_src - 1, int(round(i / a.fps * a.speed * src_fps))) for i in range(n_out)]


def diff(i, j):
    return float(np.abs(frames[i].astype(np.int16) - frames[j].astype(np.int16)).mean())


seam_note = ''
if a.loop:
    # Drop trailing output frames that repeat the first frame (the shared first/last keyframe).
    while len(idx) > 2 and diff(idx[-1], idx[0]) < 2.0:
        idx.pop()
    seam = diff(idx[-1], idx[0])
    seam_note = f', loop seam diff {seam:.1f} (under ~6 looks smooth)'

out_frames = [key_frame(frames[i]) for i in idx]
out_frames[0].save(a.out, save_all=True, append_images=out_frames[1:], duration=int(round(1000 / a.fps)),
                   loop=0 if a.loop else 1, quality=a.quality, alpha_quality=60, method=4, lossless=False)

import os
kb = os.path.getsize(a.out) / 1024
man_path = os.path.join(os.path.dirname(os.path.abspath(a.out)), 'clips.json')
man = json.load(open(man_path)) if os.path.exists(man_path) else {}
man[os.path.splitext(os.path.basename(a.out))[0]] = {'ms': int(round(len(out_frames) * 1000 / a.fps)), 'loop': a.loop}
json.dump(dict(sorted(man.items())), open(man_path, 'w'), indent=2)
print(f'{os.path.basename(a.out)}: {len(out_frames)} frames, {len(out_frames) / a.fps:.2f} s at {a.fps:g} fps, '
      f'{a.size}px, {kb:.0f} KB, key RGB {key.round().astype(int).tolist()}{seam_note}')

if a.preview:
    picks = [out_frames[int(k * (len(out_frames) - 1) / 5)] for k in range(6)]
    t = 220
    sheet = Image.new('RGBA', (t * 6, t * 2))
    for row, bg in enumerate([(255, 255, 255, 255), (21, 23, 27, 255)]):  # app bg0 light / dark
        for col, fr in enumerate(picks):
            tile = Image.new('RGBA', (t, t), bg)
            tile.alpha_composite(fr.resize((t, t), Image.LANCZOS))
            sheet.paste(tile, (col * t, row * t))
    sheet.convert('RGB').save(a.preview)
