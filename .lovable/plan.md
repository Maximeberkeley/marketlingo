# MarketLingo v2 — From "buzz sentences" to a real learning tool

## What is actually broken (verified in the live data)

- **Lessons are too thin to teach.** Lesson text averages **274 characters** and never exceeds **450** across all 55,554 pieces of content. That is one paragraph per screen — enough for a buzz sentence, not for knowledge.
- **The quiz doesn't test the lesson.** Games are built from separate pools (authored market packs, industry statistics, fact-check drills). They almost never come from the lesson the learner just read, which is exactly what the tester noticed.
- **No promised outcome.** Only about **20 of 10,800** lessons carry any learning objectives, so the "your mission" screen falls back to slide titles. Nobody is told where the 180 days lead.
- **Content gets cut.** Because text is written to a hard character ceiling, sentences end mid-phrase ("…that's where innovation of") and the reading view shows a stub.
- **Streak is a number, not an identity.** It counts days; it never tells you who you are becoming.

## 1. Goal plus focus topic

Onboarding gains a second, short step after choosing a market: a **focus topic** inside it (for aerospace: launch economics, defense procurement, satellite data, propulsion and materials, air mobility; each market gets its own five to seven).

- The goal (career, invest, found, explore) sets the *lens*.
- The focus topic sets the *subject matter*.
- Together they name a concrete destination on the commitment screen: "In 30 days you'll be able to hold your own on defense procurement in a hiring conversation."
- Changeable monthly, without losing streak or XP.

## 2. Lessons that actually teach, and connect

Every lesson becomes a six-part arc instead of loose cards:

```text
Recap      what you already own, from yesterday
Concept    the idea, defined plainly
Mechanism  how it really works, with the chain of cause and effect
Case       a real named company, real numbers, real outcome
Application the move a founder / candidate / investor makes with it
Check      retrieval questions written from THIS lesson
```

Depth arrives in two waves:

1. **Now — deep layer on demand.** When a learner opens a lesson, the app requests a full, substantive, sourced deep-dive for it: several hundred words of real explanation, the mechanism chain, the case with figures, key terms, sources, and the explicit link back to the previous lesson and forward to the next. It is cached so it is written once per lesson and instant afterwards. The short cards stay as the fast path; the deep-dive is one tap away and is no longer truncated.
2. **Then — rewrite the curriculum market by market**, starting aerospace, then fintech, then AI. Rewrites are generated against a stricter contract: no character ceilings that cut sentences, mandatory objectives, mandatory recap and next-preview so days interlock, mandatory named case with figures, mandatory sources, and a topic thread so a focus topic reads as a course rather than 180 unrelated facts.

Every lesson also gets three real objectives shown before it starts, and one earned takeaway shown after.

## 3. The quiz tests the lesson

Checks are generated **from the lesson's own deep-dive content**: the mechanism, the case figures, the terms it just defined, the trap a beginner falls into. Wrong answers explain the actual misconception and point back to the exact passage. Market packs, statistics and drills stay — but move to Practice and spaced review, where mixed recall belongs, instead of impersonating the lesson check.

Concept mastery keeps being scored deterministically (no model deciding whether you know something), and a missed concept comes back in review days later.

## 4. A goal-specific deliverable

Learning accumulates into one living document per learner, shaped by their goal, built from their own answers, notes and decisions:

- **Found a startup** — Idea Dossier: market map, who owns which layer, the gaps and why they're unclaimed, the three ideas they shortlisted, one written thesis with the assumption to validate next.
- **Career** — Interview Brief: the vocabulary they own, the frameworks, the case answers they wrote, the questions they can now ask an interviewer.
- **Invest** — Thesis Sheet: the metrics that matter in this market, the red flags, the companies they tracked, their own call on each.
- **Explore** — Market Map: how the industry fits together, the surprising truths, the players, what to watch next.

Each has a completion percentage, grows with each lesson, and is exportable and shareable. Weekly, a short synthesis step asks the learner to write one line into it — the real proof of fluency.

## 5. Streak that sells the identity, and defends what they own

Applying the four principles from the notes, at full intensity:

- **Identity**: the commitment button reads "Commit to becoming fluent", the streak screen reads "proof you're becoming an insider in defense procurement", and milestones name the identity, not the count.
- **Loss**: the streak is presented as something owned — visible countdown when today's run is unfinished, escalating Leo moods through the evening, one rescue chance.
- **Personality**: Leo tracks the relationship — remembers the market, the focus, what they got wrong, and reacts to absence with attitude.
- **Open loops**: an always-visible unfinished thing — dossier percentage, one concept waiting for review, "one card left in today's run", "tomorrow: the company that proved everyone wrong".

## Technical notes

- New tables: focus topics per market; a cached deep-dive per lesson and focus topic; generated checks linked to their source passage; deliverable documents with per-goal sections and entries. All with row-level security scoped to the owner and grants for the app roles.
- Deep-dive and check generation runs in an edge function against a strict schema, keyed by lesson plus goal plus focus topic, written once and cached; failures fall back to existing content so a lesson never blocks.
- Curriculum rewrite reuses the existing batch generation job, with the new stricter content contract and per-market progress tracking.
- The existing reading view, exercise renderer, and Leo coaching are reused — the layered reader finally receives full text instead of a stub.
- Scoring, XP, hearts, league and notes logic stay as they are; no purchase surfaces anywhere.

## Sequence

1. Focus topics, commitment screen, objectives before every lesson.
2. Deep layer on demand, plus checks generated from lesson content.
3. Goal-specific deliverable, with weekly synthesis.
4. Streak identity, loss and open-loop system.
5. Aerospace curriculum rewrite, then fintech, then AI.

## Validation

- A lesson in aerospace on "curiosity" at intermediate level teaches something a knowledgeable reader would call knowledge, and its questions are answerable only by someone who read it.
- No text ends mid-sentence anywhere.
- Day N recaps day N-1 and sets up day N+1 within the same focus topic.
- The dossier fills with the learner's own words and can be shared.
- Streak, XP, review scheduling and league behaviour unchanged; typecheck and preview build green.
