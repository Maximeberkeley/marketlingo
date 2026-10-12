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

/**
 * Tech roles get technical/certification questions, recruiters get STAR stories,
 * consultants get cases. 'case' is only for roles that name consulting, strategy
 * or analyst work; anything unknown (and every student/intern role) is technical,
 * so engineering learners never get consulting cases or mental math.
 */
export function roleTrack(role?: string | null): RoleTrack {
  const r = (role || '').toLowerCase();
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
  news: { title: string; howToMention: string } | null;
  fullMock: boolean;
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
  return track === 'technical' ? 'tech_lead' : track === 'behavioral' ? 'recruiter' : 'consultant';
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
}): SprintDay[] {
  const today = opts.today || localDateString();
  const total = Math.max(1, Math.min(14, opts.daysLeft + 1));
  const company = opts.target.company || 'the company';
  const role = opts.target.role || 'the role';
  const concepts = opts.concepts.length ? opts.concepts : ['Your strongest market idea'];
  const conceptAt = (i: number) => concepts[i % concepts.length];
  const lines: Array<(i: number) => { concept: string; mock: string; newsTitle?: string }> = [
    i => { const c = conceptAt(i); return { concept: c, mock: `How would you apply ${c.toLowerCase()} in your first month at ${company}?` }; },
    i => { const c = conceptAt(i + 1); return { concept: c, mock: `Tell ${company} about a time you handled ${c.toLowerCase()} (STAR).` }; },
    i => { const c = conceptAt(i + 2); return { concept: c, mock: `Explain ${c.toLowerCase()} to a ${company} interviewer in ninety seconds.` }; },
    i => {
      const title = opts.news.length ? opts.news[i % opts.news.length] : null;
      return title
        ? { concept: 'Current events', mock: `Be ready to discuss: ${title}`, newsTitle: title }
        : { concept: conceptAt(i + 3), mock: `Write one Brief line about ${conceptAt(i + 3).toLowerCase()} you could say out loud.` };
    },
    i => { const c = conceptAt(i + 4); return { concept: c, mock: `Write one Brief line about ${c.toLowerCase()} you could say out loud.` }; },
  ];
  const out: SprintDay[] = [];
  let lastMock = '';
  for (let i = 0; i < total; i++) {
    const last = i === total - 1 && total > 1;
    let entry = lines[i % lines.length](i);
    if (entry.mock === lastMock) entry = lines[(i + 1) % lines.length](i);
    lastMock = entry.mock;
    out.push({
      day: i + 1,
      dateLabel: dateLabel(addDays(today, i)),
      concept: entry.concept,
      mock: last ? `Full mock interview for ${role} at ${company}.` : entry.mock,
      news: entry.newsTitle
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
