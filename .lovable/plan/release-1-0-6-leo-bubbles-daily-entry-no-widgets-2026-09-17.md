# Release 1.0.6: Leo bubbles, daily entry, no widgets

## Goal

Ship a clean iPhone release with one consistent illustrated Leo speech-bubble style, a time-aware daily Leo entry screen, and no widget UI or widget extension in the submitted app.

## 1. Standardize every Leo speech bubble

- Create one reusable mobile Leo speech-bubble treatment based on the supplied reference: smooth rounded balloon, clean white or softly tinted surface, subtle outline and shadow, generous text space (not bigger than the actual fox and sufficently to the right of the screen), and a short organic tail pointing toward Leo.
- Support left/right/top tail placement and compact/full variants so the same visual language fits lessons, onboarding, popups, goals, labs, and Leo chat.
- Apply it to active Leo surfaces, including the Lesson Kit coach used by lessons, Arena, and Deep Case; Ask Leo responses; Home popups; onboarding reactions; lesson goals; mascot breaks; trainer messages; and remaining reusable Leo bubble components.
- Preserve every existing Leo image, pose, size, animation, position, and behavior. Only the bubble and its text layout change.
- Keep dark mode premium: dark-grey bubble surfaces, clear contrast, and no white-on-white text.

## 2. Add the daily Leo entry screen

- Add a full-page Leo check-in after authentication and completed onboarding, before Home.
- Query the real selected market, today’s `daily_completions.lesson_completed`, current streak, and streak expiry. If today’s lesson is already complete, go directly to Home.
- If incomplete, show Leo with an existing emotion matched to the real time remaining:
  - plenty of time: calm/waving or reading;
  - afternoon: focused/sassy;
  - evening: worried;
  - final hours: urgent/rainstorm.
  - Add the sassy message or the funny one with the app new graphic standards.
- Show one short, time-aware line in the new illustrated bubble and one purple **Continue** button. Continue dismisses the check-in and opens Home; it does not auto-start the lesson.
- Make the check-in appear once per app launch, fail safely to Home if data cannot load, and use the device’s local day boundary.

## 3. Remove widgets from this release

- Remove the Settings widget card/self-test, Home widget nudge, foreground sync bridge, lesson-completion sync calls, widget storage keys, and every user-visible widget reference.
- Remove the widget extension plugin, App Group entitlement, widget bridge dependencies, native module, and widget target from the generated iOS release so App Store Connect receives only the main app.
- Keep normal push notifications and streak reminders unchanged.

## 4. Prepare and verify the release

- Bump the mobile release to **1.0.6, build 119**.
- Update the project roadmap to mark widgets deferred to a future release.
- Run the mobile type check and focused checks for startup routing, daily completion gating, dark/light bubble contrast, and lesson navigation.
- Generate a clean iOS project and verify there is only one app target, no widget extension/App Group entitlement, and no widget dependency in the lockfiles.

## Technical notes

- The startup redirect currently lives in `mobile/app/index.tsx`; it already validates authentication, selected market, learning goal, and familiarity before opening Home.
- Today’s authoritative completion flag is `daily_completions.lesson_completed`; lesson completion already writes it through `useUserXP`.
- The active lesson, Arena, and Deep Case surfaces share `LeoCoach`, while several onboarding/chat/popup surfaces still use one-off bubble styles; the reusable bubble will eliminate that inconsistency.