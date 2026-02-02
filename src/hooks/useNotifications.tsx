import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
  const { isProUser, isLoading: isSubscriptionLoading } = useSubscription();
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const listenersRegistered = useRef(false);
  
  // Get navigate function - will be null if not in Router context
  let navigate: ((path: string) => void) | null = null;
  try {
    navigate = useNavigate();
  } catch {
    // Not in Router context, navigation will use window.location
  }

  // Check if we're on a native platform
  useEffect(() => {
    const platform = Capacitor.getPlatform();
    setIsSupported(platform === 'ios' || platform === 'android');
  }, []);

  // Handle deep link navigation from notification
  const handleDeepLink = useCallback((route: string) => {
    console.log('Navigating to:', route);
    if (navigate) {
      navigate(route);
    } else {
      window.location.href = route;
    }
  }, [navigate]);

  // Handle notification action (when user taps)
  const handleNotificationAction = useCallback((action: ActionPerformed) => {
    console.log('Push notification action performed:', action);
    const data = action.notification.data;
    
    // Handle deep linking based on payload
    if (data?.route) {
      handleDeepLink(data.route as string);
    } else if (data?.marketId) {
      // Navigate to specific market
      handleDeepLink(`/home?market=${data.marketId}`);
    } else if (data?.type === 'leaderboard') {
      handleDeepLink('/leaderboard');
    } else if (data?.type === 'streak_warning') {
      handleDeepLink('/home');
    }
  }, [handleDeepLink]);

  // Show foreground notification as toast
  const showForegroundNotification = useCallback((notification: PushNotificationSchema) => {
    const { title, body, data } = notification;
    
    toast(title || 'New Notification', {
      description: body,
      duration: 5000,
      action: data?.route ? {
        label: 'View',
        onClick: () => handleDeepLink(data.route as string),
      } : undefined,
    });
  }, [handleDeepLink]);

  // Save push token to database
  const savePushToken = useCallback(async (token: string) => {
    if (!user) {
      console.log('No user, skipping token save');
      return;
    }
    
    try {
      console.log('Saving push token for user:', user.id);
      const { error } = await supabase
        .from('profiles')
        .update({ 
          push_token: token,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token saved successfully');
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
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error saving notification preferences:', error);
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }, [user]);

  // Register for push notifications (Pro only)
  const registerPushNotifications = useCallback(async () => {
    if (!isSupported) {
      console.log('Push notifications not supported on this platform');
      return false;
    }

    if (!isProUser) {
      console.log('Push notifications are a Pro feature');
      return false;
    }

    try {
      // Request permission
      let permStatus = await PushNotifications.checkPermissions();
      console.log('Current permission status:', permStatus.receive);
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission denied');
        return false;
      }

      // Register listeners only once
      if (!listenersRegistered.current) {
        listenersRegistered.current = true;

        // Listen for registration success
        await PushNotifications.addListener('registration', async (token: Token) => {
          console.log('Push registration success, token:', token.value);
          setPushToken(token.value);
          setIsRegistered(true);
          
          // Save token to database
          await savePushToken(token.value);
        });

        // Listen for registration error
        await PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error);
          setIsRegistered(false);
        });

        // Listen for notifications received while app is open (foreground)
        await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
          console.log('Push notification received (foreground):', notification);
          showForegroundNotification(notification);
        });

        // Listen for notification actions (user tapped notification)
        await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
          handleNotificationAction(action);
        });
      }

      // Register with Apple/Google
      await PushNotifications.register();
      console.log('Push notification registration initiated');
      
      return true;
    } catch (error) {
      console.error('Error registering push notifications:', error);
      return false;
    }
  }, [isSupported, isProUser, savePushToken, showForegroundNotification, handleNotificationAction]);

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
      
      // Schedule daily reminder with Leo's voice
      const scheduleOptions: ScheduleOptions = {
        notifications: [
          {
            id: 1,
            title: "🦁 Leo: Markets are moving!",
            body: "Time for your daily brief? 5 mins is all I ask...",
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
              type: 'daily_reminder',
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
            title: "🦁 Leo: Don't let your streak end!",
            body: "5 mins is all I ask... Your streak is at risk!",
            schedule: {
              at: new Date(Date.now() + hoursUntilExpiry * 60 * 60 * 1000),
            },
            sound: 'notification.wav',
            extra: {
              route: '/home',
              type: 'streak_warning',
            },
          },
        ],
      };

      await LocalNotifications.schedule(scheduleOptions);
      console.log('Streak reminder scheduled for', hoursUntilExpiry, 'hours from now');
    } catch (error) {
      console.error('Error scheduling streak reminder:', error);
    }
  }, [isSupported, preferences.streakReminders]);

  // Send immediate local notification (for news alerts, etc.)
  const sendLocalNotification = useCallback(async (
    title: string, 
    body: string, 
    data?: Record<string, unknown>
  ) => {
    if (!isSupported) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 100000),
            title,
            body,
            schedule: { at: new Date(Date.now() + 1000) },
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
    
    // Also save to database for server-side filtering
    await saveNotificationPreferences(updated);
  }, [preferences, scheduleDailyReminder, saveNotificationPreferences]);

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

  // Auto-register when Pro user is available and on native platform
  useEffect(() => {
    if (user && isSupported && !isRegistered && isProUser && !isSubscriptionLoading) {
      // Check if we already have a token stored
      const checkExistingToken = async () => {
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
      
      checkExistingToken();
    }
  }, [user, isSupported, isRegistered, isProUser, isSubscriptionLoading]);

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      if (listenersRegistered.current) {
        PushNotifications.removeAllListeners();
        listenersRegistered.current = false;
      }
    };
  }, []);

  return {
    isSupported,
    isRegistered,
    pushToken,
    preferences,
    isProRequired: true, // Push notifications require Pro
    isProUser,
    registerPushNotifications,
    scheduleDailyReminder,
    scheduleStreakReminder,
    sendLocalNotification,
    updatePreferences,
  };
}
