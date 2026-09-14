import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Local reward ledger for the two practice modes.
 * Kept on-device so practice never blocks on the network.
 */
export interface PracticeRewards {
  arenaBestScore: number;
  arenaRuns: number;
  arenaLastPlayed: string | null;
  caseRuns: number;
  caseGrades: string[];
  caseLastPlayed: string | null;
  /** Consecutive days with at least one practice run. */
  practiceStreak: number;
}

const KEY = 'ml_practice_rewards_v1';

const EMPTY: PracticeRewards = {
  arenaBestScore: 0,
  arenaRuns: 0,
  arenaLastPlayed: null,
  caseRuns: 0,
  caseGrades: [],
  caseLastPlayed: null,
  practiceStreak: 0,
};

const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function bumpStreak(prev: PracticeRewards): number {
  const last = prev.arenaLastPlayed && prev.caseLastPlayed
    ? [prev.arenaLastPlayed, prev.caseLastPlayed].sort().pop()!
    : prev.arenaLastPlayed || prev.caseLastPlayed;
  const today = dayKey();
  if (last === today) return Math.max(1, prev.practiceStreak);
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  if (last === yesterday) return prev.practiceStreak + 1;
  return 1;
}

export function usePracticeRewards() {
  const [rewards, setRewards] = useState<PracticeRewards>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) setRewards({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      // ignore — start from an empty ledger
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(async (next: PracticeRewards) => {
    setRewards(next);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // non-fatal
    }
  }, []);

  const recordArenaRun = useCallback(
    async (score: number) => {
      const next: PracticeRewards = {
        ...rewards,
        arenaBestScore: Math.max(rewards.arenaBestScore, score),
        arenaRuns: rewards.arenaRuns + 1,
        practiceStreak: bumpStreak(rewards),
        arenaLastPlayed: dayKey(),
      };
      await persist(next);
      return next;
    },
    [persist, rewards],
  );

  const recordCaseRun = useCallback(
    async (grade: string) => {
      const next: PracticeRewards = {
        ...rewards,
        caseRuns: rewards.caseRuns + 1,
        caseGrades: [grade, ...rewards.caseGrades].slice(0, 20),
        practiceStreak: bumpStreak(rewards),
        caseLastPlayed: dayKey(),
      };
      await persist(next);
      return next;
    },
    [persist, rewards],
  );

  const playedArenaToday = rewards.arenaLastPlayed === dayKey();
  const playedCaseToday = rewards.caseLastPlayed === dayKey();

  return { rewards, loading, recordArenaRun, recordCaseRun, playedArenaToday, playedCaseToday, refresh: load };
}
