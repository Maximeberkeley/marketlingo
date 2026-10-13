/**
 * Interview prep — the learner's real upcoming interview (company, role, date),
 * a readiness score, and the day-by-day plan that follows from it.
 * The target is kept on-device, scoped to learner and market.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDateString } from './dayMath';

export interface InterviewTarget {
  company: string;
  role: string;
  /** Local date 'YYYY-MM-DD', or null for "no date yet". */
  date: string | null;
  updatedAt: string;
}

export type RoleTrack = 'technical' | 'behavioral' | 'case';

/** Early-career learners work through foundations before specialist prompts. */
export function isEarlyCareerRole(role?: string | null): boolean {
  return /\b(intern\w*|co[\s-]?op|student|new[\s-]?grad\w*)\b/i.test(role || '');
}

export function orderInterviewMocks<T extends { id?: string }>(mocks: T[], role?: string | null): T[] {
  if (!isEarlyCareerRole(role)) return mocks;
  const basics = new Set(['aero-tech-2', 'aero-tech-3', 'aero-tech-7', 'aero-tech-10']);
  const rank = (m: T) => m.id?.startsWith('aero-beh-') ? 0 : basics.has(m.id || '') ? 1 : 2;
  return [...mocks].sort((a, b) => rank(a) - rank(b));
}

export function pickInterviewIndex(size: number, used: Set<number>, foundationsFirst = false): number {
  if (size <= 0) return 0;
  if (used.size >= size) used.clear();
  const open = Array.from({ length: size }, (_, i) => i).filter(i => !used.has(i));
  const index = foundationsFirst ? open[0] : open[Math.floor(Math.random() * open.length)];
  used.add(index);
  return index;
}

const key = (userId: string, marketId: string) => `ml_interview_target:${userId}:${marketId}`;

export async function loadInterviewTarget(userId?: string | null, marketId?: string | null): Promise<InterviewTarget | null> {
  if (!userId || !marketId) return null;
  try {
    const raw = await AsyncStorage.getItem(key(userId, marketId));
    return raw ? (JSON.parse(raw) as InterviewTarget) : null;
  } catch {
    return null;
  }
}

export async function saveInterviewTarget(userId: string, marketId: string, target: InterviewTarget | null): Promise<void> {
  if (!target) { await AsyncStorage.removeItem(key(userId, marketId)); return; }
  await AsyncStorage.setItem(key(userId, marketId), JSON.stringify(target));
}

/**
 * Tech roles get technical/certification questions, recruiters get STAR stories,
 * consultants get cases. 'case' is only for roles that name consulting, strategy
 * or analyst work; anything unknown (and every student/intern role) is technical,
 * so engineering learners never get consulting cases or mental math.
 */
export function roleTrack(role?: string | null): RoleTrack {
  const r = (role || '').toLowerCase();
  if (isEarlyCareerRole(role)) return 'technical';
  if (/(recruit|talent|hr\b|human resources|people ops|sourcer)/.test(r)) return 'behavioral';
  if (/(consult|strategy|strategist|analyst|case)/.test(r)) return 'case';
  return 'technical';
}

export const TRACK_LABEL: Record<RoleTrack, string> = {
  technical: 'Technical & certification questions',
  behavioral: 'Behavioral (STAR) questions',
  case: 'Case questions',
};

/** Whole local days from today until the interview (0 = today), or null. */
export function daysUntil(date?: string | null, today = localDateString()): number | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  const diff = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86400000);
  return diff;
}

/** Accepts 'YYYY-MM-DD', 'DD/MM/YYYY' or 'MM/DD/YYYY'-style input; returns ISO or null. */
export function parseInterviewDate(input: string): string | null {
  const s = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  let [a, b] = [Number(m[1]), Number(m[2])];
  // Prefer day-first unless impossible.
  let day = a, month = b;
  if (month > 12 && day <= 12) { day = b; month = a; }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${m[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export interface ReadinessInputs {
  briefWritten: number;
  briefTotal: number;
  mocksDone: number;
  lastMockScore: number | null;
  lessonsCovered: number;
  currentEventsAnswered: number;
}

export interface ReadinessPart { key: string; label: string; detail: string; ratio: number; weight: number }

/** Readiness = brief sections written + mocks (and last score) + lessons covered + current-events answered. */
export function computeReadiness(i: ReadinessInputs): { percent: number; parts: ReadinessPart[] } {
  const brief = i.briefTotal > 0 ? Math.min(1, i.briefWritten / i.briefTotal) : 0;
  const mockVolume = Math.min(1, i.mocksDone / 5);
  const mockQuality = i.lastMockScore != null ? Math.min(1, i.lastMockScore / 100) : 0;
  const mocks = i.mocksDone > 0 ? mockVolume * 0.5 + mockQuality * 0.5 : 0;
  const lessons = Math.min(1, i.lessonsCovered / 14);
  const news = Math.min(1, i.currentEventsAnswered / 5);
  const parts: ReadinessPart[] = [
    { key: 'brief', label: 'Interview Brief', detail: `${i.briefWritten} of ${i.briefTotal} sections written`, ratio: brief, weight: 0.3 },
    { key: 'mocks', label: 'Mock interviews', detail: i.mocksDone ? `${i.mocksDone} done · last ${i.lastMockScore ?? '—'}` : 'None yet', ratio: mocks, weight: 0.3 },
    { key: 'lessons', label: 'Lessons for this role', detail: `${i.lessonsCovered} covered`, ratio: lessons, weight: 0.25 },
    { key: 'news', label: 'Current events', detail: `${i.currentEventsAnswered} answered`, ratio: news, weight: 0.15 },
  ];
  const percent = Math.round(parts.reduce((sum, p) => sum + p.ratio * p.weight, 0) * 100);
  return { percent, parts };
}

export interface SprintDay {
  day: number;
  dateLabel: string;
  concept: string;
  mock: string;
  /** What to do that day, e.g. "Technical question" or "Brief line: Buyer ≠ User". */
  label: string;
  kind: 'technical' | 'behavioral' | 'concept' | 'news' | 'brief' | 'full';
  news: { title: string; howToMention: string } | null;
  fullMock: boolean;
}

/** A concept subtitle must describe a concept task, not falsely ground a bank question. */
export function planConceptSubtitle(day: SprintDay): string | null {
  if (day.kind !== 'concept' && day.kind !== 'brief') return null;
  return day.label.toLowerCase().includes(day.concept.toLowerCase()) ? null : day.concept;
}

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** 'YYYY-MM-DD' → 'Oct 12'. Fixed English format so every screen reads the same. */
export function shortDate(iso?: string | null): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return '';
  const [, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}
function dateLabel(iso: string): string { return shortDate(iso); }

/** Interviewer persona that matches a role track. */
export function personaForTrack(track: RoleTrack | null): 'consultant' | 'tech_lead' | 'recruiter' {
  return track === 'behavioral' ? 'recruiter' : track === 'case' ? 'consultant' : 'tech_lead';
}

/**
 * Day-by-day sprint ending in a full mock. Days rotate through five line types —
 * concept, behavioral question, technical question, news item, Brief line — so a
 * short concept list never repeats the same line two days in a row.
 */
export function buildSprintPlan(opts: {
  target: InterviewTarget;
  daysLeft: number;
  concepts: string[];
  news: string[];
  today?: string;
  /** Real role questions; today's card and plan rows draw from these. */
  bank?: { technical: string[]; behavioral: string[] };
}): SprintDay[] {
  const today = opts.today || localDateString();
  const total = Math.max(1, Math.min(14, opts.daysLeft + 1));
  const company = opts.target.company || 'the company';
  const role = opts.target.role || 'the role';
  const concepts = opts.concepts.length ? opts.concepts : ['Your strongest market idea'];
  const conceptAt = (i: number) => concepts[i % concepts.length];
  const tech = opts.bank?.technical || [];
  const behav = opts.bank?.behavioral || [];
  // Day seed so today's question changes every day and never repeats two days running.
  const seed = Math.floor(Date.parse(`${today}T00:00:00Z`) / 86400000) || 0;
  const foundationsFirst = isEarlyCareerRole(opts.target.role);
  const pickQ = (list: string[], n: number) => list[((foundationsFirst ? 0 : seed) + n) % list.length];
  type Line = { kind: SprintDay['kind']; label: string; mock: string; newsTitle?: string };
  const qKinds: Array<(n: number, c: string) => Line> = [];
  if (tech.length) qKinds.push(n => ({ kind: 'technical', label: 'Technical question', mock: pickQ(tech, n) }));
  if (behav.length) qKinds.push(n => ({ kind: 'behavioral', label: 'Behavioral question', mock: pickQ(behav, n) }));
  if (!qKinds.length) qKinds.push((_n, c) => ({ kind: 'concept', label: 'Concept question', mock: `Explain ${c.toLowerCase()} to a ${company} interviewer in ninety seconds.` }));
  if (qKinds.length === 2 && (foundationsFirst || seed % 2 === 1)) qKinds.reverse();
  const slots: Array<(i: number, c: string, n: number) => Line> = qKinds.map(f => (_i: number, c: string, n: number) => f(n, c));
  if (opts.news.length) slots.push(i => { const t = opts.news[i % opts.news.length]; return { kind: 'news', label: `Current events: ${t}`, mock: `Be ready to discuss: ${t}`, newsTitle: t }; });
  slots.push((_i, c) => ({ kind: 'brief', label: `Brief line: ${c}`, mock: `Write one Brief line about ${c.toLowerCase()} you could say out loud.` }));
  const out: SprintDay[] = [];
  const counts = new Map<number, number>();
  for (let i = 0; i < total; i++) {
    const last = i === total - 1 && total > 1;
    const c = conceptAt(i);
    const slot = i % slots.length;
    const n = counts.get(slot) || 0; counts.set(slot, n + 1);
    const entry = slots[slot](i, c, n);
    out.push({
      day: i + 1,
      dateLabel: dateLabel(addDays(today, i)),
      concept: c,
      mock: last ? `Full mock interview for ${role} at ${company}.` : entry.mock,
      label: last ? 'Full mock interview' : entry.label,
      kind: last ? 'full' : entry.kind,
      news: !last && entry.newsTitle
        ? { title: entry.newsTitle, howToMention: `Bring it up when they ask what's changing in the industry: say what happened, then what it means for ${company}.` }
        : null,
      fullMock: last,
    });
  }
  return out;
}

/** Week key (local Monday) for the weekly "stay ready" check. */
export function weekKey(today = localDateString()): string {
  const [y, m, d] = today.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - dow);
  return dt.toISOString().slice(0, 10);
}
