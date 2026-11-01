import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
const colorMap = {
  purple: { bg: "rgba(139, 92, 246, 0.12)", border: "rgba(139, 92, 246, 0.4)", accent: "#A78BFA", tag: "rgba(139, 92, 246, 0.2)", overlay: "rgba(88, 28, 135, 0.90)" },
  blue: { bg: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.4)", accent: "#60A5FA", tag: "rgba(59, 130, 246, 0.2)", overlay: "rgba(30, 58, 138, 0.90)" },
  green: { bg: "rgba(34, 197, 94, 0.12)", border: "rgba(34, 197, 94, 0.4)", accent: "#4ADE80", tag: "rgba(34, 197, 94, 0.2)", overlay: "rgba(20, 83, 45, 0.90)" },
  amber: { bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.4)", accent: "#FBBF24", tag: "rgba(245, 158, 11, 0.2)", overlay: "rgba(120, 53, 15, 0.90)" },
  emerald: { bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.4)", accent: "#34D399", tag: "rgba(16, 185, 129, 0.2)", overlay: "rgba(6, 78, 59, 0.90)" },
  rose: { bg: "rgba(244, 63, 94, 0.12)", border: "rgba(244, 63, 94, 0.4)", accent: "#FB7185", tag: "rgba(244, 63, 94, 0.2)", overlay: "rgba(136, 19, 55, 0.90)" }
};
function LessonCard({ title, subtitle, headline, xp, duration, colorScheme = "purple", imageSrc, isCompleted = false, onClick }) {
  const colors = colorMap[colorScheme] || colorMap.purple;
  return /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      style: [styles.container, { borderColor: colors.border }, isCompleted && { opacity: 0.75 }],
      onPress: onClick,
      activeOpacity: 0.85
    },
    imageSrc && /* @__PURE__ */ React.createElement(View, { style: styles.imageContainer }, /* @__PURE__ */ React.createElement(Image, { source: imageSrc, style: styles.heroImage, resizeMode: "cover" }), /* @__PURE__ */ React.createElement(View, { style: [styles.imageOverlay, { backgroundColor: colors.overlay }] }), /* @__PURE__ */ React.createElement(View, { style: styles.imageBadges }, /* @__PURE__ */ React.createElement(View, { style: styles.durationBadge }, /* @__PURE__ */ React.createElement(Text, { style: styles.badgeText }, "\u23F1 ", duration, "m")), /* @__PURE__ */ React.createElement(View, { style: [styles.xpBadge, { backgroundColor: colors.accent }] }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "flask", size: 12, color: "#FFFFFF" }), /* @__PURE__ */ React.createElement(Text, { style: [styles.badgeText, { color: "#FFFFFF" }] }, " +", xp))), isCompleted && /* @__PURE__ */ React.createElement(View, { style: styles.completedBadge }, /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 14 } }, "\u2713"))),
    /* @__PURE__ */ React.createElement(View, { style: [styles.content, imageSrc ? styles.contentWithImage : { backgroundColor: colors.bg }] }, !imageSrc && /* @__PURE__ */ React.createElement(View, { style: styles.header }, /* @__PURE__ */ React.createElement(View, { style: [styles.tag, { backgroundColor: colors.tag }] }, /* @__PURE__ */ React.createElement(Text, { style: [styles.tagText, { color: colors.accent }] }, subtitle)), /* @__PURE__ */ React.createElement(View, { style: styles.meta }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "flask", size: 12, color: COLORS.xpBadgeIcon }), /* @__PURE__ */ React.createElement(Text, { style: styles.metaText }, " ", xp, " XP"), /* @__PURE__ */ React.createElement(Text, { style: styles.metaText }, "\u23F1 ", duration, "m"))), /* @__PURE__ */ React.createElement(View, { style: styles.bottomRow }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1, marginRight: 8 } }, imageSrc && /* @__PURE__ */ React.createElement(View, { style: [styles.tag, { backgroundColor: colors.tag, marginBottom: 4, alignSelf: "flex-start" }] }, /* @__PURE__ */ React.createElement(Text, { style: [styles.tagText, { color: colors.accent }] }, subtitle)), /* @__PURE__ */ React.createElement(Text, { style: styles.title, numberOfLines: 2 }, headline || title)), /* @__PURE__ */ React.createElement(View, { style: [styles.chevronCircle, { backgroundColor: colors.tag }] }, /* @__PURE__ */ React.createElement(Text, { style: [styles.chevron, { color: colors.accent }] }, "\u203A")))),
    /* @__PURE__ */ React.createElement(View, { style: [styles.accentBar, { backgroundColor: colors.accent }] })
  );
}
const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 4,
    overflow: "hidden",
    backgroundColor: COLORS.bg2
  },
  imageContainer: {
    height: 140,
    overflow: "hidden",
    position: "relative"
  },
  heroImage: {
    width: "100%",
    height: "100%"
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.75
  },
  imageBadges: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    gap: 6
  },
  durationBadge: {
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20
  },
  xpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  completedBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center"
  },
  content: {
    padding: 14
  },
  contentWithImage: {
    paddingTop: 12
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  tagText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  meta: {
    flexDirection: "row",
    gap: 8
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500"
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 22
  },
  chevronCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  chevron: {
    fontSize: 22,
    fontWeight: "300",
    marginTop: -2
  },
  accentBar: {
    height: 3,
    width: "100%"
  }
});
export {
  LessonCard
};
