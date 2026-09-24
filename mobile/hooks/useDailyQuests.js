import { useMemo } from 'react';
import { localDateString } from '../lib/dayMath';
/**
 * Quest pool — built only on the current modules: today's lesson,
 * the Daily Arena, and the Deep Case. No legacy drills or games.
 * Arena runs are counted via daily_completions.drills_completed and
 * Deep Case verdicts via games_completed (see useUserXP.addXP).
 */
const QUEST_POOL = [
    {
        id: 'complete_lesson',
        title: 'Scholar',
        description: "Complete today's lesson",
        emoji: '',
        target: 1,
        xpBonus: 25,
        multiplier: 1.5,
        type: 'lesson',
    },
    {
        id: 'arena_call',
        title: 'Arena Call',
        description: 'Complete one Daily Arena run',
        emoji: '',
        target: 1,
        xpBonus: 20,
        multiplier: 1.3,
        type: 'arena',
    },
    {
        id: 'case_closed',
        title: 'Case Closed',
        description: 'Defend one Deep Case verdict',
        emoji: '',
        target: 1,
        xpBonus: 30,
        multiplier: 1.5,
        type: 'case',
    },
    {
        id: 'double_shift',
        title: 'Double Shift',
        description: 'Lesson + Arena in one day',
        emoji: '',
        target: 2,
        xpBonus: 40,
        multiplier: 2.0,
        type: 'combo',
    },
    {
        id: 'full_stack',
        title: 'Full Stack',
        description: 'Lesson + Arena + Case today',
        emoji: '',
        target: 3,
        xpBonus: 60,
        multiplier: 2.5,
        type: 'combo',
    },
    {
        id: 'back_in_the_ring',
        title: 'Back in the Ring',
        description: 'Run the Arena twice today',
        emoji: '',
        target: 2,
        xpBonus: 35,
        multiplier: 1.6,
        type: 'arena',
    },
    {
        id: 'practice_pair',
        title: 'Practice Pair',
        description: 'Arena + Deep Case today',
        emoji: '',
        target: 2,
        xpBonus: 35,
        multiplier: 1.8,
        type: 'combo',
    },
    {
        id: 'speed_learner',
        title: 'Speed Learner',
        description: 'Complete lesson in under 5 min',
        emoji: '',
        target: 1,
        xpBonus: 35,
        multiplier: 1.8,
        type: 'lesson',
    },
];
/**
 * Simple deterministic seeded shuffle to pick 3 quests per day
 */
function getDayQuests(dateStr) {
    // Simple hash from date string
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) {
        seed = (seed * 31 + dateStr.charCodeAt(i)) | 0;
    }
    const pool = [...QUEST_POOL];
    // Fisher-Yates with seed
    for (let i = pool.length - 1; i > 0; i--) {
        seed = (seed * 1103515245 + 12345) | 0;
        const j = ((seed >>> 16) & 0x7fff) % (i + 1);
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // Always include "lesson" type as first quest, then pick 2 others
    const lessonQuest = pool.find((q) => q.type === 'lesson') || pool[0];
    const others = pool.filter((q) => q.id !== lessonQuest.id).slice(0, 2);
    return [lessonQuest, ...others];
}
export function useDailyQuests(dailyCompletion, streak) {
    const today = localDateString();
    const quests = useMemo(() => {
        const templates = getDayQuests(today);
        const lesson = dailyCompletion?.lesson_completed || false;
        // Current modules write into the existing daily counters:
        // Arena runs -> drills_completed, Deep Case verdicts -> games_completed.
        const arenaRuns = dailyCompletion?.drills_completed || 0;
        const caseRuns = dailyCompletion?.games_completed || 0;
        return templates.map((t) => {
            let current = 0;
            switch (t.type) {
                case 'lesson':
                    current = lesson ? 1 : 0;
                    break;
                case 'arena':
                    current = Math.min(arenaRuns, t.target);
                    break;
                case 'case':
                    current = Math.min(caseRuns, t.target);
                    break;
                case 'combo':
                    if (t.id === 'double_shift') {
                        current = (lesson ? 1 : 0) + Math.min(arenaRuns, 1);
                    }
                    else if (t.id === 'practice_pair') {
                        current = Math.min(arenaRuns, 1) + Math.min(caseRuns, 1);
                    }
                    else if (t.id === 'full_stack') {
                        current = (lesson ? 1 : 0) + (arenaRuns > 0 ? 1 : 0) + (caseRuns > 0 ? 1 : 0);
                    }
                    break;
                case 'streak':
                    current = Math.min(streak || 0, t.target);
                    break;
            }
            return {
                ...t,
                current,
                isCompleted: current >= t.target,
            };
        });
    }, [today, dailyCompletion, streak]);
    const completedCount = quests.filter((q) => q.isCompleted).length;
    const totalBonusXP = quests.filter((q) => q.isCompleted).reduce((sum, q) => sum + q.xpBonus, 0);
    const allComplete = completedCount === quests.length;
    return {
        quests,
        completedCount,
        totalBonusXP,
        allComplete,
    };
}
