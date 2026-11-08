import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { COLORS } from "../lib/constants";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { useAIConsent } from "../hooks/useAIConsent";
import { isDark, applyThemeMode } from "../lib/theme";
import { NotificationOnboarding } from "../components/onboarding/NotificationOnboarding";
import { log } from "../lib/logger";
const NOTIFICATION_ROUTES = {
  streak_warning: "/(tabs)/home",
  daily_reminder: "/(tabs)/home",
  leaderboard: "/friends",
  news: "/(tabs)/home",
  achievement: "/achievements",
  investment: "/investment-lab"
};
async function registerForPushNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250]
    });
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }
  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const tokenData = projectId ? await Notifications.getExpoPushTokenAsync({ projectId }) : await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (e) {
    log.warn("Could not get push token:", e);
    return null;
  }
}
function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const aiConsent = useAIConsent();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [newsAlerts, setNewsAlerts] = useState(true);
  const [pushToken, setPushToken] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [showNotifOnboarding, setShowNotifOnboarding] = useState(false);
  const [useIndustryMascots, setUseIndustryMascots] = useState(true);
  const [darkModeOn, setDarkModeOn] = useState(isDark);
  const notificationListener = useRef(null);
  useEffect(() => {
    const loadPrefs = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("push_token, notification_preferences, use_industry_mascots").eq("id", user.id).single();
      if (profile) {
        const hasToken = !!profile.push_token;
        setPushToken(profile.push_token || null);
        setPushEnabled(hasToken);
        if (typeof profile.use_industry_mascots === "boolean") {
          setUseIndustryMascots(profile.use_industry_mascots);
        }
        const prefs = profile.notification_preferences;
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
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data || {};
      const route = data?.route || (data?.type ? NOTIFICATION_ROUTES[data.type] : null);
      Alert.alert(
        notification.request.content.title || "Notification",
        notification.request.content.body || "",
        [
          { text: "Dismiss", style: "cancel" },
          ...route ? [{ text: "Open", onPress: () => router.push(route) }] : []
        ]
      );
    });
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
    };
  }, []);
  const handleTogglePush = async (value) => {
    if (value) {
      setRegistering(true);
      try {
        const token = await registerForPushNotifications();
        if (!token) {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your device Settings to receive alerts.",
            [{ text: "OK" }]
          );
          setPushEnabled(false);
          return;
        }
        setPushToken(token);
        setPushEnabled(true);
        await supabase.from("profiles").update({ push_token: token }).eq("id", user.id);
        Alert.alert("Notifications Enabled", "You'll receive daily reminders and streak alerts.");
      } catch (e) {
        log.error("Push registration error:", e);
        setPushEnabled(false);
      } finally {
        setRegistering(false);
      }
    } else {
      setPushEnabled(false);
      setPushToken(null);
      await supabase.from("profiles").update({ push_token: null }).eq("id", user.id);
      Alert.alert("Notifications Disabled", "You won't receive push notifications.");
    }
  };
  const handleTogglePref = async (key, value) => {
    if (key === "dailyReminder") setDailyReminder(value);
    if (key === "streakAlerts") setStreakAlerts(value);
    if (key === "newsAlerts") setNewsAlerts(value);
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("notification_preferences").eq("id", user.id).single();
    const currentPrefs = profile?.notification_preferences || {};
    const updated = {
      ...currentPrefs,
      dailyReminder: key === "dailyReminder" ? value : dailyReminder,
      streakReminders: key === "streakAlerts" ? value : streakAlerts,
      newsAlerts: key === "newsAlerts" ? value : newsAlerts
    };
    await supabase.from("profiles").update({ notification_preferences: updated }).eq("id", user.id);
  };
  const handleChangePassword = () => {
    let currentPassword = "";
    let newPassword = "";
    Alert.prompt(
      "Change Password",
      "Enter your new password (min 6 characters):",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: async (pwd) => {
            if (!pwd || pwd.length < 6) {
              Alert.alert("Error", "Password must be at least 6 characters.");
              return;
            }
            try {
              const { error } = await supabase.auth.updateUser({ password: pwd });
              if (error) throw error;
              Alert.alert("Success", "Your password has been updated.");
            } catch (err) {
              Alert.alert("Error", err.message || "Failed to update password.");
            }
          }
        }
      ],
      "secure-text"
    );
  };
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "All your progress, XP, streaks, notes, and data will be permanently erased.",
              [
                { text: "Go Back", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) {
                        Alert.alert("Error", "You must be signed in to delete your account.");
                        return;
                      }
                      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
                      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
                      if (!supabaseUrl) {
                        Alert.alert("Error", "Configuration error. Please reinstall the app.");
                        return;
                      }
                      const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
                        method: "POST",
                        headers: {
                          "Authorization": `Bearer ${session.access_token}`,
                          "Content-Type": "application/json",
                          "apikey": anonKey
                        },
                        body: JSON.stringify({})
                      });
                      const result = await response.json().catch(() => null);
                      if (!response.ok || result && !result.success) {
                        throw new Error(result?.error || `Server error (${response.status})`);
                      }
                      await signOut();
                      router.replace("/auth");
                    } catch (err) {
                      log.error("Delete account error:", err);
                      Alert.alert("Error", err.message || "Failed to delete account. Please try again.");
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };
  const handleToggleDarkMode = (value) => {
    setDarkModeOn(value);
    Alert.alert(
      value ? "Turn on dark mode?" : "Turn off dark mode?",
      "MarketLingo restarts so the new colors apply everywhere.",
      [
        { text: "Not now", style: "cancel", onPress: () => setDarkModeOn(!value) },
        {
          text: "Restart",
          onPress: async () => {
            const restarted = await applyThemeMode(value ? "dark" : "light");
            if (!restarted) {
              Alert.alert("Saved", "Close and reopen MarketLingo to see the new look.");
            }
          }
        }
      ]
    );
  };
  const handleToggleIndustryMascots = async (value) => {
    setUseIndustryMascots(value);
    if (!user) return;
    await supabase.from("profiles").update({ use_industry_mascots: value }).eq("id", user.id);
  };
  return /* @__PURE__ */ React.createElement(View, { style: styles.container }, /* @__PURE__ */ React.createElement(
    ScrollView,
    {
      contentContainerStyle: [styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }],
      showsVerticalScrollIndicator: false
    },
    /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.back() }, /* @__PURE__ */ React.createElement(Text, { style: styles.backText }, "\u2190 Back")),
    /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Settings"),
    /* @__PURE__ */ React.createElement(View, { style: styles.section }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionTitle }, "NOTIFICATIONS"), /* @__PURE__ */ React.createElement(View, { style: styles.settingRow }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.settingLabel }, "Push Notifications"), /* @__PURE__ */ React.createElement(Text, { style: styles.settingDesc }, pushEnabled && pushToken ? "Registered \u2014 you'll receive alerts" : "Enable to receive reminders and alerts")), registering ? /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "small", color: COLORS.accent }) : /* @__PURE__ */ React.createElement(
      Switch,
      {
        value: pushEnabled,
        onValueChange: handleTogglePush,
        trackColor: { false: COLORS.bg1, true: COLORS.accent },
        thumbColor: "#FFFFFF",
        disabled: !prefsLoaded
      }
    )), /* @__PURE__ */ React.createElement(View, { style: [styles.settingRow, !pushEnabled && { opacity: 0.45 }] }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.settingLabel }, "Daily Reminder"), /* @__PURE__ */ React.createElement(Text, { style: styles.settingDesc }, "Get reminded to complete your lesson")), /* @__PURE__ */ React.createElement(
      Switch,
      {
        value: dailyReminder,
        onValueChange: (v) => handleTogglePref("dailyReminder", v),
        trackColor: { false: COLORS.bg1, true: COLORS.accent },
        thumbColor: "#FFFFFF",
        disabled: !pushEnabled
      }
    )), /* @__PURE__ */ React.createElement(View, { style: [styles.settingRow, !pushEnabled && { opacity: 0.45 }] }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.settingLabel }, "Streak Alerts"), /* @__PURE__ */ React.createElement(Text, { style: styles.settingDesc }, "Warning when streak is at risk")), /* @__PURE__ */ React.createElement(
      Switch,
      {
        value: streakAlerts,
        onValueChange: (v) => handleTogglePref("streakAlerts", v),
        trackColor: { false: COLORS.bg1, true: COLORS.accent },
        thumbColor: "#FFFFFF",
        disabled: !pushEnabled
      }
    )), /* @__PURE__ */ React.createElement(View, { style: [styles.settingRow, !pushEnabled && { opacity: 0.45 }] }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.settingLabel }, "Industry News Alerts"), /* @__PURE__ */ React.createElement(Text, { style: styles.settingDesc }, "Breaking industry news 2\xD7 daily")), /* @__PURE__ */ React.createElement(
      Switch,
      {
        value: newsAlerts,
        onValueChange: (v) => handleTogglePref("newsAlerts", v),
        trackColor: { false: COLORS.bg1, true: COLORS.accent },
        thumbColor: "#FFFFFF",
        disabled: !pushEnabled
      }
    )), !pushEnabled && !registering && /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: styles.notifSetupBtn,
        onPress: () => setShowNotifOnboarding(true),
        activeOpacity: 0.85
      },
      /* @__PURE__ */ React.createElement(Feather, { name: "bell", size: 18, color: COLORS.accent }),
      /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.notifSetupLabel }, "Set Up Notifications"), /* @__PURE__ */ React.createElement(Text, { style: styles.notifSetupDesc }, "Daily reminders, streaks & industry news")),
      /* @__PURE__ */ React.createElement(Text, { style: styles.chevron }, "\u203A")
    ), pushEnabled && pushToken && /* @__PURE__ */ React.createElement(View, { style: styles.tokenCard }, /* @__PURE__ */ React.createElement(Text, { style: styles.tokenLabel }, "Device registered for push"))),
    /* @__PURE__ */ React.createElement(View, { style: styles.section }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionTitle }, "APPEARANCE"), /* @__PURE__ */ React.createElement(View, { style: styles.settingRow }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.settingLabel }, "Dark Mode"), /* @__PURE__ */ React.createElement(Text, { style: styles.settingDesc }, "Soft dark greys. The app restarts to apply.")), /* @__PURE__ */ React.createElement(
      Switch,
      {
        value: darkModeOn,
        onValueChange: handleToggleDarkMode,
        trackColor: { false: COLORS.bg1, true: COLORS.accent },
        thumbColor: "#FFFFFF"
      }
    )), /* @__PURE__ */ React.createElement(View, { style: styles.settingRow }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.settingLabel }, "Use Industry Mascots"), /* @__PURE__ */ React.createElement(Text, { style: styles.settingDesc }, "Show industry-themed Leo on home screen")), /* @__PURE__ */ React.createElement(
      Switch,
      {
        value: useIndustryMascots,
        onValueChange: handleToggleIndustryMascots,
        trackColor: { false: COLORS.bg1, true: COLORS.accent },
        thumbColor: "#FFFFFF"
      }
    ))),
    /* @__PURE__ */ React.createElement(View, { style: styles.section }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionTitle }, "AI & VOICE"), /* @__PURE__ */ React.createElement(View, { style: styles.settingRow }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.settingLabel }, "AI explanations (Leo)"), /* @__PURE__ */ React.createElement(Text, { style: styles.settingDesc }, "Sends your question and lesson context to an external AI service. Lessons, drills and reviews work fully without it.")), /* @__PURE__ */ React.createElement(
      Switch,
      {
        value: aiConsent.consent.ai,
        onValueChange: (v) => aiConsent.setAI(v),
        trackColor: { false: COLORS.bg1, true: COLORS.accent },
        thumbColor: "#FFFFFF"
      }
    )), /* @__PURE__ */ React.createElement(View, { style: [styles.settingRow, !aiConsent.consent.ai && { opacity: 0.45 }] }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.settingLabel }, "Voice mode"), /* @__PURE__ */ React.createElement(Text, { style: styles.settingDesc }, "Records your microphone and sends audio for speech processing when you talk to Leo.")), /* @__PURE__ */ React.createElement(
      Switch,
      {
        value: aiConsent.consent.voice,
        onValueChange: (v) => aiConsent.setVoice(v),
        trackColor: { false: COLORS.bg1, true: COLORS.accent },
        thumbColor: "#FFFFFF",
        disabled: !aiConsent.consent.ai
      }
    ))),
    /* @__PURE__ */ React.createElement(View, { style: styles.section }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionTitle }, "ACCOUNT"), /* @__PURE__ */ React.createElement(View, { style: styles.infoRow }, /* @__PURE__ */ React.createElement(Text, { style: styles.infoLabel }, "Email"), /* @__PURE__ */ React.createElement(Text, { style: styles.infoValue }, user?.email || "Not signed in")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.menuItem, onPress: handleChangePassword }, /* @__PURE__ */ React.createElement(Feather, { name: "lock", size: 18, color: COLORS.textSecondary }), /* @__PURE__ */ React.createElement(Text, { style: styles.menuText }, "Change Password"), /* @__PURE__ */ React.createElement(Text, { style: styles.chevron }, "\u203A"))),
    /* @__PURE__ */ React.createElement(View, { style: styles.section }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionTitle }, "ABOUT"), /* @__PURE__ */ React.createElement(View, { style: styles.infoRow }, /* @__PURE__ */ React.createElement(Text, { style: styles.infoLabel }, "Version"), /* @__PURE__ */ React.createElement(Text, { style: styles.infoValue }, Constants.expoConfig?.version || "1.1.1")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.menuItem, onPress: () => router.push("/legal?type=terms") }, /* @__PURE__ */ React.createElement(Feather, { name: "file-text", size: 18, color: COLORS.textSecondary }), /* @__PURE__ */ React.createElement(Text, { style: styles.menuText }, "Terms of Service"), /* @__PURE__ */ React.createElement(Text, { style: styles.chevron }, "\u203A")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.menuItem, onPress: () => router.push("/legal?type=privacy") }, /* @__PURE__ */ React.createElement(Feather, { name: "shield", size: 18, color: COLORS.textSecondary }), /* @__PURE__ */ React.createElement(Text, { style: styles.menuText }, "Privacy Policy"), /* @__PURE__ */ React.createElement(Text, { style: styles.chevron }, "\u203A"))),
    /* @__PURE__ */ React.createElement(View, { style: styles.section }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionTitle }, "DANGER ZONE"), /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: [styles.menuItem, { backgroundColor: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.2)" }],
        onPress: handleDeleteAccount
      },
      /* @__PURE__ */ React.createElement(View, { style: { width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(239,68,68,0.2)", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 10, color: "#EF4444", fontWeight: "800" } }, "!")),
      /* @__PURE__ */ React.createElement(Text, { style: [styles.menuText, { color: "#EF4444" }] }, "Delete Account")
    ))
  ), /* @__PURE__ */ React.createElement(
    NotificationOnboarding,
    {
      visible: showNotifOnboarding,
      onComplete: async (enabled) => {
        setShowNotifOnboarding(false);
        if (enabled) {
          await handleTogglePush(true);
        }
      }
    }
  ));
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  scrollContent: { paddingHorizontal: 16 },
  backText: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: "600", color: COLORS.textMuted, letterSpacing: 1, marginBottom: 10 },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  settingLabel: { fontSize: 15, fontWeight: "500", color: COLORS.textPrimary },
  settingDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  notifSetupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(139,92,246,0.10)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)"
  },
  notifSetupLabel: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary },
  notifSetupDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  tokenCard: {
    backgroundColor: "rgba(34,197,94,0.08)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
    marginTop: 4
  },
  tokenLabel: { fontSize: 12, color: "#22C55E", fontWeight: "500" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  infoLabel: { fontSize: 14, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "500" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  menuText: { flex: 1, fontSize: 15, fontWeight: "500", color: COLORS.textPrimary },
  chevron: { fontSize: 22, color: COLORS.textMuted }
});
export {
  SettingsScreen as default
};
