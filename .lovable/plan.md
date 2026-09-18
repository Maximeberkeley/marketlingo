# MarketLingo v2 — teach one thing a day, and prove it landed

## What is actually broken (verified in the live data)

- **Content gets cut.** Text is written to a hard ceiling, so sentences end mid-phrase ("…that's where innovation of") and the reading view shows a stub.
- **The games don't test the lesson.** They come from separate pools (authored market packs, industry statistics, fact-check drills), not from the lesson just read — exactly what the tester reported.
- **Lessons are thin.** Text averages **274 characters**, never exceeds **450**, across all 55,554 pieces of content.
- **Too broad per day.** Each day skims six angles; nothing is taught to the point of ownership.
- **No promised outcome.** Only about **20 of 10,800** lessons carry learning objectives, so "your mission" falls back to slide titles.
- **Day logic is fragile.** Two lessons in one day, or opening day 2 while day 1 is unfinished, confuses progress, completion and the day counter.
- **Streak is a number, not an identity.**

## The tension we are deliberately resolving

"Deep enough to be knowledge" and "light enough to do every day" pull against each other. The resolution is **narrower, not longer**: the same five to seven minutes on **one** concept instead of six half-ideas, with extra depth strictly opt-in behind one tap. Nothing about the daily loop gets heavier.

The tester's sharpest line was "I don't know who this is for." That is positioning, so this plan removes configuration rather than adding knobs, and names one primary user.

## Two judges, not one

The complaint had two separate signals, and one kind of tester cannot give both:

- **Target users** (ambitious non-experts: career switchers, students, first-time founders) certify **fit and felt learning** — is it for me, did I learn something, would I come back.
- **A domain expert** certifies it is **actually knowledge** — that a confident sentence isn't a hollow generalization.

Both must pass. Five happy beginners reciting a plausible-but-empty sentence is a false pass, and it is the exact failure mode: our own commitment screen promises they can "hold their own in a hiring conversation", and the person on the other side of that conversation is the expert. He is not off-target; he is a preview of our user's worst moment.

Expert review is cheap in aerospace (we red-pen our own). AI and fintech need a borrowed expert per market before that market's rewrite ships.

## Phase 0 — fixes that stand on their own merit

These are correct regardless of the depth question, and none of them is presented as an answer to it:

1. **No truncated content anywhere.** Remove the ceilings that cut sentences; the reading view shows the complete authored text.
2. **The check is generated from the lesson it tests** — its own mechanism, figures, terms, and the trap a beginner falls into. Wrong answers explain the real misconception and point to the passage. Market packs, statistics and drills move to Practice and spaced review, where mixed recall belongs.
3. **Day and session logic fix** (true blocker): one source of truth for "which day am I on, what is left today", so a second lesson counts as extra practice without double-advancing the day or double-paying XP, a future day resumes or previews explicitly, and a half-finished lesson resumes at the same beat without re-awarding XP or hearts.
4. **One primary user, named**, with the commitment line, tone and default difficulty written for them.

Phase 0 does **not** rewrite content, so it cannot and will not be used to settle the depth question. Existing text stays 274 characters — complete now, still thin.

## Phase 1 — the exemplar spike (the real gate)

Before any batch rewrite: **hand-author one lesson** to the new one-concept contract, end to end, in aerospace and in AI. An afternoon of work, not a curriculum.

```text
Recap        the one thing you owned yesterday          ~15s
Concept      today's single idea, defined plainly        ~1 min
Mechanism    how it actually works, cause by cause       ~1.5 min
Case         one real company, real numbers, outcome     ~1.5 min
Check        questions written from today's own material ~1.5 min
Takeaway     the sentence you keep, and tomorrow's hook  ~15s
```

Test that exemplar against **both judges**:

- Target users: can they restate the concept and its mechanism unprompted a day later, does it still feel light, would they do it again tomorrow.
- Domain expert: is every claim true, non-hollow, and would a candidate saying this sound informed rather than parroting.

Only if the exemplar passes both do we commit to the rewrite. If it fails on the expert side, the contract gets fixed and re-spiked — not scaled.

## Phase 2 — substance at scale (gated on Phase 1)

1. **Deep layer on demand** — opening a lesson can fetch a substantive, sourced explanation of that single concept (mechanism chain, named case with figures, key terms, sources, links back and forward). Cached, written once, opt-in.
2. **Curriculum rewrite, market by market** — AI and aerospace first (the criticism came from an AI lesson, so a re-test there must be able to show improvement), then fintech. Generated against the exemplar's contract: one concept per day, no ceilings, mandatory objectives, mandatory recap and next-hook, mandatory named case with real figures, mandatory sources. Each market's batch ships only after expert spot-review of a sample.

Three real objectives before every lesson; one earned takeaway after.

## Phase 3 — spread across six months

180 days sequenced as a syllabus per market: foundations → how value and money move → players and power → economics and numbers → regulation and risk → frontier and gaps. Each week a theme, each day one concept, every seventh day consolidation with no new idea — retrieval and synthesis only.

## Phase 4 — focus, without more knobs

- The existing goal stays the single lens.
- A **focus topic** is one optional tap ("go deeper on launch economics?") offered after the first week, once the learner has context to choose — not a second onboarding gate. One market first; extended only if used.
- The commitment screen states one concrete destination in the learner's words.

## Phase 5 — a deliverable worth finishing

One living document per learner from their own answers and notes, shaped by their goal: idea dossier (found), interview brief (career), thesis sheet (invest), market map (explore). Completion percentage, grows daily, exportable; the weekly consolidation day asks for one line in their own words.

## Phase 6 — streak that sells the identity

- **Identity**: "Commit to becoming fluent"; the streak reads as proof of becoming an insider.
- **Loss**: framed as owned — countdown when today is unfinished, escalating Leo moods, one rescue.
- **Personality**: Leo remembers the market, the focus, and what they got wrong, and reacts to absence with attitude.
- **Open loops**: deliverable percentage, one concept awaiting review, "tomorrow: the company that proved everyone wrong".

## Technical notes

- Day resolution consolidated into one module used by home, roadmap and the session flow, driven by start date plus completion records; XP and streak writes idempotent per day and per lesson.
- New tables: cached deep-dive per lesson and goal; generated checks linked to their source passage; deliverable documents with per-goal sections and entries; optional focus topics per market. Row-level security scoped to the owner, grants for the app roles.
- Deep-dive and check generation in an edge function against a strict schema, cached by lesson and goal; failure falls back to existing content so a lesson never blocks.
- The exemplar lessons are authored rows, not generated — they double as the reference the rewrite contract is measured against.
- Curriculum rewrite reuses the existing batch generation job with the one-concept-per-day contract and per-market progress tracking.
- Existing reading view, exercise renderer and Leo coaching are reused; the layered reader finally receives full text.
- League, notes, review scheduling and no-purchase constraints unchanged.

## Validation

Feature checks:

- Two lessons in one day, and day 2 opened during day 1: day counter, streak, XP and completion stay correct.
- No text ends mid-sentence anywhere; day N recaps N-1 and hooks N+1; day 7 introduces nothing new.
- The check is answerable only from the lesson it belongs to.

Outcome checks:

- Exemplar passes both judges: target users retain and return; expert finds no hollow or wrong claims.
- **Load, not clock**: watch lesson completion rate, next-day return rate, and drop-off point within the run on the cohort that gets the new format. Minutes are not the measure — two six-minute lessons can feel completely different.
- No fall in daily completion or streak retention after the depth change.

## Open question, still open

**What is n?** One screenshot from one intermediate-level sector expert, so far. If that is the whole signal, Phase 0 plus the exemplar spike is the right aggression and Phases 3 to 6 wait for evidence. Before writing another revision of this plan, we find out how many target-profile users say the same thing.
