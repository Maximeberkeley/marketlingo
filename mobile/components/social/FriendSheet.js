import React from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../lib/constants";
import { StreakFlame } from "../ui/StreakFlame";
import { XPFlask } from "../ui/XPFlask";
import { SocialAvatar } from "./SocialAvatar";
import { ChunkyButton } from "./ChunkyButton";
function FriendSheet({ friend, social, onClose, onNudge, onRace, onStreak, onRemove }) {
  const insets = useSafeAreaInsets();
  if (!friend) return null;
  const confirmRemove = () => Alert.alert(`Remove ${friend.name}?`, "You will stop seeing each other on the board.", [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: onRemove }
  ]);
  return /* @__PURE__ */ React.createElement(Modal, { visible: true, transparent: true, animationType: "slide", onRequestClose: onClose }, /* @__PURE__ */ React.createElement(Pressable, { style: styles.backdrop, onPress: onClose, accessibilityLabel: "Close" }), /* @__PURE__ */ React.createElement(View, { style: [styles.sheet, { paddingBottom: insets.bottom + 16 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.handle }), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onClose, style: styles.close, accessibilityLabel: "Close" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 18, color: COLORS.textMuted })), /* @__PURE__ */ React.createElement(View, { style: styles.top }, /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(SocialAvatar, { name: friend.name, size: 76, ring: COLORS.accent, ringWidth: 3 }), friend.online && /* @__PURE__ */ React.createElement(View, { style: styles.online })), /* @__PURE__ */ React.createElement(Text, { style: styles.name, numberOfLines: 1 }, friend.name), /* @__PURE__ */ React.createElement(Text, { style: styles.meta, numberOfLines: 1 }, [friend.industry, `Level ${friend.level}`].filter(Boolean).join(" \xB7 ")), /* @__PURE__ */ React.createElement(View, { style: [styles.today, friend.doneToday ? styles.todayDone : styles.todayNot] }, /* @__PURE__ */ React.createElement(Feather, { name: friend.doneToday ? "check-circle" : "clock", size: 13, color: friend.doneToday ? COLORS.success : COLORS.textSecondary }), /* @__PURE__ */ React.createElement(Text, { style: [styles.todayText, friend.doneToday && { color: COLORS.success }] }, friend.doneToday ? "Did today's lesson" : "Hasn't studied today"))), /* @__PURE__ */ React.createElement(View, { style: styles.stats }, /* @__PURE__ */ React.createElement(Stat, { icon: /* @__PURE__ */ React.createElement(XPFlask, { size: 18 }), value: friend.monthXP.toLocaleString(), label: "XP this month" }), /* @__PURE__ */ React.createElement(Stat, { icon: /* @__PURE__ */ React.createElement(StreakFlame, { size: 18, dim: friend.streak === 0 }), value: String(friend.streak), label: "Day streak" }), /* @__PURE__ */ React.createElement(Stat, { icon: /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "trophy-outline", size: 18, color: COLORS.gold }), value: `#${friend.rank}`, label: "Among friends" })), /* @__PURE__ */ React.createElement(
    ChunkyButton,
    {
      label: friend.doneToday ? `${friend.name} is done for today` : friend.nudged ? "Nudged today" : `Nudge ${friend.name}`,
      icon: /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: friend.doneToday ? "check-bold" : "hand-wave", size: 20, color: "#FFFFFF" }),
      onPress: onNudge,
      disabled: friend.doneToday || friend.nudged,
      tone: friend.doneToday ? "success" : "accent"
    }
  ), social && /* @__PURE__ */ React.createElement(View, { style: styles.row2 }, /* @__PURE__ */ React.createElement(
    ChunkyButton,
    {
      label: friend.raceAction.label,
      icon: /* @__PURE__ */ React.createElement(Feather, { name: "flag", size: 17, color: COLORS.accent }),
      tone: "plain",
      onPress: onRace,
      disabled: !friend.raceAction.enabled,
      style: { flex: 1 },
      height: 48
    }
  ), /* @__PURE__ */ React.createElement(
    ChunkyButton,
    {
      label: friend.streakAction.label,
      icon: /* @__PURE__ */ React.createElement(StreakFlame, { size: 18 }),
      tone: "plain",
      onPress: onStreak,
      disabled: !friend.streakAction.enabled,
      style: { flex: 1 },
      height: 48
    }
  )), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: confirmRemove, style: styles.remove, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.removeText }, "Remove friend"))));
}
function Stat({ icon, value, label }) {
  return /* @__PURE__ */ React.createElement(View, { style: styles.stat }, /* @__PURE__ */ React.createElement(View, { style: styles.statTop }, icon, /* @__PURE__ */ React.createElement(Text, { style: styles.statValue }, value)), /* @__PURE__ */ React.createElement(Text, { style: styles.statLabel, numberOfLines: 1 }, label));
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(11, 16, 32, 0.55)" },
  sheet: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, gap: 12, width: "100%", maxWidth: 680, alignSelf: "center" },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.border },
  close: { position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.bg1, alignItems: "center", justifyContent: "center", zIndex: 2 },
  top: { alignItems: "center", gap: 4 },
  online: { position: "absolute", right: 4, bottom: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.success, borderWidth: 3, borderColor: COLORS.bg2 },
  name: { fontSize: 22, fontWeight: "900", color: COLORS.textPrimary, marginTop: 6, maxWidth: "80%" },
  meta: { fontSize: 13, color: COLORS.textSecondary },
  today: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, height: 26, borderRadius: 13, marginTop: 4 },
  todayDone: { backgroundColor: COLORS.successSoft },
  todayNot: { backgroundColor: COLORS.bg1 },
  todayText: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, borderRadius: 16, borderWidth: 2, borderColor: COLORS.border, paddingVertical: 10, paddingHorizontal: 8, alignItems: "center", gap: 2 },
  statTop: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { fontSize: 18, fontWeight: "900", color: COLORS.textPrimary },
  statLabel: { fontSize: 11, fontWeight: "600", color: COLORS.textSecondary },
  row2: { flexDirection: "row", gap: 10 },
  remove: { alignSelf: "center", paddingVertical: 6 },
  removeText: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted, textDecorationLine: "underline" }
});
export {
  FriendSheet
};
