"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var WelcomeBackModal_exports = {};
__export(WelcomeBackModal_exports, {
  WelcomeBackModal: () => WelcomeBackModal
});
module.exports = __toCommonJS(WelcomeBackModal_exports);
var import_react = __toESM(require("react"));
var import_react_native = require("react-native");
var import_vector_icons = require("@expo/vector-icons");
var import_expo_linear_gradient = require("expo-linear-gradient");
var import_constants = require("../../lib/constants");
var import_LeoAnimated = require("../mascot/LeoAnimated");
var import_haptics = require("../../lib/haptics");
function WelcomeBackModal({
  visible,
  level,
  xp,
  xpToNextLevel,
  streak,
  marketName,
  onClose,
  onStart,
  lessonDone
}) {
  const scale = (0, import_react.useRef)(new import_react_native.Animated.Value(0.9)).current;
  const fade = (0, import_react.useRef)(new import_react_native.Animated.Value(0)).current;
  const barFill = (0, import_react.useRef)(new import_react_native.Animated.Value(0)).current;
  const [leoClip, setLeoClip] = (0, import_react.useState)("leo-greet");
  const levelStart = (level - 1) * (level - 1) * 50;
  const levelEnd = level * level * 50;
  const xpLeft = Math.max(0, typeof xpToNextLevel === "number" && xpToNextLevel > 0 ? xpToNextLevel : levelEnd - xp);
  const span = Math.max(1, levelEnd - levelStart);
  const progressRatio = Math.max(0, Math.min(1, 1 - xpLeft / span));
  (0, import_react.useEffect)(() => {
    if (!visible) {
      scale.setValue(0.9);
      fade.setValue(0);
      barFill.setValue(0);
      setLeoClip("leo-greet");
      return;
    }
    (0, import_haptics.triggerHaptic)("light");
    import_react_native.Animated.parallel([
      import_react_native.Animated.spring(scale, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
      import_react_native.Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true })
    ]).start();
    import_react_native.Animated.timing(barFill, {
      toValue: progressRatio,
      duration: 900,
      delay: 260,
      easing: import_react_native.Easing.out(import_react_native.Easing.cubic),
      useNativeDriver: false
    }).start();
  }, [visible, progressRatio]);
  return /* @__PURE__ */ import_react.default.createElement(import_react_native.Modal, { visible, transparent: true, animationType: "fade", onRequestClose: onClose }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.backdrop }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Animated.View, { style: [styles.card, { opacity: fade, transform: [{ scale }] }] }, /* @__PURE__ */ import_react.default.createElement(
    import_expo_linear_gradient.LinearGradient,
    {
      colors: ["#7C3AED", "#8B5CF6", "#A78BFA"],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
      style: styles.hero
    },
    /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.mascotWrap }, /* @__PURE__ */ import_react.default.createElement(
      import_LeoAnimated.LeoAnimated,
      {
        clip: leoClip,
        size: 120,
        fallback: "idle",
        paused: !visible,
        onEnd: () => setLeoClip("leo-idle-loop")
      }
    )),
    /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.heroKicker }, "WELCOME BACK"),
    /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.heroTitle }, "Level ", level),
    /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.heroSub }, marketName, " insider")
  ), /* @__PURE__ */ import_react.default.createElement(import_react_native.ScrollView, { style: styles.bodyScroll, contentContainerStyle: styles.body, showsVerticalScrollIndicator: false, bounces: false }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.barTrack }, /* @__PURE__ */ import_react.default.createElement(
    import_react_native.Animated.View,
    {
      style: [
        styles.barFill,
        { width: barFill.interpolate({ inputRange: [0, 1], outputRange: ["4%", "100%"] }) }
      ]
    }
  )), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.barLabel }, xpLeft.toLocaleString(), " XP to Level ", level + 1), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.statRow }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.stat }, /* @__PURE__ */ import_react.default.createElement(import_vector_icons.MaterialCommunityIcons, { name: "fire", size: 22, color: import_constants.COLORS.streak }), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.statValue }, streak), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.statLabel }, "day streak")), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.statDivider }), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.stat }, /* @__PURE__ */ import_react.default.createElement(import_vector_icons.MaterialCommunityIcons, { name: "flask", size: 24, color: import_constants.COLORS.xpBadgeIcon }), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.statValue }, xp.toLocaleString()), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.statLabel }, "total XP"))), /* @__PURE__ */ import_react.default.createElement(import_react_native.TouchableOpacity, { style: styles.cta, onPress: lessonDone ? onClose : onStart ?? onClose, activeOpacity: 0.9 }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.ctaText }, lessonDone ? "Keep going" : "Start today's lesson"), /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "arrow-right", size: 17, color: "#FFFFFF" }))))));
}
const styles = import_react_native.StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(9, 11, 18, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  card: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "90%",
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: import_constants.COLORS.bg2,
    ...import_constants.SHADOWS.lg
  },
  bodyScroll: { flexGrow: 0, flexShrink: 1 },
  hero: { paddingTop: 18, paddingBottom: 22, alignItems: "center" },
  mascotWrap: { height: 120, justifyContent: "center" },
  heroKicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4
  },
  heroTitle: { fontSize: 32, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.6, marginTop: 2 },
  heroSub: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.85)", marginTop: 2 },
  body: { padding: 20, gap: 14 },
  barTrack: { height: 10, borderRadius: 6, backgroundColor: import_constants.COLORS.bg1, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 6, backgroundColor: import_constants.COLORS.accent },
  barLabel: { ...import_constants.TYPE.caption, color: import_constants.COLORS.textMuted, textAlign: "center" },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: import_constants.COLORS.bg1,
    borderRadius: 16,
    paddingVertical: 14
  },
  stat: { flex: 1, alignItems: "center", gap: 3 },
  statDivider: { width: 1, height: 34, backgroundColor: import_constants.COLORS.border },
  statValue: { fontSize: 18, fontWeight: "800", color: import_constants.COLORS.textPrimary },
  statLabel: { fontSize: 10, fontWeight: "600", color: import_constants.COLORS.textMuted, letterSpacing: 0.4 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: import_constants.COLORS.accent,
    borderRadius: 16,
    paddingVertical: 16,
    ...import_constants.SHADOWS.accent
  },
  ctaText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" }
});
