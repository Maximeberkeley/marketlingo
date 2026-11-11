# Startup case intake

A startup shares a real challenge. MarketLingo turns it into a Weekly Case that students solve, and the startup reviews a few selected answers. Fill this in and send it to MarketLingo. Nothing is published until you approve the final text.

**Please do not include anything confidential.** Every number in a case is public to every learner. If a figure is sensitive, give a rounded range or a clearly labelled illustrative figure, and tell us which it is.

## 1. About you

- Company name:
- What it does, in one sentence:
- Industry (pick the closest): aerospace, neuroscience, ai, fintech, ev, biotech, cleanenergy, agtech, climatetech, cybersecurity, spacetech, robotics, healthtech, logistics, web3
- Contact name and email:
- Public links (website, a press article, a filing, a public dashboard):

## 2. The challenge

- The decision you face, as a question that starts with "What would you do" or "Should we":
- Why it is hard: what pulls against what? (for example growth against margin, speed against safety)
- What you have already tried or ruled out, and why:
- The decision deadline, if any:

## 3. The numbers

List every figure you want students to see, with where it comes from. We can only use numbers we can trace.

| Figure | What it measures | Date | Source (public link, or "provided by the company") | OK to publish? |
|---|---|---|---|---|
| | | | | |

Mark each figure as one of: **public** (a link anyone can open), **provided** (from you, we will label it "provided by the company"), or **illustrative** (rounded or changed, we will label it).

## 4. What a good answer looks like

- Two or three things a strong answer would consider:
- One mistake you see people make:
- Is there more than one defensible answer? Describe the main alternatives.

## 5. Consent

- [ ] We agree MarketLingo may publish this case, with our name as "presented by", for one week and keep it in the archive.
- [ ] We confirm the figures above are not confidential, or are marked illustrative.
- [ ] We would like to review the final text before it goes live.
- [ ] We can review up to a few selected answers, or share a short note after the week closes (optional).

Name and date:

---

## For MarketLingo (not for the startup)

1. Copy `templates/case.template.json` to `cases/YYYY-MM-DD-<slug>.json`, set `"kind": "startup"` and fill the `partner` block (`consent_to_publish`, `reviewed_by_marketlingo`, `confidential_figures_removed` must all be true only after the startup has approved the final text).
2. Put every startup-provided figure in the fact ledger with a source of tier `partner`, `published` set to the date they sent it, and the link to their message or document. Two verification passes still apply: the second pass is a different person on the MarketLingo side re-reading the startup's document.
3. Rewrite their material to the same bar as any other case (see PLAYBOOK.md): a clear tension, numbers that force a trade-off, no single right answer, a sharp model answer.
4. Run `node scripts/weekly/validate.mjs`, send the startup the rendered text for approval, then open the PR.
