import AsyncStorage from "@react-native-async-storage/async-storage";
import { localDateString } from "./dayMath";
const key = (userId, marketId) => `ml_interview_target:${userId}:${marketId}`;
async function loadInterviewTarget(userId, marketId) {
  if (!userId || !marketId) return null;
  try {
    const raw = await AsyncStorage.getItem(key(userId, marketId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
async function saveInterviewTarget(userId, marketId, target) {
  if (!target) {
    await AsyncStorage.removeItem(key(userId, marketId));
    return;
  }
  await AsyncStorage.setItem(key(userId, marketId), JSON.stringify(target));
}
function roleTrack(role) {
  const r = (role || "").toLowerCase();
  if (/(recruit|talent|hr\b|human resources|people ops|sourcer)/.test(r)) return "behavioral";
  if (/(consult|strategy|advisor|analyst at|associate at|case)/.test(r)) return "case";
  if (/(tech|engineer|developer|architect|lead|scientist|devops|data|it\b|cto|software|technical)/.test(r)) return "technical";
  return "case";
}
const TRACK_LABEL = {
  technical: "Technical & certification questions",
  behavioral: "Behavioral (STAR) questions",
  case: "Case questions"
};
function daysUntil(date, today = localDateString()) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const diff = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 864e5);
  return diff;
}
function parseInterviewDate(input) {
  const s = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  let [a, b] = [Number(m[1]), Number(m[2])];
  let day = a, month = b;
  if (month > 12 && day <= 12) {
    day = b;
    month = a;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${m[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function computeReadiness(i) {
  const brief = i.briefTotal > 0 ? Math.min(1, i.briefWritten / i.briefTotal) : 0;
  const mockVolume = Math.min(1, i.mocksDone / 5);
  const mockQuality = i.lastMockScore != null ? Math.min(1, i.lastMockScore / 100) : 0;
  const mocks = i.mocksDone > 0 ? mockVolume * 0.5 + mockQuality * 0.5 : 0;
  const lessons = Math.min(1, i.lessonsCovered / 14);
  const news = Math.min(1, i.currentEventsAnswered / 5);
  const parts = [
    { key: "brief", label: "Interview Brief", detail: `${i.briefWritten} of ${i.briefTotal} sections written`, ratio: brief, weight: 0.3 },
    { key: "mocks", label: "Mock interviews", detail: i.mocksDone ? `${i.mocksDone} done \xB7 last ${i.lastMockScore ?? "\u2014"}` : "None yet", ratio: mocks, weight: 0.3 },
    { key: "lessons", label: "Lessons for this role", detail: `${i.lessonsCovered} covered`, ratio: lessons, weight: 0.25 },
    { key: "news", label: "Current events", detail: `${i.currentEventsAnswered} answered`, ratio: news, weight: 0.15 }
  ];
  const percent = Math.round(parts.reduce((sum, p) => sum + p.ratio * p.weight, 0) * 100);
  return { percent, parts };
}
function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function shortDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return "";
  const [, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}
function dateLabel(iso) {
  return shortDate(iso);
}
function personaForTrack(track) {
  return track === "technical" ? "tech_lead" : track === "behavioral" ? "recruiter" : "consultant";
}
function buildSprintPlan(opts) {
  const today = opts.today || localDateString();
  const total = Math.max(1, Math.min(14, opts.daysLeft + 1));
  const company = opts.target.company || "the company";
  const track = roleTrack(opts.target.role);
  const mockFor = (concept) => track === "behavioral" ? `Tell ${company} about a time you handled ${concept.toLowerCase()} (STAR).` : track === "technical" ? `How would you apply ${concept.toLowerCase()} in your first month at ${company}?` : `${company} asks: size the impact of ${concept.toLowerCase()} on their business.`;
  const out = [];
  for (let i = 0; i < total; i++) {
    const last = i === total - 1;
    const concept = opts.concepts.length ? opts.concepts[i % opts.concepts.length] : "Your strongest market idea";
    const headline = opts.news.length ? opts.news[i % opts.news.length] : null;
    out.push({
      day: i + 1,
      dateLabel: dateLabel(addDays(today, i)),
      concept,
      mock: last ? `Full mock interview for ${opts.target.role || "the role"} at ${company}.` : mockFor(concept),
      news: headline ? { title: headline, howToMention: `Bring it up when they ask what's changing in the industry: say what happened, then what it means for ${company}.` } : null,
      fullMock: last
    });
  }
  return out;
}
function weekKey(today = localDateString()) {
  const [y, m, d] = today.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - dow);
  return dt.toISOString().slice(0, 10);
}
export {
  TRACK_LABEL,
  buildSprintPlan,
  computeReadiness,
  daysUntil,
  loadInterviewTarget,
  parseInterviewDate,
  personaForTrack,
  roleTrack,
  saveInterviewTarget,
  shortDate,
  weekKey
};
