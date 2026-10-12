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

/** Tech roles get technical/certification questions, recruiters get STAR stories, consultants get cases. */
export function roleTrack(role?: string | null): RoleTrack {
  const r = (role || '').toLowerCase();
  if (/(recruit|talent|hr\b|human resources|people ops|sourcer)/.test(r)) return 'behavioral';
  if (/(consult|strategy|advisor|analyst at|associate at|case)/.test(r)) return 'case';
  if (/(tech|engineer|developer|architect|lead|scientist|devops|data|it\b|cto|software|technical)/.test(r)) return 'technical';
  return 'case';
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
  news: { title: string; howToMention: string } | null;
  fullMock: boolean;
}

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

function dateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Day-by-day sprint: 1 concept, 1 company mock question, 1 news item; the last day is a full mock. */
export function buildSprintPlan(opts: {
  target: InterviewTarget;
  daysLeft: number;
  concepts: string[];
  news: string[];
  today?: string;
}): SprintDay[] {
  const today = opts.today || localDateString();
  const total = Math.max(1, Math.min(14, opts.daysLeft + 1));
  const company = opts.target.company || 'the company';
  const track = roleTrack(opts.target.role);
  const mockFor = (concept: string) =>
    track === 'behavioral'
      ? `Tell ${company} about a time you handled ${concept.toLowerCase()} (STAR).`
      : track === 'technical'
        ? `How would you apply ${concept.toLowerCase()} in your first month at ${company}?`
        : `${company} asks: size the impact of ${concept.toLowerCase()} on their business.`;
  const out: SprintDay[] = [];
  for (let i = 0; i < total; i++) {
    const last = i === total - 1;
    const concept = opts.concepts.length ? opts.concepts[i % opts.concepts.length] : 'Your strongest market idea';
    const headline = opts.news.length ? opts.news[i % opts.news.length] : null;
    out.push({
      day: i + 1,
      dateLabel: dateLabel(addDays(today, i)),
      concept,
      mock: last ? `Full mock interview for ${opts.target.role || 'the role'} at ${company}.` : mockFor(concept),
      news: headline
        ? { title: headline, howToMention: `Bring it up when they ask what's changing in the industry: say what happened, then what it means for ${company}.` }
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
