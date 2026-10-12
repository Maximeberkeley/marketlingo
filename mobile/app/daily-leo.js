import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { localDateString } from "../lib/dayMath";
import { getMarketName } from "../lib/markets";
import { COLORS, SHADOWS } from "../lib/constants";
import { LeoCharacter } from "../components/mascot/LeoCharacter";
import { SpeechBubble } from "../components/ui/SpeechBubble";
import { triggerHaptic } from "../lib/haptics";
import { log } from "../lib/logger";
const STARTUP_TIMEOUT_MS = 6e3;
function withStartupTimeout(request) {
  return Promise.race([
    Promise.resolve(request),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Daily check-in timed out")), STARTUP_TIMEOUT_MS);
    })
  ]);
}
function presentation(data) {
  const hour = (/* @__PURE__ */ new Date()).getHours();
  const market = getMarketName(data.market);
  if (hour >= 21) {
    return {
      mood: "reading",
      eyebrow: "GOOD EVENING",
      line: `Today's ${market} idea is ready.`
    };
  }
  if (hour >= 18) {
    return {
      mood: "thinking",
      eyebrow: "GOOD EVENING",
      line: `Today's ${market} idea is ready.`
    };
  }
  if (hour >= 12) {
    return {
      mood: "sassy",
      eyebrow: "GOOD AFTERNOON",
      line: `Today's ${market} idea is ready.`
    };
  }
  return {
    mood: "reading",
    eyebrow: "GOOD MORNING",
    line: `Today's ${market} idea is ready.`
  };
}
function DailyLeoScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      try {
        const { data: profile, error: profileError } = await withStartupTimeout(
          supabase.from("profiles").select("selected_market").eq("id", user.id).maybeSingle()
        );
        if (profileError) throw profileError;
        const market = profile?.selected_market;
        if (!market) {
          router.replace("/(tabs)/home");
          return;
        }
        const [{ data: daily, error: dailyError }, { data: progress, error: progressError }] = await withStartupTimeout(Promise.all([
          supabase.from("daily_completions").select("lesson_completed").eq("user_id", user.id).eq("market_id", market).eq("completion_date", localDateString()).maybeSingle(),
          supabase.from("user_progress").select("current_streak, streak_expires_at").eq("user_id", user.id).eq("market_id", market).maybeSingle()
        ]));
        if (dailyError) throw dailyError;
        if (progressError) throw progressError;
        if (!active) return;
        if (daily?.lesson_completed) {
          router.replace("/(tabs)/home");
          return;
        }
        setData({ market, streak: progress?.current_streak ?? 0, expiresAt: progress?.streak_expires_at ?? null });
      } catch (error) {
        log.warn("[DailyLeo] Could not load daily check-in:", error);
        router.replace("/(tabs)/home");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);
  const content = useMemo(() => data ? presentation(data) : null, [data]);
  if (loading || !data || !content) {
    return /* @__PURE__ */ React.createElement(View, { style: styles.loading }, /* @__PURE__ */ React.createElement(ActivityIndicator, { color: COLORS.accent }));
  }
  return /* @__PURE__ */ React.createElement(View, { style: [styles.root, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 22 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.heading }, /* @__PURE__ */ React.createElement(Text, { style: styles.eyebrow }, content.eyebrow), /* @__PURE__ */ React.createElement(Text, { style: styles.title }, data.streak > 0 ? `Welcome back \u2014 ${data.streak} ${data.streak === 1 ? "day" : "days"} in a row` : "Welcome back to your market")), /* @__PURE__ */ React.createElement(View, { style: styles.scene }, /* @__PURE__ */ React.createElement(SpeechBubble, { text: content.line, tail: "bottom-center", showLabel: true, style: styles.bubble }), /* @__PURE__ */ React.createElement(View, { style: styles.leoWrap }, /* @__PURE__ */ React.createElement(LeoCharacter, { size: "xl", animation: content.mood, still: true }))), /* @__PURE__ */ React.createElement(View, { style: styles.footer }, /* @__PURE__ */ React.createElement(Text, { style: styles.caption }, "One lesson. About five minutes."), /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      style: styles.continueButton,
      activeOpacity: 0.88,
      onPress: () => {
        triggerHaptic("medium");
        router.replace("/(tabs)/home");
      }
    },
    /* @__PURE__ */ React.createElement(Text, { style: styles.continueText }, "Continue"),
    /* @__PURE__ */ React.createElement(Feather, { name: "arrow-right", size: 20, color: "#FFFFFF" })
  )));
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 22, justifyContent: "space-between" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg0 },
  heading: { paddingTop: 20 },
  eyebrow: { fontSize: 11, fontWeight: "900", color: COLORS.accent, letterSpacing: 1.2, marginBottom: 10 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: "900", color: COLORS.textPrimary, maxWidth: 330 },
  scene: { flex: 1, minHeight: 310, flexDirection: "column", alignItems: "center", justifyContent: "center" },
  // Full width and no clipping: the umbrella and tail must stay in frame.
  leoWrap: { width: 208, height: 208, justifyContent: "center", alignItems: "center" },
  // Centered over Leo's head so the bubble reads as coming from him.
  bubble: { maxWidth: 260, marginBottom: 8, alignSelf: "center" },
  footer: { gap: 14 },
  caption: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19, textAlign: "center", fontWeight: "600" },
  continueButton: { height: 58, borderRadius: 18, backgroundColor: COLORS.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, ...SHADOWS.accent },
  continueText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" }
});
export {
  DailyLeoScreen as default
};
