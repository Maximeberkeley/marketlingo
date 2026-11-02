import React, { useEffect } from "react";
import { router } from "expo-router";
import { View, StyleSheet, Text } from "react-native";
import { LeoAnimated } from "../components/mascot/LeoAnimated";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { trackEvent, identifyUser } from "../lib/analytics";
import { COLORS } from "../lib/constants";
import { log } from "../lib/logger";
import { storage } from "../lib/storage";
const STARTUP_TIMEOUT_MS = 6e3;
function withStartupTimeout(request) {
  return Promise.race([
    Promise.resolve(request),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Startup request timed out")), STARTUP_TIMEOUT_MS);
    })
  ]);
}
function Index() {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    let isActive = true;
    const safeReplace = (path) => {
      if (!isActive) return;
      router.replace(path);
    };
    async function redirect() {
      if (!user) {
        const level = await storage.getFamiliarity().catch(() => null);
        safeReplace(level ? "/auth?mode=signup" : "/onboarding");
        return;
      }
      try {
        trackEvent("app_open");
        identifyUser(user.id, { email: user.email || "" });
        const { data: profile, error: profileError } = await withStartupTimeout(
          supabase.from("profiles").select("selected_market, display_name, demo_onboarding_status").eq("id", user.id).maybeSingle()
        );
        if (profileError) {
          log.warn("[Index] Failed to load profile during startup:", profileError.message);
          safeReplace("/(tabs)/home");
          return;
        }
        if (!profile?.selected_market) {
          safeReplace("/onboarding");
          return;
        }
        const { data: progress, error: progressError } = await withStartupTimeout(
          supabase.from("user_progress").select("learning_goal, familiarity_level").eq("user_id", user.id).eq("market_id", profile.selected_market).maybeSingle()
        );
        if (progressError && progressError.code !== "PGRST116") {
          log.warn("[Index] Failed to load progress during startup:", progressError.message);
          safeReplace("/(tabs)/home");
          return;
        }
        if (!progress?.learning_goal) {
          safeReplace("/onboarding/goal");
        } else if (!progress?.familiarity_level) {
          safeReplace("/onboarding/familiarity");
        } else {
          safeReplace("/daily-leo");
        }
      } catch (error) {
        log.warn("[Index] Startup redirect failed:", error);
        safeReplace("/(tabs)/home");
      }
    }
    void redirect();
    return () => {
      isActive = false;
    };
  }, [user, loading]);
  return /* @__PURE__ */ React.createElement(View, { style: styles.container }, /* @__PURE__ */ React.createElement(LeoAnimated, { clip: "leo-loading-loop", size: 160, fallback: "idle" }), /* @__PURE__ */ React.createElement(Text, { style: styles.appName }, "MarketLingo"), /* @__PURE__ */ React.createElement(Text, { style: styles.tagline }, "Master any industry in 6 months"));
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg0,
    alignItems: "center",
    justifyContent: "center"
  },
  appName: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textMuted
  }
});
export {
  Index as default
};
