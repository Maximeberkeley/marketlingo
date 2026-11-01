# Leo animations: how they are made

The clips in `mobile/assets/mascot/anim/` were made with Runway and keyed with the scripts here. Use this README to add a clip or remake one.

## 1. Make the clip in Runway
- Model: **Seedance 2.5**, **Keyframe** mode. It takes an exact first and last frame, so loops close and clips chain.
- Frames: upload from `runway-inputs/`. Each is Leo's own PNG on flat green, in the middle 75% of a 1080 px square, so every clip shares the same framing.
- Settings: aspect ratio **1:1**, audio **Off**, **480p** (call clips **720p**). Download as MP4.
- Name the MP4 after the clip, e.g. `leo-reading-wave.mp4`.
- Before keeping it, check:
  - the cap and tassel stay on;
  - the outline stays thick;
  - four legs and one tail;
  - the background stays flat green;
  - the clip starts and ends on the given frames.

## 2. Convert it
```
bash scripts/leo-animation/convert_all.sh <folder of Runway MP4s> mobile/assets/mascot/anim
```
What the script does:
- Removes the green background.
- Speeds up reactions (Runway's shortest clip is 4 s) and trims the duplicate loop frame.
- Writes a transparent animated WebP at 15 fps (480 px, or 720 px for call clips) and updates `clips.json`.
- Writes a `preview-*.png` per clip over the app's light and dark backgrounds. Look at it, then delete it; don't commit it.
- Leaves out any clip whose MP4 isn't in the folder.

Then add the clip to `mobile/components/mascot/leoClips.ts` and `.js` with its length from `clips.json`.

`leo-idle-loop` and `leo-play` were made outside this list. To remake them, add their MP4s with those names.

`make_inputs.py` rebuilds `runway-inputs/` from `mobile/assets/mascot` if Leo's art changes:
```
python3 scripts/leo-animation/make_inputs.py mobile/assets/mascot scripts/leo-animation/runway-inputs
```

## 3. Prompts
Each block already ends with its Consistency line. Paste the whole block.

### leo-sleep-loop (in the app)
First `leo-sleeping.png`, last `leo-sleeping.png`, 4 s, 480p
```
Leo, the cartoon fox in the first frame, sleeps curled up and breathes slowly in a calm, seamless loop.
0-2s: his body rises gently on a slow breath in, his left ear twitches once, and the tip of his tail flicks.
2-4s: he breathes out and settles back exactly into the first-frame pose. His eyes stay closed the whole time.
Consistency: the same flat 2D cartoon fox in every frame (orange fur with subtle paper grain, cream face and inner ears, black-tipped tail, thick dark-orange outline, black graduation cap with a gold tassel that stays on). Same size and proportions. Locked-off static camera. The background stays a perfectly flat pure green (#00FF00) from edge to edge, with Leo the only thing in frame. Smooth hand-drawn 2D animation. No subtitles.
```

### leo-peek (in the app)
First `leo-sleeping.png`, last `leo-sleeping.png`, 4 s, 480p
```
Leo, asleep, secretly opens one eye to peek at the viewer, then goes back to sleep.
0-1s: he sleeps, breathing slowly.
1-2s: one eye opens halfway and glances straight at the camera, and one ear perks up.
2-3s: he gives the viewer a sly, sleepy look, then the eye slowly closes.
3-4s: he snuggles back down and settles exactly into the first-frame pose.
Consistency: the same flat 2D cartoon fox in every frame (orange fur with subtle paper grain, cream face and inner ears, black-tipped tail, thick dark-orange outline, black graduation cap with a gold tassel that stays on). Same size and proportions. Locked-off static camera. The background stays a perfectly flat pure green (#00FF00) from edge to edge, with Leo the only thing in frame. Smooth hand-drawn 2D animation. No subtitles.
```

### leo-wake (in the app)
First `leo-sleeping.png`, last `leo-idle.png`, 4 s, 480p
```
Leo wakes up, stretches and sits up, happy to see the viewer.
0-1s: his eyes blink open and his ears perk up.
1-3s: he stretches his front paws forward in a big stretch, then pushes up into a sitting position as his tail swings around behind him. His cap wobbles and stays on.
3-4s: he settles into the sitting pose of the last frame, looking at the viewer with bright eyes.
Consistency: the same flat 2D cartoon fox in every frame (orange fur with subtle paper grain, cream face and inner ears, black-tipped tail, thick dark-orange outline, black graduation cap with a gold tassel that stays on). Same size and proportions. Locked-off static camera. The background stays a perfectly flat pure green (#00FF00) from edge to edge, with Leo the only thing in frame. Smooth hand-drawn 2D animation. No subtitles.
```

### leo-doze (in the app)
First `leo-idle.png`, last `leo-sleeping.png`, 4 s, 480p
```
Leo gets sleepy and curls back up for a nap.
0-1s: he sits, and his eyelids get heavy with a slow blink.
1-3s: his head nods once, then twice, and he lies down, curling up and wrapping his tail around himself.
3-4s: he settles exactly into the curled-up sleeping pose of the last frame, eyes closed.
Consistency: the same flat 2D cartoon fox in every frame (orange fur with subtle paper grain, cream face and inner ears, black-tipped tail, thick dark-orange outline, black graduation cap with a gold tassel that stays on). Same size and proportions. Locked-off static camera. The background stays a perfectly flat pure green (#00FF00) from edge to edge, with Leo the only thing in frame. Smooth hand-drawn 2D animation. No subtitles.
```

### leo-reading-loop (in the app)
First `leo-reading.png`, last `leo-reading.png`, 5 s, 480p
```
Leo sits between his stacks of books reading the open book, in a calm, seamless loop.
0-2s: his head moves slowly from left to right as he reads, and his round glasses catch a small glint.
2-3s: he lifts a paw and turns a page of the open book.
3-5s: he nods, pleased, his tail swishes once, and he returns exactly to the first-frame pose.
Consistency: the same flat 2D cartoon fox with round glasses in every frame (orange fur with subtle paper grain, cream face and inner ears, black-tipped tail, thick dark-orange outline, black graduation cap with a gold tassel that stays on). The book stacks stay where they are. Same size and proportions. Locked-off static camera. The background stays a perfectly flat pure green (#00FF00) from edge to edge, with Leo and his books the only things in frame. Smooth hand-drawn 2D animation. No subtitles.
```

### leo-reading-wave (not made yet)
First `leo-reading.png`, last `leo-reading.png`, 4 s, 480p
```
Leo looks up from his book, waves at the viewer, then goes back to reading.
0-1s: he looks up from the book over his round glasses, and his ears perk up.
1-2s: he gives the viewer a cheerful wave with one paw, his eyes closed in a happy smile.
2-3s: he pushes his glasses back up with his paw.
3-4s: he looks back down at the book and returns exactly to the first-frame pose.
Consistency: the same flat 2D cartoon fox with round glasses in every frame (orange fur with subtle paper grain, cream face and inner ears, black-tipped tail, thick dark-orange outline, black graduation cap with a gold tassel that stays on). The book stacks stay where they are. Same size and proportions. Locked-off static camera. The background stays a perfectly flat pure green (#00FF00) from edge to edge, with Leo and his books the only things in frame. Smooth hand-drawn 2D animation. No subtitles.
```

### leo-done (in the app)
First `leo-sleeping.png`, last `leo-reading.png`, reference image `leo-celebrating.png`, 6 s, 480p
```
@Image 1: Leo celebrating (pose reference for the jump).
Leo wakes up because the viewer just finished today's lesson, jumps for joy, then settles into his reading corner.
0-1s: his eyes pop open and his ears shoot up.
1-3s: he springs into the air in the celebrating pose from @Image 1, paws up and eyes closed in a big happy smile, as small orange and yellow confetti bursts around him.
3-5s: he lands and the confetti falls out of frame. Stacks of colourful books and an open book slide in around him as he sits down and puts on round glasses.
5-6s: he settles exactly into the reading pose of the last frame.
Consistency: the same flat 2D cartoon fox in every frame (orange fur with subtle paper grain, cream face and inner ears, black-tipped tail, thick dark-orange outline, black graduation cap with a gold tassel that stays on). Same size and proportions. Locked-off static camera. The background stays a perfectly flat pure green (#00FF00) from edge to edge, with Leo, the confetti and the books the only things in frame. Smooth hand-drawn 2D animation. No subtitles.
```

### leo-call-listen (in the app)
First `leo-call.png`, last `leo-call.png`, 4 s, 720p
```
Leo, wearing his headset at his little wooden desk, listens closely to the viewer on a call, in a seamless loop.
0-1s: he leans in slightly toward the viewer, ears perked.
1-2s: he nods slowly twice, eyes on the viewer.
2-3s: one ear twitches and he tilts his head with interest.
3-4s: he settles back exactly into the first-frame pose.
Consistency: the same flat 2D cartoon fox with his black headset in every frame (orange fur with subtle paper grain, cream face and inner ears, black-tipped tail, thick dark-orange outline, black graduation cap with a gold tassel that stays on). The desk and the open book stay where they are. Same size and proportions. Locked-off static camera. The background stays a perfectly flat pure green (#00FF00) from edge to edge, with Leo, the desk and the book the only things in frame. Smooth hand-drawn 2D animation. No subtitles.
```

### leo-call-think (in the app)
First `leo-call.png`, last `leo-call.png`, 4 s, 720p
```
Leo, at his desk with his headset on, thinks about how to answer, in a seamless loop.
0-1s: he looks up and to the side and taps one paw on the desk.
1-2s: his eyes drift across as he thinks, and his ears tilt.
2-3s: he glances down at the open book, then back up.
3-4s: he returns exactly to the first-frame pose.
Consistency: the same flat 2D cartoon fox with his black headset in every frame (orange fur with subtle paper grain, cream face and inner ears, black-tipped tail, thick dark-orange outline, black graduation cap with a gold tassel that stays on). The desk and the open book stay where they are. Same size and proportions. Locked-off static camera. The background stays a perfectly flat pure green (#00FF00) from edge to edge, with Leo, the desk and the book the only things in frame. Smooth hand-drawn 2D animation. No subtitles.
```

### leo-call-talk (in the app)
First `leo-call.png`, last `leo-call.png`, 4 s, 720p
```
Leo, at his desk with his headset on, explains something to the viewer with enthusiasm, in a seamless loop.
0-1s: he lifts one paw and gestures as he makes a point, his head bobbing.
1-2s: he nods, ears bouncing.
2-3s: he gestures with the other paw toward the open book.
3-4s: he returns exactly to the first-frame pose.
Consistency: the same flat 2D cartoon fox with his black headset in every frame (orange fur with subtle paper grain, cream face and inner ears, black-tipped tail, thick dark-orange outline, black graduation cap with a gold tassel that stays on). The desk and the open book stay where they are. Same size and proportions. Locked-off static camera. The background stays a perfectly flat pure green (#00FF00) from edge to edge, with Leo, the desk and the book the only things in frame. Smooth hand-drawn 2D animation. No subtitles.
```

### leo-correct (not made yet)
First `leo-idle.png`, last `leo-idle.png`, reference image `leo-celebrating.png`, 4 s, 480p
```
@Image 1: Leo celebrating (pose reference).
Leo cheers because the viewer got the answer right.
0-1s: his eyes light up and his ears shoot up.
1-2s: he hops into the celebrating pose from @Image 1, paws up, eyes closed in a big happy smile, with a small burst of orange and yellow confetti.
2-3s: he lands and the confetti falls out of frame.
3-4s: he settles exactly into the first-frame pose.
Consistency: the same flat 2D cartoon fox in every frame (orange fur with subtle paper grain, cream face and inner ears, black-tipped tail, thick dark-orange outline, black graduation cap with a gold tassel that stays on). Same size and proportions. Locked-off static camera. The background stays a perfectly flat pure green (#00FF00) from edge to edge, with Leo the only thing in frame. Smooth hand-drawn 2D animation. No subtitles.
```

### leo-wrong (not made yet)
First `leo-idle.png`, last `leo-idle.png`, reference image `leo-failure.png`, 4 s, 480p
```
@Image 1: Leo disappointed (pose reference).
Leo reacts kindly when the viewer gets an answer wrong.
0-1s: his ears droop and his eyes close as in @Image 1, his shoulders dropping in a small sigh.
1-2s: he shakes his head gently.
2-3s: he perks back up and gives the viewer an encouraging nod.
3-4s: he returns exactly to the first-frame pose.
Consistency: the same flat 2D cartoon fox in every frame (orange fur with subtle paper grain, cream face and inner ears, black-tipped tail, thick dark-orange outline, black graduation cap with a gold tassel that stays on). Same size and proportions. Locked-off static camera. The background stays a perfectly flat pure green (#00FF00) from edge to edge, with Leo the only thing in frame. Smooth hand-drawn 2D animation. No subtitles.
```

### leo-thinking-loop (not made yet)
First `leo-thinking.png`, last `leo-thinking.png`, 4 s, 480p
```
Leo thinks hard about a question, in a calm, seamless loop.
0-1s: he taps his chin with his paw.
1-2s: his eyes look up and to the left.
2-3s: his eyes look up and to the right, and his ears tilt.
3-4s: he taps his chin again and returns exactly to the first-frame pose.
Consistency: the same flat 2D cartoon fox in every frame (orange fur with subtle paper grain, cream face and inner ears, black-tipped tail, thick dark-orange outline, black graduation cap with a gold tassel that stays on). Same size and proportions. Locked-off static camera. The background stays a perfectly flat pure green (#00FF00) from edge to edge, with Leo the only thing in frame. Smooth hand-drawn 2D animation. No subtitles.
```

### leo-hello (not made yet)
First `leo-idle.png`, last `leo-idle.png`, reference image `leo-waving.png`, 4 s, 480p
```
@Image 1: Leo waving (pose reference).
Leo greets the viewer with a big friendly wave.
0-1s: he spots the viewer and his ears perk up.
1-3s: he waves with one paw as in @Image 1, eyes closed in a happy smile, his tail swishing.
3-4s: he lowers his paw and settles exactly into the first-frame pose.
Consistency: the same flat 2D cartoon fox in every frame (orange fur with subtle paper grain, cream face and inner ears, black-tipped tail, thick dark-orange outline, black graduation cap with a gold tassel that stays on). Same size and proportions. Locked-off static camera. The background stays a perfectly flat pure green (#00FF00) from edge to edge, with Leo the only thing in frame. Smooth hand-drawn 2D animation. No subtitles.
```
