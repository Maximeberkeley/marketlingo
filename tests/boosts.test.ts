import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  DOUBLE_XP_ID, STREAK_REPAIR_PRICE, boostClock, boostMinutes, boostedAmount, doubleXpActive, isBoostable, repairFromJson, repairRule, shiftDay,
} from '../mobile/lib/boosts';
import { WEEKLY_CASE_XP } from '../mobile/lib/weeklyCase';
import { POWER_UPS } from '../mobile/lib/shopCatalog';
import { lessonRewards } from '../mobile/lesson-kit/screens/lessonRewards';

const read = (p: string) => readFileSync(p, 'utf8');
const NOW = Date.UTC(2026, 10, 11, 18);

describe('Weekly Case reward', () => {
  it('pays 200 XP as normal XP earned', () => {
    expect(WEEKLY_CASE_XP).toBe(200);
    expect(read('mobile/app/weekly-case.tsx')).toContain("addXP(WEEKLY_CASE_XP, 'weekly_case'");
  });
  it('grants one Double XP token per submitted case on the server', () => {
    const sql = read('drizzle/migrations/0063_double_xp_streak_repair.sql');
    expect(sql).toContain('AFTER INSERT OR UPDATE OF status ON public.weekly_case_submissions');
    expect(sql).toContain('PRIMARY KEY (user_id, case_id)');
  });
});

describe('Double XP', () => {
  it('is earn-only in the shop and never sold', () => {
    const p = POWER_UPS.find(x => x.id === DOUBLE_XP_ID)!;
    expect(p).toMatchObject({ live: true, earned: true, price: null });
    expect(read('drizzle/migrations/0063_double_xp_streak_repair.sql')).toContain("('double-xp', 'powerup', NULL, NULL, 'Double XP', NULL, 'reward'");
  });
  it('doubles boostable XP only while it runs', () => {
    const until = NOW + 60_000;
    expect(boostedAmount(100, 'arena', until, NOW)).toBe(200);
    expect(boostedAmount(40, 'deep_case', until, NOW)).toBe(80);
    expect(boostedAmount(100, 'arena', NOW - 1, NOW)).toBe(100);
    expect(boostedAmount(100, 'arena', 0, NOW)).toBe(100);
  });
  it('never doubles the case reward, bonuses, quests or the lesson (it itemizes its own line)', () => {
    for (const t of ['weekly_case', 'streak_bonus', 'quest', 'lesson', 'friend_reward', 'milestone']) expect(isBoostable(t)).toBe(false);
    for (const t of ['arena', 'deep_case', 'review', 'leo_call', 'game', 'interview_lab', 'investment_lab', 'extra_practice', 'bite']) expect(isBoostable(t)).toBe(true);
    expect(boostedAmount(200, 'weekly_case', NOW + 60_000, NOW)).toBe(200);
  });
  it('shows the lesson total it banks, with its own Double XP line', () => {
    const plain = lessonRewards(30, 100, 5, 4, 3, 120);
    const boosted = lessonRewards(30, 100, 5, 4, 3, 120, true);
    const sum = (l: { xp: number }[]) => l.reduce((s, x) => s + x.xp, 0);
    expect(boosted.at(-1)).toEqual({ label: 'Double XP', xp: sum(plain) });
    expect(sum(boosted)).toBe(sum(plain) * 2);
  });
  it('counts down', () => {
    expect(doubleXpActive(NOW + 1, NOW)).toBe(true);
    expect(boostClock(NOW + 15 * 60_000, NOW)).toBe('15:00');
    expect(boostClock(NOW + 61_500, NOW)).toBe('1:02');
    expect(boostMinutes(NOW + 61_500, NOW)).toBe(2);
  });
  it('the phone banks through addXP with the boost applied', () => {
    expect(read('mobile/hooks/useUserXP.ts')).toContain('boostedAmount(requested, sourceType, doubleXpUntil(), Date.now())');
  });
});

describe('Streak Repair', () => {
  const today = '2026-11-11';
  const keptSet = (days: number[]) => { const s = new Set(days.map(n => shiftDay(today, -n))); return (d: string) => s.has(d); };
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

  it('costs 1,200 XP and is live', () => {
    expect(STREAK_REPAIR_PRICE).toBe(1200);
    expect(POWER_UPS.find(p => p.id === 'streak-repair')).toMatchObject({ live: true, price: 1200 });
  });
  it('repairs a 7+ day streak with one or two missed days', () => {
    expect(repairRule(today, keptSet(range(2, 10)), null, NOW)).toMatchObject({ reason: 'eligible', lostStreak: 9, missedDays: ['2026-11-10'] });
    expect(repairRule(today, keptSet(range(3, 9)), null, NOW)).toMatchObject({ reason: 'eligible', lostStreak: 7, missedDays: ['2026-11-09', '2026-11-10'] });
  });
  it('refuses past 48 hours, short streaks, live streaks and a second repair within 30 days', () => {
    expect(repairRule(today, keptSet(range(4, 20)), null, NOW).reason).toBe('too_late');
    expect(repairRule(today, keptSet(range(2, 7)), null, NOW).reason).toBe('too_short');
    expect(repairRule(today, keptSet(range(1, 30)), null, NOW).reason).toBe('not_broken');
    expect(repairRule(today, keptSet([]), null, NOW).reason).toBe('no_streak');
    const r = repairRule(today, keptSet(range(2, 10)), NOW - 10 * 86_400_000, NOW);
    expect(r.reason).toBe('used_recently');
    expect(repairRule(today, keptSet(range(2, 10)), NOW - 31 * 86_400_000, NOW).reason).toBe('eligible');
  });
  it('reads the server answer, unknown or missing as unavailable', () => {
    expect(repairFromJson({ reason: 'eligible', lost_streak: 9, missed_days: ['2026-11-10'] })).toEqual({ reason: 'eligible', lostStreak: 9, missedDays: ['2026-11-10'], availableAgain: null });
    expect(repairFromJson(null).reason).toBe('unavailable');
  });
  it('the server applies the same limits', () => {
    const sql = read('drizzle/migrations/0063_double_xp_streak_repair.sql');
    expect(sql).toContain("IF v_back - 1 > 2 THEN");
    expect(sql).toContain('IF v_lost < 7 THEN');
    expect(sql).toContain("interval '30 days'");
    expect(sql).toContain("kind NOT IN ('shop', 'repair')");
  });
  it('repair days never use up the weekly free freeze', () => {
    expect(read('mobile/hooks/useStreakFreeze.ts')).toContain("row.kind !== 'shop' && row.kind !== 'repair'");
  });
});
