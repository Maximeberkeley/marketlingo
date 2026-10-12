import React from "react";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
function RootLayout() {
  const notificationResponseListener = useRef(null);
  useEffect(() => {
    AsyncStorage.multiRemove(["@marketlingo/practice_shortcuts", "@marketlingo/practice_shortcuts_v2"]).catch(() => {
    });
  }, []);
  useEffect(() => {
    let active = true;
    const connectNotifications = async () => {
      try {
        const Notifications = await import("expo-notifications");
        if (!active) return;
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true
          })
        });
        const clearBadge = () => {
          Notifications.setBadgeCountAsync(0).catch(() => {
          });
          Notifications.dismissAllNotificationsAsync().catch(() => {
          });
        };
        clearBadge();
        notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data || {};
          const target = resolveRoute(data);
          if (target) setTimeout(() => router.push(target), 300);
        });
      } catch {
      }
    };
    void connectNotifications();
    return () => {
      active = false;
      notificationResponseListener.current?.remove();
      notificationResponseListener.current = null;
    };
  }, []);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void import("expo-notifications").then((Notifications) => Promise.allSettled([
        Notifications.setBadgeCountAsync(0),
        Notifications.dismissAllNotificationsAsync()
      ])).catch(() => {
      });
    });
    return () => sub.remove();
  }, []);
  return /* @__PURE__ */ React.createElement(GestureHandlerRootView, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(SafeAreaProvider, null, /* @__PURE__ */ React.createElement(ErrorBoundary, null, /* @__PURE__ */ React.createElement(AuthProvider, null, /* @__PURE__ */ React.createElement(LeoProvider, null, /* @__PURE__ */ React.createElement(PushTokenSync, null), /* @__PURE__ */ React.createElement(StatusBar, { style: isDark ? "light" : "dark" }), /* @__PURE__ */ React.createElement(
    Stack,
    {
      screenOptions: {
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg0 },
        animation: "slide_from_right"
      }
    },
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "index" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "auth" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "demo", options: { gestureEnabled: false } }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "onboarding/welcome", options: { gestureEnabled: false } }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "onboarding/index" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "onboarding/goal", options: { gestureEnabled: false } }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "onboarding/familiarity", options: { gestureEnabled: false } }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "daily-leo", options: { animation: "fade", gestureEnabled: false } }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "(tabs)", options: { animation: "fade", gestureEnabled: false } }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "notes" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "deliverable", options: { animation: "fade" } }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "focus" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "streak-rescue" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "arena", options: { animation: "fade" } }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "deep-case", options: { animation: "fade" } }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "trainer" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "games" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "drills" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "summaries" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "achievements" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "collection" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "leaderboard" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "settings" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "interview-lab" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "leo-call", options: { animation: "fade", gestureEnabled: false } }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "investment-lab" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "investment-module" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "investment-certificate" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "investment-watchlist" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "regulatory-hub" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "passport" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "certificate" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "friends" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "legal" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "seminars" }),
    /* @__PURE__ */ React.createElement(Stack.Screen, { name: "seminar-detail" })
  ))))));
}
export {
  RootLayout as default
};
