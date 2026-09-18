# Mobile learning-path redesign

## Goal
Turn the mobile app’s main experience into one polished, focused weekly course map inspired by the clarity of the references without copying their artwork or visual language. The learner should immediately see the one action to take today.

## Navigation
- Make the current Home tab the **Course** experience: the active seven-day learning map becomes the first screen.
- Replace the current **Courses/Curriculum** tab with a standalone **Intel** tab.
- Remove **Notes** from the bottom navigation; keep the notebook intact and open it from a pen control on the Course map.
- Keep **Practice** and **You**, resulting in four primary tabs: **Course, Intel, Practice, You**.
- Preserve hidden route compatibility so existing links to lessons, Intel, and Notes continue to work.

## Course screen: one-week map
- Replace the long Home feed and expandable curriculum cards with a single seven-day path based on the existing 180-day syllabus and the learner’s local calendar day.
- Show a compact top status row for streak and XP, followed by a strong weekly header: season, territory, week progress, and the specific concept being learned.
- Draw seven original, dimensional learning nodes in a gentle alternating path. Use distinct states:
  - completed: confident color, check, and replay access;
  - today: largest node, subtle pulse/ring, Leo beside it, and the only dominant action;
  - future: quiet locked nodes;
  - consolidation day: visually distinct review node;
  - milestone/reward: occasional chest or document marker created in MarketLingo’s own visual language.
- Keep the current lesson-opening behavior, revision behavior, same-day reward protection, and local-midnight day logic unchanged.
- Center the map around the current day on entry and move to the next seven-day segment as the learner advances.
- Add a floating pen/notebook control at the lower-right of the map. It opens Notes and may show a small count or completion cue without competing with today’s lesson.
- Use Leo as a contextual guide beside today’s node, with one short speech bubble only when useful.

## Intel screen
- Move the existing Industry Intel experience out of Home and into the former Courses tab.
- Retain featured stories, article reading, save, discuss, summarize, “why it matters,” quizzes, the three-stories-per-day habit, and its XP reward.
- Give Intel a dedicated header and clearer hierarchy so it feels like a complete destination rather than a section embedded in another page.
- Keep the post-lesson Leo prompt routing directly into Intel and opening the intended story.

## Notes access
- Keep the full Notes experience and all saved content unchanged.
- Remove its bottom-tab position and expose it from the Course map’s pen control and all existing save-to-notes actions.
- Make back navigation return naturally to the Course map.

## Visual direction
- Preserve MarketLingo’s current light/dark theme, industry colors, dimensional illustrations, and Leo artwork.
- Build an original map rather than reproducing Duolingo’s shapes, colors, icons, wording, or exact composition.
- Favor generous white space, crisp hierarchy, soft dimensional depth, restrained animation, haptics, and stable node sizing.
- Keep the screen visually rich but operationally sparse: one primary action, no stacked dashboard cards, no duplicated progress summaries.
- Ensure the map, Leo, speech bubble, pen control, and bottom navigation never overlap on small iPhones or large devices.

## Technical implementation
- Refactor the Course map into focused components for the weekly header, path geometry, lesson node, Leo marker, and Notes shortcut.
- Reuse the existing syllabus, progress, lesson selection, reward, streak, and local-day modules rather than creating parallel logic.
- Reuse the existing Intel and Notes functionality as standalone destinations; change presentation and routing only.
- Keep all work under `/mobile`; no web redesign or backend schema changes.

## Verification
- Test completed, current, locked, consolidation, reward, and unavailable-content states.
- Confirm tapping today starts today’s lesson, completed nodes review without moving the day, and future nodes remain locked.
- Confirm the day changes only at the learner’s local midnight, not 24 hours after completion.
- Confirm Notes opens from the pen and returns to Course; Intel opens from its tab and from the lesson-complete prompt.
- Verify the four-tab layout and map at small and large iPhone sizes in both themes, including long lesson titles and safe-area spacing.
- Check the mobile build and runtime logs before declaring the redesign ready for the next archive.
