import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { StreakFlame } from "../ui/StreakFlame";
import { SocialAvatar } from "./SocialAvatar";
import { MAX_FRIEND_STREAKS, firstName, streakToday } from "../../lib/friendSocial";
function FriendStreaksCard({ streaks, onOpen, onInvite }) {
  const open = Math.max(0, MAX_FRIEND_STREAKS - streaks.length);
  const lit = streaks.filter((s) => s.status === "active" && streakToday(s) === "both_done").length;
  return /* @__PURE__ */ React.createElement(View, { style: styles.card }, /* @__PURE__ */ React.createElement(View, { style: styles.header }, /* @__PURE__ */ React.createElement(View, { style: styles.flameDisc }, /* @__PURE__ */ React.createElement(StreakFlame, { size: 22, color: "#FFFFFF" })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Friend streaks"), /* @__PURE__ */ React.createElement(Text, { style: styles.sub }, streaks.length === 0 ? "Study the same day as a friend and grow a flame together." : `${lit} of ${streaks.filter((s) => s.status === "active").length} lit today \xB7 both do a lesson to grow it`))), /* @__PURE__ */ React.createElement(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: styles.slots }, streaks.map((s) => /* @__PURE__ */ React.createElement(StreakSlot, { key: s.id, streak: s, onPress: () => onOpen(s) })), Array.from({ length: open }, (_, i) => /* @__PURE__ */ React.createElement(TouchableOpacity, { key: `open-${i}`, style: styles.slot, onPress: onInvite, accessibilityRole: "button", accessibilityLabel: "Start a friend streak" }, /* @__PURE__ */ React.createElement(View, { style: styles.inviteCircle }, /* @__PURE__ */ React.createElement(Feather, { name: "plus", size: 20, color: COLORS.streak })), /* @__PURE__ */ React.createElement(Text, { style: styles.inviteText, numberOfLines: 1 }, i === 0 ? "Invite" : "")))));
}
function StreakSlot({ streak, onPress }) {
  const name = firstName(streak);
  const today = streakToday(streak);
  const incoming = streak.status === "pending" && !streak.invited_by_me;
  const outgoing = streak.status === "pending" && streak.invited_by_me;
  const litToday = streak.status === "active" && today === "both_done";
  const ring = incoming ? COLORS.accent : outgoing ? COLORS.border : litToday ? COLORS.streak : today === "your_turn" ? COLORS.accent : COLORS.border;
  const label = incoming ? "Accept?" : outgoing ? "Invited" : today === "your_turn" ? "Your turn" : name;
  return /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      style: styles.slot,
      onPress,
      activeOpacity: 0.85,
      accessibilityRole: "button",
      accessibilityLabel: incoming ? `${name} invited you to a friend streak` : `${streak.length}-day friend streak with ${name}`
    },
    /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(SocialAvatar, { name, size: 52, ring, ringWidth: 3, dim: outgoing, dashed: today === "waiting" || outgoing, tint: litToday ? COLORS.streakBadgeSurface : void 0 }), streak.status === "active" && /* @__PURE__ */ React.createElement(View, { style: [styles.countPill, litToday ? styles.countPillLit : styles.countPillIdle] }, /* @__PURE__ */ React.createElement(StreakFlame, { size: 12, color: litToday ? "#FFFFFF" : COLORS.streak }), /* @__PURE__ */ React.createElement(Text, { style: [styles.countText, litToday && styles.countTextLit] }, streak.length)), incoming && /* @__PURE__ */ React.createElement(View, { style: styles.newDot }, /* @__PURE__ */ React.createElement(Text, { style: styles.newDotText }, "!")), streak.claimable_xp > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.giftDot }, /* @__PURE__ */ React.createElement(Feather, { name: "gift", size: 11, color: "#FFFFFF" }))),
    /* @__PURE__ */ React.createElement(Text, { style: [styles.slotLabel, (incoming || today === "your_turn") && styles.slotLabelAccent], numberOfLines: 1 }, label)
  );
}
const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
    gap: 12,
    backgroundColor: COLORS.streakBadgeSurface,
    borderWidth: 1.5,
    borderColor: COLORS.streakBadgeBorder
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  flameDisc: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.streak,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.streak,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.textPrimary },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  slots: { gap: 9, paddingRight: 4 },
  slot: { width: 56, alignItems: "center", gap: 10 },
  inviteCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.streakBadgeBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg2
  },
  inviteText: { fontSize: 11, fontWeight: "700", color: COLORS.streak, marginTop: -1 },
  countPill: {
    position: "absolute",
    bottom: -8,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5
  },
  countPillLit: { backgroundColor: COLORS.streak, borderColor: COLORS.bg2 },
  countPillIdle: { backgroundColor: COLORS.bg2, borderColor: COLORS.streakBadgeBorder },
  countText: { fontSize: 11, fontWeight: "900", color: COLORS.streak },
  countTextLit: { color: "#FFFFFF" },
  newDot: { position: "absolute", top: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.bg2 },
  newDotText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  giftDot: { position: "absolute", top: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.success, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.bg2 },
  slotLabel: { fontSize: 11, fontWeight: "700", color: COLORS.textSecondary, maxWidth: 58 },
  slotLabelAccent: { color: COLORS.accent }
});
export {
  FriendStreaksCard
};
