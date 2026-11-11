import { useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { localDateString, nextLocalMidnightISOString } from "../lib/dayMath";
import { refreshShop } from "./useShop";
const FREE_FREEZES_PER_WEEK = 1;
function useStreakFreeze(marketId, _legacyProFlag = false) {
  const { user } = useAuth();
  const [state, setState] = useState({
    canFreeze: false,
    freezesUsedThisWeek: 0,
    maxFreezes: FREE_FREEZES_PER_WEEK,
    boughtHeld: 0,
    loading: true
  });
  const fetchFreezes = useCallback(async () => {
    if (!user || !marketId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const weekStart = getWeekStart();
    const [{ data }, held] = await Promise.all([
      supabase.from("streak_freezes").select("id, kind").eq("user_id", user.id).eq("market_id", marketId).eq("week_of", weekStart),
      supabase.from("user_inventory").select("qty").eq("user_id", user.id).eq("item_id", "streak-freeze").maybeSingle()
    ]);
    const used = (data || []).filter((row) => row.kind !== "shop" && row.kind !== "repair").length;
    const boughtHeld = held.error ? 0 : Number(held.data?.qty) || 0;
    setState({
      canFreeze: used < FREE_FREEZES_PER_WEEK || boughtHeld > 0,
      freezesUsedThisWeek: used,
      maxFreezes: FREE_FREEZES_PER_WEEK + boughtHeld,
      boughtHeld,
      loading: false
    });
  }, [user, marketId]);
  useEffect(() => {
    fetchFreezes();
  }, [fetchFreezes]);
  const useFreeze = useCallback(async () => {
    if (!user || !marketId || !state.canFreeze) return false;
    if (state.freezesUsedThisWeek < FREE_FREEZES_PER_WEEK) {
      const { error } = await supabase.from("streak_freezes").insert({
        user_id: user.id,
        market_id: marketId,
        week_of: getWeekStart()
      });
      if (error) return false;
    } else {
      const { data, error } = await supabase.rpc("shop_use_freeze", { p_market_id: marketId, p_local_date: localDateString() });
      if (error || data !== true) return false;
      void refreshShop(user.id);
    }
    await supabase.from("user_progress").update({
      streak_expires_at: nextLocalMidnightISOString()
    }).eq("user_id", user.id).eq("market_id", marketId);
    await fetchFreezes();
    return true;
  }, [user, marketId, state.canFreeze, state.freezesUsedThisWeek, fetchFreezes]);
  return {
    ...state,
    useFreeze,
    refetch: fetchFreezes
  };
}
function getWeekStart() {
  const now = /* @__PURE__ */ new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}
export {
  FREE_FREEZES_PER_WEEK,
  useStreakFreeze
};
