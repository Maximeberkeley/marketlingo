# MarketLingo v2 — From "buzz sentences" to a real learning tool

## What is actually broken (verified in the live data)

- **Lessons are too thin to teach.** Lesson text averages **274 characters** and never exceeds **450** across all 55,554 pieces of content. One paragraph per screen — enough for a buzz sentence, not for knowledge.
- **Too broad per day, too shallow per idea.** Each day currently skims six different angles. Nothing is taught to the point of ownership.
- **The games don't test the lesson.** They are built from separate pools (authored market packs, industry statistics, fact-check drills), not from the lesson just read — exactly what the tester reported.
- **No promised outcome.** Only about **20 of 10,800** lessons carry learning objectives, so "your mission" falls back to slide titles.
- **Content gets cut.** Written to a hard character ceiling, sentences end mid-phrase ("…that's where innovation of").
- **Day logic is fragile.** Doing two lessons in one day, or opening day 2 while still on day 1, confuses progress, completion and the day counter.
- **Streak is a number, not an identity.**

## 1. One concept a day, properly taught

The rule for the whole curriculum: **one idea per day, owned by the end of it.** Narrower, not longer — roughly the same five to seven minutes, but all of it spent on a single concept instead of six half-ideas.

```text
Recap        the one thing you owned yesterday          ~15s
Concept      today's single idea, defined plainly        ~1 min
Mechanism    how it actually works, cause by cause       ~1.5 min
Case         one real company, real numbers, outcome     ~1.5 min
Check        questions written from today's own material ~1.5 min
Takeaway     the sentence you keep, and tomorrow's hook  ~15s
```

Depth is opt-in, never dumped: the deep-dive sits behind one tap for whoever wants the full mechanism and sources. A learner who reads only the cards still leaves with the concept.

## 2. Spread across six months properly

The 180 days are sequenced as a real syllabus for each market and focus topic: foundations, then how value and money move, then players and power, then economics and numbers, then regulation and risk, then frontier and where the gaps are. Every week has a theme, every day one concept inside it, every seventh day is consolidation — no new idea, only retrieval and synthesis of the week's six.

Each day explicitly recaps the previous one and hooks the next, so the focus topic reads as a course, not 180 unrelated facts.

## 3. Real substance behind each concept

Two waves:

1. **Now — deep layer on demand.** Opening a lesson requests a substantive, sourced explanation of that single concept: the mechanism chain, the named case with figures, key terms, sources, and links back and forward. Cached, written once, instant afterwards. No truncation.
2. **Then — rewrite market by market**, aerospace first, then fintech, then AI. Generated against a stricter contract: one concept per day, no character ceilings that cut sentences, mandatory objectives, mandatory recap and next-hook, mandatory named case with real figures, mandatory sources.

## 4. The games test the lesson

Checks and games are generated **from that day's own material**: its mechanism, its case figures, its terms, the trap a beginner falls into. A wrong answer explains the real misconception and points to the passage that covers it. Market packs, statistics and drills remain, but move to Practice and spaced review where mixed recall belongs.

Concept mastery stays deterministically scored; a missed concept returns in review days later.

## 5. Goal plus focus topic

A short second onboarding step after the market: a **focus topic** inside it (aerospace: launch economics, defense procurement, satellite data, propulsion and materials, air mobility — each market gets five to seven).

- Goal (career, invest, found, explore) sets the lens; focus topic sets the subject.
- The commitment screen names the destination: "In 30 days you'll hold your own on defense procurement in a hiring conversation."
- Changeable monthly without losing streak or XP.
- Three real objectives before every lesson; one earned takeaway after.

## 6. Fix the day and session logic

A single source of truth for "which day am I on and what is left today", so:

- Finishing a second lesson in one day is allowed and counted as extra practice, and never double-advances the day or double-pays XP.
- Opening a future day while the current one is unfinished either resumes the current day or is clearly presented as a preview — no silent state mixing.
- Completion, streak, day counter and the daily record stay consistent, with the day resolved from the learner's start date and completion records rather than accumulated counters.
- Re-entering a half-finished lesson resumes at the same beat without re-awarding XP or hearts.

## 7. Goal-specific deliverable

Learning accumulates into one living document per learner, built from their own answers and notes:

- **Found** — Idea Dossier: market map, who owns which layer, the unclaimed gaps, shortlisted ideas, one written thesis with the next assumption to validate.
- **Career** — Interview Brief: vocabulary owned, frameworks, their written case answers, questions to ask an interviewer.
- **Invest** — Thesis Sheet: metrics that matter, red flags, companies tracked, their own call on each.
- **Explore** — Market Map: how the industry fits together, surprising truths, players, what to watch.

Each shows a completion percentage, grows daily, is exportable and shareable. The weekly consolidation day asks for one line in the learner's own words.

## 8. Streak that sells the identity

- **Identity**: "Commit to becoming fluent"; the streak reads as proof of becoming an insider in their focus topic.
- **Loss**: the streak is framed as owned — countdown when today is unfinished, escalating Leo moods through the evening, one rescue.
- **Personality**: Leo remembers the market, the focus, and what they got wrong, and reacts to absence with attitude.
- **Open loops**: dossier percentage, one concept awaiting review, "tomorrow: the company that proved everyone wrong".

## Technical notes

- New tables: focus topics per market; cached deep-dive per lesson, goal and focus topic; generated checks linked to their source passage; deliverable documents with per-goal sections and entries. Row-level security scoped to the owner, with grants for the app roles.
- Deep-dive and check generation in an edge function against a strict schema, keyed by lesson plus goal plus focus topic, cached; failure falls back to existing content so a lesson never blocks.
- Day resolution consolidated into one module used by home, roadmap and the session flow, driven by start date plus completion records; XP and streak writes made idempotent per day and per lesson.
- Curriculum rewrite reuses the existing batch generation job with the new one-concept-per-day contract and per-market progress tracking.
- Existing reading view, exercise renderer and Leo coaching are reused; the layered reader finally receives full text.
- League, notes, and no-purchase constraints unchanged.

## Sequence

1. Day and session logic fix (blocker — everything else builds on it).
2. Focus topics, commitment screen, objectives before every lesson.
3. One-concept lesson arc, deep layer on demand, checks generated from lesson content.
4. Goal-specific deliverable and weekly consolidation.
5. Streak identity, loss and open-loop system.
6. Aerospace curriculum rewrite, then fintech, then AI.

## Validation

- Two lessons in one day, and day 2 opened during day 1: day counter, streak, XP and completion stay correct.
- An aerospace intermediate lesson teaches one concept a knowledgeable reader would call knowledge, and its questions are answerable only by someone who read it.
- No text ends mid-sentence anywhere.
- Day N recaps N-1 and hooks N+1 inside the same focus topic; day 7 introduces nothing new.
- The dossier fills with the learner's own words and can be shared.
- Review scheduling and league behaviour unchanged; typecheck and preview build green.
