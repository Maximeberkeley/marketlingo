import { CROWN_ID, DEFAULT_HAT, MAX_FREEZES_HELD, SLOT_ORDER, priceOf } from "./shopCatalog";
function spendable(earned, spent) {
  const e = Math.max(0, Math.floor(earned || 0));
  const s = Math.max(0, Math.floor(spent || 0));
  return { earned: e, spent: s, balance: Math.max(0, e - s) };
}
const MILESTONES = [1e3, 2500, 5e3, 1e4, 25e3, 5e4, 1e5];
function milestoneProgress(earned) {
  const reached = MILESTONES.filter((m) => earned >= m);
  const next = MILESTONES.find((m) => earned < m) ?? null;
  const prev = reached.length ? reached[reached.length - 1] : 0;
  const progress = next === null ? 1 : Math.max(0, Math.min(1, (earned - prev) / (next - prev)));
  return { reached, next, prev, progress, toGo: next === null ? 0 : next - earned };
}
function buyBlock(ctx) {
  if (ctx.comingSoon) return "coming_soon";
  if (ctx.earnOnly || ctx.price === null) return "earn_only";
  if (ctx.hasArt === false) return "no_art";
  if (ctx.owned) return "owned";
  if (ctx.held !== void 0 && ctx.held >= MAX_FREEZES_HELD) return "max_held";
  if (ctx.requirementsMet === false) return "requirement";
  if (ctx.balance < ctx.price) return "not_enough";
  return null;
}
const BLOCK_LABEL = {
  owned: "Owned",
  no_art: "Art soon",
  earn_only: "Earn it",
  coming_soon: "Coming soon",
  max_held: "You hold 2",
  requirement: "Locked",
  not_enough: "Not enough XP"
};
const DEAL_COUNT = 3;
const DEAL_DISCOUNT = 0.3;
function fnv1a(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
const dealPrice = (price) => Math.max(10, Math.round(price * (1 - DEAL_DISCOUNT) / 10) * 10);
function dailyDeals(items, localDate, count = DEAL_COUNT) {
  return items.filter((c) => priceOf(c) !== null && !c.hidden).map((c) => ({ c, h: fnv1a(`${localDate}|${c.id}`) })).sort((a, b) => a.h - b.h || a.c.id.localeCompare(b.c.id)).slice(0, count).map(({ c }) => ({ item: c, price: priceOf(c), dealPrice: dealPrice(priceOf(c)) }));
}
function isoWeekKey(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const year = t.getUTCFullYear();
  const week = Math.ceil(((t.getTime() - Date.UTC(year, 0, 1)) / 864e5 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
function weeklyFeature(candidates, now) {
  if (!candidates.length) return null;
  const sorted = [...candidates].sort((a, b) => a.id.localeCompare(b.id));
  return sorted[fnv1a(isoWeekKey(now)) % sorted.length];
}
function msUntilLocalMidnight(now) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}
function msUntilNextMonday(now) {
  const next = new Date(now);
  const day = next.getDay();
  next.setDate(next.getDate() + ((8 - day) % 7 || 7));
  next.setHours(0, 0, 0, 0);
  return next.getTime() - now.getTime();
}
const pad = (n) => String(n).padStart(2, "0");
function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1e3));
  const d = Math.floor(total / 86400);
  const h = Math.floor(total % 86400 / 3600);
  const m = Math.floor(total % 3600 / 60);
  const s = total % 60;
  return d > 0 ? `${d}d ${h}h ${pad(m)}m` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}
function requirementProgress(req, s) {
  const checks = [];
  if (req?.min_streak_days) checks.push({ met: s.bestStreak >= req.min_streak_days, current: Math.min(s.bestStreak, req.min_streak_days), target: req.min_streak_days, label: `Reach a ${req.min_streak_days}-day streak` });
  if (req?.min_xp_earned) checks.push({ met: s.xpEarned >= req.min_xp_earned, current: Math.min(s.xpEarned, req.min_xp_earned), target: req.min_xp_earned, label: `Earn ${req.min_xp_earned.toLocaleString("en-US")} XP in total` });
  if (req?.weekly_case_submitted_count) {
    const n = req.weekly_case_submitted_count;
    checks.push({ met: s.weeklyCasesSubmitted >= n, current: Math.min(s.weeklyCasesSubmitted, n), target: n, label: n === 1 ? "Submit a Weekly Case" : `Submit ${n} Weekly Cases` });
  }
  if (req?.requires_weekly_case_submission) checks.push({ met: s.weeklyCasesSubmitted >= 1, current: Math.min(s.weeklyCasesSubmitted, 1), target: 1, label: "Finish a Weekly Case" });
  if (req?.min_lessons_completed) checks.push({ met: s.lessonsCompleted >= req.min_lessons_completed, current: Math.min(s.lessonsCompleted, req.min_lessons_completed), target: req.min_lessons_completed, label: `Finish ${req.min_lessons_completed} lessons in one industry` });
  if (req?.weekly_case_top3) checks.push({ met: !!s.weeklyCaseTop3, current: s.weeklyCaseTop3 ? 1 : 0, target: 1, label: "Finish top 3 among friends in a Weekly Case" });
  if (!checks.length) return { met: true, current: 1, target: 1, label: "" };
  return checks.find((c) => !c.met) ?? checks[0];
}
const DEFAULT_LOOK = { hat: DEFAULT_HAT };
function avatarLayers(look, opts) {
  const worn = { ...DEFAULT_LOOK, ...look ?? {} };
  if (opts.crown) worn.hat = CROWN_ID;
  const out = [];
  for (const slot of SLOT_ORDER) {
    if (slot === "outfit") out.push("base");
    const id = worn[slot];
    if (id && opts.hasArt(id)) out.push(id);
  }
  return out;
}
function lookFromRows(rows) {
  const look = {};
  for (const r of rows ?? []) if (SLOT_ORDER.includes(r.slot)) look[r.slot] = r.item_id ?? "";
  return look;
}
function lookFromJson(json) {
  return lookFromRows(Object.entries(json ?? {}).map(([slot, item_id]) => ({ slot, item_id })));
}
function idemKey() {
  const hex = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < 32; i++) s += hex[Math.floor(Math.random() * 16)];
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-4${s.slice(13, 16)}-${hex[8 + Math.floor(Math.random() * 4)]}${s.slice(17, 20)}-${s.slice(20, 32)}`;
}
function weekOf(now) {
  const d = new Date(now);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  const y = d.getFullYear();
  return `${y}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export {
  BLOCK_LABEL,
  DEAL_COUNT,
  DEAL_DISCOUNT,
  DEFAULT_LOOK,
  MILESTONES,
  avatarLayers,
  buyBlock,
  dailyDeals,
  dealPrice,
  fnv1a,
  formatCountdown,
  idemKey,
  isoWeekKey,
  lookFromJson,
  lookFromRows,
  milestoneProgress,
  msUntilLocalMidnight,
  msUntilNextMonday,
  requirementProgress,
  spendable,
  weekOf,
  weeklyFeature
};
