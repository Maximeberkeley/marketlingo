import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { ChunkyButton } from "./ChunkyButton";
const LEO_WAVING = require("../../assets/mascot/leo-waving.png");
function AddFriendsCard({ hasFriends, onShare, onSearch, onMyCode }) {
  return /* @__PURE__ */ React.createElement(View, { style: styles.card }, /* @__PURE__ */ React.createElement(View, { style: styles.top }, /* @__PURE__ */ React.createElement(Image, { source: LEO_WAVING, style: styles.leo, resizeMode: "contain" }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, hasFriends ? "Add more friends" : "Learning is better with friends"), /* @__PURE__ */ React.createElement(Text, { style: styles.sub }, hasFriends ? "More friends, more races, more flames." : "Race each other, share a streak, keep each other honest."))), /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Share invite link", icon: /* @__PURE__ */ React.createElement(Feather, { name: "share", size: 18, color: "#FFFFFF" }), onPress: onShare }), /* @__PURE__ */ React.createElement(View, { style: styles.row }, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.small, onPress: onSearch, activeOpacity: 0.85, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Feather, { name: "search", size: 17, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.smallText }, "Search")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.small, onPress: onMyCode, activeOpacity: 0.85, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "qrcode", size: 18, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.smallText }, "My code"))));
}
const styles = StyleSheet.create({
  card: { borderRadius: 22, padding: 16, gap: 12, marginBottom: 16, backgroundColor: COLORS.bg2, borderWidth: 2, borderBottomWidth: 5, borderColor: COLORS.border },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  leo: { width: 72, height: 72 },
  title: { fontSize: 18, fontWeight: "900", color: COLORS.textPrimary },
  sub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3, lineHeight: 18 },
  row: { flexDirection: "row", gap: 10 },
  small: { flex: 1, height: 46, borderRadius: 14, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: COLORS.bg2 },
  smallText: { fontSize: 15, fontWeight: "800", color: COLORS.accent }
});
export {
  AddFriendsCard
};
