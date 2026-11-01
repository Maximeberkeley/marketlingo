import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Share
} from "react-native";
import { COLORS } from "../../lib/constants";
import { LeoAnimated } from "../mascot/LeoAnimated";
import { ConfettiBurst } from "../ui/ConfettiBurst";
import { triggerCelebration } from "../../lib/haptics";
import { playSound } from "../../lib/sounds";
function SessionCompleteCard({
  dayNumber,
  marketName,
  marketEmoji,
  xpEarned,
  streak,
  lessonTitle,
  totalXP,
  stageName,
  onContinue,
  onDismiss,
  onAskMentor,
  mentorName
}) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    triggerCelebration();
    playSound("celebration");
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true })
    ]).start();
  }, []);
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Day ${dayNumber} complete in ${marketName}! ${marketEmoji}

 "${lessonTitle}"
\u26A1 ${xpEarned} XP earned
 ${streak} day streak
 Stage: ${stageName}

Learning markets daily with MarketLingo `,
        title: `MarketLingo \u2014 Day ${dayNumber} Complete`
      });
    } catch (_) {
    }
  };
  return /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.overlay, { opacity: opacityAnim }] }, /* @__PURE__ */ React.createElement(ConfettiBurst, { show: true, count: 24 }), /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.card, { transform: [{ scale: scaleAnim }] }] }, /* @__PURE__ */ React.createElement(View, { style: styles.leoCircle }, /* @__PURE__ */ React.createElement(LeoAnimated, { clip: "leo-success", size: 160, fallback: "celebrating" })), /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Day ", dayNumber, " Complete!"), /* @__PURE__ */ React.createElement(Text, { style: styles.subtitle }, marketEmoji, " ", marketName), /* @__PURE__ */ React.createElement(Text, { style: styles.lessonName, numberOfLines: 2 }, '"', lessonTitle, '"'), /* @__PURE__ */ React.createElement(View, { style: styles.statsGrid }, /* @__PURE__ */ React.createElement(View, { style: styles.statBox }, /* @__PURE__ */ React.createElement(Text, { style: styles.statValue }, "\u26A1 ", xpEarned), /* @__PURE__ */ React.createElement(Text, { style: styles.statLabel }, "XP Earned")), /* @__PURE__ */ React.createElement(View, { style: [styles.statBox, styles.statBoxMiddle] }, /* @__PURE__ */ React.createElement(Text, { style: styles.statValue }, " ", streak), /* @__PURE__ */ React.createElement(Text, { style: styles.statLabel }, "Day Streak")), /* @__PURE__ */ React.createElement(View, { style: styles.statBox }, /* @__PURE__ */ React.createElement(Text, { style: styles.statValue }, totalXP), /* @__PURE__ */ React.createElement(Text, { style: styles.statLabel }, "Total XP"))), /* @__PURE__ */ React.createElement(View, { style: styles.stageBadge }, /* @__PURE__ */ React.createElement(Text, { style: styles.stageText }, stageName)), /* @__PURE__ */ React.createElement(View, { style: styles.actions }, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.shareBtn, onPress: handleShare, activeOpacity: 0.7 }, /* @__PURE__ */ React.createElement(Text, { style: styles.shareBtnText }, "Share Achievement")), onAskMentor && /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.mentorBtn, onPress: onAskMentor, activeOpacity: 0.7 }, /* @__PURE__ */ React.createElement(Text, { style: styles.mentorBtnText }, "Discuss with ", mentorName || "Mentor")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.continueBtn, onPress: onContinue, activeOpacity: 0.8 }, /* @__PURE__ */ React.createElement(Text, { style: styles.continueBtnText }, "Continue")))));
}
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg0,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 100
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.bg2,
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 12
  },
  leoCircle: { marginBottom: 16, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  lessonName: {
    fontSize: 13,
    fontStyle: "italic",
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 8
  },
  statsGrid: { flexDirection: "row", width: "100%", marginBottom: 14 },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 12 },
  statBoxMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 2 },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "500" },
  stageBadge: {
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20
  },
  stageText: { fontSize: 12, fontWeight: "600", color: COLORS.accent },
  actions: { width: "100%", gap: 10 },
  shareBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
    alignItems: "center"
  },
  shareBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.accent },
  mentorBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.successSoft,
    borderWidth: 1,
    borderColor: COLORS.success,
    alignItems: "center"
  },
  mentorBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.success },
  continueBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: "center"
  },
  continueBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.textOnAccent }
});
export {
  SessionCompleteCard
};
