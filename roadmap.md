# MarketLingo roadmap

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
- [ ] Six-month syllabus per market (one concept per day, no overload).
- [ ] Focus topic as one optional tap after the first week.
- [ ] Goal-specific deliverable (founder idea dossier / fluency proof).
- [ ] Streak identity, loss aversion, personality, open loops.

## Release
- Version 1.0.8 / iOS build 119. Widgets deferred to a future update.
- [ ] Rebuild and archive from `/Users/sophiehernandez/MarketLingo/mobile`.
