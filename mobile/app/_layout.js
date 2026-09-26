import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import { AuthProvider } from "../hooks/useAuth";
import { LeoProvider } from "../components/mascot/LeoCharacter";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { PushTokenSync } from "../components/PushTokenSync";
import { COLORS } from "../lib/constants";
import { isDark } from "../lib/theme";
function resolveRoute(data) {
  if (data?.route) return data.route;
  switch (data?.type) {
    case "streak_warning":
    case "daily_reminder":
    case "daily_fallback":
    case "leo_rolling_nudge":
      return "/(tabs)/home";
    case "leaderboard":
      return "/leaderboard";
    case "news":
      return "/(tabs)/roadmap";
    case "achievement":
      return "/achievements";
    case "investment":
      return "/investment-lab";
    default:
      if (data?.marketId) return `/(tabs)/home`;
      return null;
  }
}
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});
function RootLayout() {
  const notificationResponseListener = useRef(null);
  useEffect(() => {
    const clearBadge = () => {
      Notifications.setBadgeCountAsync(0).catch(() => {
      });
      Notifications.dismissAllNotificationsAsync().catch(() => {
      });
    };
    clearBadge();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") clearBadge();
    });
    return () => sub.remove();
  }, []);
  useEffect(() => {
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      const target = resolveRoute(data);
      if (target) {
        setTimeout(() => {
          router.push(target);
        }, 300);
      }
    });
    return () => {
      notificationResponseListener.current?.remove();
    };
  }, []);
  return <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthProvider>
            <LeoProvider>
              <PushTokenSync />
              <StatusBar style={isDark ? "light" : "dark"} />
              <Stack
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: COLORS.bg0 },
      animation: "slide_from_right"
    }}
  >
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="demo" options={{ gestureEnabled: false }} />
                <Stack.Screen name="onboarding/welcome" options={{ gestureEnabled: false }} />
                <Stack.Screen name="onboarding/index" />
                <Stack.Screen name="onboarding/goal" options={{ gestureEnabled: false }} />
                <Stack.Screen name="onboarding/familiarity" options={{ gestureEnabled: false }} />
                <Stack.Screen name="daily-leo" options={{ animation: "fade", gestureEnabled: false }} />
                <Stack.Screen name="(tabs)" options={{ animation: "fade", gestureEnabled: false }} />
                <Stack.Screen name="notes" />
                <Stack.Screen name="deliverable" />
                <Stack.Screen name="focus" />
                <Stack.Screen name="streak-rescue" />
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
    </GestureHandlerRootView>;
}
export {
  RootLayout as default
};
