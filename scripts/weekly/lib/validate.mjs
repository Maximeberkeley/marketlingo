/**
 * Validator for Weekly Case files. A case may only publish when this returns no errors.
 *
 * What it enforces, in plain words:
 *  - Structure: every field the app and the scoring step need, in the right shape.
 *  - Length: about ten minutes (reading plus the time budgeted for the parts).
 *  - Traceability: every figure a learner can see, in prose, exhibits, rubric or model answer,
 *    matches a fact in the ledger. Every fact is sourced and was checked twice.
 *  - Derived figures are recomputed here, not trusted.
 *  - Time-bound language carries an explicit date, and the case says when to re-check it.
 *  - No "experts say" claims, no placeholders, no industry repeating within four weeks.
 */
import { KINDS, LIMITS, MARKETS, MONTHS, ROTATION_DAYS, SOURCE_TIERS, TEMPORAL_WORDS, UNSOURCED_PATTERNS } from './constants.mjs';
import { isFreeToken, numberTokens, round, tokenKey } from './numbers.mjs';

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const DATE_IN_TEXT = new RegExp(`(?:${MONTHS.join('|')})\\s+\\d{1,2},?\\s+\\d{4}|\\b\\d{4}-\\d{2}-\\d{2}\\b`);
const ID = /^[a-z][a-z0-9_]*$/;

export const REQUIRED_KEYS = [
  'schema_version', 'week_start', 'market_id', 'kind', 'presented_by', 'title', 'topic', 'hook', 'tension',
  'as_of', 'stale_after', 'disclosure', 'brief', 'exhibits', 'question', 'response', 'rubric', 'model_answer',
  'common_traps', 'sources', 'facts', 'time_sensitive',
];

const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const str = v => typeof v === 'string' && v.trim().length > 0;
const words = s => String(s).trim().split(/\s+/).filter(Boolean).length;

export function parseDate(s) {
  if (!ISO.test(s || '')) return null;
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date : null;
}
export const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);

/** Every piece of learner-visible text, with where it came from. */
export function learnerText(c) {
  const out = [];
  const push = (where, text) => { if (str(text)) out.push({ where, text }); };
  push('title', c.title); push('hook', c.hook); push('tension', c.tension); push('disclosure', c.disclosure);
  (c.brief || []).forEach((p, i) => push(`brief[${i}]`, p));
  (c.exhibits || []).forEach((e, i) => {
    push(`exhibits[${i}].title`, e.title); push(`exhibits[${i}].note`, e.note);
    (e.columns || []).forEach((cell, k) => push(`exhibits[${i}].columns[${k}]`, cell));
    (e.rows || []).forEach((row, r) => (row || []).forEach((cell, k) => push(`exhibits[${i}].rows[${r}][${k}]`, cell)));
  });
  push('question', c.question?.text);
  (c.response?.parts || []).forEach((p, i) => { push(`response.parts[${i}].label`, p.label); push(`response.parts[${i}].prompt`, p.prompt); });
  return out;
}

/** Text only the scorer and the post-close reveal see. */
export function scoringText(c) {
  const out = [];
  const push = (where, text) => { if (str(text)) out.push({ where, text }); };
  (c.rubric || []).forEach((r, i) => { push(`rubric[${i}].measures`, r.measures); push(`rubric[${i}].excellent`, r.excellent); push(`rubric[${i}].weak`, r.weak); });
  push('model_answer.summary', c.model_answer?.summary);
  (c.model_answer?.parts || []).forEach((p, i) => push(`model_answer.parts[${i}]`, p.text));
  (c.model_answer?.alternatives || []).forEach((a, i) => { push(`model_answer.alternatives[${i}].option`, a.option); push(`model_answer.alternatives[${i}].better_when`, a.better_when); });
  (c.common_traps || []).forEach((t, i) => { push(`common_traps[${i}].trap`, t.trap); push(`common_traps[${i}].why`, t.why); });
  return out;
}

export function readingWords(c) {
  const parts = [...(c.brief || [])];
  (c.exhibits || []).forEach(e => {
    parts.push(e.title || '', e.note || '', ...(e.columns || []), ...(e.rows || []).flat());
  });
  parts.push(c.question?.text || '');
  (c.response?.parts || []).forEach(p => parts.push(p.label || '', p.prompt || ''));
  return parts.reduce((n, p) => n + words(p), 0);
}

export function estimateMinutes(c) {
  const reading = readingWords(c) / LIMITS.readWordsPerMinute;
  const doing = (c.response?.parts || []).reduce((n, p) => n + (Number(p.minutes) || 0), 0);
  return { reading: round(reading, 1), doing, total: round(reading + doing, 1) };
}

function evalFormula(formula, values) {
  if (!/^[\w\s+\-*/().]+$/.test(formula)) throw new Error('formula has characters other than ids, numbers and + - * / ( )');
  const names = formula.match(/[a-z_][a-z0-9_]*/g) || [];
  for (const n of names) if (!(n in values)) throw new Error(`formula uses unknown fact "${n}"`);
  const body = formula.replace(/[a-z_][a-z0-9_]*/g, n => `(${values[n]})`);
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${body});`)();
  if (!Number.isFinite(result)) throw new Error('formula is not a finite number');
  return result;
}

/**
 * @param {object} c the case
 * @param {{ today?: string, filename?: string }} [opts]
 * @returns {{ errors: string[], warnings: string[], stats: object }}
 */
export function validateCase(c, opts = {}) {
  const errors = [];
  const warnings = [];
  const err = m => errors.push(m);
  const warn = m => warnings.push(m);
  const today = opts.today || new Date().toISOString().slice(0, 10);

  if (!isObj(c)) return { errors: ['case is not an object'], warnings, stats: {} };
  for (const k of REQUIRED_KEYS) if (!(k in c)) err(`missing field "${k}"`);
  if (errors.length) return { errors, warnings, stats: {} };

  if (c.schema_version !== 1) err('schema_version must be 1');

  // ── Identity ──────────────────────────────────────────────
  const week = parseDate(c.week_start);
  if (!week) err('week_start must be a real date, YYYY-MM-DD');
  else if (week.getUTCDay() !== 1) err(`week_start ${c.week_start} is not a Monday`);
  if (!MARKETS.includes(c.market_id)) err(`market_id "${c.market_id}" is not one of the 15 industries`);
  if (!KINDS.includes(c.kind)) err(`kind must be one of ${KINDS.join(', ')}`);
  if (!str(c.presented_by)) err('presented_by is required');
  if (!str(c.title) || c.title.length > LIMITS.title) err(`title is required and at most ${LIMITS.title} characters`);
  if (!str(c.topic)) err('topic is required');
  if (!str(c.hook) || c.hook.length > LIMITS.hook) err(`hook is required and at most ${LIMITS.hook} characters`);
  if (!str(c.tension) || words(c.tension) < 8) err('tension must state, in a sentence, what pulls against what');
  if (!str(c.disclosure)) err('disclosure is required (educational, as-of date, not advice)');
  if (opts.filename && week && !opts.filename.startsWith(c.week_start)) err(`file name must start with the week_start (${c.week_start})`);

  if (c.kind === 'startup') {
    const p = c.partner;
    if (!isObj(p)) err('startup cases need a partner object');
    else {
      if (!str(p.name)) err('partner.name is required');
      if (p.consent_to_publish !== true) err('partner.consent_to_publish must be true');
      if (p.reviewed_by_marketlingo !== true) err('partner.reviewed_by_marketlingo must be true');
      if (!parseDate(p.provided_on)) err('partner.provided_on must be a date');
      if (str(p.name) && c.presented_by !== p.name) err('presented_by must equal partner.name for startup cases');
      if (p.confidential_figures_removed !== true) err('partner.confidential_figures_removed must be true');
    }
  }

  // ── Dates ─────────────────────────────────────────────────
  if (!parseDate(c.as_of)) err('as_of must be a date');
  else if (parseDate(c.as_of) > parseDate(today) && daysBetween(today, c.as_of) > 1) err('as_of is in the future');
  if (!parseDate(c.stale_after)) err('stale_after must be a date');
  else if (week) {
    const d = daysBetween(c.week_start, c.stale_after);
    if (d < LIMITS.staleAfterDays.min || d > LIMITS.staleAfterDays.max) err(`stale_after must be ${LIMITS.staleAfterDays.min} to ${LIMITS.staleAfterDays.max} days after week_start`);
  }
  if (parseDate(c.as_of) && week && daysBetween(c.as_of, c.week_start) > 21) warn('as_of is more than 21 days before the week opens; refresh the facts');

  // ── Sources ───────────────────────────────────────────────
  const sourceIds = new Set();
  if (!Array.isArray(c.sources) || c.sources.length < 2) err('at least two sources are required');
  else {
    c.sources.forEach((s, i) => {
      const at = `sources[${i}]`;
      if (!isObj(s)) return err(`${at} is not an object`);
      if (!ID.test(s.id || '')) err(`${at}.id must be a lowercase id`);
      else if (sourceIds.has(s.id)) err(`${at}.id "${s.id}" is duplicated`);
      else sourceIds.add(s.id);
      if (!str(s.title) || !str(s.publisher)) err(`${at} needs title and publisher`);
      if (!/^https:\/\/\S+$/.test(s.url || '')) err(`${at}.url must be an https URL`);
      if (!SOURCE_TIERS.includes(s.tier)) err(`${at}.tier must be one of ${SOURCE_TIERS.join(', ')}`);
      if (s.published === null || s.published === undefined) { if (!str(s.published_note)) err(`${at} has no publication date, so published_note must say why`); }
      else if (!parseDate(s.published)) err(`${at}.published must be a date or null`);
      if (!parseDate(s.accessed)) err(`${at}.accessed must be a date`);
      else {
        if (parseDate(s.published) && parseDate(s.accessed) < parseDate(s.published)) err(`${at} was accessed before it was published`);
        if (daysBetween(today, s.accessed) > 1) err(`${at}.accessed is in the future`);
      }
    });
  }

  // ── Fact ledger ───────────────────────────────────────────
  const facts = new Map();
  if (!Array.isArray(c.facts) || c.facts.length < 4) err('the fact ledger needs at least four facts');
  else {
    c.facts.forEach(f => { if (isObj(f) && ID.test(f.id || '')) { if (facts.has(f.id)) err(`fact id "${f.id}" is duplicated`); else facts.set(f.id, f); } });
    const values = {};
    for (const f of c.facts) if (typeof f?.value === 'number') values[f.id] = f.value;

    c.facts.forEach((f, i) => {
      const at = `facts[${i}] (${f?.id ?? '?'})`;
      if (!isObj(f)) return err(`${at} is not an object`);
      if (!ID.test(f.id || '')) return err(`facts[${i}].id must be a lowercase id`);
      if (!str(f.label)) err(`${at} needs a label`);
      if (!str(f.display)) err(`${at} needs a display string exactly as it appears in the case`);
      if (!parseDate(f.as_of)) err(`${at}.as_of must be a date`);
      if (f.kind === 'reported') {
        if (!Array.isArray(f.sources) || !f.sources.length) err(`${at} has no sources`);
        else for (const s of f.sources) if (!sourceIds.has(s)) err(`${at} cites unknown source "${s}"`);
        const checks = Array.isArray(f.verified) ? f.verified : [];
        const pass1 = checks.find(v => v.pass === 1);
        const pass2 = checks.find(v => v.pass === 2);
        if (!pass1 || !pass2) err(`${at} must be verified in two passes (verified[].pass 1 and 2)`);
        else {
          for (const v of [pass1, pass2]) {
            if (!sourceIds.has(v.source_id)) err(`${at} pass ${v.pass} cites unknown source "${v.source_id}"`);
            else if (!(f.sources || []).includes(v.source_id)) err(`${at} pass ${v.pass} source "${v.source_id}" is not in the fact's sources`);
            if (!str(v.evidence) || v.evidence.length < 8) err(`${at} pass ${v.pass} needs evidence: the quote or table row that shows the figure`);
            if (!parseDate(v.checked_on)) err(`${at} pass ${v.pass} needs checked_on`);
            if (!['quote', 'table_row', 'verbatim_refetch', 'second_source'].includes(v.method)) err(`${at} pass ${v.pass} method must be quote, table_row, verbatim_refetch or second_source`);
          }
          if (pass1.source_id === pass2.source_id && pass2.method !== 'verbatim_refetch') err(`${at}: the second pass must use a different source, or a verbatim re-fetch of the same one`);
        }
        if ((f.sources || []).every(s => c.sources.find(x => x.id === s)?.tier !== 'primary') && (f.sources || []).length < 2) {
          warn(`${at} rests on a single secondary source`);
        }
        const toks = numberTokens(f.display);
        if (typeof f.value === 'number' && toks.length === 1 && Number(toks[0].core) !== Math.abs(f.value)) err(`${at}: value ${f.value} does not match display "${f.display}"`);
      } else if (f.kind === 'derived') {
        if (!str(f.formula)) err(`${at} needs a formula`);
        else if (typeof f.value !== 'number') err(`${at} needs a numeric value`);
        else {
          for (const input of f.inputs || []) if (!facts.has(input)) err(`${at} uses unknown input "${input}"`);
          try {
            const scale = typeof f.scale === 'number' ? f.scale : 1;
            const dec = Number.isInteger(f.decimals) ? f.decimals : 0;
            const computed = evalFormula(f.formula, values) * scale;
            if (round(computed, dec) !== round(f.value, dec)) err(`${at}: formula gives ${round(computed, dec)} but value says ${f.value}`);
            const toks = numberTokens(f.display);
            if (toks.length === 1 && Number(toks[0].core) !== Math.abs(round(computed, dec))) err(`${at}: display "${f.display}" does not match the computed ${round(computed, dec)}`);
          } catch (e) { err(`${at}: ${e.message}`); }
          const used = new Set((f.formula.match(/[a-z_][a-z0-9_]*/g) || []));
          for (const u of used) if (!(f.inputs || []).includes(u)) err(`${at}: formula uses "${u}" but inputs does not list it`);
        }
      } else err(`${at}.kind must be "reported" or "derived"`);
    });
  }

  // ── Learner text: structure, length, traceability ─────────
  if (!Array.isArray(c.brief) || c.brief.length < 3 || c.brief.length > 7 || !c.brief.every(str)) err('brief needs 3 to 7 non-empty paragraphs');
  if (!Array.isArray(c.exhibits) || c.exhibits.length < LIMITS.exhibits.min || c.exhibits.length > LIMITS.exhibits.max) err(`exhibits: ${LIMITS.exhibits.min} to ${LIMITS.exhibits.max} required`);
  else {
    const seen = new Set();
    c.exhibits.forEach((e, i) => {
      const at = `exhibits[${i}]`;
      if (!ID.test(e.id || '') || seen.has(e.id)) err(`${at}.id must be a unique lowercase id`); else seen.add(e.id);
      if (!str(e.title)) err(`${at} needs a title`);
      if (!Array.isArray(e.columns) || e.columns.length < 2 || e.columns.length > 5) err(`${at}.columns: 2 to 5 required`);
      if (!Array.isArray(e.rows) || !e.rows.length || e.rows.length > LIMITS.exhibitRows) err(`${at}.rows: 1 to ${LIMITS.exhibitRows} required`);
      else e.rows.forEach((row, r) => { if (!Array.isArray(row) || row.length !== e.columns?.length) err(`${at}.rows[${r}] must have ${e.columns?.length} cells`); });
      if (!Array.isArray(e.source_ids) || !e.source_ids.length) err(`${at}.source_ids is required`);
      else for (const s of e.source_ids) if (!sourceIds.has(s)) err(`${at} cites unknown source "${s}"`);
    });
  }
  if (!str(c.question?.text) || words(c.question.text) < 20) err('question.text is required (at least 20 words, with the role and the decision)');

  const parts = c.response?.parts;
  const partIds = new Set();
  if (!Array.isArray(parts) || parts.length < LIMITS.parts.min || parts.length > LIMITS.parts.max) err(`response.parts: ${LIMITS.parts.min} to ${LIMITS.parts.max} required`);
  else parts.forEach((p, i) => {
    const at = `response.parts[${i}]`;
    if (!ID.test(p.id || '') || partIds.has(p.id)) err(`${at}.id must be a unique lowercase id`); else partIds.add(p.id);
    if (!str(p.label) || !str(p.prompt)) err(`${at} needs label and prompt`);
    if (!(p.max_words >= LIMITS.partWords.min && p.max_words <= LIMITS.partWords.max)) err(`${at}.max_words must be ${LIMITS.partWords.min} to ${LIMITS.partWords.max}`);
    if (!(p.minutes >= LIMITS.partMinutes.min && p.minutes <= LIMITS.partMinutes.max)) err(`${at}.minutes must be ${LIMITS.partMinutes.min} to ${LIMITS.partMinutes.max}`);
  });

  const w = readingWords(c);
  const mins = estimateMinutes(c);
  if (w < LIMITS.words.min || w > LIMITS.words.max) err(`the learner reads ${w} words; it must be ${LIMITS.words.min} to ${LIMITS.words.max}`);
  if (mins.total < LIMITS.minutes.min || mins.total > LIMITS.minutes.max) err(`estimated ${mins.total} minutes (reading ${mins.reading} + parts ${mins.doing}); it must be ${LIMITS.minutes.min} to ${LIMITS.minutes.max}`);

  // Dated claims.
  (c.brief || []).forEach((p, i) => {
    if (TEMPORAL_WORDS.test(p) && !DATE_IN_TEXT.test(p)) err(`brief[${i}] uses time-bound wording ("${p.match(TEMPORAL_WORDS)[0]}") without an explicit date in the same paragraph`);
  });
  if (!Array.isArray(c.time_sensitive) || !c.time_sensitive.length) err('time_sensitive needs at least one claim to re-check, with as_of and check_again_by');
  else c.time_sensitive.forEach((t, i) => {
    if (!str(t.claim) || !parseDate(t.as_of) || !parseDate(t.check_again_by)) err(`time_sensitive[${i}] needs claim, as_of and check_again_by`);
  });

  // Unsourced attributions and placeholders, anywhere.
  for (const { where, text } of [...learnerText(c), ...scoringText(c)]) {
    for (const re of UNSOURCED_PATTERNS) if (re.test(text)) err(`${where}: unsourced or placeholder wording ("${text.match(re)[0]}")`);
  }

  // Every figure traces to a fact.
  const known = new Set();
  for (const f of facts.values()) for (const t of numberTokens(f.display || '')) known.add(tokenKey(t));
  const allow = new Set((c.numbers_allowlist || []).map(String));
  if (allow.size) warn(`numbers_allowlist is in use (${[...allow].join(', ')}); each entry should be a label, not a statistic`);
  const untraced = [];
  for (const { where, text } of [...learnerText(c), ...scoringText(c)]) {
    for (const t of numberTokens(text)) {
      if (isFreeToken(t) || allow.has(t.core) || known.has(tokenKey(t))) continue;
      untraced.push(`${where}: "${t.raw}"`);
    }
  }
  if (untraced.length) err(`figures with no matching fact (add it to the ledger or remove it): ${[...new Set(untraced)].join('; ')}`);

  // Every fact is used somewhere the reader can see it.
  const visible = [...learnerText(c), ...scoringText(c)].map(x => x.text).join('\n');
  const visibleKeys = new Set(numberTokens(visible).map(tokenKey));
  for (const f of facts.values()) {
    const keys = numberTokens(f.display || '').map(tokenKey);
    const dateOnly = !keys.length;
    if (!dateOnly && !keys.some(k => visibleKeys.has(k))) warn(`fact "${f.id}" is in the ledger but its figure never appears in the case`);
  }

  // Rubric.
  if (!Array.isArray(c.rubric) || c.rubric.length < LIMITS.criteria.min || c.rubric.length > LIMITS.criteria.max) err(`rubric needs ${LIMITS.criteria.min} to ${LIMITS.criteria.max} criteria`);
  else {
    const ids = new Set();
    let total = 0;
    const covered = new Set();
    c.rubric.forEach((r, i) => {
      const at = `rubric[${i}]`;
      if (!ID.test(r.id || '') || ids.has(r.id)) err(`${at}.id must be a unique lowercase id`); else ids.add(r.id);
      if (!str(r.name)) err(`${at} needs a name`);
      if (!Number.isInteger(r.weight) || r.weight < LIMITS.criterionWeight.min || r.weight > LIMITS.criterionWeight.max) err(`${at}.weight must be a whole number from ${LIMITS.criterionWeight.min} to ${LIMITS.criterionWeight.max}`);
      else total += r.weight;
      for (const k of ['measures', 'excellent', 'weak']) if (!str(r[k]) || r[k].length < 25) err(`${at}.${k} must say concretely what to look for (25+ characters)`);
      if (!Array.isArray(r.part_ids) || !r.part_ids.length) err(`${at}.part_ids is required (use ["all"] for cross-cutting criteria)`);
      else for (const p of r.part_ids) { if (p !== 'all' && !partIds.has(p)) err(`${at} cites unknown part "${p}"`); covered.add(p); }
    });
    if (total !== 100) err(`rubric weights sum to ${total}, not 100`);
    for (const p of partIds) if (!covered.has(p) && !covered.has('all')) err(`response part "${p}" is not covered by any rubric criterion`);
  }

  // Model answer: sharp, and not the only answer.
  const m = c.model_answer;
  if (!isObj(m)) err('model_answer must be an object');
  else {
    if (!str(m.summary)) err('model_answer.summary is required');
    if (!Array.isArray(m.parts) || !m.parts.length) err('model_answer.parts is required');
    else {
      for (const p of partIds) if (!m.parts.some(x => x.part_id === p)) err(`model_answer has no answer for part "${p}"`);
      for (const x of m.parts) if (!partIds.has(x.part_id)) err(`model_answer cites unknown part "${x.part_id}"`);
    }
    if (!Array.isArray(m.alternatives) || m.alternatives.length < LIMITS.alternatives.min || m.alternatives.length > LIMITS.alternatives.max) err(`model_answer.alternatives: ${LIMITS.alternatives.min} to ${LIMITS.alternatives.max} other defensible answers, each with when it would be better`);
    else m.alternatives.forEach((a, i) => { if (!str(a.option) || !str(a.better_when)) err(`model_answer.alternatives[${i}] needs option and better_when`); });
    if (!Array.isArray(m.key_fact_ids) || m.key_fact_ids.length < LIMITS.keyFacts) err(`model_answer.key_fact_ids needs at least ${LIMITS.keyFacts} fact ids`);
    else for (const id of m.key_fact_ids) if (!facts.has(id)) err(`model_answer.key_fact_ids cites unknown fact "${id}"`);
    const mw = words(m.summary || '') + (m.parts || []).reduce((n, p) => n + words(p.text || ''), 0) + (m.alternatives || []).reduce((n, a) => n + words(a.option || '') + words(a.better_when || ''), 0);
    if (mw > LIMITS.modelAnswerWords) err(`model answer is ${mw} words; keep it to ${LIMITS.modelAnswerWords} so it stays sharp`);
  }

  if (!Array.isArray(c.common_traps) || c.common_traps.length < LIMITS.traps.min || c.common_traps.length > LIMITS.traps.max) err(`common_traps needs ${LIMITS.traps.min} to ${LIMITS.traps.max} entries`);
  else c.common_traps.forEach((t, i) => { if (!str(t.trap) || !str(t.why)) err(`common_traps[${i}] needs trap and why`); });

  // Source use.
  const cited = new Set();
  for (const f of facts.values()) for (const s of f.sources || []) cited.add(s);
  for (const e of c.exhibits || []) for (const s of e.source_ids || []) cited.add(s);
  for (const s of sourceIds) if (!cited.has(s)) warn(`source "${s}" is listed but nothing cites it`);

  return { errors, warnings, stats: { words: w, ...mins, facts: facts.size, sources: sourceIds.size } };
}

/** Validates all cases together: one per week, and no industry within four weeks of itself. */
export function validateSet(cases, opts = {}) {
  const results = cases.map(({ file, data }) => ({ file, ...validateCase(data, { ...opts, filename: file }) }));
  const setErrors = [];
  const byWeek = new Map();
  for (const { file, data } of cases) {
    if (byWeek.has(data.week_start)) setErrors.push(`${file} and ${byWeek.get(data.week_start)} are both for ${data.week_start}`);
    else byWeek.set(data.week_start, file);
  }
  const sorted = [...cases].filter(c => parseDate(c.data.week_start)).sort((a, b) => a.data.week_start.localeCompare(b.data.week_start));
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const gap = daysBetween(sorted[i].data.week_start, sorted[j].data.week_start);
      if (gap < ROTATION_DAYS && sorted[i].data.market_id === sorted[j].data.market_id) {
        setErrors.push(`${sorted[j].file} repeats "${sorted[j].data.market_id}" only ${gap} days after ${sorted[i].file} (minimum ${ROTATION_DAYS})`);
      }
    }
  }
  return { results, setErrors };
}

/** Industries free to use for a given Monday, given the cases already written. */
export function eligibleMarkets(cases, weekStart) {
  const blocked = new Set();
  for (const { data } of cases) {
    if (!parseDate(data.week_start)) continue;
    if (Math.abs(daysBetween(data.week_start, weekStart)) < ROTATION_DAYS) blocked.add(data.market_id);
  }
  return MARKETS.filter(m => !blocked.has(m));
}
