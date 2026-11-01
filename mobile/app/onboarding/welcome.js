import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SHADOWS } from "../../lib/constants";
import { useAuth } from "../../hooks/useAuth";
import { normalizeDisplayName } from "../../lib/displayName";
import { storage } from "../../lib/storage";
import { supabase } from "../../lib/supabase";
import { useIsFocused } from "@react-navigation/native";
import { LeoAnimated } from "../../components/mascot/LeoAnimated";
import { triggerCelebration, triggerHaptic } from "../../lib/haptics";
import { playSound } from "../../lib/sounds";
function WelcomeLeo() {
  const focused = useIsFocused();
  const [greeted, setGreeted] = useState(false);
  return /* @__PURE__ */ React.createElement(
    LeoAnimated,
    {
      size: 200,
      fallback: "waving",
      paused: !focused,
      clip: greeted ? "leo-idle-loop" : "leo-greet",
      onEnd: () => setGreeted(true)
    }
  );
}
function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState("Scholar");
  const [demoStatus, setDemoStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    void (async () => {
      const [localName, localStatus, profileResult] = await Promise.all([
        storage.getDisplayName(),
        storage.getDemoStatus(),
        supabase.from("profiles").select("display_name, demo_onboarding_status, selected_market").eq("id", user.id).maybeSingle()
      ]);
      const profile = profileResult.data;
      if (profile?.selected_market) {
        router.replace("/");
        return;
      }
      const name = normalizeDisplayName(profile?.display_name || localName || user.user_metadata?.display_name);
      const status = localStatus === "completed" || profile?.demo_onboarding_status === "completed" ? "completed" : localStatus === "skipped" || profile?.demo_onboarding_status === "skipped" ? "skipped" : "pending";
      setDisplayName(name);
      setDemoStatus(status);
      await Promise.all([
        storage.setDisplayName(name),
        storage.setDemoStatus(status),
        supabase.from("profiles").update({ display_name: name, demo_onboarding_status: status }).eq("id", user.id)
      ]);
      setLoading(false);
      void triggerCelebration();
      void playSound("unlock");
    })();
  }, [authLoading, user]);
  const chooseIndustry = async () => {
    const status = demoStatus === "completed" ? "completed" : "skipped";
    await Promise.all([
      storage.setDemoStatus(status),
      user ? supabase.from("profiles").update({ demo_onboarding_status: status }).eq("id", user.id) : Promise.resolve()
    ]);
    void triggerHaptic("medium");
    router.replace("/onboarding");
  };
  if (loading || authLoading) {
    return /* @__PURE__ */ React.createElement(View, { style: styles.loading }, /* @__PURE__ */ React.createElement(ActivityIndicator, { color: COLORS.accent }));
  }
  return /* @__PURE__ */ React.createElement(View, { style: [styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.content }, /* @__PURE__ */ React.createElement(WelcomeLeo, null), /* @__PURE__ */ React.createElement(Text, { style: styles.kicker }, "YOUR JOURNEY STARTS HERE"), /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Welcome to MarketLingo, ", displayName, "!"), /* @__PURE__ */ React.createElement(Text, { style: styles.body }, "Ready to master the language of modern markets?")), /* @__PURE__ */ React.createElement(View, { style: styles.actions }, demoStatus === "completed" ? /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.primary, onPress: () => void chooseIndustry(), activeOpacity: 0.88 }, /* @__PURE__ */ React.createElement(Text, { style: styles.primaryText }, "Save My Progress & Choose Industry")) : /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.primary, onPress: () => router.push("/demo"), activeOpacity: 0.88 }, /* @__PURE__ */ React.createElement(Text, { style: styles.primaryText }, "Try the Demo Lesson (+20 XP)")), demoStatus !== "completed" && /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.secondary, onPress: () => void chooseIndustry(), activeOpacity: 0.8 }, /* @__PURE__ */ React.createElement(Text, { style: styles.secondaryText }, "Choose My Industry"))));
}
const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg0 },
  screen: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 24, justifyContent: "space-between" },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  kicker: { fontSize: 11, fontWeight: "900", color: COLORS.accent, letterSpacing: 1.2, marginTop: 12 },
  title: { fontSize: 31, lineHeight: 38, fontWeight: "900", color: COLORS.textPrimary, textAlign: "center", marginTop: 10 },
  body: { fontSize: 16, lineHeight: 24, color: COLORS.textSecondary, textAlign: "center", marginTop: 12, maxWidth: 320 },
  actions: { gap: 10 },
  primary: { minHeight: 58, borderRadius: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, backgroundColor: COLORS.accent, ...SHADOWS.accent },
  primaryText: { color: COLORS.textOnAccent, fontSize: 16, fontWeight: "800", textAlign: "center" },
  secondary: { minHeight: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg2 },
  secondaryText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: "700" }
});
export {
  WelcomeScreen as default
};
