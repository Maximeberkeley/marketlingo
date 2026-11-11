const DOUBLE_XP_ID = "double-xp";
const DOUBLE_XP_MINUTES = 15;
const DOUBLE_XP_MS = DOUBLE_XP_MINUTES * 6e4;
const STREAK_REPAIR_ID = "streak-repair";
const STREAK_REPAIR_PRICE = 1200;
const REPAIR_MIN_STREAK = 7;
const REPAIR_MAX_MISSED_DAYS = 2;
const REPAIR_COOLDOWN_DAYS = 30;
const NOT_BOOSTED = /* @__PURE__ */ new Set(["weekly_case", "streak_bonus", "quest", "lesson", "friend_reward", "friendship_reward", "milestone", "demo_reward"]);
const isBoostable = (sourceType) => !NOT_BOOSTED.has(sourceType) && !/reward|bonus|refund|adjust/i.test(sourceType);
const doubleXpActive = (until, now) => !!until && until > now;
function boostedAmount(amount, sourceType, until, now) {
  if (!(doubleXpActive(until, now) && isBoostable(sourceType)) || !(amount > 0)) return amount;
  return Math.round(amount) * 2;
}
const boostMinutes = (until, now) => Math.max(0, Math.ceil((until - now) / 6e4));
function boostClock(until, now) {
  const s = Math.max(0, Math.ceil((until - now) / 1e3));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
const REPAIR_COPY = {
  no_streak: "Start a streak first. Repair brings back one you lost.",
  not_broken: "Your streak is safe. Nothing to repair.",
  too_late: "Repair works for 48 hours after a streak breaks. This one is past that.",
  too_short: `Repair is for streaks of ${REPAIR_MIN_STREAK} days or more.`,
  used_recently: `One repair every ${REPAIR_COOLDOWN_DAYS} days.`,
  unavailable: "Streak Repair is not ready yet. Check back soon."
};
function repairFromJson(raw) {
  const r = raw ?? {};
  const known = ["eligible", "no_streak", "not_broken", "too_late", "too_short", "used_recently"];
  return {
    reason: known.includes(r.reason) ? r.reason : "unavailable",
    lostStreak: Math.max(0, Number(r.lost_streak) || 0),
    missedDays: Array.isArray(r.missed_days) ? r.missed_days.map(String) : [],
    availableAgain: r.available_again ?? null
  };
}
function repairRule(today, kept, lastRepairAt, now) {
  const day = (offset) => shiftDay(today, offset);
  let back = 1;
  while (back <= 400 && !kept(day(-back))) back++;
  if (back > 400) return { reason: "no_streak", lostStreak: 0, missedDays: [], availableAgain: null };
  const gap = back - 1;
  if (gap === 0) return { reason: "not_broken", lostStreak: 0, missedDays: [], availableAgain: null };
  let lost = 0;
  while (lost < 400 && kept(day(-back - lost))) lost++;
  const missedDays = Array.from({ length: gap }, (_, i) => day(-back + 1 + i));
  if (gap > REPAIR_MAX_MISSED_DAYS) return { reason: "too_late", lostStreak: lost, missedDays, availableAgain: null };
  if (lost < REPAIR_MIN_STREAK) return { reason: "too_short", lostStreak: lost, missedDays, availableAgain: null };
  const again = lastRepairAt ? lastRepairAt + REPAIR_COOLDOWN_DAYS * 864e5 : 0;
  if (again > now) return { reason: "used_recently", lostStreak: lost, missedDays, availableAgain: new Date(again).toISOString() };
  return { reason: "eligible", lostStreak: lost, missedDays, availableAgain: null };
}
function shiftDay(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}
export {
  DOUBLE_XP_ID,
  DOUBLE_XP_MINUTES,
  DOUBLE_XP_MS,
  REPAIR_COOLDOWN_DAYS,
  REPAIR_COPY,
  REPAIR_MAX_MISSED_DAYS,
  REPAIR_MIN_STREAK,
  STREAK_REPAIR_ID,
  STREAK_REPAIR_PRICE,
  boostClock,
  boostMinutes,
  boostedAmount,
  doubleXpActive,
  isBoostable,
  repairFromJson,
  repairRule,
  shiftDay
};
