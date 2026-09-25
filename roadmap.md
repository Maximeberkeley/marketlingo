# MarketLingo roadmap

## Sept 25 — Practice artwork and update delivery
- [x] Use the supplied arena and case artwork on their respective Practice cards and remove the redundant lesson-count sentence.
- [x] Explain App Store automatic updates versus app-delivered updates accurately, without implying a new version is already available.

## v2 content rethink — "teach one thing a day, and prove it landed"

### Phase 0 — content-agnostic fixes (done)
- [x] No truncated content anywhere: shortening happens at sentence boundaries only; a complete sentence is never cut, and authored text that was itself stored truncated has its fragment dropped in the reading view.
- [x] Sentence splitting is abbreviation-aware everywhere in the lesson pipeline ("the U.S. Air Force" is one sentence).
- [x] Checks are generated from the lesson they test: figure, definition, mechanism, claim and tamper checks built from the lesson's own slides, with explanations citing the passage. Market packs / industry stats / drills are now fallback and spice only.
- [x] No repeated question inside a lesson (each check used once, identical prompts rejected, boss beat never repeats an earlier beat).
- [x] Day logic single source of truth: `lib/dayMath` + `lib/dayState`; Home no longer computes the day in UTC while progress computed it locally.
- [x] Same-day repeat = extra practice (small flat XP, no streak re-bank, no second lesson reward); a lesson from another day opens as revision.
- [x] Daily completion records written on the learner's local date, and the lesson reward is paid once per day.
- [x] Goal tag mapping fixed: learners stored as `join_industry` now match `goal:career` content (21 of 48 learners were silently getting generic lessons).
- [x] Primary user named in the product: a commitment/destination line per goal in onboarding ("In 30 days you'll…").

### Phase 1 — exemplar spike (content in place, test pending)
- [x] Hand-authored one-concept exemplar lesson in aerospace ("Who eats the overrun: cost-plus vs fixed-price") and AI ("Inference cost: the meter that runs on every answer"): 6 beats, real cases, sources, objectives, takeaway.
- [x] Newest authored lesson for a day wins, so the exemplar is what learners see.
- [ ] Two-judge test: ~5 target-profile learners (ambitious non-expert) certify fit and felt-learning; a domain expert certifies it is actual knowledge, not buzz sentences.
- [ ] Find out n — how many learners actually reported "too vague / not knowledge" (currently one intermediate-level sector expert).

### Phases 2–6 — gated on the exemplar passing both judges
- [x] Deep layer on demand: `lesson_deep_dives` cache + `generate-deep-dive` edge function + "Go deeper on this concept" inside the reading view (one concept, mechanism chain, named case with figures, terms, sources; cached per lesson and goal; failure never blocks a lesson).
- [ ] Curriculum rewrite, market by market (AI and aerospace first, then fintech), with expert spot-review per market.
- [x] Six-month syllabus per market (180-day plan: 6 themes x 5 territories x 6 angles, every 7th day consolidation; wired into the lesson writer and the learner roadmap).
- [x] Focus topic as one optional tap after the first week: from day 7 Home offers one corner of the market (`learner_focus` + `/focus`), derived from the market's own themes. It is a tilt, never a filter — Daily Arena and Deep Case prefer studied lessons touching that corner, the daily concept is unchanged, and it can be changed or dropped.
- [x] Practice tied to the lessons the learner actually studied (Daily Arena waves and Deep Case evidence/numbers now come from their own studied slides, not unrelated packs), framed by the local calendar day, not completion time.
- [x] Goal-specific deliverable: one living document per learner (Interview Brief / Idea Dossier / Thesis Sheet / Market Map), written in their own words, completion percentage, shareable export, and the weekly consolidation day asks for one line.
- [x] Streak identity on Home: identity label instead of a bare number, countdown to local midnight while today is unfinished, escalating Leo moods, one rescue round, and open loops (document %, concepts awaiting review, tomorrow's lesson).

## Release
- Version 1.0.8 / iOS build 119. Widgets deferred to a future update.
- [ ] Rebuild and archive from `/Users/sophiehernandez/MarketLingo/mobile`.

## New (Sept 18, 21:37)
- [x] Weekly/monthly ranking showed only the current user — period XP now read from a shared view
- [x] Daily intel habit: 3 stories a day, Leo sends learners there right after the lesson, +20 XP
- [x] Restyled streak rescue + result to the Duolingo-grade reference (full-bleed gradient, giant streak number, white CTA, "Not now")
- [~] AI curriculum rewrite batch running again (ai + aerospace, days 1-14, all four goals; 3 attempts per lesson)

## New (Sept 18, 22:08)
- [x] Streak is a LOCAL calendar-day fact: recomputed from the learner's own completed days (`sync_local_streak`), not a UTC date with a rolling 48h window.
- [~] Curriculum rewrite for ALL 15 markets, days 1-15, all four goals (900 lessons) — durable queue + scheduled worker, self-stopping on drain.
- [x] In-app games illustrate the lesson they follow: Games + Drills hubs, Deep Case brief/call now generated from studied lesson slides (mobile/lesson-kit/practice/lessonQuestions.ts); market packs are fallback only.

## New (Sept 18, 23:00)
- [x] Mobile navigation simplified to Course, Intel, Practice, You; Notes remains a full-page destination from the Course pen.
- [x] Course rebuilt as one continuous 180-day learning path with wavy lesson nodes, local-day state, changing season colors, Leo beside today, consolidation markers, and access through the final lesson.
- [x] Industry Intel moved into its own tab while preserving the three-story habit, article actions, quizzes, and post-lesson handoff.

## New (Sept 18, 23:11) — app-wide game-quality standard
- [~] Make every mobile surface meet the upgraded in-lesson game standard: the core Course/Practice/Arena/Deep Case/rescue loop is now completed-lesson grounded with sensory feedback and explicit states; peripheral Labs, Resources, Notes, and You still need the same full treatment.
- [x] Restore the Phase 4–6 retention loops displaced by the Course map without rebuilding a dashboard: focus, deliverable progress, insider streak/rescue, review, Intel progress, and tomorrow's open loop now live on the path.
- [ ] Complete a screen-by-screen visual, interaction, dark-mode, safe-area, and navigation audit before marking the next mobile release green.
- [x] Redesign mobile Course into 30-day section clusters with bounded local-day access and locked-section curriculum previews.
- [x] Refine mobile Course/Intel presentation: 10% smaller Leo visual only, interactive industry artwork badge, stronger top-news carousel, and collapsible full analysis.

## New (Sept 23) — universal first lesson and named onboarding
- [x] Replace the old mobile demo with the universal three-step AI & Machine Learning lesson, including retry feedback, confetti, sound/haptics, +20 XP, and a real one-day starting streak.
- [x] Add display-name capture, persist it safely to the learner profile, and route new accounts through the named welcome choice into demo or industry selection without affecting returning users.
- [x] Personalize lesson celebrations and streak prompts with the learner's name, with a clean “Scholar” fallback.
- [ ] Verify fresh install, signup, sign-in, demo skip/completion, reward transfer, onboarding, and returning-user launch paths before release.
## New (Sept 23) — Practice and Monthly League polish
- [x] Remove the Practice Resources section while preserving lesson activities and Labs.
- [x] Rebuild Monthly League with tier progression, trophy Leo, medal/avatar standings, and promotion/demotion zones.
- [x] Upgrade the Arena prerequisite with interactive Thinking/Scholar Leo and a clear Course action.

## New (Sept 23) — Immersive Speak to Leo
- [x] Replace the empty voice screen with the warm study scene and a three-action voice toolbar while preserving speech, transcription, and text chat.

## New (Sept 23) — Lesson entry, orbit, Leo, and monthly leagues
- [x] Tighten lesson outcomes, hierarchy, and the Start Mission glow.
- [x] Compress Course section banners and turn the five fixed nodes into a visible learning orbit.
- [x] Make Tap Leo conversation-safe with expandable history and keyboard dismissal.
- [x] Convert social standings and tier leagues to calendar-month seasons with inspectable tiers and upgraded artwork.

## New (Sept 24) — Course orbit accuracy and rolling Leo nudges
- [x] Replace locked-section placeholder labels with real upcoming lesson titles or curated locked teasers.
- [x] Make the Course orbit fill clockwise from Daily Lesson in exact 25% steps across Lesson, Arena, Deep Case, and Intel; exclude Notes.
- [x] Fit long Course lesson titles across two complete lines without awkward ellipsis.
- [x] Add a personalized jumping-Leo in-app nudge with idle and time-of-day scripts.
- [x] Schedule matching local reminders for incomplete local days, cancel them immediately on lesson completion, and show one restrained completion nod.


## New (Sept 25) — Leo voice control and lesson finish screen
- [ ] Stop Leo's voice the moment the chat is left or the app is backgrounded, and cancel speech still downloading.
- [ ] Remember mute until it is manually switched off.
- [ ] Split the crowded lesson completion screen into a scrollable rewards step and a clean "now read intel" step.
- [ ] Investigate why a completed lesson shows no tick and no purple orbit fill, and why the day advances immediately when the learner is behind.
- [ ] Give credit for a streak when the learner studies today even while behind schedule.
- [ ] Fix the cut mascot image on the check-in popup and replace the 18-hours-left warning with a welcome message.
- [ ] Rework the dossier into an intuitive, gamified, clearly explained experience.
