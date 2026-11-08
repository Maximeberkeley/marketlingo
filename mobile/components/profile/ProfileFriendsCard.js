import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { isDark } from "../../lib/theme";
import { LeoAnimated } from "../mascot/LeoAnimated";
import { StreakFlame } from "../ui/StreakFlame";
import { SocialAvatar } from "../social/SocialAvatar";
import { ChunkyButton } from "../social/ChunkyButton";
import { CrownBadge } from "../social/CrownBadge";
import { crownCopy } from "../../lib/crown";
const LEO_KING = require("../../assets/mascot/leo-king.png");
const GOLD_TEXT = isDark ? COLORS.gold : "#B7791F";
const STACK_MAX = 5;
const STACK_TINTS = isDark ? ["rgba(167, 139, 250, 0.28)", "rgba(251, 146, 60, 0.28)", "rgba(52, 211, 153, 0.26)", "rgba(252, 211, 77, 0.26)", "rgba(56, 189, 248, 0.26)"] : ["#EDE9FE", "#FFEDD5", "#DCFCE7", "#FEF3C7", "#E0F2FE"];
function ProfileFriendsCard({ info, onOpen, onAdd }) {
  const hasFriends = info.friendNames.length > 0;
  const copy = info.crown ? crownCopy(info.crown) : null;
  const iWearIt = info.crown?.kind === "mine";
  return /* @__PURE__ */ React.createElement(View, { style: styles.card }, /* @__PURE__ */ React.createElement(View, { style: styles.head }, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Friends"), info.pending > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.pending, accessibilityLabel: `${info.pending} friend requests` }, /* @__PURE__ */ React.createElement(Text, { style: styles.pendingText }, info.pending === 1 ? "1 request" : `${info.pending} requests`)), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onOpen, style: styles.seeAll, hitSlop: 8, accessibilityRole: "button", accessibilityLabel: "Open Friends" }, /* @__PURE__ */ React.createElement(Text, { style: styles.seeAllText }, "See all"), /* @__PURE__ */ React.createElement(Feather, { name: "chevron-right", size: 16, color: COLORS.accent }))), hasFriends && copy ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.crown, onPress: onOpen, activeOpacity: 0.9, accessibilityRole: "button", accessibilityLabel: `${copy.title}. ${copy.line}. Open Friends` }, /* @__PURE__ */ React.createElement(View, { style: styles.crownLeo, pointerEvents: "none" }, /* @__PURE__ */ React.createElement(LeoAnimated, { clip: "leo-king", size: 92, fallback: LEO_KING })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.kicker }, "THIS MONTH'S CROWN"), /* @__PURE__ */ React.createElement(Text, { style: styles.crownTitle, numberOfLines: 2 }, copy.title), /* @__PURE__ */ React.createElement(Text, { style: styles.crownLine, numberOfLines: 1 }, copy.line))), /* @__PURE__ */ React.createElement(View, { style: styles.stackRow }, /* @__PURE__ */ React.createElement(View, { style: styles.stack }, info.friendNames.slice(0, STACK_MAX).map((name, i) => /* @__PURE__ */ React.createElement(View, { key: `${name}-${i}`, style: [styles.stackItem, { marginLeft: i === 0 ? 0 : -12, zIndex: STACK_MAX - i }] }, /* @__PURE__ */ React.createElement(SocialAvatar, { name, size: 36, ring: COLORS.bg2, ringWidth: 2.5, tint: STACK_TINTS[i % STACK_TINTS.length] }), i === 0 && info.crown?.kind === "theirs" && /* @__PURE__ */ React.createElement(View, { style: styles.stackCrown, pointerEvents: "none" }, /* @__PURE__ */ React.createElement(CrownBadge, { size: 18 })))), info.friendNames.length > STACK_MAX && /* @__PURE__ */ React.createElement(View, { style: [styles.stackItem, styles.stackMore, { marginLeft: -12 }] }, /* @__PURE__ */ React.createElement(Text, { style: styles.stackMoreText }, "+", info.friendNames.length - STACK_MAX))), /* @__PURE__ */ React.createElement(View, { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.stackTitle, numberOfLines: 1 }, info.friendNames.length === 1 ? "1 friend" : `${info.friendNames.length} friends`), /* @__PURE__ */ React.createElement(Text, { style: styles.stackSub, numberOfLines: 1 }, iWearIt ? `You're #1 of ${info.boardSize} this month` : `You're #${info.myRank} of ${info.boardSize} this month`))), (info.streaks || info.races != null) && /* @__PURE__ */ React.createElement(View, { style: styles.chips }, info.streaks && /* @__PURE__ */ React.createElement(View, { style: [styles.chip, styles.chipStreak] }, /* @__PURE__ */ React.createElement(StreakFlame, { size: 15 }), /* @__PURE__ */ React.createElement(Text, { style: styles.chipText, numberOfLines: 1 }, info.streaks.active > 0 ? `${info.streaks.lit} of ${info.streaks.active} streaks lit` : "Start a friend streak")), info.races != null && /* @__PURE__ */ React.createElement(View, { style: [styles.chip, styles.chipRace] }, /* @__PURE__ */ React.createElement(Feather, { name: "flag", size: 13, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.chipText, numberOfLines: 1 }, info.races > 0 ? info.races === 1 ? "1 race on" : `${info.races} races on` : "Race a friend"))), info.urgent && /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.urgent, onPress: onOpen, activeOpacity: 0.85, accessibilityRole: "button" }, info.urgent.icon === "flame" ? /* @__PURE__ */ React.createElement(StreakFlame, { size: 16 }) : /* @__PURE__ */ React.createElement(Feather, { name: info.urgent.icon === "race" ? "flag" : "gift", size: 15, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.urgentText, numberOfLines: 1 }, info.urgent.text), /* @__PURE__ */ React.createElement(Feather, { name: "chevron-right", size: 16, color: COLORS.textMuted })), /* @__PURE__ */ React.createElement(View, { style: styles.actions }, /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Open Friends", onPress: onOpen, height: 46, style: { flex: 1 } }), /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Add", tone: "plain", icon: /* @__PURE__ */ React.createElement(Feather, { name: "user-plus", size: 17, color: COLORS.accent }), onPress: onAdd, height: 46, style: { flex: 0.72 }, accessibilityLabel: "Add friends" }))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(View, { style: styles.empty }, /* @__PURE__ */ React.createElement(View, { style: styles.crownLeo, pointerEvents: "none" }, /* @__PURE__ */ React.createElement(LeoAnimated, { clip: "leo-king", size: 92, fallback: LEO_KING })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.crownTitle }, "Learning is better with friends"), /* @__PURE__ */ React.createElement(Text, { style: styles.emptyLine }, "Race each other, share a streak, and fight for this month's crown."))), /* @__PURE__ */ React.createElement(View, { style: styles.actions }, /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Invite friends", icon: /* @__PURE__ */ React.createElement(Feather, { name: "share", size: 17, color: "#FFFFFF" }), onPress: onAdd, height: 46, style: { flex: 1 } }), /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Find", tone: "plain", icon: /* @__PURE__ */ React.createElement(Feather, { name: "search", size: 17, color: COLORS.accent }), onPress: onOpen, height: 46, style: { flex: 0.6 }, accessibilityLabel: "Find friends" }))));
}
const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 14, gap: 12, marginBottom: 20, backgroundColor: COLORS.bg2, borderWidth: 2, borderBottomWidth: 5, borderColor: COLORS.border },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "900", color: COLORS.textPrimary },
  pending: { paddingHorizontal: 9, height: 22, borderRadius: 11, backgroundColor: COLORS.error, alignItems: "center", justifyContent: "center" },
  pendingText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 14, fontWeight: "800", color: COLORS.accent },
  crown: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    paddingRight: 12,
    minHeight: 96,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: isDark ? "rgba(252, 211, 77, 0.12)" : "#FFF7E0",
    borderColor: isDark ? "rgba(252, 211, 77, 0.45)" : "#F6D77A"
  },
  crownLeo: { width: 92, height: 98, alignItems: "center", justifyContent: "flex-end" },
  kicker: { fontSize: 10, fontWeight: "900", letterSpacing: 1, color: GOLD_TEXT, marginTop: 12 },
  crownTitle: { fontSize: 16, fontWeight: "900", color: COLORS.textPrimary, marginTop: 3, lineHeight: 20 },
  crownLine: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary, marginTop: 2, marginBottom: 12 },
  stackRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stack: { flexDirection: "row", alignItems: "center", paddingTop: 8 },
  stackItem: { borderRadius: 20 },
  stackCrown: { position: "absolute", top: -11, left: 9 },
  stackMore: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bg1, borderWidth: 2.5, borderColor: COLORS.bg2, alignItems: "center", justifyContent: "center" },
  stackMoreText: { fontSize: 12, fontWeight: "800", color: COLORS.textSecondary },
  stackTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  stackSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  chips: { flexDirection: "row", gap: 8 },
  chip: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 10, borderRadius: 12 },
  chipStreak: { backgroundColor: COLORS.streakBadgeSurface },
  chipRace: { backgroundColor: COLORS.accentSoft },
  chipText: { flexShrink: 1, fontSize: 12, fontWeight: "800", color: COLORS.textPrimary },
  urgent: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, height: 42, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.accentMedium, backgroundColor: COLORS.bg1 },
  urgentText: { flex: 1, fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  actions: { flexDirection: "row", gap: 10 },
  empty: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    paddingRight: 12,
    minHeight: 96,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: isDark ? "rgba(252, 211, 77, 0.12)" : "#FFF7E0",
    borderColor: isDark ? "rgba(252, 211, 77, 0.45)" : "#F6D77A"
  },
  emptyLine: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3, marginBottom: 12, lineHeight: 16 }
});
export {
  ProfileFriendsCard
};
