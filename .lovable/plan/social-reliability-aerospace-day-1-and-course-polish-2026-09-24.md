# Social reliability, Aerospace Day 1, and Course polish

## What the audit confirmed

- **Global standings are genuinely broken.** The Friends & Rivals screen reads the private XP ledger directly. That ledger only allows each learner to read their own rows, so Global can show only the signed-in learner even though the database currently has 24 learners with XP this month and 5 active Aerospace learners.
- **Monthly League has data, but not meaningful tier distribution yet.** Aerospace currently has 12 monthly membership rows, all in Bronze. The screen can read those rows, but Silver through Diamond are empty because everyone begins in Bronze and no completed monthly rollover has promoted anyone yet.
- **Friends are sparse, not necessarily hidden.** The database currently contains one accepted friendship pair. The screen also reads friends’ monthly XP from the same private ledger, so even accepted friends can incorrectly appear with zero monthly XP.
- **Aerospace Day 1 has a real structure but a poor teaching sequence.** The startup version teaches the aircraft OEM as system integrator, then uses Toyota’s investment and supplier relationship with Joby as evidence. Toyota is relevant, but it arrives before the learner has enough context, so it reads as random.
- **The startup path makes the wrong assumption.** The current opening says the learner brings “your startup idea” into the course. Onboarding only promises to help learners find and defend a real gap, so the course must work for someone starting with no idea. A database scan found 11 of 107 rewritten startup lessons containing language that may assume an existing idea and needs review.

## What will change

### 1. Make Friends, Rivals, Global, and Monthly League operational

- Move Global and friend monthly scores to one shared, privacy-safe calendar-month ranking source instead of reading private XP transactions from the phone.
- Use true local/calendar-month boundaries, not a rolling 30-day approximation, and return display name, avatar, streak, monthly XP, rank, and market consistently.
- Keep friendship records private to the two participants while making accepted-friend score lookup work through the safe ranking source.
- Harden add, accept, decline, remove, refresh, and nudge actions with visible success, empty, retry, and failure states; stop silently swallowing request errors.
- Refresh social data when either screen regains focus so newly accepted friends, XP, and membership changes appear without restarting the app.
- Keep league progression honest: do not invent members for upper tiers. Empty future tiers will clearly say that the first completed season creates promotions, while Bronze shows all real current members.
- Make the monthly sync populate every eligible learner in the selected market, verify month-end rollover/promotion rules, and retain the learner’s highlighted row.
- Remove or retire the duplicate legacy leaderboard screen so there is one source of truth and no return of “This Week” or “All Time.”

### 2. Repair Aerospace and all releveant courses includinng AI... Day 1 and the startup learning contract

- Rewrite Aerospace Day 1 for the startup goal around one explicit outcome: understand who owns the complete aircraft and use that map to locate a possible problem worth investigating.
- Start from an idea-free learner. The first action will be observing a recurring aerospace problem, customer, or workflow—not describing a startup they supposedly already have.
- Introduce OEM/system integration first, then use Joby–Toyota as a clearly signposted case showing that a startup can buy critical components while retaining whole-aircraft responsibility.
- End with a concrete, beginner-safe takeaway and one small evidence-based action that feeds the learner’s Idea Dossier.
- Audit the other flagged startup lessons and the curriculum writer instructions so “Build a startup” consistently means **discover and validate an opportunity**, with an existing idea treated as optional.
- Preserve the six-part lesson contract, lesson-derived checks, sources, local-day sequencing, and sentence-safe writing.

### 3. Refresh social artwork

- Use uploaded `image-75.png` for Monthly League and `image-76.png` for Friends & Rivals.
- Replace both Practice cards and the corresponding screen artwork where applicable, preserving readable crops, exact card dimensions, light/dark contrast, and sharp native rendering.

### 4. Upgrade in-app Leo messages

- Replace the jumping popup mascot and bounce loop with the existing original streak-state Leo artwork, rendered completely still.
- Rewrite the active Course nudges and completion message in the Insider Handbook voice: short, specific, respectful, and tied to the learner’s unfinished lesson, streak, market, or next action.
- Remove fake statistics, generic emoji-heavy copy, taunts, and unrelated prompts from the active popup path.
- Keep one clear action per message, existing cooldown/idempotency, local-time windows, completion cancellation, and notification preferences.

### 5. Add restrained motion to Course

- Replace the center idle/staring Leo with the existing **Leo reading** pose at the exact current 144 × 144 visual size and keep it static.
- Add a subtle right-to-left light sweep across the current lesson title every three seconds without changing its two-line wrapping, font sizing, layout, or touch targets.
- Disable the sweep when reduced-motion accessibility is enabled.

## Verification

- Test Global with an authenticated Aerospace learner and confirm multiple real learners appear from the current calendar month.
- Test friend request send/accept/decline/remove, accepted-friend XP, refresh-on-focus, and empty/error states.
- Test Monthly League sync, Bronze membership visibility, other-tier empty explanations, selected-tier navigation, current-row highlight, and month countdown.
- Open Aerospace Day 1 on the startup path and verify Toyota appears only after the OEM concept is established and no prior startup idea is required.
- Verify the new uploaded artwork, static notification Leo, static reading Leo, three-second title sweep, reduced motion, light mode, dark mode, and unchanged Course geometry.
- Run mobile source checks, inspect app error logs, and update the release roadmap; native/Xcode archive validation remains a separate release step.