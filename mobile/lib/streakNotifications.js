import { cancelRollingLeoNudges, scheduleRollingLeoNudges } from './leoNudges';
/**
 * Schedule streak-at-risk push notifications.
 * Called after each session or when app opens.
 */
export async function scheduleStreakNotifications(_currentStreak, lessonCompletedToday) {
    await scheduleRollingLeoNudges(lessonCompletedToday);
}
/**
 * Cancel all pending streak notifications.
 * Uses two strategies to ensure no duplicates survive:
 * 1. Cancel by saved AsyncStorage IDs (fast path)
 * 2. Scan all scheduled notifications and cancel any with streak_warning type (catches orphans)
 */
export async function cancelStreakNotifications() {
    await cancelRollingLeoNudges();
}
