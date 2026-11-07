import React from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../lib/constants";
import { inviteUrl } from "../../lib/inviteLinks";
import { QRCode } from "./QRCode";
import { ChunkyButton } from "./ChunkyButton";
function MyCodeSheet({ code, visible, onShare, onClose }) {
  const insets = useSafeAreaInsets();
  if (!visible || !code) return null;
  return /* @__PURE__ */ React.createElement(Modal, { visible: true, transparent: true, animationType: "slide", onRequestClose: onClose }, /* @__PURE__ */ React.createElement(Pressable, { style: styles.backdrop, onPress: onClose, accessibilityLabel: "Close" }), /* @__PURE__ */ React.createElement(View, { style: [styles.sheet, { paddingBottom: insets.bottom + 16 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.handle }), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onClose, style: styles.close, accessibilityLabel: "Close" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 18, color: COLORS.textMuted })), /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Your friend code"), /* @__PURE__ */ React.createElement(Text, { style: styles.sub }, "Friends scan this with their camera to add you."), /* @__PURE__ */ React.createElement(View, { style: styles.qrCard }, /* @__PURE__ */ React.createElement(QRCode, { value: inviteUrl(code), size: 208 })), /* @__PURE__ */ React.createElement(View, { style: styles.ticket }, /* @__PURE__ */ React.createElement(Text, { style: styles.ticketLabel }, "CODE"), /* @__PURE__ */ React.createElement(Text, { style: styles.ticketCode, selectable: true }, code)), /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Share invite link", icon: /* @__PURE__ */ React.createElement(Feather, { name: "share", size: 18, color: "#FFFFFF" }), onPress: onShare, style: { alignSelf: "stretch" } })));
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(11, 16, 32, 0.55)" },
  sheet: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, gap: 12, width: "100%", maxWidth: 680, alignSelf: "center", alignItems: "center" },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.border },
  close: { position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.bg1, alignItems: "center", justifyContent: "center", zIndex: 2 },
  title: { fontSize: 22, fontWeight: "900", color: COLORS.textPrimary, marginTop: 4 },
  sub: { fontSize: 14, color: COLORS.textSecondary, marginTop: -6, textAlign: "center" },
  qrCard: { padding: 14, borderRadius: 24, backgroundColor: "#FFFFFF", borderWidth: 2, borderBottomWidth: 5, borderColor: COLORS.border },
  ticket: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, height: 52, borderRadius: 16, borderWidth: 2, borderStyle: "dashed", borderColor: COLORS.accent + "70", backgroundColor: COLORS.accentSoft },
  ticketLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2, color: COLORS.accent },
  ticketCode: { fontSize: 26, fontWeight: "900", letterSpacing: 5, color: COLORS.textPrimary }
});
export {
  MyCodeSheet
};
