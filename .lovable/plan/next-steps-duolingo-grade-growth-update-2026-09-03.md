# Next Steps: "Duolingo-Grade" Growth Update

Goal: turn MarketLingo from a complete product into a retention and growth machine. Duolingo's success comes from three engines: **habit loops**, **social pressure**, and **data-driven iteration** — not from more content. The plan below is ordered by impact-to-effort.

## Phase 1 — Measure everything (foundation, ~1 week)
You cannot improve what you can't see. Duolingo runs on analytics.

- Add lightweight event tracking (posthog or a `user_events` table + edge function): lesson_started/completed, streak_lost, push_opened, session_length, day-1/7/30 retention cohorts.
- Build a small internal metrics view (daily active users, retention curve, lesson completion rate, churn points in the 180-day journey).
- Identify where users drop off in onboarding and days 1–7, then fix those screens first.

## Phase 2 — Harden the habit loop (~2 weeks)
Streaks exist; now make them emotionally sticky.

- **Streak loss flow**: when a streak is about to break, a Leo "guilt-trip" push + a one-tap streak freeze/repair offer (freeze exists; add repair for a missed day by completing 2 lessons).
- **Evening re-engagement**: smart push timing — send at the hour each user is historically active, not a fixed time.
- **Home-screen widget (iOS)**: streak flame + "Day N lesson is ready" — this is one of Duolingo's biggest retention drivers.
- **Lock-screen Live Activity** for an active lesson session (optional, later).
- Celebrate milestones harder: full-screen confetti for 7/30/100-day streaks with a shareable card (sharing infra already exists).

## Phase 3 — Social & virality (~2 weeks)
Duolingo's league system drives a large share of its daily opens.

- **Weekly leagues**: group 30 users by timezone, promote/demote weekly based on XP (leaderboard exists — add the league mechanic on top).
- **Friend quests**: a weekly shared goal ("both finish 5 lessons this week") that pushes both friends when one completes.
- **Referral loop**: "invite a friend, both get a streak freeze" + a branded invite link/QR card.
- Improve share cards (certificate/streak/level-up) so they look premium on Instagram/LinkedIn stories.

## Phase 4 — Quality & polish (continuous)
- **Content depth**: keep the human/Society-authored pipeline going; AI-personalized review sessions based on each user's weakest concepts (concept_mastery data already exists).
- **ASO**: keyword-optimized App Store title/subtitle, screenshots showing streaks + leagues, and prompt for ratings at moments of delight (after a streak milestone, never mid-lesson).
- **Performance**: cold-start time under 2s; audit largest screens for re-renders.

## What to skip for now
- More markets/content volume — retention beats breadth at this stage.
- Re-introducing monetization — the app is intentionally 100% free (MONETIZATION_ENABLED=false); revisit only after retention metrics are healthy.

## Suggested order of execution
1. Analytics events + retention dashboard
2. iOS streak widget + smart push timing
3. Weekly leagues
4. Referral + friend quests
5. ASO + rating prompts

## Technical notes
- Analytics: prefer a `user_events` table with RLS (owner-write only) + a read-only aggregate view, keeping with the existing Lovable Cloud setup; alternatively PostHog for faster dashboards.
- Widget: requires a small iOS WidgetKit extension added in Xcode (native code, done in the manual Xcode workflow already in use).
- Leagues: new `league_memberships` table + pg_cron weekly regrouping job, reusing the existing XP source of truth.
- Push timing: store each user's active-hour histogram from session events; adjust the existing notification cron.
- All work goes in `/mobile` first (mobile-priority rule), web parity only where meaningful.
