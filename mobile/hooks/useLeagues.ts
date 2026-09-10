import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { log } from '../lib/logger';
import {
  LeagueTier,
  currentWeekStart,
  msUntilWeekEnd,
  zoneForRank,
  promotionCount,
  demotionCount,
} from '../lib/leagues';

export interface LeagueStanding {
  userId: string;
  username: string;
  weeklyXP: number;
  rank: number;
  isCurrentUser: boolean;
  zone: 'promotion' | 'safe' | 'demotion';
  /** Rank change since the previous day (positive = moved up). */
  delta: number | null;
}

/** Yesterday's ranks, stored locally so we can show daily rank deltas without schema changes. */
const RANK_SNAPSHOT_KEY = 'league_rank_snapshot_v1';

interface RankSnapshot {
  day: string;
  weekOf: string;
  tier: string;
  ranks: Record<string, number>;
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export interface LeagueState {
  tier: LeagueTier;
  weekOf: string;
  myRank: number | null;
  myWeeklyXP: number;
  groupSize: number;
  standings: LeagueStanding[];
  promoteCutoff: number;
  demoteCutoff: number;
  msLeft: number;
  /** XP needed to overtake the person one rank above. */
  xpToNextRank: number | null;
  /** My rank change since yesterday (positive = moved up). */
  myDelta: number | null;
  lastResult: { tier: LeagueTier; result: string; rank: number | null } | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const STANDINGS_LIMIT = 30;

export function useLeagues(marketId?: string | null): LeagueState {
  const { user } = useAuth();
  const [tier, setTier] = useState<LeagueTier>('bronze');
  const [myWeeklyXP, setMyWeeklyXP] = useState(0);
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [lastResult, setLastResult] = useState<LeagueState['lastResult']>(null);
  const [loading, setLoading] = useState(true);
  const [msLeft, setMsLeft] = useState(msUntilWeekEnd());
  const [trueGroupSize, setTrueGroupSize] = useState(0);
  const inFlight = useRef(false);
  const weekOf = currentWeekStart();

  const refresh = useCallback(async () => {
    if (!user || !marketId || inFlight.current) return;
    inFlight.current = true;
    try {
      const { data: mine, error } = await supabase.rpc('sync_my_league', { p_market_id: marketId });
      if (error) throw error;
      const row = Array.isArray(mine) ? mine[0] : mine;
      const myTier = ((row?.tier as LeagueTier) || 'bronze') as LeagueTier;
      setTier(myTier);
      setMyWeeklyXP(row?.weekly_xp ?? 0);

      const { data: group } = await supabase
        .from('league_memberships')
        .select('user_id, weekly_xp')
        .eq('market_id', marketId)
        .eq('week_of', weekOf)
        .eq('tier', myTier)
        .order('weekly_xp', { ascending: false })
        .limit(STANDINGS_LIMIT);

      const rows = group || [];
      const ids = rows.map((r) => r.user_id);
      let names: Record<string, string> = {};
      if (ids.length) {
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, username')
          .in('id', ids);
        names = Object.fromEntries(
          (profiles || []).map((p: { id: string; username: string | null }) => [
            p.id,
            (p.username || '').split('@')[0] || 'Analyst',
          ])
        );
      }

      // True tier population (standings are capped at STANDINGS_LIMIT rows)
      const { data: trueSize } = await supabase.rpc('league_group_size', {
        p_market_id: marketId,
        p_tier: myTier,
      });
      const size = typeof trueSize === 'number' && trueSize > 0 ? trueSize : rows.length;
      setTrueGroupSize(size);

      // Daily rank deltas from a locally stored snapshot (no schema change needed).
      let previousRanks: Record<string, number> = {};
      const day = todayKey();
      try {
        const raw = await AsyncStorage.getItem(RANK_SNAPSHOT_KEY);
        const snap: RankSnapshot | null = raw ? JSON.parse(raw) : null;
        if (snap && snap.weekOf === weekOf && snap.tier === myTier && snap.day !== day) {
          previousRanks = snap.ranks || {};
        } else if (snap && snap.weekOf === weekOf && snap.tier === myTier) {
          previousRanks = snap.ranks || {};
        }
        if (!snap || snap.day !== day || snap.weekOf !== weekOf || snap.tier !== myTier) {
          const ranks = Object.fromEntries(rows.map((r, i) => [r.user_id, i + 1]));
          await AsyncStorage.setItem(
            RANK_SNAPSHOT_KEY,
            JSON.stringify({ day, weekOf, tier: myTier, ranks } satisfies RankSnapshot)
          );
        }
      } catch {
        previousRanks = {};
      }

      setStandings(
        rows.map((r, i) => {
          const prevRank = previousRanks[r.user_id];
          return {
            userId: r.user_id,
            username: names[r.user_id] || 'Analyst',
            weeklyXP: r.weekly_xp ?? 0,
            rank: i + 1,
            isCurrentUser: r.user_id === user.id,
            zone: zoneForRank(i + 1, size, myTier),
            delta: typeof prevRank === 'number' ? prevRank - (i + 1) : null,
          };
        })
      );

      // Last completed week's outcome (for the promotion/relegation banner)
      const { data: prev } = await supabase
        .from('league_memberships')
        .select('tier, result, final_rank, week_of')
        .eq('user_id', user.id)
        .eq('market_id', marketId)
        .lt('week_of', weekOf)
        .not('result', 'is', null)
        .order('week_of', { ascending: false })
        .limit(1)
        .maybeSingle();

      setLastResult(
        prev ? { tier: prev.tier as LeagueTier, result: prev.result as string, rank: prev.final_rank } : null
      );
    } catch (e) {
      log.error('League sync failed', e);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [user, marketId, weekOf]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(() => setMsLeft(msUntilWeekEnd()), 60000);
    return () => clearInterval(t);
  }, []);

  const myRank = standings.find((s) => s.isCurrentUser)?.rank ?? null;
  const groupSize = Math.max(trueGroupSize, standings.length);

  return {
    tier,
    weekOf,
    myRank,
    myWeeklyXP,
    groupSize,
    standings,
    promoteCutoff: promotionCount(groupSize),
    demoteCutoff: demotionCount(groupSize),
    msLeft,
    lastResult,
    loading,
    refresh,
  };
}
