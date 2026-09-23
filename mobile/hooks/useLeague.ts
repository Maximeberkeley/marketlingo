/**
 * useLeague — calendar-month league standings, rival XP and season ceremony.
 *
 * The backend does the honest work: `sync_my_league` recomputes this week's XP
 * from xp_transactions and places the learner in a tier, and `run_league_rollover`
 * stamps last week's result. This hook only reads and presents.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { log } from '../lib/logger';

export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type LeagueResult = 'promoted' | 'demoted' | 'held';

export const LEAGUE_TIERS: LeagueTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export const TIER_META: Record<LeagueTier, { label: string; color: string; blurb: string }> = {
  bronze: { label: 'Bronze', color: '#B45309', blurb: 'Where every analyst starts' },
  silver: { label: 'Silver', color: '#94A3B8', blurb: 'Consistency is showing' },
  gold: { label: 'Gold', color: '#FBBF24', blurb: 'You show up like a professional' },
  platinum: { label: 'Platinum', color: '#38BDF8', blurb: 'Top of the desk' },
  diamond: { label: 'Diamond', color: '#A78BFA', blurb: 'The room everyone wants in' },
};

export interface Rival {
  userId: string;
  username: string;
  weeklyXp: number;
  rank: number;
  isMe: boolean;
}

export interface LeagueState {
  loading: boolean;
  tier: LeagueTier;
  weeklyXp: number;
  myRank: number | null;
  rivals: Rival[];
  rivalsByTier: Record<LeagueTier, Rival[]>;
  promotionCutoff: number;
  demotionCutoff: number | null;
  weekOf: string;
  daysLeft: number;
  /** Last week's stamped outcome, used for the Sunday ceremony. */
  lastWeek: { tier: LeagueTier; result: LeagueResult; finalRank: number | null; weekOf: string } | null;
  ceremonyPending: boolean;
}

export function currentMonthStart(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

function daysLeftInMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
}

const CEREMONY_KEY = '@marketlingo/league_ceremony_seen';

export function useLeague(marketId?: string) {
  const { user } = useAuth();
  const [state, setState] = useState<LeagueState>({
    loading: true,
    tier: 'bronze',
    weeklyXp: 0,
    myRank: null,
    rivals: [],
    rivalsByTier: { bronze: [], silver: [], gold: [], platinum: [], diamond: [] },
    promotionCutoff: 1,
    demotionCutoff: null,
    weekOf: currentMonthStart(),
    daysLeft: daysLeftInMonth(),
    lastWeek: null,
    ceremonyPending: false,
  });

  const load = useCallback(async () => {
    if (!user || !marketId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const weekOf = currentMonthStart();

    try {
      // 1. Recompute my placement for this week (server-side, from XP ledger).
      const { data: mine, error: syncError } = await supabase.rpc('sync_my_monthly_league', {
        p_market_id: marketId,
        p_season_start: weekOf,
      });
      if (syncError) log.warn('League sync failed', syncError);

      const myRow = Array.isArray(mine) ? mine[0] : mine;
      const tier = ((myRow?.tier as LeagueTier) || 'bronze') as LeagueTier;

      // 2. Standings for every tier this month so the full league system is inspectable.
      const { data: standings } = await supabase
        .from('league_memberships')
        .select('user_id, weekly_xp, updated_at, tier')
        .eq('market_id', marketId)
        .eq('week_of', weekOf)
        .order('weekly_xp', { ascending: false })
        .limit(150);

      const rows = standings ?? [];
      const ids = rows.map((r) => r.user_id);
      const { data: profiles } = ids.length
        ? await supabase.from('public_profiles').select('id, username').in('id', ids)
        : { data: [] as { id: string; username: string | null }[] };

      const rivalsByTier = LEAGUE_TIERS.reduce((groups, groupTier) => {
        groups[groupTier] = rows
          .filter((row) => row.tier === groupTier)
          .map((r, i) => ({
            userId: r.user_id,
            username: r.user_id === user.id
              ? 'You'
              : (profiles?.find((p) => p.id === r.user_id)?.username?.split('@')[0] || 'Analyst'),
            weeklyXp: r.weekly_xp ?? 0,
            rank: i + 1,
            isMe: r.user_id === user.id,
          }));
        return groups;
      }, { bronze: [], silver: [], gold: [], platinum: [], diamond: [] } as Record<LeagueTier, Rival[]>);
      const rivals = rivalsByTier[tier];

      const size = rivals.length;
      const promotionCutoff = Math.max(1, Math.ceil(size * 0.3));
      const demotionCutoff = size >= 5 ? size - Math.floor(size * 0.2) : null;
      const myRank = rivals.find((r) => r.isMe)?.rank ?? null;

      // 3. Last week's stamped result → ceremony.
      const { data: past } = await supabase
        .from('league_memberships')
        .select('tier, result, final_rank, week_of')
        .eq('market_id', marketId)
        .eq('user_id', user.id)
        .lt('week_of', weekOf)
        .not('result', 'is', null)
        .order('week_of', { ascending: false })
        .limit(1);

      const lastRow = past?.[0];
      const lastWeek = lastRow
        ? {
            tier: (lastRow.tier as LeagueTier) || 'bronze',
            result: (lastRow.result as LeagueResult) || 'held',
            finalRank: lastRow.final_rank ?? null,
            weekOf: lastRow.week_of as string,
          }
        : null;

      let ceremonyPending = false;
      if (lastWeek) {
        const seen = await AsyncStorage.getItem(`${CEREMONY_KEY}:${marketId}:${lastWeek.weekOf}`);
        ceremonyPending = !seen;
      }

      setState({
        loading: false,
        tier,
        weeklyXp: myRow?.weekly_xp ?? 0,
        myRank,
        rivals,
        rivalsByTier,
        promotionCutoff,
        demotionCutoff,
        weekOf,
        daysLeft: daysLeftInMonth(),
        lastWeek,
        ceremonyPending,
      });
    } catch (e) {
      log.error('League load failed', e);
      setState((s) => ({ ...s, loading: false }));
    }
  }, [user, marketId]);

  useEffect(() => {
    load();
  }, [load]);

  const dismissCeremony = useCallback(async () => {
    if (state.lastWeek && marketId) {
      await AsyncStorage.setItem(`${CEREMONY_KEY}:${marketId}:${state.lastWeek.weekOf}`, '1');
    }
    setState((s) => ({ ...s, ceremonyPending: false }));
  }, [state.lastWeek, marketId]);

  /** XP needed to reach the promotion zone right now. */
  const xpToPromotion = (() => {
    const { rivals, promotionCutoff, weeklyXp } = state;
    if (!rivals.length) return 0;
    const target = rivals[Math.min(promotionCutoff, rivals.length) - 1];
    if (!target) return 0;
    const myRank = state.myRank ?? rivals.length + 1;
    if (myRank <= promotionCutoff) return 0;
    return Math.max(1, target.weeklyXp - weeklyXp + 1);
  })();

  return { ...state, xpToPromotion, refetch: load, dismissCeremony };
}
