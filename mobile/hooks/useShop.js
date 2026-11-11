import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { log } from "../lib/logger";
import { localDateString } from "../lib/dayMath";
import { useAuth } from "./useAuth";
import { COSMETICS, cosmetic, priceOf } from "../lib/shopCatalog";
import { ART_READY_IDS } from "../lib/shopArtIds";
import { dailyDeals, idemKey, lookFromRows, spendable } from "../lib/shopEconomy";
const ART = new Set(ART_READY_IDS);
const EMPTY = {
  ready: false,
  available: false,
  balance: spendable(0, 0),
  owned: {},
  look: {},
  wearsCrown: false,
  deals: [],
  dealDate: localDateString(),
  perks: {},
  stats: { bestStreak: 0, xpEarned: 0, weeklyCasesSubmitted: 0, lessonsCompleted: 0 }
};
let state = EMPTY;
let storeUser = null;
let inflight = null;
const listeners = /* @__PURE__ */ new Set();
const emit = (next) => {
  state = { ...state, ...next };
  listeners.forEach((fn) => fn(state));
};
const lookKey = (uid) => `ml_leo_look_v1/${uid}`;
const isMissing = (error) => !!error && (error.code === "PGRST202" || error.code === "42883" || error.code === "42P01" || /does not exist|Could not find/i.test(error.message || ""));
function localDeals(date) {
  return dailyDeals(COSMETICS.filter((c) => ART.has(c.id)), date).map((d) => ({ itemId: d.item.id, price: d.price, dealPrice: d.dealPrice }));
}
async function load(uid) {
  const date = localDateString();
  if (!state.ready) {
    try {
      const raw = await AsyncStorage.getItem(lookKey(uid));
      if (raw) emit({ look: JSON.parse(raw) });
    } catch {
    }
  }
  const [bal, inv, eq, looks, deals, perks, progress, xp, cases, placements] = await Promise.all([
    supabase.rpc("shop_balance"),
    supabase.from("user_inventory").select("item_id, qty, source, seen_at").eq("user_id", uid),
    supabase.from("user_equipped").select("slot, item_id").eq("user_id", uid),
    supabase.rpc("get_equipped_looks", { p_user_ids: [uid] }),
    supabase.rpc("shop_daily_deals", { p_date: date }),
    supabase.rpc("shop_perks"),
    supabase.from("user_progress").select("longest_streak, completed_stacks").eq("user_id", uid),
    supabase.from("user_xp").select("total_xp").eq("user_id", uid),
    supabase.from("weekly_case_submissions").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("status", "submitted"),
    supabase.from("weekly_case_placements").select("rank, board_size").eq("user_id", uid)
  ]);
  const available = !bal.error;
  if (bal.error && !isMissing(bal.error)) log.warn("[Shop] Balance could not load:", bal.error.message);
  const earnedFallback = (xp.data ?? []).reduce((sum, r) => sum + (Number(r.total_xp) || 0), 0);
  const b = Array.isArray(bal.data) ? bal.data[0] : bal.data;
  const balance = available && b ? spendable(Number(b.earned) || 0, Number(b.spent) || 0) : spendable(earnedFallback, 0);
  const owned = {};
  for (const r of inv.data ?? []) {
    owned[r.item_id] = { qty: Number(r.qty) || 0, source: r.source, seenAt: r.seen_at };
  }
  const look = eq.error ? state.look : lookFromRows(eq.data);
  const me = Array.isArray(looks.data) ? looks.data[0] : null;
  const dealRows = Array.isArray(deals.data) ? deals.data : null;
  const perkMap = {};
  for (const r of Array.isArray(perks.data) ? perks.data : []) {
    perkMap[r.item_id] = { waitlist: Number(r.waitlist) || 0, joined: !!r.joined };
  }
  const rows = progress.data ?? [];
  const stats = {
    bestStreak: rows.reduce((m, r) => Math.max(m, Number(r.longest_streak) || 0), 0),
    lessonsCompleted: rows.reduce((m, r) => Math.max(m, r.completed_stacks?.length ?? 0), 0),
    xpEarned: balance.earned,
    weeklyCasesSubmitted: cases.count ?? 0,
    ...podiumCounts(placements.data)
  };
  emit({
    ready: true,
    available,
    balance,
    owned,
    look,
    wearsCrown: !!me?.wears_crown,
    deals: dealRows?.length ? dealRows.map((r) => ({ itemId: r.item_id, price: r.price, dealPrice: r.deal_price })) : localDeals(date),
    dealDate: date,
    perks: perkMap,
    stats
  });
  if (!eq.error) AsyncStorage.setItem(lookKey(uid), JSON.stringify(look)).catch(() => {
  });
}
function podiumCounts(rows) {
  const real = (rows ?? []).filter((r) => Number(r.board_size) >= 3);
  const n = (rank) => real.filter((r) => Number(r.rank) === rank).length;
  return { podiumFirsts: n(1), podiumSeconds: n(2), podiumThirds: n(3) };
}
function refreshShop(uid) {
  if (!uid) return Promise.resolve();
  if (storeUser !== uid) {
    storeUser = uid;
    state = EMPTY;
  }
  if (!inflight) inflight = load(uid).catch((e) => log.warn("[Shop] Could not load:", e)).finally(() => {
    inflight = null;
  });
  return inflight;
}
function ownsItem(s, id) {
  const c = cosmetic(id);
  if (c?.acquisition === "default") return true;
  return (s.owned[id]?.qty ?? 0) > 0;
}
function useShop() {
  const { user } = useAuth();
  const [snap, setSnap] = useState(state);
  useEffect(() => {
    listeners.add(setSnap);
    setSnap(state);
    return () => {
      listeners.delete(setSnap);
    };
  }, []);
  useEffect(() => {
    void refreshShop(user?.id);
  }, [user?.id]);
  const refresh = useCallback(() => refreshShop(user?.id), [user?.id]);
  const purchase = useCallback(async (itemId, opts = {}) => {
    if (!user) return { ok: false, error: "signed_out" };
    const { data, error } = await supabase.rpc("shop_purchase", { p_item_id: itemId, p_idem_key: idemKey(), p_deal_date: opts.dealDate ?? null });
    if (error) return { ok: false, error: isMissing(error) ? "unavailable" : error.message };
    const r = data;
    if (!r?.ok) return { ok: false, error: r?.error || "failed", requirement: r?.requirement };
    await refreshShop(user.id);
    return { ok: true, balance: Number(r.balance) || state.balance.balance };
  }, [user]);
  const equip = useCallback(async (slot, itemId) => {
    if (!user) return false;
    const previous = state.look;
    const look = { ...state.look, [slot]: itemId ?? "" };
    emit({ look });
    AsyncStorage.setItem(lookKey(user.id), JSON.stringify(look)).catch(() => {
    });
    const { data, error } = await supabase.rpc("shop_equip", { p_slot: slot, p_item_id: itemId });
    if (error || !data?.ok) {
      if (error && !isMissing(error)) log.warn("[Shop] Could not equip:", error.message);
      if (!isMissing(error)) emit({ look: previous });
      return false;
    }
    return true;
  }, [user]);
  const joinWaitlist = useCallback(async (perkId) => {
    if (!user) return false;
    const before = state.perks[perkId];
    emit({ perks: { ...state.perks, [perkId]: { waitlist: (before?.waitlist ?? 0) + (before?.joined ? 0 : 1), joined: true } } });
    const { data, error } = await supabase.rpc("shop_join_waitlist", { p_item_id: perkId, p_consent: false });
    if (error) {
      emit({ perks: { ...state.perks, [perkId]: before ?? { waitlist: 0, joined: false } } });
      return false;
    }
    emit({ perks: { ...state.perks, [perkId]: { waitlist: Number(data) || 1, joined: true } } });
    return true;
  }, [user]);
  const checkRewards = useCallback(async () => {
    if (!user) return [];
    const { data, error } = await supabase.rpc("shop_check_rewards");
    if (error || !Array.isArray(data)) return [];
    const granted = data.map((r) => ({ id: r.item_id, name: r.name }));
    if (granted.length) await refreshShop(user.id);
    return granted;
  }, [user]);
  const markSeen = useCallback(async (ids) => {
    if (!user || !ids.length) return;
    const owned = { ...state.owned };
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const id of ids) if (owned[id]) owned[id] = { ...owned[id], seenAt: now };
    emit({ owned });
    await supabase.rpc("shop_mark_seen", { p_item_ids: ids });
  }, [user]);
  return { ...snap, refresh, purchase, equip, joinWaitlist, checkRewards, markSeen, owns: (id) => ownsItem(snap, id) };
}
function todaysPrice(s, itemId) {
  const c = cosmetic(itemId);
  const deal = s.deals.find((d) => d.itemId === itemId) ?? null;
  return { price: deal ? deal.dealPrice : c ? priceOf(c) : null, deal };
}
const hasArt = (id) => ART.has(id);
export {
  hasArt,
  ownsItem,
  refreshShop,
  todaysPrice,
  useShop
};
