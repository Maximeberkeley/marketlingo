import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from '../hooks/useAuth';
import { LeoProvider } from '../components/mascot/LeoCharacter';

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

export default function RootLayout() {
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null);

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
        <AuthProvider>
          <LeoProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0B1020' },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="onboarding/index" />
              <Stack.Screen name="onboarding/goal" />
              <Stack.Screen name="onboarding/familiarity" />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="trainer" />
              <Stack.Screen name="games" />
              <Stack.Screen name="drills" />
              <Stack.Screen name="summaries" />
              <Stack.Screen name="achievements" />
              <Stack.Screen name="leaderboard" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="investment-lab" />
              <Stack.Screen name="investment-module" />
              <Stack.Screen name="investment-certificate" />
              <Stack.Screen name="investment-watchlist" />
              <Stack.Screen name="regulatory-hub" />
              <Stack.Screen name="subscription" />
              <Stack.Screen name="passport" />
              <Stack.Screen name="certificate" />
              <Stack.Screen name="friends" />
            </Stack>
          </LeoProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
