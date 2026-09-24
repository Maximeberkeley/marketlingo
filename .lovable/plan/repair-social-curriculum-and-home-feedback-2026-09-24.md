# Repair Social, Curriculum, and Home Feedback

## What will change

1. **Make League, Friends, and Global operational**
   - Replace owner-only ranking reads with the new privacy-safe monthly standings source.
   - Keep friendship relationships private while allowing authenticated learners to see ranking-safe names, avatars, streaks, levels, and monthly XP.
   - Add honest loading, error, retry, refresh, and empty states instead of silently showing only the current learner.
   - Keep calendar-month seasons and allow viewing populated league tiers.

2. **Correct the startup curriculum contract**
   - Rewrite Aerospace Day 1 so it starts with opportunity discovery and explains the OEM/system-integrator model before any company case.
   - Introduce Toyota only inside a clearly framed Joby supplier/investor case, not as unexplained context.
   - Update the generator so “Build a startup” never assumes the learner already has an idea.
   - Audit and correct the other flagged startup lessons with the same assumption.

3. **Upgrade social and Course visuals**
   - Replace the League and Friends artwork with the supplied images.
   - Replace the center Course Leo with the static reading pose while preserving the exact 144×144 area and all orbit geometry.
   - Add a subtle right-to-left title light sweep every three seconds, disabled when reduced motion is enabled.

4. **Improve Leo reminders**
   - Replace the moving popup mascot with the original static streak-reminder mascot.
   - Rewrite taunting, emoji-heavy reminders into concise, personalized, course-aware prompts.
   - Preserve local-time scheduling, completion cancellation, and direct actions.

## Verification

- Test rankings with more than one authenticated learner and confirm Global is not owner-only.
- Verify friend requests, accepted-friend standings, tier switching, monthly XP, errors, and refresh behavior.
- Verify Aerospace Day 1 reads coherently for a learner with no startup idea.
- Check the Course layout, supplied artwork, static mascot behavior, title motion, light/dark themes, and reduced-motion behavior.
- Run the mobile source checks and inspect the latest build diagnostics.