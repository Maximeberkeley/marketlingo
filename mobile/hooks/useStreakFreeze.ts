/**
 * useStreakFreeze — streak freezes: one free every week, plus the ones bought in the XP Shop (up to 2 held).
 * The free one is used first; a bought one is taken through the server (shop_use_freeze), which writes the
 * freeze for that local day and takes one from the inventory. There is no Pro tier.
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { localDateString, nextLocalMidnightISOString } from '../lib/dayMath';
import { refreshShop } from './useShop';

/** Free freezes per local week. */
export const FREE_FREEZES_PER_WEEK = 1;

interface StreakFreezeState {
  canFreeze: boolean;
  freezesUsedThisWeek: number;
  maxFreezes: number;
  /** Bought freezes waiting in the inventory. */
  boughtHeld: number;
  loading: boolean;
}

export function useStreakFreeze(marketId?: string, _legacyProFlag = false) {
  const { user } = useAuth();
  const [state, setState] = useState<StreakFreezeState>({
    canFreeze: false,
    freezesUsedThisWeek: 0,
    maxFreezes: FREE_FREEZES_PER_WEEK,
    boughtHeld: 0,
    loading: true,
  });

  const fetchFreezes = useCallback(async () => {
    if (!user || !marketId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const weekStart = getWeekStart();
    const [{ data }, held] = await Promise.all([
      supabase
        .from('streak_freezes')
        .select('id, kind')
        .eq('user_id', user.id)
        .eq('market_id', marketId)
        .eq('week_of', weekStart),
      supabase.from('user_inventory').select('qty').eq('user_id', user.id).eq('item_id', 'streak-freeze').maybeSingle(),
    ]);

    // Bought freezes do not use up the weekly free one.
    const used = (data || []).filter((row: { kind?: string }) => row.kind !== 'shop').length;
    const boughtHeld = held.error ? 0 : Number((held.data as { qty?: number } | null)?.qty) || 0;
    setState({
      canFreeze: used < FREE_FREEZES_PER_WEEK || boughtHeld > 0,
      freezesUsedThisWeek: used,
      maxFreezes: FREE_FREEZES_PER_WEEK + boughtHeld,
      boughtHeld,
      loading: false,
    });
  }, [user, marketId]);

  useEffect(() => {
    fetchFreezes();
  }, [fetchFreezes]);

  const useFreeze = useCallback(async (): Promise<boolean> => {
    if (!user || !marketId || !state.canFreeze) return false;

    if (state.freezesUsedThisWeek < FREE_FREEZES_PER_WEEK) {
      const { error } = await supabase.from('streak_freezes').insert({
        user_id: user.id,
        market_id: marketId,
        week_of: getWeekStart(),
      });
      // Likely a duplicate: the free one is already used this week.
      if (error) return false;
    } else {
      const { data, error } = await supabase.rpc('shop_use_freeze', { p_market_id: marketId, p_local_date: localDateString() });
      if (error || data !== true) return false;
      void refreshShop(user.id);
    }

    // A rescue owns the current local calendar day. It never starts a rolling
    // 24/48-hour window from the moment the learner tapped the button.
    await supabase
      .from('user_progress')
      .update({
        streak_expires_at: nextLocalMidnightISOString(),
      })
      .eq('user_id', user.id)
      .eq('market_id', marketId);

    await fetchFreezes();
    return true;
  }, [user, marketId, state.canFreeze, state.freezesUsedThisWeek, fetchFreezes]);

  return {
    ...state,
    useFreeze,
    refetch: fetchFreezes,
  };
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}
