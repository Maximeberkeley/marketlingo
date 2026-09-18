# Bring the whole mobile app to the upgraded lesson-game standard

## Goal
Make every learner-facing detail feel as deliberate as the upgraded in-lesson games. The standard is not “more decoration”; it is a tighter loop where every screen has a clear purpose, one obvious next action, content grounded in what the learner studied, immediate feedback, visible progress, and a satisfying transition into what comes next.

## The app-wide quality contract
Every mobile screen must pass all of these checks:

1. **Specific** — names the concept, market, case, or learner outcome; no vague motivational filler.
2. **Lesson-connected** — practice and prompts use the learner’s actual studied material; generic packs are fallback only.
3. **One clear move** — the primary action is unmistakable, with secondary tools visually quieter.
4. **Responsive** — taps, answers, saves, completions, and errors produce immediate visual, haptic, and appropriate audio feedback.
5. **Progressive** — the learner can always see what changed, what was earned, and what unlocks next.
6. **State-complete** — loading, empty, locked, missed-day, offline, error, completed, and replay states are intentionally designed.
7. **Locally timed** — lessons, streaks, quests, Intel, rewards, and unlocks all use the learner’s local calendar day, never completion time plus 24 hours.
8. **Accessible and resilient** — readable type, large tap targets, reduced-motion support, safe-area handling, dark-grey mode, and no text collisions on small phones.

## Implementation

### 1. Create one shared interaction language
- Consolidate the strongest lesson-game primitives into reusable mobile patterns: prompt hierarchy, tactile controls, pressed/selected/correct/incorrect states, progress indicators, feedback explanations, entrance/completion motion, and sensory cues.
- Replace isolated raw visual values with the existing mobile theme and lesson-kit tokens; add semantic roles only where the system lacks one.
- Standardize concise language: instruction, action, result, explanation, next move.

### 2. Finish the Course path as the core daily loop
- Keep the 180-day map and one-action focus, but make every node state fully legible: completed, today, missed/uncompleted, consolidation, milestone, unavailable content, and future locked.
- Keep prior calendar days replayable without changing today’s day, streak, or full daily reward.
- Integrate the displaced retention signals directly into the path rather than restoring dashboard clutter: insider streak/countdown, deliverable percentage, focus topic, due review, today’s Intel progress, and tomorrow’s open loop.
- Give lesson completion a deliberate sequence: earned result, retained concept, deliverable/review consequence, then a direct handoff to three relevant Intel stories.

### 3. Upgrade Intel, Practice, Notes, and You
- **Intel:** make the three-story habit feel like a daily mission, with strong read/quiz/save states, explicit progress and XP banking, lesson relevance, and a complete no-news/offline/error experience.
- **Practice:** ensure Daily Arena, Deep Case, drills, and games visibly identify the studied lesson or concept they came from; use game-grade interactions and completion feedback throughout.
- **Notes:** turn note capture into part of learning—source context, own-words prompts, saved confirmation, contribution to the living deliverable, and meaningful empty/search states.
- **You:** align achievements, league, streak identity, statistics, and settings with the same hierarchy and feedback quality; remove stale monetization or legacy presentation.

### 4. Reconnect the learning and retention system
- Verify XP is banked once, totals refresh immediately, same-day replay receives practice XP only, and every visible reward corresponds to persisted progress.
- Restore focus, living deliverable, spaced review, quests, streak rescue, league, and Leo memory where they support the path; remove hidden background work that no longer reaches the learner.
- Make Leo context-aware across transitions: market, focus, lesson concept, prior mistake, absence, rescue status, and next-day promise.
- Keep all games, Arena, and Deep Cases derived from studied lesson content; display a safe unavailable state rather than silently presenting unrelated material when grounding fails.

### 5. Audit every detail and remove the old standard
- Review every learner-facing route, overlay, modal, notification destination, empty state, and back action.
- Remove obsolete links, duplicate destinations, stale cards, vague copy, frozen actions, inconsistent bubbles, unthemed colors, and visual patterns below the game-quality bar.
- Verify the four-destination structure remains Course, Intel, Practice, You, with Notes accessed from Course.

## Green-light validation
The release is green only when all checks pass:

- Changed mobile source compiles with the real Expo dependencies and no new warnings or runtime errors.
- Test on a small iPhone and a current large iPhone in light and dark-grey modes; no overlap, clipping, unreadable text, or unsafe controls.
- Complete: today’s lesson, a missed lesson, a same-day replay, an Arena, a Deep Case, a drill/game, three Intel stories, a note, a deliverable line, streak rescue, and league view.
- Confirm all content-based activities name and test evidence from a lesson the learner studied.
- Confirm all day boundaries by changing across local midnight: no rolling 24-hour behavior anywhere.
- Confirm XP/streak/rewards after reopening the app and on a second device/session.
- Run the two-judge content test and finish the 900-lesson rewrite separately; both remain release blockers alongside the final Xcode archive.
