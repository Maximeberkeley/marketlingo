# Practice, Weekly League, and Arena prerequisite refresh

## What will change
- Remove the Practice “Resources” carousel entirely, including Summaries and Regulatory Hub, while retaining lesson-grounded activities and both Labs without leftover spacing.
- Rebuild Weekly League as a high-energy progression screen: league/countdown header, five-tier trophy ladder, prominent trophy Leo, medal-ranked avatar rows, promotion/demotion dividers, and a strongly highlighted learner row.
- Upgrade the locked Arena state with crisp Thinking and Scholar Leo artwork, automatic crossfades, tap-to-toggle spring feedback, preserved copy, and a centered Course button.
- Keep all existing league scoring, cutoff, local-week timing, lesson prerequisite, and navigation behavior unchanged.

## Visual and interaction details
- Use the current light/dark theme tokens for backgrounds, elevated surfaces, borders, copy, and state highlights.
- Use native image dimensions and opacity transitions rather than scaling the image asset itself, preserving sharp mascot rendering.
- Use existing haptic and sound feedback for League/Arena interactions where appropriate.
- Upcoming tiers remain visible but subdued and locked; the current tier receives the strongest pedestal and glow treatment.

## Verification
- Check source consistency and the preview build log.
- Verify Practice has no Resources gap, Arena routes to Course, and League handles loading, empty, promotion, demotion, and current-user states.
