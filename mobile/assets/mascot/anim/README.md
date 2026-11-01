# Animated Leo

Transparent animated WebP clips of Leo, made with Runway and keyed with `scripts/leo-animation/`. Most are wired into the app. The sections below say where each clip goes; the latest changes are under "Fixes (Nov 1)".

## The clips

| File | Plays | Length | Where | When |
|---|---|---|---|---|
| leo-sleep-loop.webp | loop | 7567 ms (rests 2.5 s) | Home | Today's lesson not done |
| leo-peek.webp | once | 2667 ms | Home | Every 25–40 s while sleeping |
| leo-eyes-open.webp | once | 800 ms | Home | Tap Leo while he sleeps; open the call when it ends |
| leo-eyes-close.webp | once | 800 ms | Home | Leo call closes after he was woken |
| leo-done.webp | once | 5067 ms | Home | Today's lesson just finished (once a day) |
| leo-reading-loop.webp | loop | 9333 ms (rests 3 s) | Home | Today's lesson done |
| leo-call-listen.webp | loop | 7917 ms (rests 2.5 s) | Leo call | Default state |
| leo-call-think.webp | loop | 6917 ms (rests 1.5 s) | Leo call | `isGenerating` |
| leo-teach-loop.webp | loop | 4600 ms (rests 0.6 s) | Leo call | `isSpeaking` |
| leo-idle-loop.webp | loop | 8867 ms (rests 3 s) | Onboarding | Default state |
| leo-greet.webp | once | 2000 ms | First onboarding screen | Screen opens, then leo-idle-loop |
| leo-ready.webp | once | 2000 ms | Arena, Deep Case (LeoCoach) | First question of a run |
| leo-encourage.webp | once | 2000 ms | Arena, Deep Case (LeoCoach) | Answer graded wrong |
| leo-success.webp | once | 2000 ms | Lesson complete (both screens); Arena, Deep Case (LeoCoach) | Lesson finished; answer graded right |

Not used any more: leo-wake and leo-doze (replaced by leo-eyes-open and leo-eyes-close), leo-call-talk (replaced by leo-teach-loop), leo-play.

`clips.json` has the same lengths. A loop clip repeats forever. A once clip plays one time and holds its last frame.

Every clip starts and ends exactly on Leo's existing poses, so clips chain without a jump: sleep → eyes-open → (call) → eyes-close → sleep, and sleep → done → reading. Loop clips now play slower and rest on a still pose before repeating; the rest is built into the file.

## Wiring it into the app

1. Run `npx expo install expo-image`. It's a native module, so this ships in a new App Store build: bump the version and build number.

2. Create `mobile/components/mascot/leoClips.ts` and an identical `leoClips.js`. Each holds a table of every clip above with a static `require()`, its length in ms and whether it loops.

3. Create `mobile/components/mascot/LeoAnimated.tsx` and an identical `LeoAnimated.js`. The `.js` twin must `import React from "react"`.
   - Props: `clip` (a key of leoClips), `size` (the pt size of the static Leo it replaces), `fallback` (a LeoAnim name or an image source), `paused` (optional), `onEnd` (optional).
   - Each clip is a square canvas with Leo filling the middle 75%. Render it in a box of size × 4/3, centred on where the static Leo sits (offset −size/6 on each side), with `pointerEvents="none"`. That keeps Leo at exactly his current size and position. Make sure no parent clips it.
   - Use expo-image `<Image contentFit="contain" autoplay />` with no transition. To change clips without a blank frame, mount the next clip as a second layer and hide the old one only after the new one's `onLoad` fires. Give each play a new `key`, so a once clip always restarts from frame 0.
   - For once clips, call `onEnd` the clip's ms after `onLoad`. Clear all timers on unmount.
   - Show the static fallback instead (`<LeoCharacter animation={fallback} still />` or the image) when Reduce Motion is on (`AccessibilityInfo`), `paused` is true, the app is in the background (`AppState`), or the clip fails to load (`onError`).

4. **Home.** In `components/course/CourseJourney.tsx` and `.js`, inside `SectionCluster`, the `leoVisual` view renders `<LeoCharacter size="course" animation={... ? 'reading' : 'sleeping'} still />`.
   - Only the active section animates. Other sections stay exactly as today.
   - Keep the done/not-done expression exactly as it is.
   - Use `LeoAnimated` with size 144 and fallback `'sleeping'` or `'reading'` to match.

   How Leo behaves:
   - **Not done:** loop leo-sleep-loop. While Home is focused, every 12 to 20 seconds (random), play leo-peek once, then go back to the loop.
   - **Done:** loop leo-reading-loop.
   - **Tap:** keep the TouchableOpacity and its accessibility label, and fire a light haptic immediately. If not done, play leo-wake and call `onLeo()` 600 ms after the tap. If done, call `onLeo()` right away.
   - **Leo call:** pass `leoCallOpen={showLeoChat}` from `app/(tabs)/home.tsx` and `home.js` through `CourseJourney` to `SectionCluster`. Pause while the call is open. When it closes after Leo was woken, play leo-doze once, then leo-sleep-loop.
   - **Lesson just finished:** when done turns from false to true, wait until Home is focused, then play leo-done once, then leo-reading-loop. Play it at most once per day, using the AsyncStorage key `@marketlingo/leo-done-anim/${user?.id ?? 'guest'}/${marketId}/${localDay}` (the same pattern as the existing `revealKey`).
   - **Pause** whenever `!isFocused`.

5. **Leo call.** In `components/ai/LeoVoiceChatOverlay.tsx` and `.js`, replace the `LEO_STUDY_SCENE` image (style `sceneImage`) with `LeoAnimated` in the same place.
   - Measure the `sceneImage` box with `onLayout`. The drawn square is min(width, height): pass that as size, and keep the clip centred on the same point.
   - Pick the clip from the existing AI state: `isGenerating` → leo-call-think, `isSpeaking` → leo-call-talk, otherwise leo-call-listen.
   - Fallback: `LEO_STUDY_SCENE`.

6. **Onboarding.** In `app/onboarding/goal.tsx` and `familiarity.tsx` (and their `.js` twins), replace `<LeoCharacter size="lg" animation="idle" />` with `LeoAnimated` (size 160, fallback `'idle'`). Loop leo-idle-loop, and every 10 to 15 seconds play leo-play once, then go back to leo-idle-loop.

7. **Leave everything else alone:**
   - lesson logic, progress and XP;
   - `onLeo`, apart from the 600 ms delay;
   - `LeoCharacter` on every other screen.

   Keep each `.tsx` and `.js` twin identical.

8. **Check on a device, in light and dark mode:**
   - **Home, lesson not done:** Leo breathes and sometimes peeks. Tap him: he wakes and the call opens. Close the call: he dozes off.
   - **Finish the lesson:** back on Home he celebrates once, then reads.
   - **Leo call:** he listens, thinks while the AI generates, and gestures while it speaks.
   - **Onboarding:** he sits idle and sometimes chases his tail.
   - **Reduce Motion on:** every Leo is the static image exactly as today.

## Lesson moments (leo-greet, leo-ready, leo-encourage)
These three start and end on Leo's normal sitting pose. leo-encourage starts on the thinking pose and ends sitting upright, so Leo never looks defeated.

1. Add all three to `leoClips.ts` and `leoClips.js` (2000 ms, `loop: false`).
2. **LeoCoach** (`lesson-kit/components/LeoCoach.tsx` and `.js`): replace `<LeoCharacter animation={ANIM[mood]} size="sm" still />` with `LeoAnimated` (size 80) and add an optional `intro` prop.
   - Mood `'incorrect'`: play leo-encourage once, then rest on the sitting pose. Change `ANIM.incorrect` from `'failure'` to `'idle'`.
   - `intro` true and mood `'idle'`: play leo-ready once.
   - Anything else: static, exactly as today.
   - Replay when the line or mood changes, and keep the bubble timing.
3. **Arena** (`lesson-kit/arena/ArenaScreen.tsx` and `.js`) and **Deep Case** (`lesson-kit/case/CaseScreen.tsx` and `.js`): where LeoCoach renders for the current question:
   - Pass mood `'incorrect'` while `phase` is `'feedback'` and the answer was graded wrong (timeouts included). Otherwise keep the exercise's own mood.
   - Pass `intro={beatIndex === 0}` in Arena (the first question after the round intro) and `intro={stageIndex === 0}` in Deep Case.
4. **Onboarding welcome** (`app/onboarding/welcome.tsx` and `.js`): replace `<LeoCharacter size="xl" animation="waving" />` with `LeoAnimated` (size 200, fallback `'waving'`). Play leo-greet once when the screen opens, then loop leo-idle-loop.
5. Keep `.tsx` and `.js` twins identical. Don't change grading, XP or lesson content.
6. Check on a device:
   - The welcome screen: Leo looks at you, waves, then idles.
   - The first question in Arena or a Deep Case: he nods and points.
   - A wrong answer: he gives a reassuring nod and ends sitting upright.
   - With Reduce Motion on: static images.

## Lesson complete and right answers (leo-success)
leo-success starts on the sitting pose. Leo fist-pumps, sparkles pop, and he ends in the proud pose (`leo-success.png`, the same image the app already shows for a correct answer). Hold its last frame; don't swap to the still image afterwards.

1. Add leo-success to `leoClips.ts` and `leoClips.js` (2000 ms, `loop: false`).
2. **Lesson complete** (`lesson-kit/screens/LessonComplete.tsx` and `.js`): replace `<Image source={require('../../assets/mascot/leo-celebrating.png')} style={styles.leoHero} resizeMode="contain" />` with `LeoAnimated` (size 132, fallback `'celebrating'`). Keep it in a view with the same centring and bottom margin as `styles.leoHero`. Play leo-success once when the screen appears.
3. **LeoCoach**: mood `'correct'` or `'celebrate'` plays leo-success once, then holds. This builds on the Lesson moments step above.
4. **Arena and Deep Case**: while `phase` is `'feedback'` and the answer was graded right, pass mood `'correct'` to LeoCoach. Wrong answers still pass `'incorrect'`.
5. Keep `.tsx` and `.js` twins identical. Don't change grading, XP, saving or lesson content.
6. Check on a device:
   - Finish a lesson: Leo fist-pumps and lands in the proud pose.
   - A right answer in Arena or a Deep Case: the same reaction.
   - With Reduce Motion on: the same still images as today.

## Fixes (Nov 1)
1. **Clip table:** add leo-eyes-open (800 ms, once), leo-eyes-close (800 ms, once) and leo-teach-loop (4600 ms, loop) to `leoClips.ts` and `leoClips.js`. Update every other length from `clips.json`; the loop files were replaced with slower versions that rest before repeating.
2. **Home tap while sleeping** (`useHomeLeo` in `components/mascot/useLeoAnimations.ts` and `.js`):
   - Play leo-eyes-open instead of leo-wake, so Leo only opens his eyes and doesn't start getting up.
   - Open the call from that clip's `onEnd`, not from the fixed 600 ms timer. If motion is off, open the call immediately.
   - When the call closes after Leo was woken, play leo-eyes-close, then leo-sleep-loop. Don't play leo-doze: it starts from the sitting pose and would jump.
3. **Peek less often:** every 25 to 40 seconds instead of 12 to 20 (`leoAnimationDelay('peek')`).
4. **Leo call speaking:**
   - In `leoCallClip` (`components/mascot/leoAnimationRules.ts` and `.js`), return leo-teach-loop while `isSpeaking`. This is Leo with his notebook, explaining.
   - On a device, Leo currently doesn't visibly change when he speaks, although the flags in `LeoVoiceChatOverlay` look right. Log the clip `LeoAnimated` receives in the call to confirm it switches.
   - In `ClipPlayer` (`components/mascot/LeoAnimated.tsx` and `.js`): if the newest layer hasn't fired `onLoad` within 400 ms, show it anyway and remove the older layers. Two clips must never be visible at once.
5. **Greeting:** `app/onboarding/welcome.tsx` is never opened by any route, so leo-greet never plays. Put it on the first onboarding screen. In `app/onboarding/index.tsx` and `.js`, replace `<LeoCharacter size="lg" animation="waving" />` with `LeoAnimated` (size 160, fallback `'waving'`). Play leo-greet once, then loop leo-idle-loop, paused when the screen isn't focused.
6. **Lesson complete on Home:** the daily lesson finishes on `components/home/SessionCompleteCard.tsx` (and `.js`), which still shows `<LeoCharacter size="lg" animation="celebrating" />`. Replace it with `LeoAnimated` (size 160, fallback `'celebrating'`) and play leo-success once.
7. **Practice reactions:** in Arena and Deep Case, LeoCoach only appears on questions with an authored Leo line (`exercise.leo.line`), so most answers get no reaction. In the feedback phase of every graded question, show LeoCoach (right → leo-success, wrong → leo-encourage). When the question has no line of its own, give him one short line of about eight words, chosen from a small set for right answers and another for wrong ones. Wrong-answer lines must be encouraging and must not give away the answer.
8. Keep each `.tsx` and `.js` twin identical. Don't change grading, XP, saving or lesson content.
9. **Check on a device:**
   - **Home:** Tap the sleeping Leo. He only opens his eyes, then the call opens. Close the call: he closes his eyes and sleeps.
   - **Loops:** they're calmer, with still pauses between repeats.
   - **Leo call:** Leo switches to the notebook clip whenever he speaks.
   - **Onboarding:** the first screen greets with a wave.
   - **Lesson complete:** finishing a lesson shows the fist pump on both completion screens.
   - **Practice:** every graded answer gets a reaction.

## Adding or replacing a clip
See `scripts/leo-animation/README.md`. It has the Runway settings and prompts and the start/end frames, and explains how to convert a Runway MP4 into a clip here.
