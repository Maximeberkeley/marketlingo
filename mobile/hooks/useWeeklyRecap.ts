/**
 * useWeeklyRecap — the Sunday market recap.
 *
 * Everything here is read from the learner's own ledger (xp_transactions and
 * daily_completions), so the numbers are real and never estimated.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { log } from '../lib/logger';
import { currentWeekStart } from './useLeague';

export interface WeeklyRecap {
  loading: boolean;
  weekOf: string;
  xpThisWeek: number;
  xpLastWeek: number;
  lessonsCompleted: number;
  gamesCompleted: number;
  drillsCompleted: number;
  activeDays: number;
  bestDay: { label: string; xp: number } | null;
  perDay: { label: string; xp: number }[];
  /** True on Sunday, when the recap is meant to surface. */
  isRecapDay: boolean;
  seen: boolean;
}

const RECAP_KEY = '@marketlingo/recap_seen';
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function shiftWeek(weekOf: string, weeks: number): string {
  const [y, m, d] = weekOf.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + weeks * 7);
  return currentWeekStart(dt);
}

export function useWeeklyRecap(marketId?: string) {
  const { user } = useAuth();
  const weekOf = currentWeekStart();
  const [state, setState] = useState<WeeklyRecap>({
    loading: true,
    weekOf,
    xpThisWeek: 0,
    xpLastWeek: 0,
    lessonsCompleted: 0,
    gamesCompleted: 0,
    drillsCompleted: 0,
    activeDays: 0,
    bestDay: null,
    perDay: [],
    isRecapDay: new Date().getDay() === 0,
    seen: true,
  });

  const load = useCallback(async () => {
    if (!user || !marketId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const [y, m, d] = weekOf.split('-').map(Number);
    const weekStart = new Date(y, m - 1, d, 0, 0, 0, 0);
    const prevStart = new Date(weekStart);
    prevStart.setDate(prevStart.getDate() - 7);

    try {
      const [xpRes, prevRes, compRes, seenRaw] = await Promise.all([
        supabase
          .from('xp_transactions')
          .select('xp_amount, created_at')
          .eq('user_id', user.id)
          .eq('market_id', marketId)
          .gte('created_at', weekStart.toISOString()),
        supabase
          .from('xp_transactions')
          .select('xp_amount')
          .eq('user_id', user.id)
          .eq('market_id', marketId)
          .gte('created_at', prevStart.toISOString())
          .lt('created_at', weekStart.toISOString()),
        supabase
          .from('daily_completions')
          .select('completion_date, lesson_completed, games_completed, drills_completed')
          .eq('user_id', user.id)
          .eq('market_id', marketId)
          .gte('completion_date', shiftWeek(weekOf, 0)),
        AsyncStorage.getItem(`${RECAP_KEY}:${marketId}:${weekOf}`),
      ]);

      const xpRows = xpRes.data ?? [];
      const buckets = new Map<number, number>();
      let xpThisWeek = 0;
      xpRows.forEach((r) => {
        const amt = r.xp_amount ?? 0;
        xpThisWeek += amt;
        const dow = new Date(r.created_at as string).getDay();
        buckets.set(dow, (buckets.get(dow) ?? 0) + amt);
      });

      const order = [1, 2, 3, 4, 5, 6, 0]; // Monday-first
      const perDay = order.map((dow) => ({ label: DAY_LABELS[dow], xp: buckets.get(dow) ?? 0 }));
      const best = perDay.reduce<{ label: string; xp: number } | null>(
        (acc, cur) => (cur.xp > (acc?.xp ?? 0) ? cur : acc),
        null,
      );

      const comps = compRes.data ?? [];
      setState({
        loading: false,
        weekOf,
        xpThisWeek,
        xpLastWeek: (prevRes.data ?? []).reduce((sum, r) => sum + (r.xp_amount ?? 0), 0),
        lessonsCompleted: comps.filter((c) => c.lesson_completed).length,
        gamesCompleted: comps.reduce((s, c) => s + (c.games_completed ?? 0), 0),
        drillsCompleted: comps.reduce((s, c) => s + (c.drills_completed ?? 0), 0),
        activeDays: perDay.filter((p) => p.xp > 0).length,
        bestDay: best && best.xp > 0 ? best : null,
        perDay,
        isRecapDay: new Date().getDay() === 0,
        seen: !!seenRaw,
      });
    } catch (e) {
      log.error('Weekly recap failed', e);
      setState((s) => ({ ...s, loading: false }));
    }
  }, [user, marketId, weekOf]);

  useEffect(() => {
    load();
  }, [load]);

  const markSeen = useCallback(async () => {
    if (marketId) await AsyncStorage.setItem(`${RECAP_KEY}:${marketId}:${weekOf}`, '1');
    setState((s) => ({ ...s, seen: true }));
  }, [marketId, weekOf]);

  return { ...state, refetch: load, markSeen };
}
