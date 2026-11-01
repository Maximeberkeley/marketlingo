import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { getComboMessage } from "../../lib/combo";
function ComboCounter({ combo, show }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fireScale = useRef(new Animated.Value(1)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (show && combo.streak > 0) {
      scaleAnim.setValue(0.5);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [combo.streak, show]);
  useEffect(() => {
    if (combo.isOnFire) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(fireScale, {
            toValue: 1.2,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(fireScale, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [combo.isOnFire]);
  const message = getComboMessage(combo.streak);
  useEffect(() => {
    if (message) {
      messageOpacity.setValue(0);
      Animated.sequence([
        Animated.timing(messageOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(messageOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start();
    }
  }, [message]);
  if (!show || combo.streak === 0) return null;
  const multiplierColor = combo.isOnFire ? "#F97316" : combo.multiplier > 1 ? "#FBBF24" : COLORS.textSecondary;
  return /* @__PURE__ */ React.createElement(View, { style: styles.container }, /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.comboChip, { transform: [{ scale: scaleAnim }] }] }, /* @__PURE__ */ React.createElement(Animated.View, { style: combo.isOnFire ? { transform: [{ scale: fireScale }] } : void 0 }, combo.isOnFire ? null : /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "flask", size: 16, color: COLORS.xpBadgeIcon })), /* @__PURE__ */ React.createElement(Text, { style: [styles.comboCount, { color: multiplierColor }] }, combo.streak), /* @__PURE__ */ React.createElement(View, { style: [styles.multiplierBadge, { backgroundColor: multiplierColor + "20" }] }, /* @__PURE__ */ React.createElement(Text, { style: [styles.multiplierText, { color: multiplierColor }] }, combo.multiplier, "x"))), message && /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.messageBubble, { opacity: messageOpacity }] }, /* @__PURE__ */ React.createElement(Text, { style: styles.messageText }, message)));
}
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 6
  },
  comboChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(251, 146, 60, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(251, 146, 60, 0.3)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  fireEmoji: { fontSize: 16 },
  comboCount: {
    fontSize: 16,
    fontWeight: "800"
  },
  multiplierBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  multiplierText: {
    fontSize: 11,
    fontWeight: "700"
  },
  messageBubble: {
    backgroundColor: "rgba(251, 146, 60, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(251, 146, 60, 0.3)"
  },
  messageText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FB923C",
    textAlign: "center"
  }
});
export {
  ComboCounter
};
