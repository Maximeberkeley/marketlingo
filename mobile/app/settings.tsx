import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { COLORS } from '../lib/constants';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { NotificationOnboarding } from '../components/onboarding/NotificationOnboarding';

// Deep-link route map (mirrors _layout.tsx)
const NOTIFICATION_ROUTES: Record<string, string> = {
  streak_warning: '/(tabs)/home',
  daily_reminder: '/(tabs)/home',
  leaderboard: '/leaderboard',
  news: '/(tabs)/home',
  achievement: '/achievements',
  investment: '/investment-lab',
};

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return tokenData.data;
  } catch (e) {
    console.warn('Could not get push token:', e);
    return null;
  }
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, resetPassword } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [newsAlerts, setNewsAlerts] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [showNotifOnboarding, setShowNotifOnboarding] = useState(false);
  const notificationListener = useRef<any>(null);

  // Load saved preferences from profile
  useEffect(() => {
    const loadPrefs = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('push_token, notification_preferences')
        .eq('id', user.id)
        .single();

      if (profile) {
        const hasToken = !!profile.push_token;
        setPushToken(profile.push_token || null);
        setPushEnabled(hasToken);

        const prefs = profile.notification_preferences as any;
        if (prefs) {
          setDailyReminder(prefs.dailyReminder ?? true);
          setStreakAlerts(prefs.streakReminders ?? true);
          setNewsAlerts(prefs.newsAlerts ?? true);
        }
      }
      setPrefsLoaded(true);
    };
    loadPrefs();
  }, [user]);

  // Listen for incoming notifications while app is open — show toast-style alert
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const data = (notification.request.content.data || {}) as Record<string, any>;
      const route = data?.route || (data?.type ? NOTIFICATION_ROUTES[data.type] : null);
      Alert.alert(
        notification.request.content.title || 'Notification',
        notification.request.content.body || '',
        [
          { text: 'Dismiss', style: 'cancel' },
          ...(route ? [{ text: 'Open', onPress: () => router.push(route as any) }] : []),
        ]
      );
    });
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
    };
  }, []);

  const handleTogglePush = async (value: boolean) => {
    if (value) {
      // Enable: register for push notifications
      setRegistering(true);
      try {
        const token = await registerForPushNotifications();
        if (!token) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device Settings to receive alerts.',
            [{ text: 'OK' }]
          );
          setPushEnabled(false);
          return;
        }

        setPushToken(token);
        setPushEnabled(true);

        // Save token to profile
        await supabase
          .from('profiles')
          .update({ push_token: token })
          .eq('id', user!.id);

        Alert.alert('Notifications Enabled', 'You\'ll receive daily reminders and streak alerts.');
      } catch (e) {
        console.error('Push registration error:', e);
        setPushEnabled(false);
      } finally {
        setRegistering(false);
      }
    } else {
      // Disable: remove token from profile
      setPushEnabled(false);
      setPushToken(null);
      await supabase
        .from('profiles')
        .update({ push_token: null })
        .eq('id', user!.id);

      Alert.alert('Notifications Disabled', 'You won\'t receive push notifications.');
    }
  };

  const handleTogglePref = async (key: 'dailyReminder' | 'streakAlerts' | 'newsAlerts', value: boolean) => {
    if (key === 'dailyReminder') setDailyReminder(value);
    if (key === 'streakAlerts') setStreakAlerts(value);
    if (key === 'newsAlerts') setNewsAlerts(value);

    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single();

    const currentPrefs = (profile?.notification_preferences as any) || {};
    const updated = {
      ...currentPrefs,
      dailyReminder: key === 'dailyReminder' ? value : dailyReminder,
      streakReminders: key === 'streakAlerts' ? value : streakAlerts,
      newsAlerts: key === 'newsAlerts' ? value : newsAlerts,
    };

    await supabase
      .from('profiles')
      .update({ notification_preferences: updated })
      .eq('id', user.id);
  };

  // Send a local test notification with a deep-link payload
  const handleTestNotification = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Enable notifications first.');
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Leo: Your streak is at risk!',
        body: "5 mins is all I ask… Don't lose your streak today!",
        data: { type: 'streak_warning', route: '/(tabs)/home' },
        sound: true,
      },
      trigger: { seconds: 3 } as any,
    });
    Alert.alert('Test Sent', "You'll receive a notification in 3 seconds. Tap it to test deep-linking!");
  };

  const handleResetPassword = async () => {

    if (!user?.email) return;
    Alert.alert(
      'Reset Password',
      `Send a password reset email to ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            const { success, error } = await resetPassword(user.email!);
            if (success) {
              Alert.alert('Sent', 'Check your email for the reset link.');
            } else {
              Alert.alert('Error', error || 'Failed to send reset email.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Contact Support', 'Please email support@marketlingo.app to delete your account.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Settings</Text>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>

          {/* Push toggle */}
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDesc}>
                {pushEnabled && pushToken
                  ? 'Registered — you\'ll receive alerts'
                  : 'Enable to receive reminders and alerts'}
              </Text>
            </View>
            {registering ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Switch
                value={pushEnabled}
                onValueChange={handleTogglePush}
                trackColor={{ false: COLORS.bg1, true: COLORS.accent }}
                thumbColor="#FFFFFF"
                disabled={!prefsLoaded}
              />
            )}
          </View>

          <View style={[styles.settingRow, !pushEnabled && { opacity: 0.45 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Daily Reminder</Text>
              <Text style={styles.settingDesc}>Get reminded to complete your lesson</Text>
            </View>
            <Switch
              value={dailyReminder}
              onValueChange={(v) => handleTogglePref('dailyReminder', v)}
              trackColor={{ false: COLORS.bg1, true: COLORS.accent }}
              thumbColor="#FFFFFF"
              disabled={!pushEnabled}
            />
          </View>

          <View style={[styles.settingRow, !pushEnabled && { opacity: 0.45 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Streak Alerts</Text>
              <Text style={styles.settingDesc}>Warning when streak is at risk</Text>
            </View>
            <Switch
              value={streakAlerts}
              onValueChange={(v) => handleTogglePref('streakAlerts', v)}
              trackColor={{ false: COLORS.bg1, true: COLORS.accent }}
              thumbColor="#FFFFFF"
              disabled={!pushEnabled}
            />
          </View>

          {/* News Alerts toggle */}
          <View style={[styles.settingRow, !pushEnabled && { opacity: 0.45 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Industry News Alerts</Text>
              <Text style={styles.settingDesc}>Breaking industry news 2× daily</Text>
            </View>
            <Switch
              value={newsAlerts}
              onValueChange={(v) => handleTogglePref('newsAlerts', v)}
              trackColor={{ false: COLORS.bg1, true: COLORS.accent }}
              thumbColor="#FFFFFF"
              disabled={!pushEnabled}
            />
          </View>

          {/* Set up notifications CTA — shown when push not yet enabled */}
          {!pushEnabled && !registering && (
            <TouchableOpacity
              style={styles.notifSetupBtn}
              onPress={() => setShowNotifOnboarding(true)}
              activeOpacity={0.85}
            >
              <Image source={APP_ICONS.streak} style={{ width: 18, height: 18, resizeMode: 'contain' }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.notifSetupLabel}>Set Up Notifications</Text>
                <Text style={styles.notifSetupDesc}>Daily reminders, streaks & industry news</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}

          {/* Token debug info (subtle) */}
          {pushEnabled && pushToken && (
            <View style={styles.tokenCard}>
              <Text style={styles.tokenLabel}>Device registered for push</Text>
            </View>
          )}

          {/* Test deep-link notification */}
          {pushEnabled && (
            <TouchableOpacity style={styles.testNotifBtn} onPress={handleTestNotification}>
              <Text style={styles.testNotifIcon}>🔔</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.testNotifLabel}>Send Test Notification</Text>
                <Text style={styles.testNotifDesc}>Fires in 3s — tap to test deep-linking</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'Not signed in'}</Text>
          </View>

          <TouchableOpacity style={styles.menuItem} onPress={handleResetPassword}>
            <Text style={{ fontSize: 18 }}>🔑</Text>
            <Text style={styles.menuText}>Reset Password</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/subscription' as any)}>
            <Text style={{ fontSize: 18 }}>👑</Text>
            <Text style={styles.menuText}>Manage Subscription</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={{ fontSize: 18 }}>📜</Text>
            <Text style={styles.menuText}>Terms of Service</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={{ fontSize: 18 }}>🔒</Text>
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DANGER ZONE</Text>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}
            onPress={handleDeleteAccount}
          >
            <Text style={{ fontSize: 18 }}>⚠️</Text>
            <Text style={[styles.menuText, { color: '#EF4444' }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Notification onboarding modal */}
      <NotificationOnboarding
        visible={showNotifOnboarding}
        onComplete={(_enabled) => setShowNotifOnboarding(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  scrollContent: { paddingHorizontal: 16 },
  backText: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 10 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  settingLabel: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
  settingDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  notifSetupBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(139,92,246,0.10)', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
  },
  notifSetupLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  notifSetupDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  tokenCard: {
    backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)', marginTop: 4,
  },
  tokenLabel: { fontSize: 12, color: '#22C55E', fontWeight: '500' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  infoLabel: { fontSize: 14, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
  chevron: { fontSize: 22, color: COLORS.textMuted },
  testNotifBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(99,102,241,0.10)', borderRadius: 14, padding: 14, marginTop: 4,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)',
  },
  testNotifIcon: { fontSize: 18 },
  testNotifLabel: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
  testNotifDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
