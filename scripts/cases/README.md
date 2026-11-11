# Hand-written Deep Cases

The daily path is lesson, then Daily Arena, then three Deep Cases. This folder holds the cases' source and the
builder that turns them into one migration per industry.

- **Table:** `public.deep_cases (market_id, day, slot 1-3, content jsonb)`. Each migration creates it if
  needed and upserts on `(market_id, day, slot)`, so it is safe to run again.
- **App:**
  - `mobile/hooks/useAuthoredCase.ts` loads the row for the learner's course day and case number.
  - `mobile/lesson-kit/case/authoredCase.ts` turns the row into the four stages: brief, evidence, numbers,
    and the call written for the learner's goal. `join_industry` reads `career`; a missing goal falls back to
    `curiosity`.
  - When no valid row exists, the app builds a case from lessons instead (`buildCase`).
- **XP:** A case pays 40, 30, 20 or 10 by grade, and counts in the race and the crown.

## Status (November 10, 2026)

| Market | Migration | Days done | Cases |
|---|---|---|---|
| aerospace | `0038_aerospace_deep_cases.sql` | 1-30 | 90 of 90 |
| ai | `0039_ai_deep_cases.sql` | 1-30 | 90 of 90 |
| biotech | `0040_biotech_deep_cases.sql` | 1-30 | 90 of 90 |
| fintech | `0041_fintech_deep_cases.sql` | 1-30 | 90 of 90 |
| neuroscience | `0042_neuroscience_deep_cases.sql` | 1-30 | 90 of 90 |
| cleanenergy | `0049_cleanenergy_deep_cases.sql` | 1-30 | 90 of 90 |
| climatetech | `0050_climatetech_deep_cases.sql` | 1-30 | 90 of 90 |
| healthtech | `0047_healthtech_deep_cases.sql` | 1-30 | 90 of 90 |
| robotics | `0053_robotics_deep_cases.sql` | 1-15 | 45 of 90 |
| spacetech | `0054_spacetech_deep_cases.sql` | 1-15 | 45 of 90 |
| ev | `0051_ev_deep_cases.sql` | 1-30 | 90 of 90 |
| web3 | `0055_web3_deep_cases.sql` | 1-15 | 45 of 90 |
| cybersecurity | `0046_cybersecurity_deep_cases.sql` | 1-30 | 90 of 90 |
| agtech | `0048_agtech_deep_cases.sql` | 1-15 | 45 of 90 |
| logistics | `0052_logistics_deep_cases.sql` | 1-15 | 45 of 90 |

The goal is days 1-30, three cases a day, for all 15 industries: 1,350 cases in all. 1,125 are done.

Known to go stale: biotech day 13 says the FDA decision on povetacicept is pending (due by November 30,
2026). Update that case once the FDA rules.

The agreed order:
1. aerospace
2. ai, biotech, fintech, neuroscience
3. agtech, cleanenergy, climatetech, cybersecurity, ev, healthtech, logistics, robotics, spacetech, web3

Migration numbers are pre-assigned, so batches can run in parallel without colliding. Each journal entry keeps its own idx.

| idx | market | idx | market | idx | market |
|---|---|---|---|---|---|
| 0039 | ai | 0044 | cleanenergy | 0049 | logistics |
| 0040 | biotech | 0045 | climatetech | 0050 | robotics |
| 0041 | fintech | 0046 | cybersecurity | 0051 | spacetech |
| 0042 | neuroscience | 0047 | ev | 0052 | web3 |
| 0043 | agtech | 0048 | healthtech | | |

Name each file `00NN_<market>_deep_cases.sql`. If another migration lands first, take the next free number
and update this table.

## Where the lessons are

Every case is built on the lesson of its day, so read the lesson first.

- `scripts/cases/lessons/<market>.md` is a digest of the hand-written lessons exported from the database:
  - each day's opening, cards, checks with their answers, rule, takeaway, and the lens card for each goal;
  - every source URL, with its label at the bottom.
  - It covers days 1-30 for aerospace, ai, biotech, fintech and neuroscience, and days 1-5 for the ten newer
    industries.
- For days 6-30 of the ten newer industries, read the lesson source directly:
  `scripts/lessons/<market>/days_*.py`.

## What a day needs

Each day has three cases.

- **Slot 1, apply.** A fresh, real situation that uses the day's idea, verified on the web for this case. Use
  a different story from the lesson's own opening. Never write a fact from memory.
- **Slot 2, connect.** Ties today's lesson to an earlier day, with both named in the kicker, for example
  "Connect day 3 and day 15: ...". Day 1 links two ideas from its own lesson.
- **Slot 3, decide.** A decision built on the lesson's facts. Label scenarios honestly ("You run...").

Each case has these parts. `scripts/cases/aerospace/days_*.py` shows the exact shape.

- `title`, and `lessonTitle` (the day's lesson title).
- `brief`:
  - `headline`: at most 4 sentences and 260 characters;
  - `kicker`: 1 sentence, at most 80 characters;
  - `fullText`: paragraphs separated by `\n\n`;
  - `sources`: keys into `SRC`.
- `evidence`: one of `sortSignal`, `spotFake`, `buildChain`, `multipleChoice` or `faceOff`. Vary the kind
  across the three cases of a day.
- `numbers`: a `numberSense` dial with `min`, `max`, `value` and `unit`.
  - The value must not sit near the minimum, where an untouched dial would already count as right.
  - Avoid the exact middle.
  - Values of 1,000 or more need `K`, `M` or `B` units.
- `calls`: one entry for each of `career`, `invest`, `build_startup` and `curiosity`. Each entry has:
  - a `theCall`, with:
    - `situation`: at most 2 sentences and 150 characters;
    - `prompt`;
    - exactly 3 `options`, each at most 72 characters, with the right one not clearly the longest;
    - 3 `consequences`, one per option, each a single sentence of at most 90 characters;
    - `explanation`;
  - `pro`, `mistake` and `model`, each at most 2 sentences and 230 characters;
  - optional `sources`.
  - Write `correctIndex: 0`. The builder rotates the stored position, and the app shuffles the display.

House style:
- Short, plain sentences.
- No em or en dashes.
- No hype words; the builder warns on the list in `scripts/lessons/build.py`.
- Every figure sourced.
- The four goal calls must ask genuinely different questions about the same situation.

## Build, check, ship

```
# check only
python3 scripts/cases/build.py <market> scripts/cases/<market>/days_*.py
# write the migration
python3 scripts/cases/build.py <market> scripts/cases/<market>/days_*.py --out drizzle/migrations/00NN_<market>_deep_cases.sql
```

- **Errors:** must be zero. The builder replays the app's text limits through `scripts/lessons/fitcheck.mjs`,
  which needs `esbuild`.
- **Warnings:** fix them where reasonable, such as unbalanced option lengths or a flagged word.
- **No shared files.** Do not edit `drizzle/migrations/meta/_journal.json`; the aerospace session adds the
  journal entries for every market later, so parallel sessions never conflict.
- **Journal:** entries 0038-0042 exist. A coordinator adds 0043-0052 when those files land.
- **Dotted names** such as Crypto.com and "Bank, N.A." are safe in case text since PR #84.
- **Tests find your migration automatically.** `tests/deep-cases.test.ts` checks every
  `00NN_<market>_deep_cases.sql`: three cases per covered day, four goal calls each, that every case plays,
  and that the migration matches its source files. Ship whole days only.
- **Fresh clone setup:** run `(cd scripts/lessons && npm install --no-save esbuild@0.25.12)` so the builder's
  fitcheck runs. In a scratch folder, also install `vitest@3.2.4` and `@electric-sql/pglite`.
- **Database check:** `node scripts/cases/pgcheck.mjs drizzle/migrations/00NN_<market>_deep_cases.sql`. It
  needs `@electric-sql/pglite` installed, and applies the migration twice.
- **Tests:** `vitest run tests/deep-cases.test.ts` with `{ test: { environment: 'node', include:
  ['tests/**/*.test.ts'] } }`. Run the full suite before a PR.
- **Commit trailers:**
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: <session URL>
  ```
- **PR body:** end with "🤖 Generated with [Claude Code](https://claude.com/claude-code)", then the session
  URL.
- **Merge:** open the PR and merge it through `gh api`. Never commit `mobile/package-lock.json`.
- **Loader data:** after rebuilding any migration, run `python3 scripts/cases/export_loader.py`. It writes
  the same rows into `supabase/functions/load-deep-cases/data/`, and `tests/deep-cases-loader.test.ts`
  fails if you forget.
- **After each merge:** tell the user to call the `load-deep-cases` function again (see below).

## Loading into Supabase

Lovable runs schema changes and data separately, and it cannot pass a 500 KB data file through its
tools. So the cases ship inside an edge function:

1. **Once:** create the table with a Lovable migration from `scripts/cases/supabase/deep_cases_schema.sql`.
2. **Every time cases change:** have Lovable deploy `load-deep-cases` and call it with POST.
   - A GET call previews what would change.
   - It upserts only rows whose content fingerprint (`src:` tag) differs, so calling it twice is safe.
   - It answers with the number of cases per market and any day that does not hold three cases.
3. **Without Lovable:** the `drizzle/migrations/00NN_<market>_deep_cases.sql` files still work as they
   are in the Supabase SQL editor.

## Aerospace days 19-24, research already verified

These slot 1 stories (export controls) were checked on November 10, 2026, and are now written.

- **Day 19 (information as an export).** J. Reece Roth, a University of Tennessee professor.
  - On a 2004 US Air Force plasma actuator contract for drone wings, he let graduate students from China and
    Iran access controlled data. The contract barred sharing with foreign nationals.
  - In 2006 he took a laptop with the plans on a lecture tour in China, despite warnings from the export
    control officer.
  - He was sentenced in 2009 to 4 years on 18 counts, including Arms Export Control Act violations.
  - Source: https://www.scientificamerican.com/blog/news-blog/tennessee-physicist-sentenced-to-4-2009-07-03
- **Day 20 (what a violation costs).** FLIR Systems, announced April 25, 2018.
  - $30 million civil penalty, with $15 million suspended if spent on remedial compliance.
  - Foreign and dual-national employees accessed ITAR data on its computer system, and it lacked controls
    and citizenship information.
  - It had to appoint a special compliance officer for at least 3 years.
  - Source: https://www.williamsmullen.com/news/state-department-announces-another-major-itar-enforcement-case-and-30-million-penalty
- **Day 21 (one part, one veto).** Two options:
  - The US suspended export licenses to COMAC in May 2025, freezing deliveries of the LEAP-1C (GE and
    Safran). It lifted the suspensions on July 3, 2025, amid easing tensions and concessions on rare earths.
    The C919 also relies on Honeywell, Collins and Parker systems; 19 were flying in late May 2025.
    Sources: https://www.caixinglobal.com/2025-06-03/us-export-curbs-threaten-chinas-homegrown-jet-ambitions-102326720.html
    and https://ground.news/article/us-lifts-license-suspensions-for-ge-jet-engines-to-chinas-comac
  - Or Spain's 2006 sale of 12 EADS-CASA transport and patrol aircraft to Venezuela, part of a $2 billion
    deal. The US blocked it over US engines and electronics, and CASA looked to French suppliers for
    substitute technology. Source: https://www.aljazeera.com/news/2006/1/13/us-blocks-aircraft-sale-to-venezuela
- **Day 22 (the numbers).** Honeywell, May 2021.
  - $13 million penalty, with $5 million suspended for compliance.
  - 71 ITAR-controlled drawings exported between July 2011 and October 2015, mostly to China, via a file
    exchange platform. They covered parts for the F-35, F-22, B-1B, Abrams and Tomahawk.
  - Honeywell voluntarily disclosed in 2016. That works out to about $183,000 per drawing.
  - Source: https://www.twz.com/40436/honeywell-fined-millions-over-exporting-sensitive-info-on-f-22-f-35-and-more-to-china
- **Day 23 (who counts as a US person).** The DOJ sued SpaceX on August 24, 2023.
  - It alleged that SpaceX said "export control laws" let it hire only citizens and green card holders, and
    that it discouraged asylees and refugees from applying.
  - The DOJ said export laws impose no such limit, and that asylees and refugees stand on equal footing
    with citizens and green card holders.
  - The case was paused after SpaceX won an injunction, and the DOJ dropped it in early 2025.
  - Sources: https://www.justice.gov/archives/opa/pr/justice-department-sues-spacex-discriminating-against-asylees-and-refugees-hiring
    and https://news.bloomberglaw.com/daily-labor-report/doj-suit-over-alleged-spacex-immigrant-hiring-bias-dropped
  - Keep this case factual. It is about the rules, never about the learner's own status.
- **Day 24 (designing the US out).** The EU's SAFE loans, approved in May 2025.
  - €150 billion.
  - At least 65% of a weapon's value must come from the EU, EEA/EFTA or Ukraine.
  - The EU wants European design authority over foreign components, so a third country cannot block use or
    re-export.
  - Source: https://www.euronews.com/my-europe/2025/05/21/everything-you-need-to-know-about-safe-the-eus-150bn-defence-instrument
  - The CASA case also fits here, as a design-out.

Days 19-30 are written and shipped. Days 25-30 use TransDigm, the Airbus panel cut, AOG Technics and
Lufthansa's parked 787s; their sources are in `aerospace/days_25_27.py` and `aerospace/days_28_30.py`.
