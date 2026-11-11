# Hand-written lessons

Lessons for Days 1–30 tagged `handwritten-v1` win over older generated stacks (`mobile/lib/handwritten.ts`).
This folder holds their source and the builder that turns them into a database migration.

## Write or edit a lesson

Each file in `<market>/` defines:

- `SRC`: sources by key, `{ 'url': ..., 'label': ... }`. Every reading card cites at least one.
- `LESSONS`: one dict per day with `day`, `facet`, `title`, `open` (the first card), `cards` (two or three
  reading cards), `checks` (two or three questions), `lenses` (one goal card per learner goal), `rule` and
  `takeaway`. See `spacetech/days_06_12.py` for the shape.

The facet must follow the syllabus arc for that day (`supabase/functions/_shared/syllabus.ts`):
definition, money, power, numbers, rules, frontier, repeating every six days.

House style: short plain sentences, no dashes, one idea per card, every figure sourced. The app shows one
sentence of a highlight, two of a card's text and one of a kicker; the build fails if anything would be cut.

## Build

```
python3 scripts/lessons/build.py spacetech scripts/lessons/spacetech/days_*.py \
  --out drizzle/migrations/0028_spacetech_handwritten_days_6_30.sql
```

Each day becomes four stacks (career, invest, build_startup, curiosity) with stable ids, so the migration is
safe to run again after an edit: stacks are updated in place and their slides replaced.
`fitcheck.mjs` needs `esbuild` (installed with the web app's dependencies).

## Load into Supabase

The migrations are too large for Lovable to paste, so the same rows also ship in edge functions. After any
lesson edit, rebuild the migration and then run:

```
python3 scripts/lessons/export_loader.py
```

It writes the data into `supabase/functions/load-handwritten-lessons[-N]/data/` (split to stay under the deploy
size limit) and registers each function in `supabase/config.toml`. Deploy each function and call it: GET
previews, POST loads only stacks whose fingerprint (`stacks.metadata.handwritten_src`) changed and replaces
their slides. Rows use `stack_type` 'LESSON' (the table's CHECK constraint rejects 'MICRO_LESSON'); the app
finds them by the MICRO_LESSON and handwritten-v1 tags.
