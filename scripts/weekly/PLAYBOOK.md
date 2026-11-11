# Weekly Case playbook

The exact procedure an unattended agent follows each week to write, check, publish and announce the next Weekly Case. A person can follow it too. The scheduled-task prompt that starts it is in `SCHEDULED_PROMPT.md`.

## What a Weekly Case is

A short business problem on a hot topic, about ten minutes: read a one-page brief and two small exhibits, then write a four-part strategy. It needs more independent thinking than a Deep Case, because there is no multiple choice and no single right answer. Learners are scored against a rubric with AI-assisted feedback, ranked against their friends, and earn XP. It opens Monday 00:00 Pacific and closes the next Monday 00:00 Pacific. The model answer is shown after it closes.

One case per week, one industry per case, and an industry may not repeat within 28 days.

## Timing

The run starts Friday morning Pacific. It writes the case for the **upcoming Monday**. If that Monday already has a case file, the run does nothing about authoring and sends no message. This keeps a small buffer of finished cases (the first two are already written) and means a human-written or startup case always wins.

## The quality bar

A case is top tier when a member of a Berkeley consulting club would respect it. Every case must pass all of these. If any fails, rework it or drop the topic.

1. **A real decision.** The learner is asked to choose and defend, in a stated role, not to summarise the news.
2. **A clear tension.** Two things that both matter pull against each other (growth against margin, speed against safety, fairness against speed). State it in the `tension` field in one sentence.
3. **Numbers that force a trade-off.** At least four distinct figures, at least one of them a ratio or comparison the learner has to read, and at least one derived figure the case itself works out. Numbers are never decoration.
4. **No single right answer.** The model answer lists at least two other defensible answers and says when each would be better. If one option plainly dominates, change the case.
5. **Everything is real and checkable.** Every figure traces to a source and was checked twice. If a figure cannot be confirmed, it goes out of the case, not into it with a hedge.
6. **Fair and neutral.** No politics of the day, no election questions, no tragedies as hooks, no named private individuals, no advice to buy or sell a security. Describe what companies and governments said and did, attributed.
7. **Plain language.** No jargon without a short explanation. No hype words. Short paragraphs. The brief is facts; the question is the only place with a role and a verb.
8. **Ten minutes.** The validator checks the budget (350 to 900 words to read, 8 to 12 minutes in total).
9. **A sharp model answer.** It commits to a recommendation, uses the numbers, names who loses, and sets a trigger to change course. It is the answer a strong student could actually write in the word limits, not a treatise.
10. **Durable for the week.** Pick something that will still be accurate and interesting for about two weeks. Anything time-bound is dated in the text and listed under `time_sensitive`.

## Procedure

### 0. Set up

1. Make sure the repo `Maximeberkeley/marketlingo` is checked out and up to date on `main`. If it is not present, attach it with the add-repo tool and clone it.
2. `node scripts/weekly/rotation.mjs` prints `target_week_start`, `already_written`, and `eligible_markets`.
   - If `already_written` is true, go to step 0b, then stop.
   - Otherwise note `target_week_start` and the eligible industries.
3. `git checkout -b weekly-case-<target_week_start>`.

### 0b. Freshness check on cases already written

For the case opening this coming Monday, and the case that opened last Monday, read `time_sensitive[].check_again_by` and `stale_after`. If either date is on or before today, re-check those claims against their sources. If anything changed in a way that alters what a learner should think or do, edit the case (update `as_of`, the text, the facts and the model answer), re-run validation, and open a PR titled `Refresh weekly case <week_start>`. Tell the user what changed. Do not change the question of a case that has already opened; only fix errors of fact and add a dated note to the brief.

### 1. Choose the topic

1. Look for news from the last 7 days. Use web search in extended mode. Search the 15 industries: aerospace, neuroscience, ai, fintech, ev, biotech, cleanenergy, agtech, climatetech, cybersecurity, spacetech, robotics, healthtech, logistics, web3. Search at least eight different queries, such as company earnings, regulator decisions, funding rounds and acquisitions, product or pricing changes, grid or supply-chain rules, recalls, launches and failures. Do not rely on one roundup site; open the primary document where one exists (a filing, a regulator or government statement, a company letter).
2. List five candidates. For each, write the decision a student would make, the tension, the figures available, the primary source, and the industry.
3. Reject a candidate if: the key figures are only in one secondary article; it needs a number you cannot verify; it is mainly a political or legal fight; it depends on someone's private data; it will be stale in a week; it is a pure stock-price move; the answer is obvious.
4. Prefer candidates whose industry is in `eligible_markets`, and among those the industry used least recently. A week with one clearly great topic in an ineligible industry is not an exception: pick the second best.
5. Prefer topics where the learner must make a trade-off with real constraints (allocation, pricing, sequencing, risk, build or buy), where a student can reason from fundamentals without insider knowledge, and where the decision is genuinely open.
6. Record the five candidates and why each was kept or dropped. They go in the PR description.

If no candidate clears the bar, go to **Failure path**. Do not publish a weak case to fill the week.

If a file named `scripts/weekly/incoming/approved-*.md` exists (a completed startup intake the user has approved), use it for the target week instead of choosing a topic, following the startup rules at the end of this file.

### 2. Research and the fact ledger

1. Open the primary sources. Take the figures from tables and quotes, not from summaries. Where a fetch tool returns a summary, ask it to quote the exact row or sentence and keep that text.
2. For each figure you will use, add a fact to the ledger (`facts`) with: an id, a label, the exact `display` string, a numeric `value`, the `as_of` date it describes, and its sources.
3. Reported facts need two passes (see step 5). Derived facts (ratios, sums, changes) are not typed in: give the `formula`, the `inputs`, a `scale` (100 for a percentage), the number of `decimals`, and the `value`. The validator recomputes them. Derived ratios must be labelled as the case's own arithmetic, not company-reported.
4. Keep what a company has not said as an explicit gap. If a company has not given a conversion rate, the case says so and a trap warns against inventing one.
5. A figure that is "a little over" or "under" something is recorded with the real display ("25,000 MW") and the brief keeps the qualifier.

### 3. Write the case

Start from `templates/case.template.json`. The schema is in `schema/weekly_case.schema.json`; the full rules are enforced by the validator. File name: `cases/<week_start>-<short-slug>.json`.

- **brief**: 3 to 5 short paragraphs. What happened, why it matters, the numbers, what the actors have said they might do, who is affected. Put "As of <Month D, YYYY>" in any paragraph that uses time words such as now, currently or pending. Attribute claims ("reporting by X says").
- **exhibits**: one or two small tables. Exhibit 1 is the raw numbers; exhibit 2 is the ratios or comparison that make the tension visible, marked as the case's own arithmetic.
- **question**: a role, the decision, the constraint, in two or three sentences.
- **response.parts**: three or four parts with ids, prompts, a word limit and minutes. The usual shape is: read the numbers, make the call, test and guardrail or who loses, biggest risk or how you would know.
- **rubric**: four or five criteria, weights summing to 100, each with what it measures, what excellent looks like and what weak looks like, concrete enough that a model or a person can score against it. One criterion covers use of numbers across all parts.
- **model_answer**: a summary, one text per part, at least two alternatives each with when it would be better, and at least three key fact ids. At most 450 words in total.
- **common_traps**: three to five. At least one is about misusing the numbers, one about answering from the wrong role, and one about skipping the trade-off.
- **sources**: every source used, with tier (primary, secondary, partner), publication date or a note why it is unknown, and the date you accessed it.
- **time_sensitive**: every claim that could change within two weeks, with the date to check again. **stale_after**: 14 days after `week_start` unless something is expected sooner.

### 4. Validate

Run `node scripts/weekly/validate.mjs`. Fix every error. Read every warning and either fix it or be able to explain it in the PR. Common errors and what they mean:

- *figures with no matching fact*: a number in the text is not in the ledger, or its unit differs ("29M" against a fact "29%"). Add the fact or fix the text.
- *must be verified in two passes*: a reported fact has no second check yet. Do step 5.
- *formula gives X but value says Y*: fix the value, or the formula, or the inputs.
- *time-bound wording without an explicit date*: add the date in that paragraph.
- *estimated N minutes*: cut words or part minutes.

### 5. Second pass: an independent recheck of every figure

The author must not grade their own numbers.

1. Prepare a verification sheet with only: each reported fact's id, display, label, and the URLs of its sources. Leave out the author's evidence quotes.
2. Spawn a fresh verifier agent with the Agent tool and give it only that sheet and this instruction: "For each fact, open the listed source yourself and find the figure. Quote the exact row or sentence you found. Report MATCH, MISMATCH (with what the source says) or NOT FOUND. Do not guess or compute. Be literal about units and dates."
3. If the Agent tool is not available, do the pass yourself in a clean way: for each fact, open the source again with a different prompt that asks for a verbatim quote, and do not look at your earlier notes until you have the quote.
4. Compare. For every MATCH, the verifier's quote becomes `verified[1]` (pass 2) with a `second_source` or `verbatim_refetch` method. For a MISMATCH, correct the fact and everything derived from it, then re-run steps 4 and 5 for that fact. For NOT FOUND, remove the figure from the case.
5. Finish with a reading pass as the consulting-club member: would they say the answer is obvious? is any number decorative? is any claim stronger than its source? Fix what fails.

### 6. Publish

1. `node scripts/weekly/export.mjs --write` regenerates `export/weekly_cases.generated.sql` and `.json`, and the bundle `supabase/functions/load-weekly-cases/data/index.ts`. Commit the case file and all three generated files (a test fails if the bundle is out of date).
2. Run the repository's tests (`npm test`, which is `vitest run`; run `npm ci` first if dependencies are not installed) and make sure nothing fails.
3. Open a pull request into `main` with `gh api repos/Maximeberkeley/marketlingo/pulls -X POST --input file.json`. Title: `Weekly case <week_start>: <title>`. Body: the five candidates and why each was kept or dropped; the tension; the validator output; the list of facts that rest on a single secondary source; the `time_sensitive` list; and the attribution line from your instructions.
4. If checks pass, merge with `gh api repos/Maximeberkeley/marketlingo/pulls/<n>/merge -X PUT -f merge_method=merge`. On a 405, wait a few seconds and retry up to three times. Do not merge a PR whose validator or tests fail.
5. Delivery to the database: merging is enough. Lovable deploys `supabase/functions/load-weekly-cases`, and a database job (`weekly-case-load`, every six hours, created by migration 0044) calls it, so the new case is inserted before its Monday without anyone running SQL. The agent cannot call the function itself (the sandbox network is allowlisted), so the notification must say "merged; the database job loads it within six hours". If the migration has not been applied yet, say the case is "merged, loading starts once migration 0044 is applied". The exported SQL in `scripts/weekly/export/` remains a manual fallback.

### 7. Notify

Send the user one short message with `SendUserMessage`, because an unattended run has no live reader of its final reply:

> **Weekly Case ready for <Mon D>:** <title> (<industry>). <One sentence on the tension.> <Number of sources, and whether any key figure rests on a single secondary source.> Merged in PR #<n>. <Loaded to the database / SQL ready, needs loading.> Veto by reverting the PR before Monday.

Send nothing when the run only found the week already covered.

### Failure path

Do not publish, and send the user one message with the reason, whenever:

- no candidate clears the quality bar;
- validation still has errors after a serious attempt;
- the second pass leaves fewer than four confirmed figures;
- a tool you need (search, fetch, GitHub) is unavailable;
- merge fails after three retries.

The message says what was tried, what blocked it, and what is needed (for example "send me a topic", "approve a startup intake", "re-run after the outage"). If the PR was opened but not merged, say so and leave it open.

## Startup-submitted cases

A partner fills in `templates/startup-intake.md`. Nothing from an intake is used until the user saves it as `scripts/weekly/incoming/approved-<company>.md`.

For such a case:

1. Set `kind` to `startup`, `presented_by` to the company name, and fill the `partner` block. `consent_to_publish`, `reviewed_by_marketlingo` and `confidential_figures_removed` must be true, which means the startup has approved the final text.
2. Every figure from the startup goes in the ledger with a source of tier `partner` and a link to their document or message. Label it in the brief as provided by the company. Public figures still need public sources.
3. Rewrite their material to the same quality bar. A startup's description of its challenge is raw material, not a finished case.
4. The second pass is a person re-reading the startup's document against each figure, since there may be no public source to fetch.
5. A startup case takes the target week even if an automatically written case already exists for it: move the other case to the next free Monday, keeping rotation intact.

## Files

| Path | What it is |
|---|---|
| `cases/` | One JSON file per week, `YYYY-MM-DD-slug.json`. |
| `schema/weekly_case.schema.json` | The structure, documented as JSON Schema. |
| `lib/validate.mjs` | The rules. `validate.mjs` runs them. |
| `lib/mapping.mjs` | The only place a case becomes database rows. |
| `export.mjs`, `export/` | Generates the idempotent SQL and JSON. |
| `rotation.mjs` | Target Monday and eligible industries. |
| `templates/` | The case skeleton and the startup intake. |
| `incoming/` | Approved startup intakes waiting to be turned into cases. |
