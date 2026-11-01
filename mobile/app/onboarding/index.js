import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { storage } from "../../lib/storage";
import { COLORS } from "../../lib/constants";
import { markets } from "../../lib/markets";
import { useAuth } from "../../hooks/useAuth";
import { localDateString } from "../../lib/dayMath";
import { supabase } from "../../lib/supabase";
import { LeoAnimated } from "../../components/mascot/LeoAnimated";
import { useOnboardingLeo } from "../../components/mascot/useLeoAnimations";
import { getDemoXP } from "../../lib/demoXPBridge";
import { OnboardingProgress } from "../../components/onboarding/OnboardingProgress";
import { triggerHaptic } from "../../lib/haptics";
import { Feather } from "@expo/vector-icons";
import { log } from "../../lib/logger";
const STEP_LABELS = ["Industry", "Goal", "Level"];
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MARKET_ILLUSTRATIONS = {
  aerospace: require("../../assets/illustrations/aerospace.png"),
  ai: require("../../assets/illustrations/ai.png"),
  biotech: require("../../assets/illustrations/biotech.png"),
  cleanenergy: require("../../assets/illustrations/cleanenergy.png"),
  fintech: require("../../assets/illustrations/fintech.png"),
  ev: require("../../assets/illustrations/ev.png"),
  cybersecurity: require("../../assets/illustrations/cybersecurity.png"),
  robotics: require("../../assets/illustrations/robotics.png"),
  spacetech: require("../../assets/illustrations/spacetech.png"),
  healthtech: require("../../assets/illustrations/healthtech.png"),
  web3: require("../../assets/illustrations/web3.png"),
  agtech: require("../../assets/illustrations/agtech.png"),
  logistics: require("../../assets/illustrations/logistics.png"),
  climatetech: require("../../assets/illustrations/climatetech.png"),
  neuroscience: require("../../assets/illustrations/neuroscience.png")
};
function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoMarket, setDemoMarket] = useState(null);
  const [demoXP, setDemoXP] = useState(0);
  const [focused, setFocused] = useState(true);
  useFocusEffect(React.useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));
  const leo = useOnboardingLeo(!focused, "leo-greet");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true })
    ]).start();
  }, []);
  useEffect(() => {
    (async () => {
      const { xp, market } = await getDemoXP();
      if (market && xp > 0) {
        setDemoMarket(market);
        setDemoXP(xp);
        setSelectedIndustry(market);
      }
    })();
  }, []);
  const filteredMarkets = markets.filter(
    (market) => market.name.toLowerCase().includes(searchQuery.toLowerCase()) || market.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedMarketData = markets.find((m) => m.id === selectedIndustry);
  const handleSelect = (id) => {
    triggerHaptic("light");
    setSelectedIndustry(id);
  };
  const handleContinue = async () => {
    if (!selectedIndustry || isSubmitting) return;
    triggerHaptic("medium");
    setIsSubmitting(true);
    try {
      await storage.setIndustry(selectedIndustry);
      if (user) {
        await supabase.from("profiles").update({ selected_market: selectedIndustry }).eq("id", user.id);
        await supabase.from("user_progress").upsert(
          {
            user_id: user.id,
            market_id: selectedIndustry,
            current_day: 1,
            current_streak: 0,
            longest_streak: 0,
            completed_stacks: [],
            start_date: localDateString()
          },
          { onConflict: "user_id,market_id" }
        );
      }
      router.push("/onboarding/goal");
    } catch (error) {
      log.error("Error saving market selection:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ React.createElement(View, { style: [styles.container, { paddingTop: insets.top }] }, /* @__PURE__ */ React.createElement(OnboardingProgress, { currentStep: 0, totalSteps: 3, labels: STEP_LABELS }), /* @__PURE__ */ React.createElement(
    Animated.ScrollView,
    {
      contentContainerStyle: styles.scrollContent,
      showsVerticalScrollIndicator: false,
      style: { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
    },
    /* @__PURE__ */ React.createElement(View, { style: styles.header }, /* @__PURE__ */ React.createElement(LeoAnimated, { clip: leo.clip, size: 160, fallback: "waving", paused: !focused, onEnd: leo.onEnd }), /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Choose your industry"), /* @__PURE__ */ React.createElement(Text, { style: styles.subtitle }, "Pick your industry"), !user && /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.push("/auth"), activeOpacity: 0.7, style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement(Text, { style: { color: COLORS.accent, fontWeight: "700", fontSize: 15 } }, "I already have an account"))),
    demoMarket && demoXP > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.demoBanner }, /* @__PURE__ */ React.createElement(Feather, { name: "activity", size: 24, color: COLORS.accent }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.demoBannerTitle }, "Continue where you left off"), /* @__PURE__ */ React.createElement(Text, { style: styles.demoBannerSub }, "Your ", demoXP, " XP from the demo lesson is waiting!"))),
    /* @__PURE__ */ React.createElement(View, { style: styles.searchContainer }, /* @__PURE__ */ React.createElement(Feather, { name: "search", size: 18, color: COLORS.textMuted, style: { marginRight: 10 } }), /* @__PURE__ */ React.createElement(
      TextInput,
      {
        style: styles.searchInput,
        placeholder: "Search industries...",
        placeholderTextColor: COLORS.textMuted,
        value: searchQuery,
        onChangeText: setSearchQuery
      }
    )),
    /* @__PURE__ */ React.createElement(Text, { style: styles.countText }, filteredMarkets.length, " industries available"),
    /* @__PURE__ */ React.createElement(View, { style: styles.gridContainer }, filteredMarkets.map((market, index) => {
      const illustration = MARKET_ILLUSTRATIONS[market.id];
      return /* @__PURE__ */ React.createElement(
        Animated.View,
        {
          key: market.id,
          style: {
            width: (SCREEN_WIDTH - 42) / 2,
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20 + index * 5, 0]
              })
            }]
          }
        },
        /* @__PURE__ */ React.createElement(
          TouchableOpacity,
          {
            style: [
              styles.gridCard,
              selectedIndustry === market.id && styles.gridCardSelected,
              selectedIndustry === market.id && { borderColor: market.color }
            ],
            onPress: () => handleSelect(market.id),
            activeOpacity: 0.7
          },
          illustration ? /* @__PURE__ */ React.createElement(Image, { source: illustration, style: styles.gridIllustration, resizeMode: "contain" }) : /* @__PURE__ */ React.createElement(View, { style: [styles.gridIconFallback, { backgroundColor: market.color + "20" }] }, /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 20, fontWeight: "800", color: market.color } }, market.name.charAt(0).toUpperCase())),
          /* @__PURE__ */ React.createElement(Text, { style: styles.gridName }, market.name),
          selectedIndustry === market.id && /* @__PURE__ */ React.createElement(View, { style: [styles.gridCheck, { backgroundColor: market.color }] }, /* @__PURE__ */ React.createElement(Text, { style: styles.gridCheckText }, "\u2713"))
        )
      );
    }))
  ), /* @__PURE__ */ React.createElement(
    Animated.View,
    {
      style: [
        styles.footer,
        { paddingBottom: insets.bottom + 20, opacity: fadeAnim }
      ]
    },
    selectedMarketData && /* @__PURE__ */ React.createElement(View, { style: styles.selectedPreview }, /* @__PURE__ */ React.createElement(View, { style: styles.selectedPreviewRow }, MARKET_ILLUSTRATIONS[selectedMarketData.id] && /* @__PURE__ */ React.createElement(Image, { source: MARKET_ILLUSTRATIONS[selectedMarketData.id], style: { width: 24, height: 24, resizeMode: "contain" } }), /* @__PURE__ */ React.createElement(Text, { style: styles.selectedPreviewName }, selectedMarketData.name)), /* @__PURE__ */ React.createElement(Text, { style: styles.selectedPreviewDesc }, selectedMarketData.description)),
    /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: [
          styles.ctaButton,
          (!selectedIndustry || isSubmitting) && styles.ctaButtonDisabled
        ],
        onPress: handleContinue,
        disabled: !selectedIndustry || isSubmitting,
        activeOpacity: 0.85
      },
      isSubmitting ? /* @__PURE__ */ React.createElement(ActivityIndicator, { color: "#fff" }) : /* @__PURE__ */ React.createElement(Text, { style: styles.ctaButtonText }, selectedIndustry ? "Continue" : "Select an industry")
    )
  ));
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg0
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 220
  },
  header: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 6,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary
  },
  countText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  gridCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 110,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative"
  },
  gridCardSelected: {
    backgroundColor: "rgba(139, 92, 246, 0.1)"
  },
  gridIllustration: {
    width: 48,
    height: 48,
    marginBottom: 8
  },
  gridIconFallback: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  gridName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center"
  },
  gridCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  gridCheckText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700"
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: COLORS.bg0,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  selectedPreview: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12
  },
  selectedPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4
  },
  selectedPreviewName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary
  },
  selectedPreviewDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18
  },
  ctaButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  ctaButtonDisabled: {
    opacity: 0.4
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700"
  },
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(251, 191, 36, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.25)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16
  },
  demoBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FBBF24",
    marginBottom: 2
  },
  demoBannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary
  }
});
export {
  OnboardingScreen as default
};
