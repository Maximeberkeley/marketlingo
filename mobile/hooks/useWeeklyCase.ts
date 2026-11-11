/**
 * useWeeklyCase — this week's case, whether the learner has submitted, and (once the server has released it)
 * their score. Also last week's score when it is ready and has not been opened yet.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';
import { log } from '../lib/logger';
import { pickCases, phaseOf, WeeklyCase } from '../lib/weeklyCase';
import { loadMySubmissions, loadOpenedCases, loadResult, requestRelease } from '../lib/weeklyCaseApi';

export const seenKey = (userId: string, caseId: string) => `ml_weekly_seen_v1/${userId}/${caseId}`;

export interface WeeklyCaseState {
  loading: boolean;
  current: WeeklyCase | null;
  previous: WeeklyCase | null;
  /** The learner has a submission for the current case. */
  submitted: boolean;
  /** Released score for the current case; null until results are out. */
  score: number | null;
  /** Last week's released score, only while its results are still unread. */
  previousScore: number | null;
  failed: boolean;
}

const EMPTY: WeeklyCaseState = { loading: true, current: null, previous: null, submitted: false, score: null, previousScore: null, failed: false };

export function useWeeklyCase() {
  const { user } = useAuth();
  const [state, setState] = useState<WeeklyCaseState>(EMPTY);
  // One lazy release per mount: a finished week whose results are not out yet gets nudged once.
  const released = useRef(false);

  const refresh = useCallback(async () => {
    if (!user?.id) { setState({ ...EMPTY, loading: false }); return; }
    try {
      const now = Date.now();
      const { current, previous } = pickCases(await loadOpenedCases(now), now);
      const ids = [current?.id, previous?.id].filter((id): id is string => !!id);
      let subs = await loadMySubmissions(user.id, ids);
      const needsRelease = (c: WeeklyCase | null) => !!c && phaseOf(c, now) === 'closed'
        && subs.some(s => s.case_id === c.id && !s.released_at);
      if (!released.current && (needsRelease(current) || needsRelease(previous))) {
        released.current = true;
        await requestRelease();
        subs = await loadMySubmissions(user.id, ids);
      }
      const scoreOf = async (c: WeeklyCase | null): Promise<number | null> => {
        const s = c && subs.find(x => x.case_id === c.id);
        if (!c || !s?.released_at) return null;
        const r = await loadResult(c.id);
        return r.state === 'ready' && typeof r.score === 'number' ? r.score : null;
      };
      const score = await scoreOf(current);
      let previousScore = await scoreOf(previous);
      if (previous && previousScore !== null && await AsyncStorage.getItem(seenKey(user.id, previous.id))) previousScore = null;
      setState({
        loading: false,
        current,
        previous,
        submitted: !!current && subs.some(s => s.case_id === current.id),
        score,
        previousScore,
        failed: false,
      });
    } catch (error) {
      log.warn('[WeeklyCase] could not load', error);
      setState(s => ({ ...s, loading: false, failed: true }));
    }
  }, [user?.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { ...state, refresh, userId: user?.id ?? null };
}

/** Remember that the learner has opened this case's results, so the Practice card stops nudging. */
export async function markResultsSeen(userId: string, caseId: string): Promise<void> {
  try { await AsyncStorage.setItem(seenKey(userId, caseId), '1'); } catch { /* best effort */ }
}
