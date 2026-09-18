# Curriculum rewrite — one concept per day, written to the exemplar contract

The exemplar lessons are in place. This rewrites generated lessons so every day looks like them: one idea, taught properly, with a real case and real sources — and a check that can only be answered by someone who read it.

## Scope: pilot first, then scale

1. **Pilot — AI, days 1 to 14.** Generate with the new contract into the existing lesson tables, tagged so they win over the old rows for those days. Read them; red-pen; adjust the contract.
2. **Then AI days 15 to 180, then aerospace**, same job, same contract.
3. Other markets afterwards, one market per run, so a bad batch never spreads.

Old rows are left in place, not deleted — the reader already shows the newest authored lesson for a day, so a rollback is just removing the new batch.

## What changes in the contract

Today's generator asks for six slides "under 280 / 450 characters" each, which is exactly why content is thin and cut. The new contract per day:

- **One concept**, named in the title, defined in plain words. No six-angle skim.
- **Six beats, not six topics**: recap of yesterday, the concept, the mechanism cause by cause, one named company with real figures and the outcome, the check, the takeaway plus tomorrow's hook.
- **No character ceilings.** Each beat runs as long as it needs (roughly 400 to 1,200 characters), and nothing is trimmed on write.
- **Mandatory**: three real learning objectives, a recap bridge, a next preview, a key takeaway, a named case with figures, and sources with working links. A day missing any of these is rejected and regenerated rather than saved thin.
- **Every seventh day consolidates** — no new concept, retrieval and synthesis only.
- **Six-month sequence** per market: foundations → how value and money move → players and power → economics and numbers → regulation and risk → frontier and gaps.

## Quality gate before a market ships

- Automated: reject any day with a missing objective, no case figures, no sources, a body under ~350 characters, or text ending mid-sentence.
- Human: read a sample of ten days per market. Aerospace we red-pen ourselves; AI and fintech need a borrowed expert before that market's batch is allowed to stand.

## Technical notes

- Rewrite the day-lesson prompt in `supabase/functions/generate-curriculum/index.ts`: drop the 280/450 limits and the `substring(0, 450)` write truncation, restructure the slide schema to the six named beats, make objectives/recap/preview/takeaway/case/sources required, and add a validator that retries a day once before recording it as failed.
- Reuse `curriculum_generation_jobs` and `batch-generate-all` for batching and progress; add a `contract: 'v2'` marker in `stacks.metadata` and an `exemplar-v2`-style day tag so v2 rows are identifiable and removable.
- Consolidation days generated from the six concepts of that week, not fresh material.
- Keep `generate-content`'s ceilings aligned with the same contract so one-off regeneration doesn't reintroduce stubs.
- Sequencer, reading view, deep layer, checks, day logic, league, notes and review scheduling all unchanged — they already consume this shape.

## Validation

- Pilot days 1 to 14 in AI: no truncated text anywhere, day N recaps N-1 and hooks N+1, day 7 introduces nothing new, every day has three objectives and a sourced case.
- The check on each day is answerable only from that day's own material.
- After the batch: lesson completion rate and next-day return rate on the new days do not fall versus the old ones.
