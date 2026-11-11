/** Pure planning for load-weekly-cases, kept free of Deno APIs so tests can run it. */

/** One bundled week, as scripts/weekly/lib/mapping.mjs toRows() produces it. */
export interface BundledWeek {
  weekly_case: {
    id: string;
    week_start: string;
    market_id: string | null;
    kind: string;
    presented_by: string;
    title: string;
    topic: string;
    status: string;
    opens_at: string;
    closes_at: string;
    content: { response?: { parts?: { id: string }[] } } & Record<string, unknown>;
  };
  scoring: {
    case_id: string;
    rubric: unknown;
    model_answer: unknown;
    common_traps: unknown;
    facts: unknown;
    time_sensitive: unknown;
    stale_after: string | null;
  };
}

export interface StoredCase {
  id: string;
  week_start: string;
  market_id: string | null;
  kind: string;
  presented_by: string;
  title: string;
  topic: string;
  opens_at: string;
  closes_at: string;
  content: unknown;
}

export interface StoredScoring {
  case_id: string;
  rubric: unknown;
  model_answer: unknown;
  common_traps: unknown;
  facts: unknown;
  time_sensitive: unknown;
  stale_after: string | null;
}

/** JSON with sorted keys, so two values that differ only in key order compare equal (jsonb reorders keys). */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return `{${Object.keys(o).sort().map(k => `${JSON.stringify(k)}:${canonical(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

const sameInstant = (a: string, b: string) => Date.parse(a) === Date.parse(b);

export function caseChanged(bundled: BundledWeek["weekly_case"], stored: StoredCase): boolean {
  return bundled.market_id !== stored.market_id || bundled.kind !== stored.kind || bundled.presented_by !== stored.presented_by
    || bundled.title !== stored.title || bundled.topic !== stored.topic
    || !sameInstant(bundled.opens_at, stored.opens_at) || !sameInstant(bundled.closes_at, stored.closes_at)
    || canonical(bundled.content) !== canonical(stored.content);
}

export function scoringChanged(bundled: BundledWeek["scoring"], stored: StoredScoring | undefined): boolean {
  if (!stored) return true;
  return (["rubric", "model_answer", "common_traps", "facts", "time_sensitive"] as const)
    .some(k => canonical(bundled[k]) !== canonical(stored[k])) || (bundled.stale_after ?? null) !== (stored.stale_after ?? null);
}

const partIds = (content: unknown): string => ((content as { response?: { parts?: { id: string }[] } })?.response?.parts ?? []).map(p => p.id).join(",");

export type WeekPlan =
  | { week_start: string; action: "insert" }
  | { week_start: string; action: "update"; id: string; caseChanged: boolean; scoringChanged: boolean }
  | { week_start: string; action: "current" }
  | { week_start: string; action: "locked"; reason: string };

/**
 * What to do for each bundled week. A week is never rewritten after it has closed (its scores are final), and the
 * part ids of a week that has already opened are never changed (answers are stored by part id). A stored status is
 * never touched, so archiving a case in the database is a veto that loading respects.
 */
export function planWeeks(bundled: BundledWeek[], stored: StoredCase[], storedScoring: StoredScoring[], now = new Date()): WeekPlan[] {
  const byWeek = new Map(stored.map(row => [row.week_start, row]));
  const scoringById = new Map(storedScoring.map(row => [row.case_id, row]));
  return bundled.map(({ weekly_case: w, scoring }): WeekPlan => {
    const have = byWeek.get(w.week_start);
    if (!have) return { week_start: w.week_start, action: "insert" };
    if (Date.parse(have.closes_at) <= now.getTime()) {
      const differs = caseChanged(w, have) || scoringChanged({ ...scoring, case_id: have.id }, scoringById.get(have.id));
      return differs ? { week_start: w.week_start, action: "locked", reason: "the week has closed, so it is not rewritten" } : { week_start: w.week_start, action: "current" };
    }
    if (Date.parse(have.opens_at) <= now.getTime() && partIds(w.content) !== partIds(have.content)) {
      return { week_start: w.week_start, action: "locked", reason: "the week is open and its parts changed; answers are stored by part id" };
    }
    const c = caseChanged(w, have);
    const s = scoringChanged({ ...scoring, case_id: have.id }, scoringById.get(have.id));
    return c || s ? { week_start: w.week_start, action: "update", id: have.id, caseChanged: c, scoringChanged: s } : { week_start: w.week_start, action: "current" };
  });
}

export function planSummary(plans: WeekPlan[]): Record<string, number> {
  const out: Record<string, number> = { insert: 0, update: 0, current: 0, locked: 0 };
  for (const p of plans) out[p.action]++;
  return out;
}
