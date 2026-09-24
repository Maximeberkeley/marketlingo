/**
 * Single source of truth for "which day am I on, and what is left today".
 *
 * Every screen (home, roadmap, session flow) resolves the day the same way:
 *  - the available day comes from the learner's start_date and local calendar
 *    days, never from an accumulated counter that can drift;
 *  - "done today" comes from the daily completion record for the local date;
 *  - a second lesson on the same local day is EXTRA PRACTICE: it never
 *    advances the day, never re-pays the lesson XP, never re-banks the streak;
 *  - opening a day other than the available one is an explicit mode (resume
 *    the unfinished current day, or preview a past day) — never silent mixing.
 */
import { supabase } from './supabase';
import { calculateAvailableDay, localDateString } from './dayMath';
import { log } from './logger';
export const emptyDayState = (availableDay = 1) => ({
    availableDay,
    today: localDateString(),
    lessonDoneToday: false,
    completedStackId: null,
    extraLessonsToday: 0,
});
/**
 * Resolve the learner's day state from the server record for the local date.
 * Never throws: on failure it returns a safe state derived from start_date so
 * the learner can still study.
 */
export async function resolveDayState(userId, marketId, startDate) {
    const availableDay = calculateAvailableDay(startDate);
    const base = emptyDayState(availableDay);
    if (!userId || !marketId)
        return base;
    try {
        const { data, error } = await supabase
            .from('daily_completions')
            .select('lesson_completed, completed_stack_id, drills_completed, games_completed')
            .eq('user_id', userId)
            .eq('market_id', marketId)
            .eq('completion_date', base.today)
            .maybeSingle();
        if (error) {
            log.warn('[dayState] Could not read today’s completion:', error.message);
            return base;
        }
        return {
            ...base,
            lessonDoneToday: Boolean(data?.lesson_completed),
            completedStackId: data?.completed_stack_id ?? null,
            extraLessonsToday: 0,
        };
    }
    catch (err) {
        log.warn('[dayState] Completion lookup failed:', err);
        return base;
    }
}
/**
 * How a given day should open, given the learner's state.
 *  - 'today'  — the unlocked day, not yet finished: the real run.
 *  - 'resume' — the unlocked day, already finished: extra practice, no rewards.
 *  - 'review' — an earlier day: revision, no rewards, no day movement.
 *  - 'locked' — a future day: not available yet.
 */
export function resolveOpenMode(day, state) {
    if (day > state.availableDay)
        return 'locked';
    if (day < state.availableDay)
        return 'review';
    return state.lessonDoneToday ? 'resume' : 'today';
}
/** Rewards (lesson XP, streak, day credit) are paid on the first run only. */
export function earnsRewards(mode) {
    return mode === 'today';
}
