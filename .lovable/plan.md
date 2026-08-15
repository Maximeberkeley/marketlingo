# MarketLingo: the Decision Engine (release-safe plan)

Keep the app's essence — Insider Handbook tone, 15 industry markets, 180-day track, Leo, XP/streaks — and add one shared system, internally the **Decision Engine**: predict → decide → consequence → explanation → evidence recorded. It powers lessons, Market of the Day, Trainer, Interview Lab and Investment Lab instead of being another exercise type.

## What already exists (no rebuild)

180-day curriculum with slides/drills/games, SM-2 review queue, XP/levels/streaks/freezes, achievements, daily quests, friends and leaderboard, sound + haptics, Leo mascot and mentor overlays with TTS/STT, MCP server with 7 OAuth tools, in-app account deletion, legal routes, scheduled notifications.

## Gaps

Decision-and-consequence loop, daily scenario ritual, confidence signal, evidence-based mastery, Leo as contextual coach, explicit AI/voice disclosure, learning-funnel analytics.

---

## Submission blockers (must be true to ship)

- AI and voice disclosure wherever learner data or audio leaves the app.
- Working in-app account deletion (verify end to end).
- Complete privacy labels and privacy policy matching actual data flows, including voice.
- Functional App Review account with credentials.
- No crashes, dead ends, placeholders or broken network states.
- Remote kill switch for AI-dependent features.
- App Review notes explaining Leo, voice processing and authentication.

Accessibility and notification timing are launch-quality work, not gates: fix what is seriously broken, ship the rest in 1.0 polish.

## AI consent (precise, not a legal wall)

Shown once, before the first Leo/mentor/AI action — not at launch:

> Leo uses an external AI service to answer questions and personalize explanations. Your question and relevant lesson context may be sent for processing. Voice recordings are processed when you use voice mode.

Buttons: **Continue** · **Not now** · **Learn more**. Voice gets its own explicit opt-in the first time voice mode is used. The full curriculum, drills and reviews stay usable without consent. Both toggles live in Settings and are revocable.

## Mastery: dual-track, invisible at first

Two parallel records:

- `completion_progress` — what the learner consumed. Continues to drive the 180-day journey, streaks and XP exactly as today.
- `concept_mastery` — what the learner demonstrated. Drives review recommendations and (later) the knowledge map.

States: Unseen → Introduced → Practicing → Proficient → Mastered → Decaying.

**Hard rule:** `concept_mastery` is written only by a deterministic scoring service, never by Leo. Initial model:

```text
mastery evidence = correctness × difficulty weight × confidence calibration × recency factor
```

Repetition count feeds the decay/confirmation schedule. Leo may explain a result or generate grounded practice, but never decides a concept is mastered. Mastery is not surfaced as a visible progress replacement in 1.0.

## Confidence: selective, three levels

Asked only on: market predictions, the final lesson question, Interview Lab responses, and questions previously answered wrong. Input: **Guessing · Fairly sure · Certain**.

| Answer | Interpretation | System response |
| --- | --- | --- |
| Correct + certain | Strong mastery evidence | Increase mastery substantially; long review interval |
| Correct + guessing | Fragile knowledge | Small increase; schedule a confirmation check |
| Wrong + certain | High-priority misconception | Reduce mastery; prioritize review; tag misconception |
| Wrong + guessing | Normal knowledge gap | Minor reduction; provide explanation |


## Contextual Leo: structured actions, no blank chat

After a mistake, show action chips instead of an open prompt: **Why?** · **Explain more simply** · **Show the market consequence** · **Give me another example** · **Challenge me again**. Each sends lesson text, the selected answer, the misconception tag and the learner level — bounded prompts, lower cost and hallucination risk. Correctness, XP, streaks and mastery stay deterministic server-side.

## Analytics (instrument before launch)

Onboarding started/completed; first lesson started/completed; decision submitted; consequence viewed; explanation requested; review completed; notification permission requested/accepted; D1/D7/D30 return; lesson abandonment screen; AI latency, failure, cancellation; confidently-wrong rate by concept.

Success metrics: first-lesson completion, time to first meaningful action, second-session rate, review-session completion, daily-scenario return rate, crash-free sessions, AI success rate and latency.

---

## Release sequence

**Version 1.0**
- Privacy + AI/voice consent flow and Settings controls.
- Reliability pass (loading, empty, offline, error states) and accessibility fixes.
- Feature flags, remote kill switch, observability.
- Notification timing and preferences (study time, days/week, quiet hours, categories).
- Contextual Leo action chips.
- Decision loop in a few flagship lessons per market.
- Internal concept/mastery data model (written, not displayed).
- Analytics events above.

**Version 1.1**
- Market of the Day: one curated historical scenario per market per day — predict, confidence, reveal, adapted explanation, streak credit.
- Confidence scoring in the selective surfaces.
- Visible mastery map.
- Decision loop across more lessons.
- Smarter review recommendations driven by mastery + misconception tags.
- Additional read-only MCP tools: `search_course_content`, `get_recommended_action`, `get_mastery_map`, `get_due_reviews`, `generate_practice_set`, `explain_progress`, `export_my_learning_data`. No XP/mastery writes from assistants; per-tool rate limits, pagination, learner-visible audit log, assistant revocation in Settings.

**Later**
- Adaptive course sequencing; AI-generated drills under editorial review; live or recent market scenarios; collaborative challenges and deeper social mechanics.

## Technical notes

- New tables: `concept_mastery` (user, market, concept_key, state, evidence counters, last_seen), `decision_scenarios` (market, prompt, options, outcome, mechanism, era tag), `decision_attempts` (choice, confidence, correct, misconception_tag), `feature_flags`, `ai_consent` fields on profile. RLS scoped to `auth.uid()` with explicit GRANTs.
- SM-2 grade becomes f(correct, confidence) so wrong+certain grades 0 and jumps the queue.
- Decision reveal reuses `FeedbackBanner`, existing haptics and sounds; `useNativeDriver: false` for width animations.
- AI calls stay behind the existing edge functions; kill switch and consent checked server-side too.
- Mobile-first (Expo) with web parity, per project convention.

## First build step

The blocker list plus the 1.0 items in order: consent flow → feature flags/kill switch → reliability pass → contextual Leo → decision loop on flagship lessons → mastery model + analytics.
