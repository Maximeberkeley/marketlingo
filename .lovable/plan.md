# Course orbit and rolling Leo nudges

## Course page
- Replace every locked `What it is` fallback with the actual first lesson title for that section (Day 31, 61, and so on) when loaded. If unavailable, rotate deterministic teasers such as `Locked Dossier`, `Uncharted Territory`, and `Next Module Locked`.
- Keep all five activity node sizes and positions unchanged.
- Replace the border-side approximation with a real circular progress stroke that starts at 12 o’clock and fills clockwise.
- Calculate progress from exactly four actions: Daily Lesson, Daily Arena, Deep Case, and Intel. Notes remains on the orbit but never changes progress. Each completed action contributes exactly 25%.
- Give the active lesson heading a true two-line layout. Long titles use a slightly smaller responsive size and measured fitting rather than ellipsis.

## Jumping Leo nudges
- Create a crisp transparent jumping-Leo asset and upgrade the existing Leo popup into a compact floating banner with spring entry, subtle ongoing hop, title, personalized message, dismiss control, and `Jump In`/`Let’s Go` action.
- Add time-aware script pools for midday, late afternoon, and evening streak urgency, using the saved display name with `Scholar` fallback.
- Add one dashboard idle nudge after 90 seconds without opening a lesson. Reset or suppress it when the learner starts a lesson, leaves the Course screen, or completes today’s lesson.
- Schedule matching device-local notifications in the learner’s current timezone for the remaining windows of the current calendar day only. Use tagged notification IDs so this system never cancels unrelated alerts.
- On daily lesson completion, immediately cancel all remaining Leo nudges for that local day, dismiss any visible nudge, and show the completion line once: `Okay, showoff. You’re safe... until tomorrow.`

## Reliability and verification
- Preserve notification permission preferences and avoid requesting permission outside the existing user-controlled flow.
- Prevent duplicates across app resumes by storing today’s schedule and shown-script state locally; a new local date resets it.
- Verify locked titles, 0/25/50/75/100% clockwise orbit states, long titles, idle action routing, local-day scheduling, completion cancellation, and light/dark presentation.
- Run focused mobile source checks and inspect the current build/error logs before marking complete.

## Technical details
- Use `react-native-svg` for the ring if already available; otherwise use the project’s installed native drawing support without changing node geometry.
- Keep rolling reminders device-local for the mobile app. True remote push delivery is not required for these same-device scheduled reminders.
- Centralize scripts, local-day keys, scheduling, and cancellation in one reminder module so Home and lesson completion share identical rules.
