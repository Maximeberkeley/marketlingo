import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { SocialAvatar } from "./SocialAvatar";
import { XPFlask } from "../ui/XPFlask";
import {
  RACE_DAYS,
  RACE_REWARD,
  firstName,
  raceIsOver,
  raceLeadLine,
  raceOutcome,
  raceReward,
  raceShare,
  timeLeft
} from "../../lib/friendSocial";
function RaceCard({ race, busy, nudgeState, onAccept, onCancel, onClaim, onNudge, onRematch }) {
  const name = firstName(race);
  const over = raceIsOver(race);
  const share = raceShare(race.my_xp, race.friend_xp);
  const incoming = race.status === "pending" && !race.challenged_by_me;
  const outgoing = race.status === "pending" && race.challenged_by_me;
  const outcome = raceOutcome(race.my_xp, race.friend_xp);
  const reward = raceReward(race.my_xp, race.friend_xp);
  const leading = race.my_xp > race.friend_xp;
  if (race.status === "pending") {
    return /* @__PURE__ */ React.createElement(View, { style: [styles.card, incoming && styles.cardInvite] }, /* @__PURE__ */ React.createElement(View, { style: styles.inviteRow }, /* @__PURE__ */ React.createElement(View, { style: styles.flagDisc }, /* @__PURE__ */ React.createElement(Feather, { name: "flag", size: 18, color: "#FFFFFF" })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.inviteTitle }, incoming ? `${name} challenged you` : `Waiting for ${name}`), /* @__PURE__ */ React.createElement(Text, { style: styles.inviteSub }, RACE_DAYS, "-day XP race \xB7 winner gets +", RACE_REWARD.won, " XP"))), incoming ? /* @__PURE__ */ React.createElement(View, { style: styles.row2 }, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: [styles.btn, styles.btnPrimary], onPress: () => onAccept(true), disabled: busy, accessibilityRole: "button" }, busy ? /* @__PURE__ */ React.createElement(ActivityIndicator, { color: "#FFFFFF" }) : /* @__PURE__ */ React.createElement(Text, { style: styles.btnPrimaryText }, "Accept race")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: [styles.btn, styles.btnGhost], onPress: () => onAccept(false), disabled: busy, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.btnGhostText }, "Not now"))) : /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onCancel, style: styles.linkBtn, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.link }, "Cancel challenge")));
  }
  return /* @__PURE__ */ React.createElement(View, { style: [styles.card, over && !race.claimed && styles.cardDone] }, /* @__PURE__ */ React.createElement(View, { style: styles.topRow }, /* @__PURE__ */ React.createElement(Text, { style: styles.kicker }, over ? "RACE OVER" : "RACE"), !over && /* @__PURE__ */ React.createElement(View, { style: styles.clock }, /* @__PURE__ */ React.createElement(Feather, { name: "clock", size: 12, color: COLORS.textSecondary }), /* @__PURE__ */ React.createElement(Text, { style: styles.clockText }, timeLeft(race.ends_at))), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }), /* @__PURE__ */ React.createElement(View, { style: styles.prizeRow }, /* @__PURE__ */ React.createElement(XPFlask, { size: 13 }), /* @__PURE__ */ React.createElement(Text, { style: styles.prize }, over && race.claimed ? `+${race.claimed_xp} XP collected` : `Winner +${RACE_REWARD.won} XP`))), /* @__PURE__ */ React.createElement(View, { style: styles.versus }, /* @__PURE__ */ React.createElement(View, { style: styles.side }, /* @__PURE__ */ React.createElement(SocialAvatar, { name: "You", size: 44, ring: COLORS.accent, ringWidth: 3 }), /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Text, { style: styles.sideName }, "You"), /* @__PURE__ */ React.createElement(Text, { style: [styles.sideXP, { color: COLORS.accent }] }, race.my_xp.toLocaleString(), " XP"))), /* @__PURE__ */ React.createElement(Text, { style: styles.vs }, "VS"), /* @__PURE__ */ React.createElement(View, { style: [styles.side, styles.sideRight] }, /* @__PURE__ */ React.createElement(View, { style: { alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement(Text, { style: styles.sideName, numberOfLines: 1 }, name), /* @__PURE__ */ React.createElement(Text, { style: [styles.sideXP, { color: COLORS.streak }] }, race.friend_xp.toLocaleString(), " XP")), /* @__PURE__ */ React.createElement(SocialAvatar, { name, size: 44, ring: COLORS.streak, ringWidth: 3 }))), /* @__PURE__ */ React.createElement(View, { style: styles.bar, accessibilityLabel: `You ${race.my_xp} XP, ${name} ${race.friend_xp} XP` }, /* @__PURE__ */ React.createElement(View, { style: [styles.barMine, { flex: share }] }), /* @__PURE__ */ React.createElement(View, { style: [styles.barTheirs, { flex: 1 - share }] }), /* @__PURE__ */ React.createElement(View, { style: [styles.knob, { left: `${share * 100}%` }] }, /* @__PURE__ */ React.createElement(XPFlask, { size: 16 }))), /* @__PURE__ */ React.createElement(Text, { style: [styles.lead, leading && { color: COLORS.accent }] }, raceLeadLine({ ...race, status: over ? "finished" : race.status })), over && !race.claimed ? /* @__PURE__ */ React.createElement(TouchableOpacity, { style: [styles.btn, styles.btnClaim], onPress: onClaim, disabled: busy, accessibilityRole: "button" }, busy ? /* @__PURE__ */ React.createElement(ActivityIndicator, { color: "#FFFFFF" }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Feather, { name: "gift", size: 17, color: "#FFFFFF" }), /* @__PURE__ */ React.createElement(Text, { style: styles.btnPrimaryText }, reward > 0 ? `${outcome === "won" ? "You won! " : outcome === "tied" ? "Tie! " : ""}Collect +${reward} XP` : "See results"))) : over ? /* @__PURE__ */ React.createElement(TouchableOpacity, { style: [styles.btn, styles.btnGhost], onPress: onRematch, disabled: busy, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Feather, { name: "rotate-ccw", size: 15, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.btnGhostText }, "Rematch ", name)) : nudgeState === "nudged" || race.nudged_today ? /* @__PURE__ */ React.createElement(View, { style: [styles.btn, styles.btnOff] }, /* @__PURE__ */ React.createElement(Text, { style: styles.btnOffText }, "Nudged ", name, " \u2713")) : /* @__PURE__ */ React.createElement(TouchableOpacity, { style: [styles.btn, styles.btnGhost], onPress: onNudge, disabled: nudgeState === "sending", accessibilityRole: "button" }, nudgeState === "sending" ? /* @__PURE__ */ React.createElement(ActivityIndicator, { color: COLORS.accent }) : /* @__PURE__ */ React.createElement(Text, { style: styles.btnGhostText }, leading ? `Nudge ${name}` : `Nudge ${name} \xB7 then pull ahead`)));
}
const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.bg2, borderRadius: 20, padding: 14, gap: 12, borderWidth: 1.5, borderColor: COLORS.border },
  cardInvite: { borderColor: COLORS.accent + "55", backgroundColor: COLORS.accentSoft },
  cardDone: { borderColor: COLORS.success + "66" },
  inviteRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  flagDisc: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
  inviteTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  inviteSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  row2: { flexDirection: "row", gap: 10 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  kicker: { fontSize: 11, fontWeight: "900", letterSpacing: 1, color: COLORS.accent },
  clock: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: COLORS.bg1 },
  clockText: { fontSize: 11, fontWeight: "700", color: COLORS.textSecondary },
  prizeRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  prize: { fontSize: 11, fontWeight: "800", color: COLORS.success },
  versus: { flexDirection: "row", alignItems: "center" },
  side: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 },
  sideRight: { justifyContent: "flex-end" },
  sideName: { fontSize: 13, fontWeight: "800", color: COLORS.textPrimary, maxWidth: 110 },
  sideXP: { fontSize: 16, fontWeight: "900" },
  vs: { fontSize: 12, fontWeight: "900", color: COLORS.textMuted, marginHorizontal: 6 },
  bar: { height: 14, borderRadius: 7, flexDirection: "row", overflow: "visible", backgroundColor: COLORS.bg1 },
  barMine: { backgroundColor: COLORS.accent, borderTopLeftRadius: 7, borderBottomLeftRadius: 7 },
  barTheirs: { backgroundColor: COLORS.streak, borderTopRightRadius: 7, borderBottomRightRadius: 7 },
  knob: {
    position: "absolute",
    top: -8,
    marginLeft: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.bg2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  lead: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, textAlign: "center" },
  btn: { flex: 1, minHeight: 46, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 12 },
  btnPrimary: { backgroundColor: COLORS.accent },
  btnClaim: { backgroundColor: COLORS.success },
  btnPrimaryText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  btnGhost: { borderWidth: 2, borderColor: COLORS.accent + "45", backgroundColor: COLORS.bg2 },
  btnGhostText: { fontSize: 14, fontWeight: "800", color: COLORS.accent },
  btnOff: { backgroundColor: COLORS.bg1 },
  btnOffText: { fontSize: 14, fontWeight: "700", color: COLORS.textMuted },
  linkBtn: { alignSelf: "flex-start", paddingVertical: 2 },
  link: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted, textDecorationLine: "underline" }
});
export {
  RaceCard
};
