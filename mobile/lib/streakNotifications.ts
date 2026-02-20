import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_NOTIF_KEY = 'ml_streak_notif_ids';

/**
 * Schedule streak-at-risk push notifications.
 * Called after each session or when app opens.
 *
 * Strategy:
 * - If user has an active streak and hasn't completed today's lesson:
 *   - Schedule a notification at 8 PM local time
 *   - Schedule an urgent one at 10 PM if still not done
 * - Cancel all streak notifications when lesson is completed today
 */
export async function scheduleStreakNotifications(
  currentStreak: number,
  lessonCompletedToday: boolean,
) {
  // Always cancel previous streak notifications first
  await cancelStreakNotifications();

  // Don't schedule if no streak or already completed
  if (currentStreak === 0 || lessonCompletedToday) return;

  const now = new Date();
  const today8PM = new Date();
  today8PM.setHours(20, 0, 0, 0);

  const today10PM = new Date();
  today10PM.setHours(22, 0, 0, 0);

  const ids: string[] = [];

  try {
    // 8 PM reminder — friendly nudge
    if (now < today8PM) {
      const secondsUntil8PM = Math.floor((today8PM.getTime() - now.getTime()) / 1000);
      const id1 = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔥 Your ${currentStreak}-day streak needs you!`,
          body: "You haven't done today's lesson yet. A quick 5-minute session keeps your streak alive!",
          data: { type: 'streak_warning', route: '/(tabs)/home' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(60, secondsUntil8PM),
        },
      });
      ids.push(id1);
    }

    // 10 PM reminder — urgent
    if (now < today10PM) {
      const secondsUntil10PM = Math.floor((today10PM.getTime() - now.getTime()) / 1000);
      const id2 = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ ${currentStreak}-day streak ends in 2 hours!`,
          body: "Don't lose your progress! Open the app now — it only takes 5 minutes.",
          data: { type: 'streak_warning', route: '/(tabs)/home' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(60, secondsUntil10PM),
        },
      });
      ids.push(id2);
    }

    // Save IDs so we can cancel them later
    if (ids.length > 0) {
      await AsyncStorage.setItem(STREAK_NOTIF_KEY, JSON.stringify(ids));
    }
  } catch (error) {
    console.warn('Failed to schedule streak notifications:', error);
  }
}

/**
 * Cancel all pending streak notifications.
 * Called when the user completes their daily lesson.
 */
export async function cancelStreakNotifications() {
  try {
    const stored = await AsyncStorage.getItem(STREAK_NOTIF_KEY);
    if (stored) {
      const ids: string[] = JSON.parse(stored);
      for (const id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      await AsyncStorage.removeItem(STREAK_NOTIF_KEY);
    }
  } catch (error) {
    console.warn('Failed to cancel streak notifications:', error);
  }
}
