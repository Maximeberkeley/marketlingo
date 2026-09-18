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

"Deep enough to be knowledge" and "light enough to do every day" pull against each other. The resolution is **narrower, not longer**: the same five to seven minutes, spent on **one** concept instead of six half-ideas, with extra depth strictly opt-in behind one tap. A beginner finishes in the same time as today. Nothing about the daily loop gets heavier.

The tester's sharpest line was "I don't know who this is for." That is positioning, not depth — so this plan reduces configuration rather than adding knobs, and names one primary user.

## Phase 0 — ship the two fixes that move the verdict (first)

Small, safe, and they address the complaint directly:

1. **No truncated content anywhere.** Remove the character ceilings that cut sentences; the reading view always shows the complete authored text.
2. **The check is generated from the lesson it tests** — its own mechanism, figures, terms and the trap a beginner falls into. A wrong answer explains the real misconception and points to the passage. Market packs, statistics and drills stay, but move to Practice and spaced review where mixed recall belongs.
3. **One primary user, named.** We pick the person the whole app speaks to (proposal: the ambitious non-expert breaking into an industry — career switcher, student, first-time founder — *not* the sector professional). The commitment screen, tone and difficulty default are written for them.
4. **Day and session logic fix** (true blocker): one source of truth for "which day am I on, what is left today", so a second lesson counts as extra practice without double-advancing the day or double-paying XP, a future day resumes or previews explicitly, and a half-finished lesson resumes at the same beat without re-awarding XP or hearts.

**Then re-run the exact same test with about five people who match that primary user, before building anything below.** If "it's not knowledge" persists for the target user, depth is the problem. If it doesn't, the rest of this plan is optional polish and we spend the effort elsewhere.

Note: the criticism came from an AI-market lesson, so the first curriculum rewrite covers **AI and aerospace together** — otherwise a re-test on AI shows nothing.

## Phase 1 — one concept a day, properly taught

```text
Recap        the one thing you owned yesterday          ~15s
Concept      today's single idea, defined plainly        ~1 min
Mechanism    how it actually works, cause by cause       ~1.5 min
Case         one real company, real numbers, outcome     ~1.5 min
Check        questions written from today's own material ~1.5 min
Takeaway     the sentence you keep, and tomorrow's hook  ~15s
```

Substance arrives in two waves:

1. **Deep layer on demand** — opening a lesson requests a substantive, sourced explanation of that single concept (mechanism chain, named case with figures, key terms, sources, links back and forward). Cached, written once, instant afterwards, opt-in.
2. **Curriculum rewrite, market by market** — AI and aerospace first, then fintech. Generated against a stricter contract: one concept per day, no ceilings that cut sentences, mandatory objectives, mandatory recap and next-hook, mandatory named case with real figures, mandatory sources.

Three real objectives before every lesson; one earned takeaway after.

## Phase 2 — spread across six months

180 days sequenced as a real syllabus per market: foundations → how value and money move → players and power → economics and numbers → regulation and risk → frontier and gaps. Each week a theme, each day one concept, every seventh day consolidation with no new idea — retrieval and synthesis only.

## Phase 3 — focus, without more knobs

Instead of goal × focus topic × level multiplying the surface area:

- The existing goal stays the single lens.
- A **focus topic** is offered as one optional tap ("go deeper on launch economics?") after the first week, once the learner has context to choose — not another onboarding gate. Shipped for one market first and only extended if it's used.
- The commitment screen states one concrete destination in the learner's words: "In 30 days you'll hold your own on this in a hiring conversation."

## Phase 4 — a deliverable worth finishing

One living document per learner, built from their own answers and notes, shaped by their goal: idea dossier (found), interview brief (career), thesis sheet (invest), market map (explore). Completion percentage, grows daily, exportable. The weekly consolidation day asks for one line in their own words. Built only if the re-test says depth and outcome are what's missing.

## Phase 5 — streak that sells the identity

- **Identity**: "Commit to becoming fluent"; the streak reads as proof of becoming an insider, not a counter.
- **Loss**: framed as owned — countdown when today is unfinished, escalating Leo moods through the evening, one rescue.
- **Personality**: Leo remembers the market, the focus, and what they got wrong, and reacts to absence with attitude.
- **Open loops**: deliverable percentage, one concept awaiting review, "tomorrow: the company that proved everyone wrong".

## Technical notes

- Day resolution consolidated into one module used by home, roadmap and the session flow, driven by start date plus completion records; XP and streak writes made idempotent per day and per lesson.
- New tables: cached deep-dive per lesson and goal; generated checks linked to their source passage; deliverable documents with per-goal sections and entries; optional focus topics per market. Row-level security scoped to the owner, grants for the app roles.
- Deep-dive and check generation in an edge function against a strict schema, cached by lesson and goal; failure falls back to existing content so a lesson never blocks.
- Curriculum rewrite reuses the existing batch generation job with the new one-concept-per-day contract and per-market progress tracking.
- Existing reading view, exercise renderer and Leo coaching are reused; the layered reader finally receives full text.
- League, notes, review scheduling and the no-purchase constraints unchanged.

## Validation — outcome, not just QA

Feature checks:

- Two lessons in one day, and day 2 opened during day 1: day counter, streak, XP and completion all stay correct.
- No text ends mid-sentence anywhere; day N recaps N-1 and hooks N+1; day 7 introduces nothing new.

Outcome checks (the ones that decide whether this worked):

- Five testers matching the primary user run the same lesson-and-quiz test. Target: they can restate the concept and its mechanism unprompted afterwards, the quiz is answerable only from the lesson, and nobody says "I don't know who this is for".
- Session length does not grow: the daily run still finishes in about five to seven minutes.
- Daily completion and streak retention do not fall after the depth change.

## Open question

How many testers actually reported "too vague / not knowledge"? If it is one intermediate-level sector expert, Phase 0 plus the re-test is the right aggression and Phases 2 to 5 wait. If several target-profile users say it, we run the whole sequence.
