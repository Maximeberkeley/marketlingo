import React, { useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CaseScreen } from "../lesson-kit/case/CaseScreen";
import { buildCase } from "../lesson-kit/case/buildCase";
import { useIndustryContent } from "../hooks/useIndustryContent";
import { useStudiedLessons } from "../hooks/useStudiedLessons";
import { useFocusTopic } from "../hooks/useFocusTopic";
import { useSelectedMarket } from "../hooks/useSelectedMarket";
import { usePracticeRewards } from "../hooks/usePracticeRewards";
import { useUserXP } from "../hooks/useUserXP";
import { useCollectibles } from "../hooks/useCollectibles";
import { useLearningGoal } from "../hooks/useLearningGoal";
import { getMarketName } from "../lib/markets";
import { COLORS, TYPE } from "../lib/constants";
import { log } from "../lib/logger";
import { trackEvent } from "../lib/analytics";
function DeepCaseRoute() {
  const { day } = useLocalSearchParams();
  const preferredDay = day ? Number(day) : void 0;
  const { marketId, loading: marketLoading } = useSelectedMarket();
  const content = useIndustryContent(marketId);
  const focus = useFocusTopic(marketId, 1);
  const studied = useStudiedLessons(marketId, focus.keywords, preferredDay);
  const { recordCaseRun, loading: rewardsLoading } = usePracticeRewards();
  const { addXP } = useUserXP(marketId);
  const { evaluateRewards } = useCollectibles(marketId);
  const learningGoal = useLearningGoal(marketId);
  const marketName = getMarketName(marketId);
  const deepCase = useMemo(
    () => buildCase({
      marketId,
      marketName,
      trainer: content.trainer,
      drills: content.drills,
      stats: content.stats,
      studied: studied.lessons
    }),
    [marketId, marketName, content.trainer, content.drills, content.stats, studied.lessons]
  );
  if (marketLoading || content.isLoading || rewardsLoading || studied.isLoading) {
    return /* @__PURE__ */ React.createElement(View, { style: styles.loading }, /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "large", color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.loadingText }, "Pulling a live ", marketName, " case\u2026"));
  }
  if (studied.lessons.length === 0) {
    return /* @__PURE__ */ React.createElement(View, { style: styles.loading }, /* @__PURE__ */ React.createElement(Image, { source: require("../assets/mascot/leo-thinking.png"), style: styles.leo, resizeMode: "contain", accessibilityLabel: "Leo is thinking" }), /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, "Your first case starts in the course"), /* @__PURE__ */ React.createElement(Text, { style: styles.loadingText }, "Complete a lesson first. Your case will use its real claims, mechanisms, and numbers."), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.courseButton, onPress: () => router.replace("/(tabs)/home"), accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.courseButtonText }, "Go to Course")));
  }
  if (!deepCase) {
    return /* @__PURE__ */ React.createElement(View, { style: styles.loading }, /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, "No case ready yet"), /* @__PURE__ */ React.createElement(Text, { style: styles.loadingText }, "Finish a lesson or two in ", marketName, " and a case will open up here."));
  }
  const handleFinish = async (result) => {
    trackEvent("case_finished", { grade: result.grade, caseId: deepCase.id });
    try {
      await recordCaseRun(result.grade);
      await addXP(result.xp, "deep_case", deepCase.id, `Deep Case graded ${result.grade}`);
      const accuracy = result.total > 0 ? result.correct / result.total : 0;
      await evaluateRewards("deep_case", `case:${deepCase.id}`, accuracy);
    } catch (error) {
      log.warn("[DeepCase] Could not bank the case:", error);
    }
    router.back();
  };
  return /* @__PURE__ */ React.createElement(
    CaseScreen,
    {
      deepCase,
      marketId,
      marketName,
      goal: learningGoal,
      onExit: () => router.back(),
      onFinish: handleFinish
    }
  );
}
const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 28,
    backgroundColor: COLORS.bg0
  },
  loadingText: { ...TYPE.caption, color: COLORS.textMuted, textAlign: "center" },
  emptyTitle: { ...TYPE.h2, color: COLORS.textPrimary },
  backLink: { ...TYPE.bodyBold, color: COLORS.accent, marginTop: 4 },
  leo: { width: 192, height: 192, marginBottom: 12 },
  courseButton: { marginTop: 8, minWidth: 188, minHeight: 50, borderRadius: 14, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.accent },
  courseButtonText: { ...TYPE.bodyBold, color: COLORS.textOnAccent }
});
export {
  DeepCaseRoute as default
};
