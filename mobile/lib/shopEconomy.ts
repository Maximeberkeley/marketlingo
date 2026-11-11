/**
 * The XP Shop's rules, kept pure so the screens and the tests agree.
 *
 * One user-facing balance called XP: XP earned (lifetime, never goes down) minus XP spent. Spending never touches
 * XP earned, so friend races, the crown, levels and milestones keep reading earned. The server is the authority
 * (shop_balance, shop_purchase); these helpers decide what the phone shows and enables.
 */
import { CROWN_ID, Cosmetic, DEFAULT_HAT, MAX_FREEZES_HELD, Requirements, Slot, SLOT_ORDER, priceOf } from './shopCatalog';

export interface Balance { earned: number; spent: number; balance: number }

/** XP to spend: earned minus spent, never below zero. */
export function spendable(earned: number, spent: number): Balance {
  const e = Math.max(0, Math.floor(earned || 0));
  const s = Math.max(0, Math.floor(spent || 0));
  return { earned: e, spent: s, balance: Math.max(0, e - s) };
}

// ── Milestones (read XP earned, never the balance) ───────────────────────────
export const MILESTONES = [1000, 2500, 5000, 10000, 25000, 50000, 100000];

export function milestoneProgress(earned: number) {
  const reached = MILESTONES.filter(m => earned >= m);
  const next = MILESTONES.find(m => earned < m) ?? null;
  const prev = reached.length ? reached[reached.length - 1] : 0;
  const progress = next === null ? 1 : Math.max(0, Math.min(1, (earned - prev) / (next - prev)));
  return { reached, next, prev, progress, toGo: next === null ? 0 : next - earned };
}

// ── Can this be bought? ──────────────────────────────────────────────────────
export type BuyBlock = 'owned' | 'no_art' | 'earn_only' | 'coming_soon' | 'max_held' | 'requirement' | 'not_enough';
export interface BuyContext {
  price: number | null;
  balance: number;
  owned?: boolean;
  hasArt?: boolean;
  earnOnly?: boolean;
  comingSoon?: boolean;
  /** Freezes: how many are held now. */
  held?: number;
  requirementsMet?: boolean;
}

/** The first reason a purchase is blocked, in the order a learner would want to hear it, or null when it can go. */
export function buyBlock(ctx: BuyContext): BuyBlock | null {
  if (ctx.comingSoon) return 'coming_soon';
  if (ctx.earnOnly || ctx.price === null) return 'earn_only';
  if (ctx.hasArt === false) return 'no_art';
  if (ctx.owned) return 'owned';
  if (ctx.held !== undefined && ctx.held >= MAX_FREEZES_HELD) return 'max_held';
  if (ctx.requirementsMet === false) return 'requirement';
  if (ctx.balance < ctx.price) return 'not_enough';
  return null;
}

export const BLOCK_LABEL: Record<BuyBlock, string> = {
  owned: 'Owned',
  no_art: 'Art soon',
  earn_only: 'Earn it',
  coming_soon: 'Coming soon',
  max_held: 'You hold 2',
  requirement: 'Locked',
  not_enough: 'Not enough XP',
};

// ── Daily deals: the same three for everyone on a local date ─────────────────
export const DEAL_COUNT = 3;
export const DEAL_DISCOUNT = 0.3;

/** FNV-1a: tiny, stable across devices, good enough to shuffle a catalog. */
export function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export const dealPrice = (price: number) => Math.max(10, Math.round((price * (1 - DEAL_DISCOUNT)) / 10) * 10);

/**
 * Picks the day's deals from items that can be bought and have art. The server keeps its own list
 * (shop_daily_deals) and honours only that one; this is the phone's preview when the server is unreachable.
 */
export function dailyDeals(items: Cosmetic[], localDate: string, count = DEAL_COUNT): { item: Cosmetic; price: number; dealPrice: number }[] {
  return items
    .filter(c => priceOf(c) !== null && !c.hidden)
    .map(c => ({ c, h: fnv1a(`${localDate}|${c.id}`) }))
    .sort((a, b) => a.h - b.h || a.c.id.localeCompare(b.c.id))
    .slice(0, count)
    .map(({ c }) => ({ item: c, price: priceOf(c)!, dealPrice: dealPrice(priceOf(c)!) }));
}

/** ISO week key ("2026-W46") for the weekly featured offer. */
export function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const year = t.getUTCFullYear();
  const week = Math.ceil(((t.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** One featured offer per week, rotating through the candidates. */
export function weeklyFeature<T extends { id: string }>(candidates: T[], now: Date): T | null {
  if (!candidates.length) return null;
  const sorted = [...candidates].sort((a, b) => a.id.localeCompare(b.id));
  return sorted[fnv1a(isoWeekKey(now)) % sorted.length];
}

// ── Countdowns ───────────────────────────────────────────────────────────────
export function msUntilLocalMidnight(now: Date): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

/** Until next Monday 00:00 local, when the weekly offer changes. */
export function msUntilNextMonday(now: Date): number {
  const next = new Date(now);
  const day = next.getDay(); // 0 Sunday
  next.setDate(next.getDate() + ((8 - day) % 7 || 7));
  next.setHours(0, 0, 0, 0);
  return next.getTime() - now.getTime();
}

const pad = (n: number) => String(n).padStart(2, '0');
/** "06:42:10" under a day, "2d 14h 03m" beyond. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return d > 0 ? `${d}d ${h}h ${pad(m)}m` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// ── Earn-only items ──────────────────────────────────────────────────────────
export interface EarnStats {
  /** Best streak ever across industries (never the current one). */
  bestStreak: number;
  /** XP earned, never the balance. */
  xpEarned: number;
  weeklyCasesSubmitted: number;
  lessonsCompleted: number;
  weeklyCaseTop3?: boolean;
}

export interface Progress { met: boolean; current: number; target: number; label: string }

/** Progress toward an item's requirements; the first unmet one is the one to show. */
export function requirementProgress(req: Requirements | undefined, s: EarnStats): Progress {
  const checks: Progress[] = [];
  if (req?.min_streak_days) checks.push({ met: s.bestStreak >= req.min_streak_days, current: Math.min(s.bestStreak, req.min_streak_days), target: req.min_streak_days, label: `Reach a ${req.min_streak_days}-day streak` });
  if (req?.min_xp_earned) checks.push({ met: s.xpEarned >= req.min_xp_earned, current: Math.min(s.xpEarned, req.min_xp_earned), target: req.min_xp_earned, label: `Earn ${req.min_xp_earned.toLocaleString('en-US')} XP in total` });
  if (req?.weekly_case_submitted_count) {
    const n = req.weekly_case_submitted_count;
    checks.push({ met: s.weeklyCasesSubmitted >= n, current: Math.min(s.weeklyCasesSubmitted, n), target: n, label: n === 1 ? 'Submit a Weekly Case' : `Submit ${n} Weekly Cases` });
  }
  if (req?.requires_weekly_case_submission) checks.push({ met: s.weeklyCasesSubmitted >= 1, current: Math.min(s.weeklyCasesSubmitted, 1), target: 1, label: 'Finish a Weekly Case' });
  if (req?.min_lessons_completed) checks.push({ met: s.lessonsCompleted >= req.min_lessons_completed, current: Math.min(s.lessonsCompleted, req.min_lessons_completed), target: req.min_lessons_completed, label: `Finish ${req.min_lessons_completed} lessons in one industry` });
  if (req?.weekly_case_top3) checks.push({ met: !!s.weeklyCaseTop3, current: s.weeklyCaseTop3 ? 1 : 0, target: 1, label: 'Finish top 3 among friends in a Weekly Case' });
  if (!checks.length) return { met: true, current: 1, target: 1, label: '' };
  return checks.find(c => !c.met) ?? checks[0];
}

// ── Leo's look ───────────────────────────────────────────────────────────────
export type Look = Partial<Record<Slot, string>>;
export const DEFAULT_LOOK: Look = { hat: DEFAULT_HAT };

export type LayerKey = 'base' | string;
/**
 * The layers to stack, bottom to top: background, cape, the base Leo, outfit, glasses, hat, held, frame.
 * The live crown takes the hat slot while its wearer holds it. Items without art are skipped.
 */
export function avatarLayers(look: Look | null | undefined, opts: { crown?: boolean; hasArt: (id: string) => boolean }): LayerKey[] {
  const worn: Look = { ...DEFAULT_LOOK, ...(look ?? {}) };
  if (opts.crown) worn.hat = CROWN_ID;
  const out: LayerKey[] = [];
  for (const slot of SLOT_ORDER) {
    if (slot === 'outfit') out.push('base');
    const id = worn[slot];
    if (id && opts.hasArt(id)) out.push(id);
  }
  return out;
}

/** Rows from user_equipped into a look. A null item is a slot left empty on purpose (''), e.g. a bare head. */
export function lookFromRows(rows: { slot: string; item_id: string | null }[] | null | undefined): Look {
  const look: Look = {};
  for (const r of rows ?? []) if ((SLOT_ORDER as string[]).includes(r.slot)) look[r.slot as Slot] = r.item_id ?? '';
  return look;
}

/** A look from get_equipped_looks' jsonb ({"hat": "astro-helmet", "glasses": null}). */
export function lookFromJson(json: Record<string, string | null> | null | undefined): Look {
  return lookFromRows(Object.entries(json ?? {}).map(([slot, item_id]) => ({ slot, item_id })));
}

/** A fresh idempotency key per tap, so a retried purchase never charges twice. */
export function idemKey(): string {
  const hex = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 32; i++) s += hex[Math.floor(Math.random() * 16)];
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-4${s.slice(13, 16)}-${hex[8 + Math.floor(Math.random() * 4)]}${s.slice(17, 20)}-${s.slice(20, 32)}`;
}

/** Monday of the local week, as the streak freeze table keys it. */
export function weekOf(now: Date): string {
  const d = new Date(now);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  const y = d.getFullYear();
  return `${y}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
