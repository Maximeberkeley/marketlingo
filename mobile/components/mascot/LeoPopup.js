import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image
} from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../../lib/constants";
import { pickBubbleLine } from "../../lib/leoLines";
const LEO_MOOD_IMAGES = {
  waving: require("../../assets/mascot/leo-waving.png"),
  celebrating: require("../../assets/mascot/leo-celebrating.png"),
  thinking: require("../../assets/mascot/leo-thinking.png"),
  idle: require("../../assets/mascot/leo-idle.png")
};
const LEO_IMAGE = LEO_MOOD_IMAGES.idle;
const CATEGORY_CONFIG = {
  social: { icon: "users", color: "#8B5CF6", leoMood: "waving" },
  game: { icon: "zap", color: "#F59E0B", leoMood: "celebrating" },
  learning: { icon: "book-open", color: "#22C55E", leoMood: "thinking" },
  streak: { icon: "trending-up", color: "#F97316", leoMood: "celebrating" },
  achievement: { icon: "award", color: "#EC4899", leoMood: "celebrating" },
  tip: { icon: "info", color: "#3B82F6", leoMood: "idle" }
};
function LeoPopup({ message, onDismiss }) {
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef(null);
  const animateIn = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, tension: 120, friction: 12, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true })
    ]).start();
  }, []);
  const animateOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -200, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true })
    ]).start(() => onDismiss());
  }, [onDismiss]);
  useEffect(() => {
    if (!message) return;
    translateY.setValue(-200);
    opacity.setValue(0);
    animateIn();
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => {
      animateOut();
    }, message.duration || 5e3);
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [message?.id]);
  if (!message) return null;
  const config = CATEGORY_CONFIG[message.category];
  return /* @__PURE__ */ React.createElement(
    Animated.View,
    {
      style: [
        styles.container,
        { transform: [{ translateY }], opacity }
      ]
    },
    /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        activeOpacity: 0.95,
        onPress: () => {
          if (dismissTimer.current) clearTimeout(dismissTimer.current);
          if (message.onAction) message.onAction();
          else animateOut();
        },
        style: styles.touchable
      },
      /* @__PURE__ */ React.createElement(View, { style: styles.content }, /* @__PURE__ */ React.createElement(View, { style: styles.header }, /* @__PURE__ */ React.createElement(View, { style: [styles.categoryBadge, { backgroundColor: config.color + "18" }] }, /* @__PURE__ */ React.createElement(Feather, { name: config.icon, size: 11, color: config.color }), /* @__PURE__ */ React.createElement(Text, { style: [styles.categoryText, { color: config.color }] }, message.category)), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: animateOut, hitSlop: { top: 12, right: 12, bottom: 12, left: 12 } }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 16, color: COLORS.textMuted }))), /* @__PURE__ */ React.createElement(Text, { style: styles.title, numberOfLines: 2 }, pickBubbleLine([message.body, message.title], message.title)), message.actionLabel && /* @__PURE__ */ React.createElement(
        TouchableOpacity,
        {
          style: [styles.actionBtn, { backgroundColor: config.color }],
          onPress: () => {
            if (dismissTimer.current) clearTimeout(dismissTimer.current);
            message.onAction?.();
            animateOut();
          }
        },
        /* @__PURE__ */ React.createElement(Text, { style: styles.actionText }, message.actionLabel)
      )),
      /* @__PURE__ */ React.createElement(View, { style: styles.bubbleTail }),
      /* @__PURE__ */ React.createElement(View, { style: styles.leoWrap }, /* @__PURE__ */ React.createElement(Image, { source: LEO_MOOD_IMAGES[config.leoMood] ?? LEO_IMAGE, style: styles.leoImage }))
    )
  );
}
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 54,
    left: 16,
    right: 16,
    zIndex: 9999
  },
  touchable: {
    flexDirection: "column",
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "transparent",
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10
  },
  leoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2
  },
  leoImage: {
    width: 82,
    height: 82,
    resizeMode: "contain"
  },
  content: {
    alignSelf: "stretch",
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...SHADOWS.lg
  },
  bubbleTail: {
    width: 14,
    height: 14,
    marginTop: -8,
    backgroundColor: COLORS.bg2,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    transform: [{ rotate: "45deg" }]
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
    lineHeight: 20
  },
  body: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18
  },
  actionBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    marginTop: 8
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textOnAccent
  }
});
export {
  LeoPopup
};
