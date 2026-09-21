# MarketLingo Course page redesign

## Goal

Replace the current winding 180-day Course path with the attached section-based composition: a clean white, vertically scrolling course made of 30-day sections, each centered on Leo and five consistent circular actions. This is a mobile-only presentation and routing change; existing curriculum records, lesson reader, rewards, streaks, Notes, Intel, Arena, Deep Case, and Leo chat remain intact.

## Confirmed rules

- The shared daily clock remains the learner’s **local calendar day**, advancing at local midnight from the persisted course start date. No new timer or completion-driven day advancement will be added.
- Each section spans 30 curriculum days; the existing six market themes supply the six section titles.
- Section 2 unlocks only after all 30 lessons in Section 1 are completed. The same lesson-completion gate applies between later sections.
- Daily unlocking and section completion remain separate: calendar time can make a day eligible, but an incomplete prior section keeps the next section’s actions locked.
- Previously unlocked lessons remain available and unfinished lessons remain intact.

## Course page

- Keep the existing MarketLingo course heading, streak, XP, and bottom navigation.
- Render all six 30-day sections in one vertically scrolling list so future sections remain visible.
- Give each section a compact header with:
  - section number;
  - real market theme title;
  - completed-lesson count out of 30;
  - a restrained progress track;
  - an arrow opening that section’s 30-day curriculum view.
- Show the active week title above the module cluster, derived from the real syllabus and authored lesson data rather than placeholder copy.
- Replace the wavy lesson nodes and mission rail with one balanced five-module cluster per section:
  - Daily Lesson at top center;
  - Daily Arena upper right;
  - Deep Case lower right;
  - Intel lower left;
  - Notes upper left;
  - existing Leo artwork in the center.
- Use equal circular controls with a subtle raised coin construction, clear MarketLingo icons, soft shadows, restrained state motion, and screen-reader labels. Labels sit outside the circles only where needed; icons remain the main signal.
- Use the uploaded mockup only for composition and hierarchy. Do not import its generated mascot or copy its colors.

## Module behavior

- Resolve one authoritative displayed curriculum day from the existing local-day state and selected section.
- Daily Lesson opens that day’s existing authored lesson through the current lesson goals and lesson reader flow.
- Daily Arena and Deep Case open their existing experiences with the displayed day as context, using that day’s completed lesson material when available and retaining their existing grounded-content safety rules.
- Intel opens the existing daily Intel destination and preserves the three-story habit, XP award, article actions, and live-news behavior; it shares the same local-date boundary without turning Notes or news into lesson records.
- Notes opens the existing full notebook. Existing notes, lesson annotations, Leo-created notes, search, creation, editing, and deletion remain unchanged and never rotate with the curriculum day.
- Every visible Leo remains tappable and opens the current Leo overlay with the relevant market, section, and day context. No second chat is created.
- Preserve all current completion writes, XP awards, streak updates, replay/review behavior, and same-day reward protection.

## States and access

- Active-section circles show individual completion state without unlocking tomorrow early.
- Past unlocked days remain revisitable from the section curriculum view.
- Future calendar days remain locked under the existing day-access rule.
- Future sections remain fully visible but dimmed, with small lock indicators on the four daily actions and a short explanation when tapped.
- Notes remains available as the persistent notebook even when shown in a future section cluster; it does not inherit a daily reset. Leo also remains available in locked sections, using the sleeping pose until the section unlocks.
- Missing content, loading, offline, and unavailable states keep progress safe and provide a clear retry or return action.

## Section curriculum view

- Add a focused 30-day view opened from each section header.
- List the section’s actual lesson titles and syllabus promises with completed, available, unfinished, and future states.
- Permit opening any previously unlocked lesson; block future days and days inside a section whose prior-section completion gate is unmet.
- Return naturally to the same section and scroll position on Course.

## Technical approach

- Refactor `CourseJourney` into focused section header, five-module cluster, coin control, Leo center, and section curriculum components.
- Reuse `dayMath`, `dayState`, `syllabus`, `useUserProgress`, `useHomeData`, and the existing session flow instead of duplicating timing or progress logic.
- Derive section completion from completed lesson stack IDs matched to authored `day-N` curriculum records; do not mutate or reinterpret stored progress.
- Pass explicit section/day context through existing routes for Lesson, Arena, and Deep Case while retaining lesson-derived exercise generation.
- Keep Notes on its existing route and data tables, and reuse the current Leo chat overlay from Home.
- Keep all implementation under `/mobile`; no web redesign, database migration, curriculum rewrite, or unrelated screen changes.

## Verification

- Test first use, mid-section, day 30, day 31 with Section 1 incomplete, Section 1 complete, and fully completed sections.
- Confirm all daily actions use the same local calendar boundary and completion never advances the day.
- Confirm the next section unlocks only after all 30 prior-section lessons are complete.
- Confirm past lessons remain available, unfinished lessons remain stored, and future content stays blocked.
- Confirm Notes retains all content and CRUD behavior; Leo opens the existing chat from active and locked sections.
- Confirm XP, streak, Arena, Deep Case, Intel habit, lesson review, and reward protection behave exactly as before.
- Check small and large iPhones, long titles, safe areas, scrolling through all six sections, light/dark themes, accessibility labels, reduced motion, and unchanged bottom navigation.
- Run the available mobile source checks and inspect runtime/build logs. Final release approval still requires a clean native Expo/Xcode build because the current sandbox lacks the full Expo dependency environment.
