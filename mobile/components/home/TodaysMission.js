import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
function CircularProgress({
  progress,
  size,
  strokeWidth,
  isCompleted
}) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: progress,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
  }, [progress]);
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const degrees = clampedProgress * 360;
  const accentColor = isCompleted ? COLORS.success : COLORS.accent;
  const trackColor = COLORS.surfaceLight;
  return /* @__PURE__ */ React.createElement(Animated.View, { style: { width: size, height: size, opacity: fadeAnim } }, /* @__PURE__ */ React.createElement(
    View,
    {
      style: {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: trackColor,
        position: "absolute"
      }
    }
  ), /* @__PURE__ */ React.createElement(View, { style: { width: size, height: size, position: "absolute", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(View, { style: { width: size / 2, height: size, position: "absolute", right: 0, overflow: "hidden" } }, degrees > 0 && /* @__PURE__ */ React.createElement(
    View,
    {
      style: {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: accentColor,
        borderLeftColor: "transparent",
        borderBottomColor: "transparent",
        position: "absolute",
        right: 0,
        transform: [{ rotate: `${Math.min(degrees, 180) - 90}deg` }]
      }
    }
  )), degrees > 180 && /* @__PURE__ */ React.createElement(View, { style: { width: size / 2, height: size, position: "absolute", left: 0, overflow: "hidden" } }, /* @__PURE__ */ React.createElement(
    View,
    {
      style: {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: accentColor,
        borderRightColor: "transparent",
        borderTopColor: "transparent",
        position: "absolute",
        left: 0,
        transform: [{ rotate: `${degrees - 270}deg` }]
      }
    }
  ))));
}
function TodaysMission({
  dayNumber,
  totalDays = 180,
  lessonTitle,
  marketEmoji,
  marketName,
  xpReward,
  duration,
  progress,
  isCompleted,
  streak,
  onStart,
  onReview,
  onPractice
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true })
    ]).start();
    if (!isCompleted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();
    }
  }, [isCompleted]);
  return /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.container, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }] }, /* @__PURE__ */ React.createElement(View, { style: [styles.accentBar, isCompleted && styles.accentBarCompleted] }), /* @__PURE__ */ React.createElement(View, { style: styles.content }, /* @__PURE__ */ React.createElement(View, { style: styles.topRow }, /* @__PURE__ */ React.createElement(View, { style: styles.dayBadge }, /* @__PURE__ */ React.createElement(Text, { style: styles.dayBadgeText }, "DAY ", dayNumber)), streak > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.streakBadge }, /* @__PURE__ */ React.createElement(Feather, { name: "activity", size: 12, color: COLORS.orange }), /* @__PURE__ */ React.createElement(Text, { style: styles.streakText }, streak, " day streak"))), /* @__PURE__ */ React.createElement(View, { style: styles.mainRow }, /* @__PURE__ */ React.createElement(View, { style: styles.ringContainer }, /* @__PURE__ */ React.createElement(CircularProgress, { progress, size: 88, strokeWidth: 5, isCompleted }), /* @__PURE__ */ React.createElement(View, { style: styles.ringCenter }, isCompleted ? /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 32, color: COLORS.success }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Feather, { name: "book-open", size: 22, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.ringDay }, dayNumber)))), /* @__PURE__ */ React.createElement(View, { style: styles.infoColumn }, /* @__PURE__ */ React.createElement(Text, { style: styles.missionLabel }, isCompleted ? "TODAY'S MISSION COMPLETE" : "TODAY'S MISSION"), /* @__PURE__ */ React.createElement(Text, { style: styles.lessonTitle, numberOfLines: 2 }, lessonTitle), /* @__PURE__ */ React.createElement(View, { style: styles.metaRow }, /* @__PURE__ */ React.createElement(View, { style: styles.metaChip }, /* @__PURE__ */ React.createElement(Text, { style: styles.metaText }, xpReward, " XP")), /* @__PURE__ */ React.createElement(View, { style: styles.metaChip }, /* @__PURE__ */ React.createElement(Text, { style: styles.metaText }, duration, " min")), /* @__PURE__ */ React.createElement(View, { style: styles.metaChip }, /* @__PURE__ */ React.createElement(Text, { style: styles.metaText }, marketName))))), isCompleted ? /* @__PURE__ */ React.createElement(View, { style: styles.completedActions }, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.reviewBtn, onPress: onReview, activeOpacity: 0.7 }, /* @__PURE__ */ React.createElement(Feather, { name: "book-open", size: 14, color: COLORS.textSecondary }), /* @__PURE__ */ React.createElement(Text, { style: styles.reviewBtnText }, "Review")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.practiceBtn, onPress: onPractice, activeOpacity: 0.7 }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "flask", size: 14, color: "#fff" }), /* @__PURE__ */ React.createElement(Text, { style: styles.practiceBtnText }, "Practice"))) : /* @__PURE__ */ React.createElement(Animated.View, { style: { transform: [{ scale: pulseAnim }] } }, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.startBtn, onPress: onStart, activeOpacity: 0.8 }, /* @__PURE__ */ React.createElement(Text, { style: styles.startBtnText }, "Start Lesson"), /* @__PURE__ */ React.createElement(Feather, { name: "arrow-right", size: 18, color: "rgba(255,255,255,0.7)" })))));
}
const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.15)",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  accentBar: { height: 3, backgroundColor: COLORS.accent },
  accentBarCompleted: { backgroundColor: COLORS.success },
  content: { padding: 16 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  dayBadge: { backgroundColor: COLORS.accentSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dayBadgeText: { fontSize: 11, fontWeight: "800", color: COLORS.accent, letterSpacing: 1 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.orangeSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  streakText: { fontSize: 11, fontWeight: "600", color: COLORS.orange },
  mainRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  ringContainer: { width: 88, height: 88, alignItems: "center", justifyContent: "center" },
  ringCenter: { position: "absolute", alignItems: "center", justifyContent: "center" },
  ringDay: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, marginTop: -2 },
  infoColumn: { flex: 1 },
  missionLabel: { fontSize: 10, fontWeight: "700", color: COLORS.accent, letterSpacing: 0.8, marginBottom: 4 },
  lessonTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary, lineHeight: 22, marginBottom: 8 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metaChip: { backgroundColor: COLORS.bg1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  metaText: { fontSize: 10, fontWeight: "500", color: COLORS.textMuted },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8
  },
  startBtnText: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  completedActions: { flexDirection: "row", gap: 10 },
  reviewBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.bg1,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center"
  },
  reviewBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  practiceBtn: { flex: 1, flexDirection: "row", gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.success, alignItems: "center", justifyContent: "center" },
  practiceBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" }
});
export {
  TodaysMission
};
