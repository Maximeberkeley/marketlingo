# Animated Leo

11 transparent animated WebP clips of Leo, made with Runway and keyed with `scripts/leo-animation/`. They are not wired into the app yet. The instructions below say how to do that.

## The clips

| File | Plays | Length | Where | When |
|---|---|---|---|---|
| leo-sleep-loop.webp | loop | 4067 ms | Home | Today's lesson not done |
| leo-peek.webp | once | 2667 ms | Home | Every 12–20 s while sleeping |
| leo-wake.webp | once | 2000 ms | Home | Tap Leo while he sleeps |
| leo-doze.webp | once | 2667 ms | Home | Leo call closes after he was woken |
| leo-done.webp | once | 5067 ms | Home | Today's lesson just finished (once a day) |
| leo-reading-loop.webp | loop | 5067 ms | Home | Today's lesson done |
| leo-call-listen.webp | loop | 4067 ms | Leo call | Default state |
| leo-call-think.webp | loop | 4067 ms | Leo call | `isGenerating` |
| leo-call-talk.webp | loop | 4067 ms | Leo call | `isSpeaking` |
| leo-idle-loop.webp | loop | 4733 ms | Onboarding | Default state |
| leo-play.webp | once | 5333 ms | Onboarding | Every 10–15 s |

`clips.json` has the same lengths. A loop clip repeats forever. A once clip plays one time and holds its last frame.

Every clip starts and ends exactly on Leo's existing poses, so clips chain without a jump: sleep → wake → (call) → doze → sleep, and sleep → done → reading.

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

## Adding or replacing a clip
See `scripts/leo-animation/README.md`. It has the Runway settings and prompts and the start/end frames, and explains how to convert a Runway MP4 into a clip here.
