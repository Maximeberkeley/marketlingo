import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { log } from '../lib/logger';
import { cancelRollingLeoNudges, scheduleRollingLeoNudges } from '../lib/leoNudges';

export interface NotificationPreferences {
  dailyReminder: boolean;
  reminderTime: string; // HH:MM format
  newsAlerts: boolean;
  streakReminders: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  dailyReminder: true,
  reminderTime: '09:00',
  newsAlerts: true,
  streakReminders: true,
};

const DAILY_TEMPLATES = [
  { title: 'Your daily industry briefing', body: 'Learn one mechanism today and add it to your working market map.' },
  { title: 'Continue your course', body: 'Today’s lesson is ready and takes only a few focused minutes.' },
  { title: 'One idea. One clear takeaway.', body: 'Open today’s briefing and keep building practical industry fluency.' },
  { title: 'Your next lesson is ready', body: 'Complete the briefing, then test it in the Arena and Deep Case.' },
];

const STREAK_TEMPLATES = [
  { title: 'Protect your learning streak', body: 'Complete today’s lesson before your local day ends.' },
  { title: 'Your streak is still yours to keep', body: 'One focused lesson carries your progress into tomorrow.' },
  { title: 'Close today’s learning loop', body: 'Finish the daily briefing now to keep your streak intact.' },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// NOTE: setNotificationHandler is configured globally in _layout.tsx — do not duplicate here

export function useNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);

  // Check platform support
  useEffect(() => {
    setIsSupported(Platform.OS === 'ios' || Platform.OS === 'android');
  }, []);

  // NOTE: Notification response (tap) handling is done globally in _layout.tsx
  // This hook only manages registration, scheduling, and preferences

  // Save push token to database
  const savePushToken = useCallback(async (token: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          push_token: token,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        log.error('Error saving push token:', error);
      }
    } catch (error) {
      log.error('Error saving push token:', error);
    }
  }, [user]);

  // Save notification preferences to database
  const saveNotificationPreferences = useCallback(async (prefs: NotificationPreferences) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: JSON.parse(JSON.stringify(prefs)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        log.error('Error saving notification preferences:', error);
      }
    } catch (error) {
      log.error('Error saving notification preferences:', error);
    }
  }, [user]);

  // Register for push notifications
  const registerPushNotifications = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        log.debug('Push notification permission denied');
        return false;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;

      setPushToken(token);
      setIsRegistered(true);
      await savePushToken(token);

      return true;
    } catch (error) {
      log.error('Error registering push notifications:', error);
      return false;
    }
  }, [isSupported, savePushToken]);

  // Schedule daily reminder
  const scheduleDailyReminder = useCallback(async () => {
    if (!isSupported) return;

    try {
      // Preserve Intel and rolling Leo alerts; replace only this recurring reminder.
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(scheduled
        .filter(item => item.content.data?.type === 'daily_reminder')
        .map(item => Notifications.cancelScheduledNotificationAsync(item.identifier)));

      if (!preferences.dailyReminder) return;

      const [hours, minutes] = preferences.reminderTime.split(':').map(Number);

      const template = pickRandom(DAILY_TEMPLATES);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: template.title,
          body: template.body,
          data: { route: '/(tabs)/home', type: 'daily_reminder' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });
    } catch (error) {
      log.error('Error scheduling daily reminder:', error);
    }
  }, [isSupported, preferences]);

  // Schedule streak warning notification
  const scheduleStreakReminder = useCallback(async (hoursUntilExpiry: number) => {
    if (!isSupported || !preferences.streakReminders) return;

    try {
      const template = pickRandom(STREAK_TEMPLATES);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: template.title,
          body: template.body,
          data: { route: '/(tabs)/home', type: 'streak_warning' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: hoursUntilExpiry * 60 * 60,
        },
      });
    } catch (error) {
      log.error('Error scheduling streak reminder:', error);
    }
  }, [isSupported, preferences.streakReminders]);

  // Send immediate local notification
  const sendLocalNotification = useCallback(async (
    title: string,
    body: string,
    data?: Record<string, unknown>
  ) => {
    if (!isSupported) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });
    } catch (error) {
      log.error('Error sending local notification:', error);
    }
  }, [isSupported]);

  const scheduleRollingReminders = useCallback(async (lessonCompletedToday: boolean) => {
    if (!isSupported || !preferences.dailyReminder) {
      await cancelRollingLeoNudges();
      return;
    }
    await scheduleRollingLeoNudges(lessonCompletedToday);
  }, [isSupported, preferences.dailyReminder]);

  // Update preferences
  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);

    if (newPrefs.dailyReminder !== undefined || newPrefs.reminderTime !== undefined) {
      await scheduleDailyReminder();
    }

    await saveNotificationPreferences(updated);
  }, [preferences, scheduleDailyReminder, saveNotificationPreferences]);

  // Foreground notification handling is done globally in _layout.tsx via setNotificationHandler

  // Auto-register when user is available
  useEffect(() => {
    if (user && isSupported && !isRegistered) {
      const checkExisting = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('push_token')
          .eq('id', user.id)
          .single();

        if (data?.push_token) {
          setPushToken(data.push_token);
          setIsRegistered(true);
        }
      };
      checkExisting();
    }
  }, [user, isSupported, isRegistered]);

  // Schedule reminders when registered
  useEffect(() => {
    if (isRegistered && preferences.dailyReminder) {
      scheduleDailyReminder();
    }
  }, [isRegistered, preferences.dailyReminder, scheduleDailyReminder]);

  return {
    isSupported,
    isRegistered,
    pushToken,
    preferences,
    registerPushNotifications,
    scheduleDailyReminder,
    scheduleStreakReminder,
    scheduleRollingReminders,
    cancelRollingReminders: cancelRollingLeoNudges,
    sendLocalNotification,
    updatePreferences,
  };
}
