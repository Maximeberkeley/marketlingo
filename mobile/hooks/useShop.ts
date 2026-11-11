/**
 * The learner's shop state in one shared store: XP to spend, what they own and wear, today's deals, perk
 * waitlists and the numbers behind earn-only items. Every screen reads the same store, so buying in the try-on
 * updates the Shop, the wardrobe, Home's XP pill and Profile at once.
 *
 * Until the shop migration is applied the server functions are missing: `available` stays false, the balance
 * falls back to XP earned, nothing can be bought, and Leo wears the default cap.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { localDateString } from '../lib/dayMath';
import { useAuth } from './useAuth';
import { COSMETICS, Slot, cosmetic, priceOf } from '../lib/shopCatalog';
import { ART_READY_IDS } from '../lib/shopArtIds';
import { Balance, EarnStats, Look, dailyDeals, idemKey, lookFromRows, spendable } from '../lib/shopEconomy';

export interface OwnedItem { qty: number; source: string; seenAt: string | null }
export interface Deal { itemId: string; price: number; dealPrice: number }
export interface ShopState {
  ready: boolean;
  /** The shop migration is live: buying, equipping and waitlists work. */
  available: boolean;
  balance: Balance;
  owned: Record<string, OwnedItem>;
  look: Look;
  wearsCrown: boolean;
  deals: Deal[];
  dealDate: string;
  perks: Record<string, { waitlist: number; joined: boolean }>;
  stats: EarnStats;
}

const ART = new Set(ART_READY_IDS);
const EMPTY: ShopState = {
  ready: false,
  available: false,
  balance: spendable(0, 0),
  owned: {},
  look: {},
  wearsCrown: false,
  deals: [],
  dealDate: localDateString(),
  perks: {},
  stats: { bestStreak: 0, xpEarned: 0, weeklyCasesSubmitted: 0, lessonsCompleted: 0 },
};

// ── Shared store ────────────────────────────────────────────────────────────
let state: ShopState = EMPTY;
let storeUser: string | null = null;
let inflight: Promise<void> | null = null;
const listeners = new Set<(s: ShopState) => void>();
const emit = (next: Partial<ShopState>) => {
  state = { ...state, ...next };
  listeners.forEach(fn => fn(state));
};
const lookKey = (uid: string) => `ml_leo_look_v1/${uid}`;

const isMissing = (error: { code?: string; message?: string } | null | undefined) =>
  !!error && (error.code === 'PGRST202' || error.code === '42883' || error.code === '42P01' || /does not exist|Could not find/i.test(error.message || ''));

/** The day's deals: the server's list when it has one, otherwise the phone's preview of the same rule. */
function localDeals(date: string): Deal[] {
  return dailyDeals(COSMETICS.filter(c => ART.has(c.id)), date).map(d => ({ itemId: d.item.id, price: d.price, dealPrice: d.dealPrice }));
}

async function load(uid: string): Promise<void> {
  const date = localDateString();
  // Leo shows up at once from the last look saved on this device.
  if (!state.ready) {
    try {
      const raw = await AsyncStorage.getItem(lookKey(uid));
      if (raw) emit({ look: JSON.parse(raw) });
    } catch { /* first open */ }
  }
  const [bal, inv, eq, looks, deals, perks, progress, xp, cases] = await Promise.all([
    supabase.rpc('shop_balance'),
    supabase.from('user_inventory').select('item_id, qty, source, seen_at').eq('user_id', uid),
    supabase.from('user_equipped').select('slot, item_id').eq('user_id', uid),
    supabase.rpc('get_equipped_looks', { p_user_ids: [uid] }),
    supabase.rpc('shop_daily_deals', { p_date: date }),
    supabase.rpc('shop_perks'),
    supabase.from('user_progress').select('longest_streak, completed_stacks').eq('user_id', uid),
    supabase.from('user_xp').select('total_xp').eq('user_id', uid),
    supabase.from('weekly_case_submissions').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'submitted'),
  ]);
  const available = !bal.error;
  if (bal.error && !isMissing(bal.error)) log.warn('[Shop] Balance could not load:', bal.error.message);
  const earnedFallback = ((xp.data ?? []) as { total_xp: number | null }[]).reduce((sum, r) => sum + (Number(r.total_xp) || 0), 0);
  const b = Array.isArray(bal.data) ? bal.data[0] : bal.data;
  const balance = available && b ? spendable(Number(b.earned) || 0, Number(b.spent) || 0) : spendable(earnedFallback, 0);

  const owned: Record<string, OwnedItem> = {};
  for (const r of (inv.data ?? []) as { item_id: string; qty: number; source: string; seen_at: string | null }[]) {
    owned[r.item_id] = { qty: Number(r.qty) || 0, source: r.source, seenAt: r.seen_at };
  }
  const look = eq.error ? state.look : lookFromRows(eq.data as { slot: string; item_id: string }[]);
  const me = Array.isArray(looks.data) ? (looks.data as { wears_crown: boolean }[])[0] : null;
  const dealRows = Array.isArray(deals.data) ? (deals.data as { item_id: string; price: number; deal_price: number }[]) : null;
  const perkMap: ShopState['perks'] = {};
  for (const r of (Array.isArray(perks.data) ? perks.data : []) as { item_id: string; waitlist: number; joined: boolean }[]) {
    perkMap[r.item_id] = { waitlist: Number(r.waitlist) || 0, joined: !!r.joined };
  }
  const rows = (progress.data ?? []) as { longest_streak: number | null; completed_stacks: string[] | null }[];
  const stats: EarnStats = {
    bestStreak: rows.reduce((m, r) => Math.max(m, Number(r.longest_streak) || 0), 0),
    lessonsCompleted: rows.reduce((m, r) => Math.max(m, r.completed_stacks?.length ?? 0), 0),
    xpEarned: balance.earned,
    weeklyCasesSubmitted: cases.count ?? 0,
  };
  emit({
    ready: true,
    available,
    balance,
    owned,
    look,
    wearsCrown: !!me?.wears_crown,
    deals: dealRows?.length ? dealRows.map(r => ({ itemId: r.item_id, price: r.price, dealPrice: r.deal_price })) : localDeals(date),
    dealDate: date,
    perks: perkMap,
    stats,
  });
  if (!eq.error) AsyncStorage.setItem(lookKey(uid), JSON.stringify(look)).catch(() => {});
}

export function refreshShop(uid: string | null | undefined): Promise<void> {
  if (!uid) return Promise.resolve();
  if (storeUser !== uid) { storeUser = uid; state = EMPTY; }
  if (!inflight) inflight = load(uid).catch(e => log.warn('[Shop] Could not load:', e)).finally(() => { inflight = null; });
  return inflight;
}

export type PurchaseResult = { ok: true; balance: number } | { ok: false; error: string; requirement?: string };

/** Owned (bought, earned or free), so it can be worn. */
export function ownsItem(s: ShopState, id: string): boolean {
  const c = cosmetic(id);
  if (c?.acquisition === 'default') return true;
  return (s.owned[id]?.qty ?? 0) > 0;
}

export function useShop() {
  const { user } = useAuth();
  const [snap, setSnap] = useState<ShopState>(state);
  useEffect(() => {
    listeners.add(setSnap);
    setSnap(state);
    return () => { listeners.delete(setSnap); };
  }, []);
  useEffect(() => { void refreshShop(user?.id); }, [user?.id]);

  const refresh = useCallback(() => refreshShop(user?.id), [user?.id]);

  /** Buys through the server (one idempotency key per tap); a deal date applies today's discount if the item is in it. */
  const purchase = useCallback(async (itemId: string, opts: { dealDate?: string } = {}): Promise<PurchaseResult> => {
    if (!user) return { ok: false, error: 'signed_out' };
    const { data, error } = await supabase.rpc('shop_purchase', { p_item_id: itemId, p_idem_key: idemKey(), p_deal_date: opts.dealDate ?? null });
    if (error) return { ok: false, error: isMissing(error) ? 'unavailable' : error.message };
    const r = data as { ok: boolean; error?: string; requirement?: string; balance?: number };
    if (!r?.ok) return { ok: false, error: r?.error || 'failed', requirement: r?.requirement };
    await refreshShop(user.id);
    return { ok: true, balance: Number(r.balance) || state.balance.balance };
  }, [user]);

  /** Wears an item (or leaves the slot empty with null). Shows at once; the server confirms. */
  const equip = useCallback(async (slot: Slot, itemId: string | null): Promise<boolean> => {
    if (!user) return false;
    const previous = state.look;
    const look = { ...state.look, [slot]: itemId ?? '' };
    emit({ look });
    AsyncStorage.setItem(lookKey(user.id), JSON.stringify(look)).catch(() => {});
    const { data, error } = await supabase.rpc('shop_equip', { p_slot: slot, p_item_id: itemId });
    if (error || !(data as { ok?: boolean })?.ok) {
      if (error && !isMissing(error)) log.warn('[Shop] Could not equip:', error.message);
      if (!isMissing(error)) emit({ look: previous });
      return false;
    }
    return true;
  }, [user]);

  const joinWaitlist = useCallback(async (perkId: string): Promise<boolean> => {
    if (!user) return false;
    const before = state.perks[perkId];
    emit({ perks: { ...state.perks, [perkId]: { waitlist: (before?.waitlist ?? 0) + (before?.joined ? 0 : 1), joined: true } } });
    const { data, error } = await supabase.rpc('shop_join_waitlist', { p_item_id: perkId, p_consent: false });
    if (error) {
      emit({ perks: { ...state.perks, [perkId]: before ?? { waitlist: 0, joined: false } } });
      return false;
    }
    emit({ perks: { ...state.perks, [perkId]: { waitlist: Number(data) || 1, joined: true } } });
    return true;
  }, [user]);

  /** Grants any earn-only item the learner now qualifies for; returns what is new. */
  const checkRewards = useCallback(async (): Promise<{ id: string; name: string }[]> => {
    if (!user) return [];
    const { data, error } = await supabase.rpc('shop_check_rewards');
    if (error || !Array.isArray(data)) return [];
    const granted = (data as { item_id: string; name: string }[]).map(r => ({ id: r.item_id, name: r.name }));
    if (granted.length) await refreshShop(user.id);
    return granted;
  }, [user]);

  const markSeen = useCallback(async (ids: string[]) => {
    if (!user || !ids.length) return;
    const owned = { ...state.owned };
    const now = new Date().toISOString();
    for (const id of ids) if (owned[id]) owned[id] = { ...owned[id], seenAt: now };
    emit({ owned });
    await supabase.rpc('shop_mark_seen', { p_item_ids: ids });
  }, [user]);

  return { ...snap, refresh, purchase, equip, joinWaitlist, checkRewards, markSeen, owns: (id: string) => ownsItem(snap, id) };
}

/** Price the learner pays today: the deal price when the item is in today's deals. */
export function todaysPrice(s: Pick<ShopState, 'deals'>, itemId: string): { price: number | null; deal: Deal | null } {
  const c = cosmetic(itemId);
  const deal = s.deals.find(d => d.itemId === itemId) ?? null;
  return { price: deal ? deal.dealPrice : c ? priceOf(c) : null, deal };
}

export const hasArt = (id: string) => ART.has(id);
