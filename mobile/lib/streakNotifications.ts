import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_NOTIF_KEY = 'ml_streak_notif_ids';

// Duolingo-style streak notification templates
const EVENING_TEMPLATES = [
  { title: "🔥 Your {streak}-day streak needs you!", body: "You haven't done today's lesson yet. 5 minutes keeps it alive!" },
  { title: "🦁 Leo checked — no lesson today", body: "Your {streak}-day streak is waiting. Don't leave it hanging!" },
  { title: "🦁 Your streak is getting nervous", body: "{streak} days strong. Don't blow it now. Quick lesson?" },
  { title: "🦁 Leo's holding your streak hostage", body: "Do a lesson and I'll release it. Fair deal. 🤝" },
];

const URGENT_TEMPLATES = [
  { title: "⚠️ {streak}-day streak ends in 2 HOURS!", body: "This is your last chance. Open the app NOW. 💀" },
  { title: "🚨 STREAK EMERGENCY", body: "Your {streak}-day streak expires at midnight. Leo is panicking." },
  { title: "🦁 Leo is crying real tears", body: "{streak} days of progress, about to vanish. 2 hours left!" },
  { title: "⏰ Final warning from Leo", body: "Your streak dies at midnight. 5 minutes can save it. GO!" },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillStreak(text: string, streak: number): string {
  return text.replace(/\{streak\}/g, String(streak));
}

/**
 * Schedule streak-at-risk push notifications.
 * Called after each session or when app opens.
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
      const template = pickRandom(EVENING_TEMPLATES);
      const secondsUntil8PM = Math.floor((today8PM.getTime() - now.getTime()) / 1000);
      const id1 = await Notifications.scheduleNotificationAsync({
        content: {
          title: fillStreak(template.title, currentStreak),
          body: fillStreak(template.body, currentStreak),
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
      const template = pickRandom(URGENT_TEMPLATES);
      const secondsUntil10PM = Math.floor((today10PM.getTime() - now.getTime()) / 1000);
      const id2 = await Notifications.scheduleNotificationAsync({
        content: {
          title: fillStreak(template.title, currentStreak),
          body: fillStreak(template.body, currentStreak),
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
 * Uses two strategies to ensure no duplicates survive:
 * 1. Cancel by saved AsyncStorage IDs (fast path)
 * 2. Scan all scheduled notifications and cancel any with streak_warning type (catches orphans)
 */
export async function cancelStreakNotifications() {
  try {
    // Strategy 1: Cancel by saved IDs
    const stored = await AsyncStorage.getItem(STREAK_NOTIF_KEY);
    if (stored) {
      const ids: string[] = JSON.parse(stored);
      for (const id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      await AsyncStorage.removeItem(STREAK_NOTIF_KEY);
    }

    // Strategy 2: Scan all scheduled notifications for any orphaned streak ones
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of allScheduled) {
      const data = notif.content.data as Record<string, any> | undefined;
      if (data?.type === 'streak_warning') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (error) {
    console.warn('Failed to cancel streak notifications:', error);
  }
}
