/**
 * The one place a case file becomes database rows.
 *
 * Two tables, because the rubric and the model answer must never reach a learner before the week closes:
 *   public.weekly_cases          what learners read (brief, exhibits, question, parts). Readable when open.
 *   public.weekly_case_scoring   rubric, model answer, traps, fact ledger. Service role only; the scoring step
 *                                reads it, and the app reveals the model answer after closes_at.
 *
 * If the app engine's migration names columns differently, change THIS file and nothing else.
 */
import { createHash } from 'node:crypto';
import { TIMEZONE } from './constants.mjs';

/** A stable uuid per week, so re-running the export updates the same row. */
export function caseId(weekStart) {
  const h = createHash('sha1').update(`marketlingo:weekly-case:${weekStart}`).digest('hex');
  const variant = ((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(18, 20)}-${h.slice(20, 32)}`;
}

/** The UTC instant of local midnight on a date, in the product's timezone. */
export function localMidnightISO(dateStr, timeZone = TIMEZONE) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const offsetAt = ts => {
    const p = Object.fromEntries(fmt.formatToParts(new Date(ts)).map(x => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ts;
  };
  const wall = Date.UTC(y, m - 1, d);
  let ts = wall - offsetAt(wall);
  ts = wall - offsetAt(ts); // the offset can differ across a DST change; one more pass settles it
  return new Date(ts).toISOString();
}

export function addDaysISO(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** @returns {{ weekly_case: object, scoring: object }} */
export function toRows(c) {
  const id = caseId(c.week_start);
  const publicSources = c.sources.map(({ id: sid, title, publisher, url, published, accessed, tier }) => ({ id: sid, title, publisher, url, published, accessed, tier }));
  return {
    weekly_case: {
      id,
      week_start: c.week_start,
      market_id: c.market_id,
      kind: c.kind,
      presented_by: c.presented_by,
      title: c.title,
      topic: c.topic,
      status: 'scheduled',
      opens_at: localMidnightISO(c.week_start),
      closes_at: localMidnightISO(addDaysISO(c.week_start, 7)),
      content: {
        hook: c.hook,
        tension: c.tension,
        disclosure: c.disclosure,
        as_of: c.as_of,
        brief: c.brief,
        exhibits: c.exhibits.map(({ id: eid, title, note, columns, rows, source_ids }) => ({ id: eid, title, note: note || null, columns, rows, source_ids })),
        question: c.question,
        response: c.response,
        sources: publicSources,
      },
    },
    scoring: {
      case_id: id,
      rubric: c.rubric,
      model_answer: c.model_answer,
      common_traps: c.common_traps,
      facts: c.facts,
      time_sensitive: c.time_sensitive,
      stale_after: c.stale_after,
    },
  };
}

const q = v => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

function jsonLiteral(value) {
  const body = JSON.stringify(value);
  if (body.includes('$wc$')) throw new Error('case JSON contains the $wc$ quote tag');
  return `$wc$${body}$wc$::jsonb`;
}

/** An idempotent upsert for one case: re-running replaces the same week. */
export function toSQL(c) {
  const { weekly_case: w, scoring: s } = toRows(c);
  return [
    `-- Weekly Case ${w.week_start}: ${w.title}`,
    `INSERT INTO public.weekly_cases (id, week_start, market_id, kind, presented_by, title, topic, status, opens_at, closes_at, content)`,
    `VALUES (${q(w.id)}, ${q(w.week_start)}, ${q(w.market_id)}, ${q(w.kind)}, ${q(w.presented_by)}, ${q(w.title)}, ${q(w.topic)}, ${q(w.status)}, ${q(w.opens_at)}, ${q(w.closes_at)}, ${jsonLiteral(w.content)})`,
    `ON CONFLICT (week_start) DO UPDATE SET market_id = EXCLUDED.market_id, kind = EXCLUDED.kind, presented_by = EXCLUDED.presented_by,`,
    `  title = EXCLUDED.title, topic = EXCLUDED.topic, opens_at = EXCLUDED.opens_at, closes_at = EXCLUDED.closes_at, content = EXCLUDED.content;`,
    ``,
    `INSERT INTO public.weekly_case_scoring (case_id, rubric, model_answer, common_traps, facts, time_sensitive, stale_after)`,
    `VALUES (${q(s.case_id)}, ${jsonLiteral(s.rubric)}, ${jsonLiteral(s.model_answer)}, ${jsonLiteral(s.common_traps)}, ${jsonLiteral(s.facts)}, ${jsonLiteral(s.time_sensitive)}, ${q(s.stale_after)})`,
    `ON CONFLICT (case_id) DO UPDATE SET rubric = EXCLUDED.rubric, model_answer = EXCLUDED.model_answer, common_traps = EXCLUDED.common_traps,`,
    `  facts = EXCLUDED.facts, time_sensitive = EXCLUDED.time_sensitive, stale_after = EXCLUDED.stale_after;`,
    ``,
  ].join('\n');
}
