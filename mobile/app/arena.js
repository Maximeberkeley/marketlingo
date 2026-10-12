import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../hooks/useAuth";
import { recentQuizHistory, recordQuizQuestion } from "../lib/quizHistory";
import { View, Text, StyleSheet, ActivityIndicator, Animated, Image, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArenaScreen } from "../lesson-kit/arena/ArenaScreen";
import { buildArena } from "../lesson-kit/arena/buildArena";
import { useIndustryContent } from "../hooks/useIndustryContent";
import { useStudiedLessons } from "../hooks/useStudiedLessons";
import { useFocusTopic } from "../hooks/useFocusTopic";
import { useSelectedMarket } from "../hooks/useSelectedMarket";
import { usePracticeRewards } from "../hooks/usePracticeRewards";
import { useUserXP } from "../hooks/useUserXP";
import { useCollectibles } from "../hooks/useCollectibles";
import { getMarketName } from "../lib/markets";
import { localDateString } from "../lib/dayMath";
import { COLORS, TYPE } from "../lib/constants";
import { log } from "../lib/logger";
import { triggerHaptic } from "../lib/haptics";
import { playSound } from "../lib/sounds";
const THINKING_LEO = require("../assets/mascot/leo-thinking.png");
const SCHOLAR_LEO = require("../assets/mascot/leo-graduation.png");
function ArenaPrerequisite() {
  const [isScholar, setIsScholar] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;
  const changePose = (nextScholar) => {
    Animated.timing(fade, {
      toValue: nextScholar ? 1 : 0,
      duration: 500,
      useNativeDriver: true
    }).start();
    setIsScholar(nextScholar);
  };
  useEffect(() => {
    const interval = setInterval(() => {
      setIsScholar((current) => {
        const next = !current;
        Animated.timing(fade, {
          toValue: next ? 1 : 0,
          duration: 500,
          useNativeDriver: true
        }).start();
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [fade]);
  const togglePose = () => {
    triggerHaptic("light");
    playSound("tap").catch(() => {
    });
    changePose(!isScholar);
    Animated.sequence([
      Animated.spring(bounce, { toValue: 1.06, friction: 5, tension: 180, useNativeDriver: true }),
      Animated.spring(bounce, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true })
    ]).start();
  };
  return /* @__PURE__ */ jsxs(View, { style: styles.prerequisite, children: [
    /* @__PURE__ */ jsx(
      TouchableOpacity,
      {
        activeOpacity: 0.92,
        onPress: togglePose,
        accessibilityRole: "button",
        accessibilityLabel: `Leo is ${isScholar ? "ready to study" : "thinking"}. Tap to change his pose.`,
        children: /* @__PURE__ */ jsxs(Animated.View, { style: [styles.leoStage, { transform: [{ scale: bounce }] }], children: [
          /* @__PURE__ */ jsx(Animated.View, { style: [styles.leoLayer, { opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }], children: /* @__PURE__ */ jsx(Image, { source: THINKING_LEO, style: styles.leoImage, resizeMode: "contain" }) }),
          /* @__PURE__ */ jsx(Animated.View, { style: [styles.leoLayer, { opacity: fade }], children: /* @__PURE__ */ jsx(Image, { source: SCHOLAR_LEO, style: styles.leoImage, resizeMode: "contain" }) })
        ] })
      }
    ),
    /* @__PURE__ */ jsx(Text, { style: styles.emptyTitle, children: "Your Arena needs a lesson" }),
    /* @__PURE__ */ jsx(Text, { style: styles.loadingText, children: "Complete a course lesson first. Every round will then test concepts you actually studied." }),
    /* @__PURE__ */ jsxs(
      TouchableOpacity,
      {
        style: styles.courseButton,
        activeOpacity: 0.88,
        onPress: () => router.replace("/(tabs)/home"),
        accessibilityRole: "button",
        children: [
          /* @__PURE__ */ jsx(Text, { style: styles.courseButtonText, children: "Go to Course" }),
          /* @__PURE__ */ jsx(Text, { style: styles.courseButtonArrow, children: "\u2192" })
        ]
      }
    )
  ] });
}
function ArenaRoute() {
  const { user } = useAuth();
  const { day } = useLocalSearchParams();
  const preferredDay = day ? Number(day) : void 0;
  const { marketId, loading: marketLoading } = useSelectedMarket();
  const content = useIndustryContent(marketId);
  const focus = useFocusTopic(marketId, 1);
  const studied = useStudiedLessons(marketId, focus.keywords, preferredDay);
  const { rewards, loading: rewardsLoading, recordArenaRun } = usePracticeRewards();
  const { addXP } = useUserXP(marketId);
  const { evaluateRewards } = useCollectibles(marketId);
  const [runKey, setRunKey] = useState(0);
  const historyKey = user?.id && marketId ? `ml_quiz_seen_v1/${user.id}/${marketId}` : null;
  const [loadedHistoryKey, setLoadedHistoryKey] = useState(null);
  const [historyError, setHistoryError] = useState(false);
  const [seenKeys, setSeenKeys] = useState(/* @__PURE__ */ new Set());
  const history = useRef([]);
  const writeQueue = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    if (!historyKey) return;
    setHistoryError(false);
    void AsyncStorage.getItem(historyKey).then((raw) => {
      if (!active) return;
      history.current = recentQuizHistory(raw ? JSON.parse(raw) : []);
      setSeenKeys(new Set(history.current.map((row) => row.key)));
      setLoadedHistoryKey(historyKey);
    }).catch(() => {
      if (active) setHistoryError(true);
    });
    return () => {
      active = false;
    };
  }, [historyKey]);
  const onQuestionSeen = useCallback((exercise) => {
    if (!historyKey) return;
    history.current = recordQuizQuestion(history.current, exercise);
    const snapshot = JSON.stringify(history.current);
    writeQueue.current = writeQueue.current.then(() => AsyncStorage.setItem(historyKey, snapshot)).catch((error) => {
      log.warn("[Arena] Could not save question history:", error);
      setHistoryError(true);
    });
  }, [historyKey]);
  const waves = useMemo(
    () => buildArena({
      marketId,
      marketName: getMarketName(marketId),
      trainer: content.trainer,
      drills: content.drills,
      stats: content.stats,
      studied: studied.lessons,
      seenQuestionKeys: seenKeys
    }),
    // A new runKey reshuffles the run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [marketId, content.trainer, content.drills, content.stats, studied.lessons, runKey, seenKeys]
  );
  const busy = marketLoading || content.isLoading || rewardsLoading || studied.isLoading || !historyKey || loadedHistoryKey !== historyKey;
  if (historyError) return /* @__PURE__ */ jsxs(View, { style: styles.loading, children: [
    /* @__PURE__ */ jsx(Text, { style: styles.loadingText, children: "Your quiz history could not be saved or loaded. Please reopen the quiz." }),
    /* @__PURE__ */ jsx(Text, { style: styles.backLink, onPress: () => router.back(), children: "Go back" })
  ] });
  if (busy) {
    return /* @__PURE__ */ jsxs(View, { style: styles.loading, children: [
      /* @__PURE__ */ jsx(ActivityIndicator, { size: "large", color: COLORS.accent }),
      /* @__PURE__ */ jsx(Text, { style: styles.loadingText, children: "Setting up the arena floor\u2026" })
    ] });
  }
  if (studied.lessons.length === 0) {
    return /* @__PURE__ */ jsx(ArenaPrerequisite, {});
  }
  if (!waves || waves.length === 0) {
    return /* @__PURE__ */ jsxs(View, { style: styles.loading, children: [
      /* @__PURE__ */ jsx(Text, { style: styles.loadingText, children: "You've seen all available questions this week. Study another lesson for fresh questions." }),
      /* @__PURE__ */ jsx(Text, { style: styles.backLink, onPress: () => router.back(), children: "Go back" })
    ] });
  }
  const handleFinish = async (result) => {
    try {
      await recordArenaRun(result.score);
      await addXP(result.xp, "arena", void 0, "Daily Arena run");
      const accuracy = result.total > 0 ? result.correct / result.total : 0;
      await evaluateRewards("arena", `arena:${localDateString()}`, accuracy);
    } catch (error) {
      log.warn("[Arena] Could not bank the run:", error);
    }
    router.back();
  };
  return /* @__PURE__ */ jsx(
    ArenaScreen,
    {
      waves,
      marketId,
      marketName: getMarketName(marketId),
      bestScore: rewards.arenaBestScore,
      onExit: () => router.back(),
      onFinish: handleFinish,
      onQuestionSeen
    },
    runKey
  );
}
const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: COLORS.bg0 },
  loadingText: { ...TYPE.caption, color: COLORS.textMuted, textAlign: "center", paddingHorizontal: 32 },
  emptyTitle: { ...TYPE.h2, color: COLORS.textPrimary, textAlign: "center" },
  backLink: { ...TYPE.caption, color: COLORS.accent, fontWeight: "700" },
  prerequisite: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 24, backgroundColor: COLORS.bg0 },
  leoStage: { width: 192, height: 192, marginBottom: 6, backfaceVisibility: "hidden" },
  leoLayer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  leoImage: { width: 192, height: 192, resizeMode: "contain", backfaceVisibility: "hidden", imageRendering: "crisp-edges" },
  courseButton: { marginTop: 8, minWidth: 188, minHeight: 50, borderRadius: 14, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: COLORS.accent },
  courseButtonText: { ...TYPE.bodyBold, color: COLORS.textOnAccent },
  courseButtonArrow: { fontSize: 20, lineHeight: 22, color: COLORS.textOnAccent, fontWeight: "700" }
});
export {
  ArenaRoute as default
};
