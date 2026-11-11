/**
 * Weekly Case, the phone's rules: which case is current, what phase it is in, what the Practice card says,
 * how an answer is checked, and how a draft is kept. No network and no React in here, so it is all testable.
 *
 * A case is one row of public.weekly_cases (see scripts/weekly/lib/mapping.mjs): its text is in `content`, and the
 * writing boxes are `content.response.parts`. The server (migration 0044) enforces the same limits as below.
 */

/**
 * Flat XP for submitting an answer; paid once per case. Normal XP earned, so it counts for friend races and the
 * crown. The submission also earns one 15-minute Double XP token (granted on the server).
 */
export const WEEKLY_CASE_XP = 200;
/** Fallback when a case gives no part timings. A suggestion, never a lock. */
export const SUGGESTED_MINUTES = 10;
/** An answer needs at least this many words in every part, and at most HARD_CAP_FACTOR times the part's guidance. */
export const MIN_PART_WORDS = 3;
export const HARD_CAP_FACTOR = 2;

export interface WeeklyPart {
  id: string;
  label: string;
  prompt: string;
  /** Guidance shown to the learner; going over is allowed up to HARD_CAP_FACTOR times. */
  maxWords: number;
  minutes: number;
}

export interface WeeklyExhibit {
  id: string;
  title: string;
  note: string | null;
  columns: string[];
  rows: string[][];
}

export interface WeeklySource {
  id: string;
  title: string;
  publisher?: string;
  url?: string;
  published?: string | null;
  accessed?: string;
}

export interface WeeklyCase {
  id: string;
  weekStart: string;
  marketId: string | null;
  kind: 'original' | 'startup';
  presentedBy: string;
  title: string;
  topic: string;
  hook: string;
  tension: string;
  disclosure: string;
  asOf: string | null;
  brief: string[];
  exhibits: WeeklyExhibit[];
  question: string;
  parts: WeeklyPart[];
  sources: WeeklySource[];
  opensAt: number;
  /** Writing stops here; scores and the model answer are released from this moment. */
  closesAt: number;
}

export interface WeeklyCaseRow {
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

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export function caseFromRow(row: WeeklyCaseRow): WeeklyCase {
  const c = (row.content && typeof row.content === 'object' ? row.content : {}) as Record<string, any>;
  const parts: WeeklyPart[] = (Array.isArray(c.response?.parts) ? c.response.parts : [])
    .filter((p: any) => p && typeof p.id === 'string')
    .map((p: any) => ({ id: p.id, label: str(p.label), prompt: str(p.prompt), maxWords: Number(p.max_words) || 120, minutes: Number(p.minutes) || 2 }));
  const exhibits: WeeklyExhibit[] = (Array.isArray(c.exhibits) ? c.exhibits : [])
    .filter((e: any) => e && Array.isArray(e.columns) && Array.isArray(e.rows))
    .map((e: any) => ({ id: str(e.id), title: str(e.title), note: typeof e.note === 'string' ? e.note : null, columns: e.columns.map(String), rows: e.rows.map((r: unknown[]) => r.map(String)) }));
  return {
    id: row.id,
    weekStart: row.week_start,
    marketId: row.market_id,
    kind: row.kind === 'startup' ? 'startup' : 'original',
    presentedBy: row.presented_by || 'MarketLingo',
    title: row.title,
    topic: row.topic,
    hook: str(c.hook),
    tension: str(c.tension),
    disclosure: str(c.disclosure),
    asOf: typeof c.as_of === 'string' ? c.as_of : null,
    brief: (Array.isArray(c.brief) ? c.brief : []).map(String),
    exhibits,
    question: str(c.question?.text),
    parts,
    sources: Array.isArray(c.sources) ? (c.sources as WeeklySource[]) : [],
    opensAt: Date.parse(row.opens_at),
    closesAt: Date.parse(row.closes_at),
  };
}

/** The partner's name on a startup case; MarketLingo's own cases carry no byline. */
export const presenter = (c: Pick<WeeklyCase, 'kind' | 'presentedBy'>): string | null => (c.kind === 'startup' ? c.presentedBy : null);

export type WeeklyPhase = 'upcoming' | 'open' | 'closed';

/** Where a case is in its week: not open yet, open to write, or closed (results are released from then). */
export function phaseOf(c: Pick<WeeklyCase, 'opensAt' | 'closesAt'>, now: number): WeeklyPhase {
  if (now < c.opensAt) return 'upcoming';
  return now < c.closesAt ? 'open' : 'closed';
}

/**
 * The case a learner is on and the one before it. Every learner gets the week's case whatever their industry:
 * the newest case that has opened is current.
 */
export function pickCases(cases: WeeklyCase[], now: number): { current: WeeklyCase | null; previous: WeeklyCase | null } {
  const opened = cases.filter(c => c.opensAt <= now).sort((a, b) => b.opensAt - a.opensAt);
  return { current: opened[0] ?? null, previous: opened[1] ?? null };
}

const DAY = 86_400_000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "3d 4h", "5h 12m", "42m"; "under a minute" at the very end. */
export function countdown(ms: number): string {
  if (ms < 60_000) return 'under a minute';
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days >= 1) return hours ? `${days}d ${hours}h` : `${days}d`;
  if (hours >= 1) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

/** The weekday results arrive on, in the learner's own time zone ("today" if it is today). */
export function resultsDay(at: number, now: number): string {
  const r = new Date(at);
  const n = new Date(now);
  const sameDay = r.getFullYear() === n.getFullYear() && r.getMonth() === n.getMonth() && r.getDate() === n.getDate();
  return sameDay ? 'today' : WEEKDAYS[r.getDay()];
}

/** ISO week number of the case's Monday, for the card's tile. */
export function weekNumber(weekStart: string): number {
  const d = new Date(`${weekStart}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - first.getTime()) / DAY - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
}

export const countWords = (text: string): number => (text.trim().match(/\S+/g) ?? []).length;

/** About how long the case takes: the reading plus the time budgeted for each part, rounded to whole minutes. */
export function suggestedMinutes(c: Pick<WeeklyCase, 'brief' | 'exhibits' | 'question' | 'parts'>): number {
  if (!c.parts.length) return SUGGESTED_MINUTES;
  const reading = countWords([...c.brief, c.question, ...c.parts.map(p => p.prompt), ...c.exhibits.flatMap(e => [e.title, ...e.rows.flat()])].join(' ')) / 200;
  const writing = c.parts.reduce((n, p) => n + p.minutes, 0);
  return Math.min(15, Math.max(5, Math.round(reading + writing)));
}

/* ─── The Practice card ─── */

export interface WeeklyCardInfo {
  kind: 'open' | 'submitted' | 'results' | 'none';
  title: string;
  byline?: string;
  state: { before?: string; bold?: string; after?: string };
  button: string | null;
  path: string;
  tile: { icon: 'calendar' | 'check-circle' | 'award'; label: string };
  /** Last week's results, when they are ready and unread. */
  extra?: { label: string; path: string };
}

export interface WeeklyCardInput {
  now: number;
  current: WeeklyCase | null;
  /** The learner has a submission for the current case. */
  submitted: boolean;
  /** Released score of the current case, when results are out. */
  score?: number | null;
  previous?: { case: WeeklyCase; score: number | null } | null;
}

export function weeklyCardInfo(input: WeeklyCardInput): WeeklyCardInfo {
  const { now, current } = input;
  const extra = input.previous && input.previous.score !== null
    ? { label: `Last week: ${Math.round(input.previous.score)} / 100 · See results`, path: `/weekly-case-results?id=${input.previous.case.id}` }
    : undefined;
  if (!current) {
    return { kind: 'none', title: 'Next case Monday', state: { before: 'A new business problem every week.' }, button: null, path: '/weekly-case', tile: { icon: 'calendar', label: 'SOON' }, extra };
  }
  const byline = presenter(current) ? `Presented by ${current.presentedBy}` : undefined;
  const tile = { icon: 'calendar' as const, label: `WEEK ${weekNumber(current.weekStart)}` };
  const phase = phaseOf(current, now);
  if (phase === 'closed' && input.submitted) {
    return {
      kind: 'results', title: current.title, byline, tile: { ...tile, icon: 'award' },
      state: input.score != null ? { before: 'You scored ', bold: `${Math.round(input.score)} / 100` } : { before: 'Your results are ready.' },
      button: 'See results', path: `/weekly-case-results?id=${current.id}`, extra,
    };
  }
  if (input.submitted) {
    return {
      kind: 'submitted', title: current.title, byline, tile: { ...tile, icon: 'check-circle' },
      state: { before: `Submitted · results ${resultsDay(current.closesAt, now)}` },
      button: null, path: '/weekly-case', extra,
    };
  }
  if (phase === 'open') {
    return {
      kind: 'open', title: current.title, byline, tile,
      state: { bold: `Closes in ${countdown(current.closesAt - now)}`, after: ` · about ${suggestedMinutes(current)} min` },
      button: 'Start the case', path: '/weekly-case', extra,
    };
  }
  return { kind: 'none', title: 'Next case Monday', state: { before: 'This week’s case has closed.' }, button: null, path: '/weekly-case', tile: { icon: 'calendar', label: 'SOON' }, extra };
}

/* ─── Writing ─── */

/** Answers by part id. */
export type WeeklyAnswers = Record<string, string>;
export const emptyAnswers = (parts: WeeklyPart[]): WeeklyAnswers => Object.fromEntries(parts.map(p => [p.id, '']));

export const totalWords = (answers: WeeklyAnswers): number => Object.values(answers).reduce((n, t) => n + countWords(t), 0);
/** The most words a part accepts; the server enforces the same cap. */
export const hardCap = (part: WeeklyPart): number => part.maxWords * HARD_CAP_FACTOR;

export type PartStatus = 'empty' | 'short' | 'ok' | 'over' | 'toolong';

/** empty and short block submitting, over (past the guidance) is allowed with a nudge, toolong blocks. */
export function partStatus(text: string, part: WeeklyPart): PartStatus {
  const n = countWords(text);
  if (n === 0) return 'empty';
  if (n < MIN_PART_WORDS) return 'short';
  if (n > hardCap(part)) return 'toolong';
  return n > part.maxWords ? 'over' : 'ok';
}

/** The parts that stop the learner submitting, by id. */
export function blockingParts(answers: WeeklyAnswers, parts: WeeklyPart[]): string[] {
  return parts.filter(p => { const s = partStatus(answers[p.id] ?? '', p); return s === 'empty' || s === 'short' || s === 'toolong'; }).map(p => p.id);
}

export const canSubmit = (answers: WeeklyAnswers, parts: WeeklyPart[]): boolean => parts.length > 0 && blockingParts(answers, parts).length === 0;

/** "01:42" counting down from the suggested time, then "+02:10" over it. Never blocks anything. */
export function timerLabel(elapsedMs: number, suggested = SUGGESTED_MINUTES): { text: string; over: boolean } {
  const total = suggested * 60_000;
  const diff = Math.abs(total - Math.max(0, elapsedMs));
  const m = Math.floor(diff / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const clock = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return elapsedMs > total ? { text: `+${clock}`, over: true } : { text: clock, over: false };
}

/* ─── Drafts, kept on the device ─── */

export interface WeeklyDraft {
  answers: WeeklyAnswers;
  /** When the learner pressed Start writing; the timer counts from here. */
  startedAt: number | null;
  savedAt: number;
}

export const draftKey = (userId: string, caseId: string) => `ml_weekly_draft_v2/${userId}/${caseId}`;

export function parseDraft(raw: string | null, parts: WeeklyPart[]): WeeklyDraft | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== 'object' || typeof v.answers !== 'object') return null;
    const answers = emptyAnswers(parts);
    // A generous character cap, so a pasted essay cannot fill the device.
    for (const p of parts) answers[p.id] = typeof v.answers?.[p.id] === 'string' ? v.answers[p.id].slice(0, hardCap(p) * 16) : '';
    return { answers, startedAt: typeof v.startedAt === 'number' ? v.startedAt : null, savedAt: Number(v.savedAt) || 0 };
  } catch {
    return null;
  }
}

/* ─── Results ─── */

export interface WeeklyBreakdownRow {
  id: string;
  name: string;
  weight: number;
  score: number;
  comment: string;
}

export interface WeeklyResult {
  state: 'none' | 'waiting' | 'ready';
  score?: number;
  breakdown?: WeeklyBreakdownRow[];
  strongest_move?: string;
  sharpen?: string;
  expert_flag?: boolean;
  participants?: number;
  beat_pct?: number | null;
}

export interface WeeklyBoardRow {
  user_id: string;
  display_name: string;
  friend_code: string | null;
  is_me: boolean;
  score: number | null;
  rank: number | null;
}

/** The model answer, shown only once the week has closed. */
export interface WeeklyReveal {
  model_answer: {
    summary: string;
    parts: { part_id: string; text: string }[];
    alternatives?: { option: string; better_when: string }[];
  };
  common_traps?: { trap: string; why: string }[];
}

/** One honest line about the score. */
export function scoreHeadline(score: number): string {
  if (score >= 85) return 'A plan you could pitch.';
  if (score >= 70) return 'Strong thinking. A few sharp edges left.';
  if (score >= 50) return 'A solid start. Tighten the numbers.';
  return 'Good try. Start from the numbers next time.';
}

export function shareText(title: string, score: number, rank: number | null, friends: number): string {
  const place = rank && friends > 1 ? ` I came #${rank} of ${friends} among my friends.` : '';
  return `I scored ${Math.round(score)}/100 on this week's MarketLingo case: "${title}".${place}`;
}
