# Universal AI Demo and Named Onboarding

## Goal
Make every new mobile learner’s first MarketLingo experience a short, interactive AI & Machine Learning lesson, then carry their name and earned reward cleanly into the existing industry onboarding and learning experience.

## New learner flow
1. **Create account:** Sign-up first asks “What should we call you?” with the existing Thinking Leo artwork, then collects email and password.
2. **Named welcome:** After successful account creation, show a one-time Leo welcome with the learner’s saved display name.
3. **Choice:** “Try the Demo Lesson (+20 XP)” opens the universal lesson; “Choose My Industry” records a skip and opens the existing industry selector.
4. **Demo completion:** “Save My Progress & Choose Industry” records completion, preserves the reward, and opens the existing industry selector.
5. **Returning users:** Existing learners with an industry go through the normal startup flow. Incomplete onboarding accounts missing the new decision are safely routed through the name/welcome gate once, without loops.

## Demo lesson
- Replace the current long demo with exactly three visible stages: **Step 1**, **Step 2**, **Quiz**, plus a Skip/X action.
- **Next-Token Machine:** selectable probability chips for “torque / music / engine,” then the supplied concise explanation.
- **Attention Spark:** tappable “IT,” with an animated connection to “trophy,” then the supplied self-attention explanation.
- **Mind-Blown Quiz:** four supplied options; wrong answers shake and remain retryable, while the correct answer triggers confetti, sound, haptics, and the supplied explanation.
- Completion presents the existing celebratory Leo, **+20 XP**, and **1-Day Streak unlocked**.
- Reuse existing mascot images, confetti, haptics, sounds, theme colors, and XP bridge; do not add generated artwork.

## Profile and reward integrity
- Add a private `display_name` profile field and a small demo onboarding status (`pending`, `completed`, or `skipped`). Existing profile security remains owner-only.
- Validate names (trimmed, 1–40 characters) before local or cloud storage; use **Scholar** when missing.
- Store the name locally before account creation and sync it to the profile after authentication.
- Make the +20 XP bridge idempotent so replaying the demo cannot duplicate rewards.
- Represent the starting streak through the app’s existing local-day completion/streak model when onboarding finishes; do not create a rolling timer or prematurely complete curriculum lessons.

## Personalization
- Add one reusable display-name hook/helper so screens do not each invent fallback logic.
- Rotate the three supplied named praise lines on daily lesson completion.
- Personalize visible streak-at-risk reminders with the same safe fallback.
- Keep social usernames, saved notes, curriculum progress, XP rules, and industry selection unchanged.

## Technical details
- Add dedicated mobile routes for the welcome/name gate and demo so navigation state does not live inside the auth screen.
- Update startup routing to distinguish new/incomplete onboarding from returning learners.
- Keep email/password as the only mobile authentication method and preserve instant account access.
- Update the existing profile creation/sync path without storing names in insecure client-only state.

## Verification
- Fresh install: name → account → welcome → demo → reward → industry → goal → level.
- Fresh install skip: name → account → welcome → industry, with no demo reward.
- Pre-account demo entry: complete demo → create account → name/profile sync → industry.
- Wrong quiz answers retry without navigation or reward; correct answer rewards once.
- App relaunch during every onboarding stage resumes safely and never loops.
- Existing signed-in learner launches normally and retains progress, notes, XP, and streak.
- Missing/malformed names render “Scholar,” never `undefined`.
- Validate iPhone small/large layouts, keyboard behavior, reduced motion behavior, source checks, and the mobile production bundle.
