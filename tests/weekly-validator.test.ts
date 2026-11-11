import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
// @ts-ignore plain ESM scripts, no type declarations
import { validateCase, validateSet, eligibleMarkets, estimateMinutes, readingWords, REQUIRED_KEYS } from '../scripts/weekly/lib/validate.mjs';
// @ts-ignore
import { caseId, localMidnightISO, toRows, toSQL } from '../scripts/weekly/lib/mapping.mjs';
// @ts-ignore
import { numberTokens } from '../scripts/weekly/lib/numbers.mjs';
// @ts-ignore
import { loadCases } from '../scripts/weekly/lib/files.mjs';

const TODAY = '2026-11-10';
const files: { file: string; data: any }[] = loadCases();
const norway = () => structuredClone(files.find(f => f.file.includes('norway'))!.data);
const duolingo = () => structuredClone(files.find(f => f.file.includes('duolingo'))!.data);
const errorsOf = (c: any, extra: object = {}) => validateCase(c, { today: TODAY, ...extra }).errors;
const has = (errors: string[], text: string) => errors.some(e => e.includes(text));

describe('the two first weekly cases', () => {
  it('are on disk, on Mondays, in two different industries', () => {
    expect(files.map(f => f.file)).toEqual(['2026-11-16-norway-grid-pause.json', '2026-11-23-duolingo-free-to-paid.json']);
    expect(files.map(f => f.data.week_start)).toEqual(['2026-11-16', '2026-11-23']);
    expect(new Set(files.map(f => f.data.market_id)).size).toBe(2);
  });
  it('validate without errors and fit about ten minutes', () => {
    for (const { file, data } of files) {
      const r = validateCase(data, { today: TODAY, filename: file });
      expect(r.errors, file).toEqual([]);
      expect(r.stats.total, file).toBeGreaterThanOrEqual(8);
      expect(r.stats.total, file).toBeLessThanOrEqual(12);
    }
    expect(validateSet(files, { today: TODAY }).setErrors).toEqual([]);
  });
  it('have every reported fact checked twice, with evidence', () => {
    for (const { data } of files) {
      for (const f of data.facts.filter((x: any) => x.kind === 'reported')) {
        expect(f.verified.map((v: any) => v.pass).sort(), f.id).toEqual([1, 2]);
        for (const v of f.verified) expect(v.evidence.length, f.id).toBeGreaterThan(8);
      }
    }
  });
  it('give the model answer other defensible answers', () => {
    for (const { data } of files) expect(data.model_answer.alternatives.length).toBeGreaterThanOrEqual(2);
  });
});

describe('the validator refuses what must not publish', () => {
  it('a figure that is in no fact', () => {
    const c = norway();
    c.brief[3] = c.brief[3].replace('800 MW', '810 MW');
    expect(has(errorsOf(c), 'figures with no matching fact')).toBe(true);
  });
  it('a figure whose unit changed', () => {
    const c = duolingo();
    c.brief[0] = c.brief[0].replace('up 29%', 'up 29M');
    expect(has(errorsOf(c), '29M')).toBe(true);
  });
  it('a derived figure that does not recompute', () => {
    const c = norway();
    c.facts.find((f: any) => f.id === 'share_all').value = 130;
    expect(has(errorsOf(c), 'formula gives')).toBe(true);
  });
  it('a derived display that disagrees with the arithmetic', () => {
    const c = duolingo();
    c.facts.find((f: any) => f.id === 'bpd26').display = '$4.78';
    expect(has(errorsOf(c), 'does not match the computed')).toBe(true);
  });
  it('a reported value that disagrees with its display', () => {
    const c = duolingo();
    c.facts.find((f: any) => f.id === 'dau26').value = 46.9;
    expect(has(errorsOf(c), 'does not match display')).toBe(true);
  });
  it('a reported fact with only one check', () => {
    const c = norway();
    c.facts.find((f: any) => f.id === 'conn').verified.pop();
    expect(has(errorsOf(c), 'two passes')).toBe(true);
  });
  it('a second pass that re-reads the same source the same way', () => {
    const c = norway();
    const f = c.facts.find((x: any) => x.id === 'conn');
    f.verified[1].source_id = f.verified[0].source_id;
    expect(has(errorsOf(c), 'second pass must use a different source')).toBe(true);
  });
  it('a check with no evidence', () => {
    const c = norway();
    c.facts.find((f: any) => f.id === 'res').verified[0].evidence = '';
    expect(has(errorsOf(c), 'needs evidence')).toBe(true);
  });
  it('a fact citing a source that is not listed', () => {
    const c = norway();
    c.facts.find((f: any) => f.id === 'res').sources.push('ghost');
    expect(has(errorsOf(c), 'unknown source "ghost"')).toBe(true);
  });
  it('a formula that is not plain arithmetic', () => {
    const c = norway();
    c.facts.find((f: any) => f.id === 'all').formula = 'process.exit(1)';
    expect(errorsOf(c).some(e => e.includes('all)') && (e.includes('characters other than') || e.includes('unknown fact')))).toBe(true);
    c.facts.find((f: any) => f.id === 'all').formula = 'committed + enq; 1';
    expect(has(errorsOf(c), 'characters other than')).toBe(true);
  });
  it('time-bound wording without a date in the same paragraph', () => {
    const c = norway();
    c.brief[4] = 'Industry groups currently warn that changing the rules could weaken investor confidence.';
    expect(has(errorsOf(c), 'without an explicit date')).toBe(true);
  });
  it('unsourced attribution', () => {
    const c = duolingo();
    c.brief[2] += ' Experts say this will work.';
    expect(has(errorsOf(c), 'unsourced or placeholder wording')).toBe(true);
  });
  it('a placeholder left in the text', () => {
    const c = duolingo();
    c.common_traps[0].why += ' TODO check this.';
    expect(has(errorsOf(c), 'unsourced or placeholder wording')).toBe(true);
  });
  it('a case that is too long to do in ten minutes', () => {
    const c = norway();
    c.brief.push('Padding sentence. '.repeat(250));
    const e = errorsOf(c);
    expect(has(e, 'the learner reads')).toBe(true);
  });
  it('a case with too much time budgeted in the parts', () => {
    const c = norway();
    c.response.parts.forEach((p: any) => { p.minutes = 5; });
    expect(has(errorsOf(c), 'estimated')).toBe(true);
  });
  it('a rubric whose weights do not sum to 100', () => {
    const c = norway();
    c.rubric[0].weight = 20;
    expect(has(errorsOf(c), 'rubric weights sum to 95')).toBe(true);
  });
  it('a rubric that leaves a response part unscored', () => {
    const c = norway();
    c.rubric = c.rubric.map((r: any) => ({ ...r, part_ids: r.part_ids.filter((p: string) => p !== 'signals' && p !== 'all') })).filter((r: any) => r.part_ids.length);
    const e = errorsOf(c);
    expect(has(e, 'not covered by any rubric criterion') || has(e, 'rubric needs')).toBe(true);
  });
  it('a model answer with a single answer only', () => {
    const c = duolingo();
    c.model_answer.alternatives = c.model_answer.alternatives.slice(0, 1);
    expect(has(errorsOf(c), 'model_answer.alternatives')).toBe(true);
  });
  it('a model answer that skips a part', () => {
    const c = duolingo();
    c.model_answer.parts.pop();
    expect(has(errorsOf(c), 'no answer for part')).toBe(true);
  });
  it('a week that does not open on a Monday', () => {
    const c = norway();
    c.week_start = '2026-11-17';
    expect(has(errorsOf(c), 'not a Monday')).toBe(true);
  });
  it('a file name that does not match its week', () => {
    expect(has(errorsOf(norway(), { filename: '2026-11-23-norway.json' }), 'file name must start with the week_start')).toBe(true);
  });
  it('an industry that is not one of the 15', () => {
    const c = norway();
    c.market_id = 'banking';
    expect(has(errorsOf(c), 'not one of the 15 industries')).toBe(true);
  });
  it('sources without a date and without a reason', () => {
    const c = norway();
    delete c.sources[0].published_note;
    expect(has(errorsOf(c), 'published_note must say why')).toBe(true);
  });
  it('a source that is not https', () => {
    const c = norway();
    c.sources[1].url = 'http://example.com/x';
    expect(has(errorsOf(c), 'https URL')).toBe(true);
  });
  it('stale_after outside the window', () => {
    const c = norway();
    c.stale_after = '2027-02-01';
    expect(has(errorsOf(c), 'stale_after must be')).toBe(true);
  });
  it('a missing field', () => {
    const c = norway();
    delete c.tension;
    expect(has(errorsOf(c), 'missing field "tension"')).toBe(true);
  });
  it('the blank template', () => {
    const t = JSON.parse(readFileSync('scripts/weekly/templates/case.template.json', 'utf8'));
    expect(errorsOf(t).length).toBeGreaterThan(5);
  });
});

describe('startup cases', () => {
  const asStartup = () => {
    const c = norway();
    c.kind = 'startup';
    c.presented_by = 'Acme Grid Ltd';
    c.partner = { name: 'Acme Grid Ltd', contact: 'founder@example.com', consent_to_publish: true, reviewed_by_marketlingo: true, confidential_figures_removed: true, provided_on: '2026-11-09' };
    return c;
  };
  it('pass when the partner has consented and the final text is approved', () => {
    expect(errorsOf(asStartup())).toEqual([]);
  });
  it('need consent, review, and confidential figures removed', () => {
    for (const key of ['consent_to_publish', 'reviewed_by_marketlingo', 'confidential_figures_removed']) {
      const c = asStartup();
      c.partner[key] = false;
      expect(has(errorsOf(c), key), key).toBe(true);
    }
  });
  it('are presented by the partner, not MarketLingo', () => {
    const c = asStartup();
    c.presented_by = 'MarketLingo';
    expect(has(errorsOf(c), 'presented_by must equal partner.name')).toBe(true);
  });
  it('need a partner block at all', () => {
    const c = asStartup();
    delete c.partner;
    expect(has(errorsOf(c), 'partner object')).toBe(true);
  });
});

describe('the set of cases', () => {
  const wrap = (c: any, file: string) => ({ file, data: c });
  it('allows one case a week', () => {
    const a = norway();
    const b = duolingo();
    b.week_start = a.week_start;
    const { setErrors } = validateSet([wrap(a, '2026-11-16-a.json'), wrap(b, '2026-11-16-b.json')], { today: TODAY });
    expect(setErrors.some(e => e.includes('both for 2026-11-16'))).toBe(true);
  });
  it('keeps an industry out for four weeks', () => {
    const a = norway();
    const b = norway();
    b.week_start = '2026-12-14'; // 28 days later is allowed
    expect(validateSet([wrap(a, '2026-11-16-a.json'), wrap(b, '2026-12-14-b.json')], { today: TODAY }).setErrors).toEqual([]);
    b.week_start = '2026-12-07'; // 21 days later is not
    expect(validateSet([wrap(a, '2026-11-16-a.json'), wrap(b, '2026-12-07-b.json')], { today: TODAY }).setErrors.some(e => e.includes('repeats "cleanenergy"'))).toBe(true);
  });
  it('lists the industries still free for a week', () => {
    const free = eligibleMarkets(files, '2026-11-30');
    expect(free).not.toContain('cleanenergy');
    expect(free).not.toContain('ai');
    expect(free).toContain('fintech');
    expect(eligibleMarkets(files, '2026-12-21')).toContain('cleanenergy');
  });
  it('reports the next Monday from the command line', () => {
    const run = (today: string) => JSON.parse(execFileSync(process.execPath, ['scripts/weekly/rotation.mjs', '--today', today], { encoding: 'utf8' }));
    expect(run('2026-11-10')).toMatchObject({ target_week_start: '2026-11-16', already_written: true });
    expect(run('2026-11-13')).toMatchObject({ target_week_start: '2026-11-16', already_written: true });
    const next = run('2026-11-27');
    expect(next).toMatchObject({ target_week_start: '2026-11-30', already_written: false });
    expect(next.eligible_markets).not.toContain('ai');
    // On a Monday the target is the Monday after, never today.
    expect(run('2026-11-16').target_week_start).toBe('2026-11-23');
  });
});

describe('figure tracing reads numbers the way a learner does', () => {
  it('ignores dates and joined units', () => {
    expect(numberTokens('On Monday, November 9, 2026 the 420-kV grid').map((t: any) => t.raw)).toEqual(['420 kV']);
    expect(numberTokens('August 1, 2027 and 2027-08-01')).toEqual([]);
  });
  it('treats million and M alike, and keeps % and $ apart from the number', () => {
    const [a] = numberTokens('$316.1 million');
    const [b] = numberTokens('$316.1M');
    expect(a.core).toBe(b.core);
    expect(a.unit).toBe(b.unit);
    expect(numberTokens('29%')[0].unit).toBe('%');
  });
  it('counts what a learner reads, and the budget adds the parts', () => {
    const c = norway();
    expect(readingWords(c)).toBeGreaterThan(350);
    const m = estimateMinutes(c);
    expect(m.doing).toBe(8.5);
    expect(m.total).toBeCloseTo(m.reading + m.doing, 1);
  });
});

describe('the database mapping', () => {
  it('gives a week the same id every time, and different weeks different ids', () => {
    expect(caseId('2026-11-16')).toBe(caseId('2026-11-16'));
    expect(caseId('2026-11-16')).not.toBe(caseId('2026-11-23'));
    expect(caseId('2026-11-16')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it('opens at Pacific midnight, through a daylight-saving change', () => {
    expect(localMidnightISO('2026-11-16')).toBe('2026-11-16T08:00:00.000Z');
    expect(localMidnightISO('2026-07-06')).toBe('2026-07-06T07:00:00.000Z');
    // The week of October 26 opens on summer time and closes on winter time.
    const rows = toRows({ ...norway(), week_start: '2026-10-26' });
    expect(rows.weekly_case.opens_at).toBe('2026-10-26T07:00:00.000Z');
    expect(rows.weekly_case.closes_at).toBe('2026-11-02T08:00:00.000Z');
  });
  it('keeps the rubric and the model answer out of the learner-facing row', () => {
    const { weekly_case, scoring } = toRows(norway());
    const visible = JSON.stringify(weekly_case);
    for (const secret of ['rubric', 'model_answer', 'common_traps', '"facts"', 'excellent', 'alternatives']) expect(visible).not.toContain(secret);
    expect(Object.keys(scoring).sort()).toEqual(['case_id', 'common_traps', 'facts', 'model_answer', 'rubric', 'stale_after', 'time_sensitive']);
    expect(scoring.case_id).toBe(weekly_case.id);
  });
  it('writes idempotent SQL that survives apostrophes', () => {
    const c = norway();
    c.title = "Norway's Pause";
    const sql = toSQL(c);
    expect(sql).toContain("'Norway''s Pause'");
    expect(sql.match(/ON CONFLICT/g)).toHaveLength(2);
    expect(sql).toContain('INSERT INTO public.weekly_cases');
    expect(sql).toContain('INSERT INTO public.weekly_case_scoring');
    expect(sql.match(/\$wc\$/g)!.length % 2).toBe(0);
  });
  it('refuses JSON that would break the quote tag', () => {
    const c = norway();
    c.hook = 'contains $wc$ tag';
    expect(() => toSQL(c)).toThrow('$wc$');
  });
  it('is up to date: the committed export matches the cases on disk', () => {
    const sql = readFileSync('scripts/weekly/export/weekly_cases.generated.sql', 'utf8');
    for (const { data } of files) expect(sql).toContain(toSQL(data));
    const json = JSON.parse(readFileSync('scripts/weekly/export/weekly_cases.generated.json', 'utf8'));
    expect(json).toEqual(files.map(f => JSON.parse(JSON.stringify(toRows(f.data)))));
  });
});

describe('the schema file', () => {
  it('lists the same required fields as the validator', () => {
    const schema = JSON.parse(readFileSync('scripts/weekly/schema/weekly_case.schema.json', 'utf8'));
    expect([...schema.required].sort()).toEqual([...REQUIRED_KEYS].sort());
  });
});

describe('the playbook', () => {
  const playbook = readFileSync('scripts/weekly/PLAYBOOK.md', 'utf8');
  it('states the rules the pipeline enforces', () => {
    for (const phrase of ['Berkeley consulting club', 'No single right answer', 'Second pass', 'Failure path', 'Startup-submitted cases', '28 days', 'upcoming Monday', 'SendUserMessage']) {
      expect(playbook, phrase).toContain(phrase);
    }
  });
  it('names commands that exist', () => {
    for (const cmd of ['validate.mjs', 'export.mjs', 'rotation.mjs']) {
      expect(playbook).toContain(cmd);
      expect(() => readFileSync(`scripts/weekly/${cmd}`, 'utf8')).not.toThrow();
    }
  });
  it('is the same procedure the scheduled prompt starts', () => {
    const prompt = readFileSync('scripts/weekly/SCHEDULED_PROMPT.md', 'utf8');
    expect(prompt).toContain('scripts/weekly/PLAYBOOK.md');
    expect(prompt).toContain('rotation.mjs');
  });
});
