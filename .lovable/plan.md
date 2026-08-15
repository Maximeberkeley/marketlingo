# MarketLingo: decision-training upgrade (release-safe)

Goal: keep the app's essence — Insider Handbook tone, 15 industry markets, 180-day track, Leo, XP/streaks — and add the missing piece from the vision: **predict → consequence → explanation**, plus mastery that reflects demonstrated knowledge.

## What we already have (no rebuild needed)

- 180-day curriculum, slides, drills, games, trainer scenarios, Interview & Investment Labs.
- SM-2 spaced repetition (`review_queue`) with a home review session.
- XP, levels, streaks + freezes, achievements, daily quests, friends/leaderboard.
- Sound + haptics system, mascot/AI mentors, Ask Leo voice loop.
- MCP server with 7 tools over OAuth.
- Account deletion, legal routes, notification scheduling.

## Gaps vs. the vision

1. No decision-and-consequence loop (lessons still end in plain quiz feedback).
2. No daily scenario ritual ("Market of the Day").
3. No confidence scoring, so "confidently wrong" never feeds review.
4. Progress = screens completed, not per-concept mastery states.
5. AI is a tab/overlay, not contextual coaching at the moment of a mistake.
6. No explicit in-app disclosure/consent for AI processing.
7. MCP lacks retrieval/recommendation tools.

## Phase 1 — App Store blockers (do before submission)

- AI data disclosure + one-time consent gate before any Leo/mentor/TTS call; setting to revoke in Settings.
- Audit every screen for loading / empty / offline / error states; fix placeholder or inconsistent screens.
- Accessibility pass: Dynamic Type on lesson text, VoiceOver labels on icon-only buttons, contrast check.
- Notification permission asked only after first completed lesson; preferences screen (study time, days/week, quiet hours, categories).
- Verify in-app account deletion + review-account notes.
- Remote kill switch / feature flag table for AI features.

## Phase 2 — Launch polish (ship if it lands cleanly)

- **Decision loop in lessons**: after the concept slide, one "market reaction" question — pick direction/asset, then an animated consequence reveal and a one-sentence mechanism explanation. Reuses the existing slide reader and feedback banner.
- **Confidence scoring**: 50/70/90 selector on questions. Confidently-wrong answers get pushed into `review_queue` with a low SM-2 grade; confidence stored per answer.
- **Market of the Day**: one curated historical scenario per market per day (predict → confidence → reveal → AI-adapted explanation → streak credit). Content is curated/editorial, not live data.
- **AI coach in context**: replace the generic entry point with action chips at the mistake moment — "Why was I wrong", "Explain simply", "Harder example", "Turn this into a 5-question drill". Model gets lesson text, mastery state, recent mistakes; correctness/XP stay deterministic server-side.
- **Mastery model**: per-concept states (New → Introduced → Practiced → Applied → Mastered → Needs review) driven by answer history, surfaced as one mastery visualization on Roadmap/Profile.
- Sound/haptic pass: distinct mastery cue, restrained error cue, separate effects/haptics toggles, silent-mode safe.
- Vocabulary alignment (keep, don't rename everything): XP stays XP; add "Conviction" for confidence and skill ratings per theme.

## Phase 3 — Post-launch

- MCP additions: `search_course_content`, `get_recommended_action`, `get_mastery_map`, `get_due_reviews`, `generate_practice_set`, `create_study_plan`, `explain_progress`, `export_my_learning_data`. All read-only; no XP/mastery writes from assistants. Add per-tool rate limits, pagination, audit log the learner can see, and assistant revocation in Settings.
- Weekly market missions, personal bests, entitlement/feature-flag plumbing for future paid tiers ("Founding Access" framing; earned progress and notes never paywalled).
- Society-authored content pipeline (already planned) as the editorial source for scenarios.
- Deferred: social feed, leagues, live market data, unreviewed AI-generated courses.

## Technical notes

- New tables: `concept_mastery` (user, market, concept_key, state, streak, last_seen), `scenarios` (market_id, day, prompt, options, outcome, mechanism, era tag), `user_scenario_attempts` (choice, confidence, correct, xp). All with RLS scoped to `auth.uid()` and explicit GRANTs.
- Confidence extends the existing answer path; SM-2 grade = f(correct, confidence) so confident-wrong → grade 0.
- Scenario reveal reuses `FeedbackBanner` + existing animation/haptics; `useNativeDriver: false` for width animations.
- AI explanations go through the existing edge-function boundary; deterministic grading stays in the client/RPC path that already awards XP.
- Feature flags read from a small `feature_flags` table so AI surfaces can be disabled without a new build.

## Suggested first build step

Phase 1 blockers, then the decision loop + confidence scoring, since Market of the Day is built from the same components.
