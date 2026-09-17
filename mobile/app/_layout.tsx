import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { LeoProvider } from '../components/mascot/LeoCharacter';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { COLORS } from '../lib/constants';
import { isDark } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';
import { syncLeoWidget } from '../lib/leoWidget';
import { getMarketName } from '../lib/markets';
import { log } from '../lib/logger';

// Map notification data `route` or `type` to an Expo Router path
function resolveRoute(data: Record<string, any>): string | null {
  if (data?.route) return data.route as string;

  switch (data?.type) {
    case 'streak_warning':
    case 'daily_reminder':
      return '/(tabs)/home';
    case 'leaderboard':
      return '/leaderboard';
    case 'news':
      return '/(tabs)/home';
    case 'achievement':
      return '/achievements';
    case 'investment':
      return '/investment-lab';
    default:
      if (data?.marketId) return `/(tabs)/home`;
      return null;
  }
}

// Global foreground handler — show banner even while app is active
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Keeps both Home Screen and Lock Screen widgets fresh from any app screen. */
function WidgetSyncBridge() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let active = true;

    const pushLatest = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('selected_market')
          .eq('id', user.id)
          .maybeSingle();
        const marketId = profile?.selected_market || await storage.getIndustry();
        if (!marketId || !active) return;

        const today = new Date().toISOString().split('T')[0];
        const [{ data: progress }, { data: daily }] = await Promise.all([
          supabase
            .from('user_progress')
            .select('current_streak, streak_expires_at')
            .eq('user_id', user.id)
            .eq('market_id', marketId)
            .maybeSingle(),
          supabase
            .from('daily_completions')
            .select('lesson_completed')
            .eq('user_id', user.id)
            .eq('market_id', marketId)
            .eq('completion_date', today)
            .maybeSingle(),
        ]);
        if (!active) return;

        syncLeoWidget({
          streak: progress?.current_streak ?? 0,
          lessonComplete: daily?.lesson_completed ?? false,
          expiresAt: progress?.streak_expires_at,
          market: getMarketName(marketId),
        });
      } catch (error) {
        log.warn('[LeoWidget] Foreground sync failed:', error);
      }
    };

    void pushLatest();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void pushLatest();
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [user]);

  return null;
}

export default function RootLayout() {
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null);

  // Keep the iOS app icon free of any badge count (we never use badges).
  useEffect(() => {
    const clearBadge = () => {
      Notifications.setBadgeCountAsync(0).catch(() => {});
      Notifications.dismissAllNotificationsAsync().catch(() => {});
    };
    clearBadge();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') clearBadge();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // Handle tap on notification (background → foreground / killed → open)
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = (response.notification.request.content.data || {}) as Record<string, any>;
        const target = resolveRoute(data);
        if (target) {
          // Small delay so the navigator is mounted before we push
          setTimeout(() => {
            router.push(target as any);
          }, 300);
        }
      });

    // Handle notification tapped while app was already in the foreground
    // (foreground taps are shown as banners; tapping them fires the response listener above)

    return () => {
      notificationResponseListener.current?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthProvider>
             <WidgetSyncBridge />
            <LeoProvider>
              <StatusBar style={isDark ? 'light' : 'dark'} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: COLORS.bg0 },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="onboarding/index" />
                <Stack.Screen name="onboarding/goal" options={{ gestureEnabled: false }} />
                <Stack.Screen name="onboarding/familiarity" options={{ gestureEnabled: false }} />
                <Stack.Screen name="(tabs)" options={{ animation: 'fade', gestureEnabled: false }} />
                <Stack.Screen name="arena" />
                <Stack.Screen name="deep-case" />
                <Stack.Screen name="trainer" />
                <Stack.Screen name="games" />
                <Stack.Screen name="drills" />
                <Stack.Screen name="summaries" />
                <Stack.Screen name="achievements" />
                <Stack.Screen name="collection" />
                <Stack.Screen name="leaderboard" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="interview-lab" />
                <Stack.Screen name="investment-lab" />
                <Stack.Screen name="investment-module" />
                <Stack.Screen name="investment-certificate" />
                <Stack.Screen name="investment-watchlist" />
                <Stack.Screen name="regulatory-hub" />
                <Stack.Screen name="passport" />
                <Stack.Screen name="certificate" />
                <Stack.Screen name="friends" />
                <Stack.Screen name="legal" />
                <Stack.Screen name="seminars" />
                <Stack.Screen name="seminar-detail" />
              </Stack>
            </LeoProvider>
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
