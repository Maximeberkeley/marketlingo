import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'ml_practice_rewards_v1';
const EMPTY = {
    arenaBestScore: 0,
    arenaRuns: 0,
    arenaLastPlayed: null,
    caseRuns: 0,
    caseGrades: [],
    caseLastPlayed: null,
    practiceStreak: 0,
};
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function bumpStreak(prev) {
    const last = prev.arenaLastPlayed && prev.caseLastPlayed
        ? [prev.arenaLastPlayed, prev.caseLastPlayed].sort().pop()
        : prev.arenaLastPlayed || prev.caseLastPlayed;
    const today = dayKey();
    if (last === today)
        return Math.max(1, prev.practiceStreak);
    const yesterday = dayKey(new Date(Date.now() - 86400000));
    if (last === yesterday)
        return prev.practiceStreak + 1;
    return 1;
}
export function usePracticeRewards() {
    const [rewards, setRewards] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => {
        try {
            const raw = await AsyncStorage.getItem(KEY);
            if (raw)
                setRewards({ ...EMPTY, ...JSON.parse(raw) });
        }
        catch {
            // ignore — start from an empty ledger
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        load();
    }, [load]);
    const persist = useCallback(async (next) => {
        setRewards(next);
        try {
            await AsyncStorage.setItem(KEY, JSON.stringify(next));
        }
        catch {
            // non-fatal
        }
    }, []);
    const recordArenaRun = useCallback(async (score) => {
        const next = {
            ...rewards,
            arenaBestScore: Math.max(rewards.arenaBestScore, score),
            arenaRuns: rewards.arenaRuns + 1,
            practiceStreak: bumpStreak(rewards),
            arenaLastPlayed: dayKey(),
        };
        await persist(next);
        return next;
    }, [persist, rewards]);
    const recordCaseRun = useCallback(async (grade) => {
        const next = {
            ...rewards,
            caseRuns: rewards.caseRuns + 1,
            caseGrades: [grade, ...rewards.caseGrades].slice(0, 20),
            practiceStreak: bumpStreak(rewards),
            caseLastPlayed: dayKey(),
        };
        await persist(next);
        return next;
    }, [persist, rewards]);
    const playedArenaToday = rewards.arenaLastPlayed === dayKey();
    const playedCaseToday = rewards.caseLastPlayed === dayKey();
    return { rewards, loading, recordArenaRun, recordCaseRun, playedArenaToday, playedCaseToday, refresh: load };
}
