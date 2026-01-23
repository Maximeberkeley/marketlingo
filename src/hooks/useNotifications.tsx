import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
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

export function useNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  // Check if we're on a native platform
  useEffect(() => {
    const checkPlatform = () => {
      const platform = Capacitor.getPlatform();
      setIsSupported(platform === 'ios' || platform === 'android');
    };
    checkPlatform();
  }, []);

  // Register for push notifications
  const registerPushNotifications = useCallback(async () => {
    if (!isSupported) return false;

    try {
      // Request permission
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission denied');
        return false;
      }

      // Register with Apple/Google
      await PushNotifications.register();
      
      // Listen for registration
      PushNotifications.addListener('registration', async (token: Token) => {
        console.log('Push registration success, token:', token.value);
        setPushToken(token.value);
        setIsRegistered(true);
        
        // Save token to database
        if (user) {
          await savePushToken(token.value);
        }
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
        setIsRegistered(false);
      });

      // Listen for notifications received
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
      });

      // Listen for notification actions
      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('Push notification action performed:', action);
        handleNotificationAction(action);
      });

      return true;
    } catch (error) {
      console.error('Error registering push notifications:', error);
      return false;
    }
  }, [isSupported, user]);

  // Save push token to database
  const savePushToken = async (token: string) => {
    if (!user) return;
    
    try {
      // We'll store this in user_progress or a dedicated table
      const { error } = await supabase
        .from('profiles')
        .update({ 
          push_token: token,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error saving push token:', error);
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  // Handle notification action (when user taps)
  const handleNotificationAction = (action: ActionPerformed) => {
    const data = action.notification.data;
    
    if (data?.route) {
      // Navigate to the specified route
      window.location.href = data.route;
    }
  };

  // Schedule local notification reminders (Duolingo-style)
  const scheduleDailyReminder = useCallback(async () => {
    if (!isSupported) return;

    try {
      // Check permission for local notifications
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        const request = await LocalNotifications.requestPermissions();
        if (request.display !== 'granted') return;
      }

      // Cancel existing scheduled notifications
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }

      if (!preferences.dailyReminder) return;

      // Parse reminder time
      const [hours, minutes] = preferences.reminderTime.split(':').map(Number);
      
      // Schedule daily reminder
      const scheduleOptions: ScheduleOptions = {
        notifications: [
          {
            id: 1,
            title: "Time to learn! 📚",
            body: "Your daily aerospace lesson is waiting. Keep your streak alive!",
            schedule: {
              on: {
                hour: hours,
                minute: minutes,
              },
              repeats: true,
              allowWhileIdle: true,
            },
            sound: 'notification.wav',
            actionTypeId: 'OPEN_APP',
            extra: {
              route: '/home',
            },
          },
        ],
      };

      await LocalNotifications.schedule(scheduleOptions);
      console.log('Daily reminder scheduled for', preferences.reminderTime);
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  }, [isSupported, preferences]);

  // Schedule streak warning notification
  const scheduleStreakReminder = useCallback(async (hoursUntilExpiry: number) => {
    if (!isSupported || !preferences.streakReminders) return;

    try {
      const scheduleOptions: ScheduleOptions = {
        notifications: [
          {
            id: 2,
            title: "🔥 Your streak is at risk!",
            body: "Complete a lesson now to keep your learning streak alive!",
            schedule: {
              at: new Date(Date.now() + hoursUntilExpiry * 60 * 60 * 1000),
            },
            sound: 'notification.wav',
            extra: {
              route: '/home',
            },
          },
        ],
      };

      await LocalNotifications.schedule(scheduleOptions);
    } catch (error) {
      console.error('Error scheduling streak reminder:', error);
    }
  }, [isSupported, preferences.streakReminders]);

  // Send immediate local notification (for news alerts, etc.)
  const sendLocalNotification = useCallback(async (title: string, body: string, data?: Record<string, unknown>) => {
    if (!isSupported) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 100000),
            title,
            body,
            schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
            sound: 'notification.wav',
            extra: data,
          },
        ],
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }, [isSupported]);

  // Update preferences
  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    
    // Reschedule reminders with new preferences
    if (newPrefs.dailyReminder !== undefined || newPrefs.reminderTime !== undefined) {
      await scheduleDailyReminder();
    }
    
    // Save to local storage
    localStorage.setItem('notification_preferences', JSON.stringify(updated));
  }, [preferences, scheduleDailyReminder]);

  // Load preferences from storage
  useEffect(() => {
    const stored = localStorage.getItem('notification_preferences');
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing notification preferences:', e);
      }
    }
  }, []);

  // Setup notifications when registered
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