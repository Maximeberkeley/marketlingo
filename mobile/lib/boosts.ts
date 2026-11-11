/**
 * Double XP and Streak Repair: the rules the phone shows. The server decides (shop_use_double_xp,
 * shop_repair_status, shop_repair_streak); these helpers only keep screens and tests in agreement.
 *
 * Double XP is earn-only: one 15-minute token per submitted Weekly Case, never sold, so it can count for
 * friend races and the crown (everyone earns it the same way).
 * Streak Repair costs 1,200 XP (three freezes): within 48 hours of the break, for a lost streak of 7+ days,
 * once every 30 days. It covers the missed days the way a freeze does.
 */
export const DOUBLE_XP_ID = 'double-xp';
export const DOUBLE_XP_MINUTES = 15;
export const DOUBLE_XP_MS = DOUBLE_XP_MINUTES * 60_000;

export const STREAK_REPAIR_ID = 'streak-repair';
export const STREAK_REPAIR_PRICE = 1200;
export const REPAIR_MIN_STREAK = 7;
export const REPAIR_MAX_MISSED_DAYS = 2;
export const REPAIR_COOLDOWN_DAYS = 30;

/**
 * XP that never doubles: the Weekly Case reward itself (it grants the token), streak and friend bonuses, and
 * anything already itemized with its own Double XP line (the daily lesson).
 */
const NOT_BOOSTED = new Set(['weekly_case', 'streak_bonus', 'quest', 'lesson', 'friend_reward', 'friendship_reward', 'milestone', 'demo_reward']);

export const isBoostable = (sourceType: string) =>
  !NOT_BOOSTED.has(sourceType) && !/reward|bonus|refund|adjust/i.test(sourceType);

export const doubleXpActive = (until: number | null | undefined, now: number) => !!until && until > now;

/** Amount to bank: doubled while Double XP runs, for boostable sources. */
export function boostedAmount(amount: number, sourceType: string, until: number | null | undefined, now: number): number {
  if (!(doubleXpActive(until, now) && isBoostable(sourceType)) || !(amount > 0)) return amount;
  return Math.round(amount) * 2;
}

/** Whole minutes left, rounded up ("12 min left"), for screens that tick once a minute. */
export const boostMinutes = (until: number, now: number) => Math.max(0, Math.ceil((until - now) / 60_000));

/** "12:04" left on the boost. */
export function boostClock(until: number, now: number): string {
  const s = Math.max(0, Math.ceil((until - now) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export type RepairReason = 'eligible' | 'no_streak' | 'not_broken' | 'too_late' | 'too_short' | 'used_recently' | 'unavailable';

export interface RepairStatus {
  reason: RepairReason;
  lostStreak: number;
  missedDays: string[];
  /** ISO time when a repair is allowed again (used_recently). */
  availableAgain: string | null;
}

export const REPAIR_COPY: Record<Exclude<RepairReason, 'eligible'>, string> = {
  no_streak: 'Start a streak first. Repair brings back one you lost.',
  not_broken: 'Your streak is safe. Nothing to repair.',
  too_late: 'Repair works for 48 hours after a streak breaks. This one is past that.',
  too_short: `Repair is for streaks of ${REPAIR_MIN_STREAK} days or more.`,
  used_recently: `One repair every ${REPAIR_COOLDOWN_DAYS} days.`,
  unavailable: 'Streak Repair is not ready yet. Check back soon.',
};

export function repairFromJson(raw: unknown): RepairStatus {
  const r = (raw ?? {}) as { reason?: string; lost_streak?: number; missed_days?: string[]; available_again?: string | null };
  const known: RepairReason[] = ['eligible', 'no_streak', 'not_broken', 'too_late', 'too_short', 'used_recently'];
  return {
    reason: known.includes(r.reason as RepairReason) ? (r.reason as RepairReason) : 'unavailable',
    lostStreak: Math.max(0, Number(r.lost_streak) || 0),
    missedDays: Array.isArray(r.missed_days) ? r.missed_days.map(String) : [],
    availableAgain: r.available_again ?? null,
  };
}

/**
 * The same eligibility the server applies, from local facts: `kept` says whether a local day was finished or
 * frozen. Used by the tests to pin the rule; the phone always asks the server.
 */
export function repairRule(today: string, kept: (day: string) => boolean, lastRepairAt: number | null, now: number): RepairStatus {
  const day = (offset: number) => shiftDay(today, offset);
  let back = 1;
  while (back <= 400 && !kept(day(-back))) back++;
  if (back > 400) return { reason: 'no_streak', lostStreak: 0, missedDays: [], availableAgain: null };
  const gap = back - 1;
  if (gap === 0) return { reason: 'not_broken', lostStreak: 0, missedDays: [], availableAgain: null };
  let lost = 0;
  while (lost < 400 && kept(day(-back - lost))) lost++;
  const missedDays = Array.from({ length: gap }, (_, i) => day(-back + 1 + i));
  if (gap > REPAIR_MAX_MISSED_DAYS) return { reason: 'too_late', lostStreak: lost, missedDays, availableAgain: null };
  if (lost < REPAIR_MIN_STREAK) return { reason: 'too_short', lostStreak: lost, missedDays, availableAgain: null };
  const again = lastRepairAt ? lastRepairAt + REPAIR_COOLDOWN_DAYS * 86_400_000 : 0;
  if (again > now) return { reason: 'used_recently', lostStreak: lost, missedDays, availableAgain: new Date(again).toISOString() };
  return { reason: 'eligible', lostStreak: lost, missedDays, availableAgain: null };
}

/** "2026-11-10" plus n days, on the calendar (no time zones involved). */
export function shiftDay(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}
