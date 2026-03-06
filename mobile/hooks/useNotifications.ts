import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

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

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const notificationListener = useRef<Notifications.EventSubscription>(undefined as any);
  const responseListener = useRef<Notifications.EventSubscription>(undefined as any);

  // Check platform support
  useEffect(() => {
    setIsSupported(Platform.OS === 'ios' || Platform.OS === 'android');
  }, []);

  // Handle notification response (user tapped notification)
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    if (data?.route) {
      router.push(data.route as any);
    } else if (data?.type === 'streak_warning') {
      router.push('/(tabs)/home');
    } else if (data?.type === 'leaderboard') {
      router.push('/leaderboard');
    }
  }, []);

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
        console.error('Error saving push token:', error);
      }
    } catch (error) {
      console.error('Error saving push token:', error);
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
        console.error('Error saving notification preferences:', error);
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
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
        console.log('Push notification permission denied');
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
      console.error('Error registering push notifications:', error);
      return false;
    }
  }, [isSupported, savePushToken]);

  // Schedule daily reminder
  const scheduleDailyReminder = useCallback(async () => {
    if (!isSupported) return;

    try {
      // Cancel existing scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (!preferences.dailyReminder) return;

      const [hours, minutes] = preferences.reminderTime.split(':').map(Number);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: ' Leo: Markets are moving!',
          body: "Time for your daily brief? 5 mins is all I ask...",
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
      console.error('Error scheduling daily reminder:', error);
    }
  }, [isSupported, preferences]);

  // Schedule streak warning notification
  const scheduleStreakReminder = useCallback(async (hoursUntilExpiry: number) => {
    if (!isSupported || !preferences.streakReminders) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: " Leo: Don't let your streak end!",
          body: '5 mins is all I ask... Your streak is at risk!',
          data: { route: '/(tabs)/home', type: 'streak_warning' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: hoursUntilExpiry * 60 * 60,
        },
      });
    } catch (error) {
      console.error('Error scheduling streak reminder:', error);
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
      console.error('Error sending local notification:', error);
    }
  }, [isSupported]);

  // Update preferences
  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);

    if (newPrefs.dailyReminder !== undefined || newPrefs.reminderTime !== undefined) {
      await scheduleDailyReminder();
    }

    await saveNotificationPreferences(updated);
  }, [preferences, scheduleDailyReminder, saveNotificationPreferences]);

  // Setup listeners
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Notification received while app is foregrounded — handled by Notifications.setNotificationHandler
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationResponse]);

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
    sendLocalNotification,
    updatePreferences,
  };
}
