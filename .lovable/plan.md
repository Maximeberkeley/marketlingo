# Leo attitude alerts

## Goal
Turn the five uploaded Leo expressions into a rotating set of polished, Duolingo-style mobile alerts with funny, slightly antagonistic encouragement.

## What will change
- Add all five transparent Leo expressions as app assets, preserving their quality while fitting them cleanly inside each alert.
- Match Leo’s expression to the moment: sleepy for inactivity, stern for streak risk, pleading for comeback prompts, anxious for deadlines, and sly for challenges.
- Expand the alert copy into multiple short variants for lessons, streaks, reviews, practice, friends, progress, and achievements.
- Keep every alert actionable with one clear button, and rotate lines so the same prompt does not feel repetitive.
- Polish the alert layout around the larger character art while keeping text readable and dismiss controls accessible.

## Technical details
- Store uploaded PNGs through the app’s asset delivery flow and map each alert to an explicit Leo mood.
- Extend the existing popup message type with a mood field and update the existing queue helpers rather than adding another alert system.
- Preserve the existing cooldown and per-session limits.
- Validate the changed mobile files and check the project build signal.
