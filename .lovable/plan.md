# Make MarketLingo addictive — the "crush on your industry" program

Goal: turn MarketLingo from "useful lessons" into a daily habit people feel emotionally pulled back to. The app stays 100% free — every mechanic below is about retention and delight, never paywalls. Mobile only (`/mobile`); no backend data changes unless noted.

## Phase 1 — Lessons that feel like a game (deepen what's already built)

The lesson kit now has hearts, combos, instant feedback and a reward screen. This phase makes each lesson *emotionally* sticky:

1. **Card identity without emojis.** Each card type gets a color-coded icon chip (feather icons): Concept = lightbulb (violet), Key Term = book-open (amber), Question = help-circle (accent), Milestone = award. Scannable at a glance, keeps the premium insider look.
2. **Cliffhanger endings.** Every lesson's finish screen gets a "Tomorrow:" teaser line pulled from the next day's stack metadata (`next_preview` already exists in stack metadata) — the episode-ending hook.
3. **Mid-lesson celebrations.** At 50% progress, a one-second full-screen pulse ("Halfway — you're on fire") with haptic. First card of the day shows a tiny "Day N of 180" chip so progress toward the certificate is always visible.
4. **Variable reward polish.** The reward reveal on LessonComplete becomes a tap-to-open "card pack" moment: tap to flip, XP + bonus counts up, occasional rare bonus ("Insight Bonus — 2x") so the amount is never fully predictable.
5. **Near-miss feedback.** Wrong answers show "So close — the trick is…" micro-explanations (already have `explanation` field; surface it with warmer copy).

## Phase 2 — The daily habit loop (whole app)

1. **Streak protection & rescue.** Streak freeze already has a hook (`useStreakFreeze`); wire it visibly into Home: when a streak is at risk (evening, lesson not done), the streak chip pulses amber with a "Save your 12-day streak" card. One-tap rescue = complete one quick review question.
2. **Comeback flow.** Detect a broken streak (yesterday missed): next open shows "Welcome back — Day 1 again, but your knowledge stayed. 2-minute review to restart?" with a single-tap shortened lesson.
3. **Daily ritual home.** Home header becomes a ritual strip: streak flame + day counter + today's 3 quests as checkable chips. Completing all three triggers a small confetti + sound moment.
4. **Smarter notifications.** Extend the existing scheduled-notifications function with personalized send times (send 1 hour after the user's usual lesson time instead of a fixed hour) and loss-aversion copy at 8pm if the lesson isn't done. Badge stays 0.
5. **Evening digest card.** After 6pm, Home shows a compact "Today in your market" card with the top news headline — a reason to open even after lessons are done.

## Phase 3 — Social pressure & belonging

1. **Rival nudges on mobile.** Port the web `SocialNudge` pattern to mobile Home: "Maya is 42 XP ahead of you in Aerospace — one lesson closes the gap." Data comes from the existing leaderboard views (no new tables).
2. **League promotion drama.** Weekly leaderboard result becomes a moment: Sunday evening push "Results are in" + a full-screen promotion/relegation reveal with animation when the app opens.
3. **Friend activity pulses.** On Home, a small row: "Alex finished Day 34 · Maya passed you in Biotech." Real-time via the existing friends/notification infrastructure.
4. **Milestone sharing 2.0.** The existing milestone share cards get industry-branded artwork (segment colors) so sharing a streak on social media reads as identity, not just an app ad.

## Phase 4 — Industry romance (the "crush")

1. **Market identity pages.** Each of the 15 markets gets a living identity: signature gradient + 3D art (already exists via segmentColors) used consistently across Home, lessons, profile banner, and share cards — switching markets should feel like changing worlds.
2. **"Your market this week" recap.** Sunday: a generated recap card — what happened in your industry this week, what you learned, your rank — one screen, shareable.
3. **Insider milestones.** At days 7/30/90/180, unlock an "Insider badge" per market with a short ceremony — language framed as "you now speak Aerospace at a Day-30 level."
4. **Market lore in lessons.** Info cards occasionally open with a one-line "Insider fact" about a key player in the user's market (data already exists in key-players content) — builds parasocial attachment to the industry.

## Sequencing & verification

- Build order: Phase 1 → 2 → 3 → 4, each phase independently shippable and verified with the type checker + a simulator walkthrough where possible.
- No monetization surfaces, no emoji (brand rule), no new paywalls, no backend schema changes except possibly one table for league results in Phase 3 (with full RLS + grants if added).
- Copy stays Insider Handbook tone, 9th-grade reading level.

## Technical notes

- Lesson changes live in `mobile/lesson-kit/` (screens, exercises, tokens) and `mobile/components/slides/LessonKitReader.tsx` (metadata → teaser wiring).
- Habit loop touches `mobile/app/(tabs)/home.tsx`, `mobile/hooks/useStreakFreeze.ts`, `mobile/hooks/useDailyQuests.ts`, `supabase/functions/scheduled-notifications/`.
- Social uses existing `leaderboard_xp` / `leaderboard_progress` views and `useFriends` — read-only, no policy changes.
- Market identity centralizes in `mobile/lib/segmentColors.ts` and existing illustration assets.
