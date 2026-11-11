# Weekly Case: content and automation

One business case a week, on a hot topic, for the Practice tab. This folder holds the cases, the rules that decide whether a case may publish, the exporter that turns a case into database rows, and the playbook an unattended agent follows every week.

Start with `PLAYBOOK.md`. The scheduled-task prompt is in `SCHEDULED_PROMPT.md`.

```
node scripts/weekly/rotation.mjs          # the upcoming Monday, and which industries are free
node scripts/weekly/validate.mjs          # every case, plus the set (one per week, 28-day rotation)
node scripts/weekly/export.mjs --write    # validate, then write export/weekly_cases.generated.{sql,json}
```

## Database mapping

`lib/mapping.mjs` is the only place a case becomes rows. It targets two tables so a learner can never read the answer early:

| Table | Holds | Who reads it |
|---|---|---|
| `public.weekly_cases` | `id`, `week_start` (unique), `market_id`, `kind`, `presented_by`, `title`, `topic`, `status`, `opens_at`, `closes_at`, `content` (jsonb: hook, tension, disclosure, as_of, brief, exhibits, question, response parts, sources) | Learners, while the case is open |
| `public.weekly_case_scoring` | `case_id`, `rubric`, `model_answer`, `common_traps`, `facts`, `time_sensitive`, `stale_after` (jsonb) | Service role only. The scoring step uses the rubric; the app reveals the model answer after `closes_at`. |

`opens_at` is Monday 00:00 and `closes_at` the next Monday 00:00, both America/Los_Angeles. The id is a stable uuid per week, so exporting again updates the same row. If the app engine's migration names tables or columns differently, change `lib/mapping.mjs` and regenerate; the validator and the cases do not change.

## What the validator guarantees

- Structure: every field, in the right shape. `schema/weekly_case.schema.json` documents it.
- Length: 350 to 900 words to read, 8 to 12 minutes including the time budgeted for the response parts.
- Traceability: every figure the learner or the scorer can see matches a fact in the ledger. Each reported fact names its sources and has two verification passes with evidence. Derived figures are recomputed from their inputs.
- Dates: time-bound wording carries an explicit date, and the case lists what to re-check and when.
- Honesty: no "experts say" claims, no placeholders, startup cases need the partner's consent.
- Rotation: one case per week, and an industry may not repeat within 28 days.

Tests: `tests/weekly-validator.test.ts`.
