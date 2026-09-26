import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { supabase } from "../lib/supabase";
import { getMarketName, getMarketEmoji } from "../lib/markets";
import { triggerHaptic } from "../lib/haptics";
import { trackEvent } from "../lib/analytics";
import { log } from "../lib/logger";
import { autoDossierLine, deliverableFor } from "../lib/deliverables";
async function fillDossierFromLesson(userId, marketId, goal, stack, day) {
  try {
    const template = deliverableFor(goal);
    const { data } = await supabase.from("deliverable_entries").select("section_key, content, source, day_number").eq("user_id", userId).eq("market_id", marketId).eq("goal_key", template.goal);
    const rows = data ?? [];
    if (rows.some((r) => r.source === "lesson" && r.day_number === day)) return;
    const line = autoDossierLine(
      template,
      new Set(rows.map((r) => r.section_key)),
      stack.slides,
      new Set(rows.map((r) => r.content))
    );
    if (!line) return;
    await supabase.from("deliverable_entries").insert({
      user_id: userId,
      market_id: marketId,
      goal_key: template.goal,
      section_key: line.sectionKey,
      content: line.content,
      day_number: day,
      source: "lesson"
    });
  } catch (err) {
    log.warn("[useSessionFlow] Dossier auto-fill failed:", err);
  }
}
function useSessionFlow({
  user,
  selectedMarket,
  lessonStack,
  progress,
  xpData,
  lessonCompletedToday,
  currentDay,
  completeStack,
  updateStreak,
  completeLessonForToday,
  addXP,
  checkStreakMilestone,
  checkLevelMilestone,
  xpRewardLessonComplete,
  xpRewardStreakBonus,
  onDataRefresh
}) {
  const [activeStack, setActiveStack] = useState(null);
  const [showReader, setShowReader] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [sessionXPEarned, setSessionXPEarned] = useState(0);
  const [completedBites, setCompletedBites] = useState([]);
  const [activeBiteIndex, setActiveBiteIndex] = useState(null);
  const handleOpenStack = useCallback((stack) => {
    triggerHaptic("light");
    trackEvent("lesson_start", { stackId: stack.id, type: stack.stack_type });
    setActiveStack(stack);
    setActiveBiteIndex(null);
    setShowGoals(true);
  }, []);
  const handleOpenBite = useCallback((biteIndex) => {
    if (!lessonStack) return;
    triggerHaptic("light");
    const startIdx = biteIndex * 2;
    const biteSlides = lessonStack.slides.slice(startIdx, startIdx + 2);
    if (biteSlides.length === 0) return;
    const biteStack = {
      ...lessonStack,
      title: `${lessonStack.title} \u2014 Bite ${biteIndex + 1}`,
      slides: biteSlides
    };
    setActiveStack(biteStack);
    setActiveBiteIndex(biteIndex);
    setShowGoals(true);
  }, [lessonStack]);
  const handleStackComplete = useCallback(async (isReviewMode, timeSpentSeconds) => {
    setShowReader(false);
    if (isReviewMode) {
      setActiveStack(null);
      Alert.alert("Great review!", "Keep up the good work.");
      return false;
    }
    if (timeSpentSeconds < 10) {
      Alert.alert("Too fast!", "Take a moment to read through the slides.");
      return false;
    }
    if (!progress || !activeStack) {
      Alert.alert("Could not save your lesson", "Please reconnect and try again.");
      return false;
    }
    const isExtraPractice = lessonCompletedToday;
    triggerHaptic("success");
    let earnedXP = isExtraPractice ? 15 : xpRewardLessonComplete;
    let synced = false;
    try {
      if (progress && activeStack) {
        if (isExtraPractice) {
          const alreadyCompleted = progress.completed_stacks?.includes(activeStack.id);
          if (!alreadyCompleted) await completeStack(activeStack.id);
          await addXP(earnedXP, "extra_practice", activeStack.id, "Extra lesson today");
          await onDataRefresh();
          synced = true;
        } else {
          await completeStack(activeStack.id);
          await completeLessonForToday(activeStack.id);
          const updatedProgress = await updateStreak();
          if ((progress.current_streak || 0) > 0) {
            const streakBonus = xpRewardStreakBonus * (progress.current_streak || 1);
            await addXP(streakBonus, "streak_bonus");
            earnedXP += streakBonus;
          }
          const mktName = getMarketName(selectedMarket || "aerospace");
          const mktEmoji = getMarketEmoji(selectedMarket || "aerospace");
          const newStreak = updatedProgress?.current_streak || progress.current_streak || 0;
          checkStreakMilestone(newStreak, mktName, mktEmoji);
          if (xpData) {
            checkLevelMilestone(xpData.current_level, mktName, mktEmoji);
          }
          if (user?.id && selectedMarket) {
            const dayTag = activeStack.tags?.find((t) => /^day[:-]\d+$/.test(t));
            const lessonDay = dayTag ? Number(dayTag.split(/[:-]/)[1]) : currentDay;
            await fillDossierFromLesson(user.id, selectedMarket, progress.learning_goal ?? null, activeStack, lessonDay);
          }
          await onDataRefresh();
          synced = true;
        }
      }
    } catch (err) {
      log.error("Lesson completion error:", err);
      Alert.alert(
        "Could not save your lesson",
        "Please reconnect and try again. Your lesson has not been marked complete yet."
      );
      return false;
    }
    trackEvent("lesson_complete", {
      stackId: activeStack?.id || "",
      xp: earnedXP,
      market: selectedMarket || "",
      extraPractice: isExtraPractice
    });
    setSessionXPEarned(earnedXP);
    setShowSessionComplete(true);
    return synced;
  }, [activeStack, progress, xpData, selectedMarket, lessonCompletedToday, completeStack, updateStreak, completeLessonForToday, addXP, checkStreakMilestone, checkLevelMilestone, xpRewardLessonComplete, xpRewardStreakBonus, onDataRefresh]);
  const handleBiteComplete = useCallback(async (isReviewMode, _timeSpentSeconds) => {
    setShowReader(false);
    if (isReviewMode || activeBiteIndex === null) return;
    const biteIndex = activeBiteIndex;
    setActiveBiteIndex(null);
    if (completedBites.includes(biteIndex)) {
      Alert.alert("Bite reviewed", "You already earned XP for this one.");
      return;
    }
    triggerHaptic("success");
    setCompletedBites((prev) => prev.includes(biteIndex) ? prev : [...prev, biteIndex]);
    try {
      await addXP(10, "bite", void 0, `Quick Bite ${biteIndex + 1}`);
      Alert.alert("Bite Complete! \u26A1", "+10 XP earned");
    } catch (err) {
      log.error("Bite XP error:", err);
      Alert.alert("Bite Complete!", "XP could not be saved right now.");
    }
  }, [activeBiteIndex, completedBites, addXP]);
  const handleSaveInsight = useCallback(async (slideNum) => {
    if (!user || !activeStack) return;
    const slide = activeStack.slides.find((s) => s.slide_number === slideNum);
    if (!slide) return;
    try {
      const { error } = await supabase.from("saved_insights").insert({
        user_id: user.id,
        title: slide.title || "Insight",
        content: slide.body,
        stack_id: activeStack.id,
        slide_id: slide.id ?? null
      });
      if (error) throw error;
      triggerHaptic("success");
      Alert.alert("Saved!", "Insight saved to your notebook.");
    } catch (err) {
      log.error("Save insight error:", err);
      Alert.alert("Error", "Could not save insight. Please try again.");
    }
  }, [user, activeStack]);
  const handleAddNote = useCallback(async (slideNum, customContent) => {
    if (!user || !activeStack || !selectedMarket) return;
    const slide = activeStack.slides.find((s) => s.slide_number === slideNum);
    if (!slide) return;
    try {
      const noteContent = customContent || slide.body || "";
      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        content: noteContent,
        linked_label: activeStack.title || `Slide ${slideNum}`,
        stack_id: activeStack.id,
        slide_id: slide.id ?? null,
        market_id: selectedMarket
      });
      if (error) throw error;
      triggerHaptic("success");
      Alert.alert("Note added!", "Your annotation has been saved.");
    } catch (err) {
      log.error("Add note error:", err);
      Alert.alert("Error", "Could not save note. Please try again.");
    }
  }, [user, activeStack, selectedMarket]);
  const dismissSessionComplete = useCallback(() => {
    setShowSessionComplete(false);
    onDataRefresh();
  }, [onDataRefresh]);
  const closeReader = useCallback(() => {
    setShowReader(false);
    setShowGoals(false);
    setActiveBiteIndex(null);
  }, []);
  const beginLesson = useCallback(() => {
    setShowGoals(false);
    setShowReader(true);
  }, []);
  return {
    activeStack,
    showReader,
    showGoals,
    showSessionComplete,
    sessionXPEarned,
    completedBites,
    activeBiteIndex,
    handleOpenStack,
    handleOpenBite,
    handleStackComplete,
    handleBiteComplete,
    handleSaveInsight,
    handleAddNote,
    dismissSessionComplete,
    closeReader,
    beginLesson
  };
}
export {
  useSessionFlow
};
