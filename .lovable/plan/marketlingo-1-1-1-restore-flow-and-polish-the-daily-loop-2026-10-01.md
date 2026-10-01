# MarketLingo 1.1.1 — restore flow and polish the daily loop

## What changes

1. **Course must never get stuck.** Trace the sequence lesson → completion → dossier → Course → Intel → Course on iPhone. Make Course scrolling recover on return without restarting the app; clean up any lingering sheet, touch layer, keyboard focus, or list repositioning. The exact cause is not confirmed from the screenshots alone. Keep the user's place instead of unexpectedly jumping to a different section.
2. **Completion should look complete.** The screenshot shows a check on Daily Lesson while the Day 2 title still shimmers. Tie the title effect to the actual unfinished lesson and credited progress, stop it on completion or when Course loses focus, and refresh the orbit and ticks promptly after returning from a lesson or game. Preserve the four-activity, 25%-each orbit rule.
3. **Make the dossier immediately understandable.** Replace the dense explainer-plus-six-editor presentation with a clear first view: what was added from the lesson, the current document, and one optional action to improve it. Keep automatic lesson entries, the six sections, personal editing, progress, and export; let people reveal detail only when they want it. Make the handoff from lesson rewards into the dossier and back to Course feel deliberate rather than like an extra assignment.
4. **Give practice a graceful finish.** Review Arena, Deep Case, Games, and Drills completion and exit paths. Show a short, consistent earned-result moment and a clear next destination before returning to Course or Practice; guard repeat taps while rewards save, and confirm that progress is visible on return. Do not change scoring or invent new rewards.
5. **Audit both appearances in the daily loop.** Fix low-contrast text and buttons, especially the Arena “Enter the wave” control shown in the screenshot; review sheets, overlays, status bar, completion, dossier, and Course for readable text, touch targets, and safe-area spacing in light and dark mode. Use the existing app palette and lesson colors rather than one-off fixes.

## Verification

- Walk the actual phone flows in both appearances: finish a catch-up lesson, view and leave the dossier, scroll Course, switch to Intel and back, run each available practice activity, and return. Check small and large iPhones, including an open keyboard and a reduced-motion setting.
- Confirm completed lessons no longer shimmer; the orbit, XP, and streak stay accurate; saving never produces an invisible or duplicate result. Check the paired TypeScript/JavaScript phone files and the latest app diagnostics.
- This is a phone-app polish pass. No curriculum regeneration, backend changes, or App Store submission is included; the fixes reach an iPhone with the next installed build.

## Technical approach

- Start with CourseJourney’s FlatList focus/scroll effect and the Home completion state. Inspect the dossier’s auto-focused editor and the modal layers during navigation; reproduce before selecting the precise fix.
- Consolidate practice-return behavior without changing each activity’s underlying lesson-grounded questions or reward rules. Keep source and parallel JavaScript entries synchronized.