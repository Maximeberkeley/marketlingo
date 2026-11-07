import React, { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { COLORS } from "../../lib/constants";
import { triggerHaptic } from "../../lib/haptics";
import { LeoAnimated } from "../mascot/LeoAnimated";
import { StreakFlame } from "../ui/StreakFlame";
import { XPFlask } from "../ui/XPFlask";
import { STREAK_MILESTONES } from "../../lib/friendSocial";
const CONFETTI_COLORS = ["#8B5CF6", "#F97316", "#22C55E", "#FACC15", "#38BDF8", "#F472B6"];
function rewardCopy(reward) {
  if (reward.kind === "streak") {
    const top = Math.max(...reward.milestones?.length ? reward.milestones : [reward.length ?? 0]);
    const tier = STREAK_MILESTONES.find((m) => m.days === top);
    return {
      title: `${top}-day friend streak!`,
      line: `You and ${reward.friendName} are ${tier ? tier.name : "on fire"}. You both get the bonus.`
    };
  }
  if (reward.outcome === "won") return { title: "You won the race!", line: `${reward.myXP ?? 0} to ${reward.friendXP ?? 0} against ${reward.friendName}. Rematch?` };
  if (reward.outcome === "tied") return { title: "A dead heat!", line: `You and ${reward.friendName} finished level. Bonus for both of you.` };
  return { title: "Good race!", line: `${reward.friendName} edged it this time. You showed up all week, so this is yours.` };
}
function RewardCelebration({ reward, onClose }) {
  const { width, height } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [shown, setShown] = useState(0);
  const count = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const fall = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    x: Math.random() * width,
    delay: Math.random() * 0.35,
    drift: (Math.random() - 0.5) * 80,
    spin: Math.random() * 720 - 360,
    size: 6 + Math.random() * 7,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]
  })), [width, reward]);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {
    });
  }, []);
  useEffect(() => {
    if (!reward) return;
    triggerHaptic("success");
    setShown(reduceMotion ? reward.xp : 0);
    count.setValue(0);
    pop.setValue(0);
    fall.setValue(0);
    if (reduceMotion) return;
    const id = count.addListener(({ value }) => setShown(Math.round(value)));
    Animated.parallel([
      Animated.spring(pop, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
      Animated.timing(fall, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(count, { toValue: reward.xp, duration: 1100, delay: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false })
    ]).start();
    return () => count.removeListener(id);
  }, [reward, reduceMotion, count, pop, fall]);
  if (!reward) return null;
  const copy = rewardCopy(reward);
  return /* @__PURE__ */ React.createElement(Modal, { visible: true, transparent: true, animationType: "fade", onRequestClose: onClose }, /* @__PURE__ */ React.createElement(View, { style: styles.backdrop }, !reduceMotion && pieces.map((p, i) => /* @__PURE__ */ React.createElement(Animated.View, { key: i, pointerEvents: "none", style: [styles.piece, {
    left: p.x,
    width: p.size,
    height: p.size * 1.6,
    backgroundColor: p.color,
    opacity: fall.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
    transform: [
      { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [-40 - p.delay * 200, height * 0.75] }) },
      { translateX: fall.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
      { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.spin}deg`] }) }
    ]
  }] })), /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.card, { transform: [{ scale: reduceMotion ? 1 : pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }] }, /* @__PURE__ */ React.createElement(View, { style: styles.leo }, /* @__PURE__ */ React.createElement(LeoAnimated, { clip: "leo-success", size: 150, fallback: "celebrating" })), /* @__PURE__ */ React.createElement(View, { style: styles.titleRow }, reward.kind === "streak" && /* @__PURE__ */ React.createElement(StreakFlame, { size: 28 }), /* @__PURE__ */ React.createElement(Text, { style: styles.title }, copy.title)), /* @__PURE__ */ React.createElement(Text, { style: styles.line }, copy.line), /* @__PURE__ */ React.createElement(View, { style: styles.xpPill }, /* @__PURE__ */ React.createElement(XPFlask, { size: 30 }), /* @__PURE__ */ React.createElement(Text, { style: styles.xpText }, "+", shown, " XP")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.button, onPress: onClose, activeOpacity: 0.9, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.buttonText }, "Collect")))));
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(11, 16, 32, 0.78)", alignItems: "center", justifyContent: "center", padding: 24 },
  piece: { position: "absolute", top: 0, borderRadius: 2 },
  card: { width: "100%", maxWidth: 380, backgroundColor: COLORS.bg2, borderRadius: 28, paddingHorizontal: 22, paddingBottom: 22, paddingTop: 78, alignItems: "center" },
  leo: { position: "absolute", top: -80 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4, maxWidth: "100%" },
  title: { fontSize: 26, fontWeight: "900", color: COLORS.textPrimary, textAlign: "center", flexShrink: 1 },
  line: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 6, lineHeight: 20 },
  xpPill: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 999, backgroundColor: COLORS.accentSoft, borderWidth: 2, borderColor: COLORS.accent + "40" },
  xpText: { fontSize: 30, fontWeight: "900", color: COLORS.accent },
  button: { alignSelf: "stretch", height: 54, borderRadius: 16, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center", marginTop: 20 },
  buttonText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" }
});
export {
  RewardCelebration,
  rewardCopy
};
