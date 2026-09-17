# Roadmap
- [x] iOS home-screen Leo widget — sync immediately at lesson completion, query the active market, reload LeoWidget directly, and ship in build 103
- [x] Website About — 3 founder posts (Maxime, Sophia, Leo) with large headshots and sitting/sat Leo sticker image
- [x] Remove all purchase/IAP code from mobile + iOS (Apple rejection)
- [x] Fix broken demo lesson on the website (src/components/demo/DemoLesson.tsx)
- [x] Phase 1 — playable lesson modules (Sort the Signal, Build the Chain, Face-Off,
      Beat the Clock, Number Sense, Spot the Fake, Map the Market, Chart Read, The Call)
- [x] Phase 2 — beat sequencer: cold open, insight, game, boss round, takeaway
- [ ] Phase 3 — streak rescue, comeback flow, rival nudges, league reveal, smarter notifications
- [ ] Phase 4 — market worlds, collectibles, milestones, and full LessonKit coverage
- [x] Phase 5 — Daily Arena and Deep Case replace the Practice activity cards; Labs and Resources remain.
      Light appearance is fixed app-wide; level uses a 4h return pop-up while XP stays on Home; achievements are industry-scoped
  - [x] 15 world identities, 60 cards, secure unlocks, reveal ceremony, collection, featured card, journey milestones
  - [ ] Adapt Trainer, Games, Drills, Investment Lab, Seminar Prep, Notebook, and Summaries to LessonKit

## Lesson kit — industry content (done)
- Industry packs: fintech (finance), ai (tech), logistics (commerce)
- Real trainer scenarios power The Call; fact-checked drills power Spot the Fake
- Leo coaches every beat and reacts to answers
- Next: packs for the remaining 12 markets (no retail market exists yet)

## Website About — 3 founder posts (in progress)
- Maxime, Sophia, and Leo each get their own spotlight "post" card in #about
- Use the sitting/sat Leo sticker image for Leo's card

## Retention — streak rescue + weekly league (done, mobile)
- Streak rescue round: 3 market drill statements, 2 right saves the streak (spends a freeze, else extends the clock)
- Rescue entry appears on Home whenever the streak is at risk and today's lesson isn't done
- Weekly league screen (/league): tier hero, countdown, rank, rival weekly XP, promotion/demotion zones
- Sunday ceremony modal on Home for last week's promotion/demotion/hold
- Sunday recap card: weekly XP chart, activity counts, week-over-week delta, league CTA
- League card added to Practice > Resources

## Industry packs — all 15 markets (done)
- Added: aerospace, agtech, biotech, cleanenergy, climatetech, ev, healthtech, neuroscience, spacetech

- [x] Add concise goal preview before every lesson
- [x] Add skippable three-minute first-use app tour and one-time chosen-goal learning promise
- [x] Rebuild Interview Lab to current short-copy, visual, retention, and reward standards
- [x] Rebuild Investment Lab to current short-copy, visual, retention, and reward standards

## Social + widget accuracy (done)
- Widget reads the same App Group the app writes to (group id no longer derived), streak/expiry written as number + text, and resyncs whenever the app returns to the foreground
- Global tab now reads the public leaderboard views (RLS-safe), so every industry rank is real instead of showing only you
- Global tab has This week / All time scopes plus a real cohort count
- Friends tab ranks you against your friends in one list
- League standings show display names, not raw emails
- Removed paid-reward wording from the leaderboard banner

## Investment Lab landing screen
- [ ] Revise Investment Lab landing page (short copy, gamified visuals, new app standards)

- [x] Widget shows 0 streak after completing a lesson (app shows 2) — sync on lesson completion, not just Home mount
- [x] Recut Leo's lesson PNGs to remove neighboring-sheet fragments and simplify the coach strip without aura circles
- [x] Replace lesson Leo poses with the new 10-pose sheet and contour every transparent cut cleanly
- [x] Provide the exact clean iOS rebuild and widget reinstall commands for build 103

## Current fixes
- [x] Add a tappable end-to-end widget self-test that writes the real streak, reloads WidgetKit, and waits for extension acknowledgement; confirm Lock Screen families
- [x] Make the Leo iOS widget read and refresh real streak data reliably
- [ ] Replace legacy daily quests with Daily Arena, Deep Case, and lesson quests; verify one-time XP banking
- [ ] Add safe backward navigation inside lessons
- [ ] Restore Leo's natural image proportions and make every speech line fit cleanly
- [x] Leo presence: enlarge Leo himself (not bubble/text), bubble appears ~2s into each slide with a gentle pop so he feels alive
- [x] Dark mode (v2): premium dark greys, Settings > Appearance toggle, boot-time palette + restart, hardcoded whites removed

- [x] Widget self-test red — replace the silently missing third-party bridge with a local iOS App Group module; fix broken target artwork paths
- [x] Increase in-lesson Leo slightly without enlarging or overlapping the speech bubble
