import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../lib/constants";
import { triggerHaptic } from "../../lib/haptics";
import { inviteAppUrl } from "../../lib/inviteLinks";
import { LeoAnimated } from "../mascot/LeoAnimated";
import { QRCode } from "./QRCode";
import { QRScanner } from "./QRScanner";
import { ChunkyButton } from "./ChunkyButton";
const LEO_SUCCESS = require("../../assets/mascot/leo-success.png");
const QR_SIZE = 208;
const WINDOW = QR_SIZE + 28 + 4;
function MyCodeSheet({ code, visible, initialTab = "code", onShare, onRedeem, onClose }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState(initialTab);
  const [scan, setScan] = useState({ kind: "scanning" });
  useEffect(() => {
    if (visible) {
      setTab(initialTab);
      setScan({ kind: "scanning" });
    }
  }, [visible, initialTab]);
  if (!visible || !code) return null;
  const pick = (next) => {
    if (next === tab) return;
    triggerHaptic("light");
    setTab(next);
    setScan({ kind: "scanning" });
  };
  const onCode = async (scanned) => {
    if (scanned === code) {
      triggerHaptic("warning");
      setScan({ kind: "scanning", note: { text: "That's your own code. Scan a friend's.", bad: true } });
      return;
    }
    triggerHaptic("medium");
    setScan({ kind: "adding" });
    const result = await onRedeem(scanned);
    if (result.ok) {
      triggerHaptic("success");
      setScan({ kind: "added", message: result.message });
    } else {
      triggerHaptic("warning");
      setScan({ kind: "scanning", note: { text: result.message, bad: true } });
    }
  };
  const onNotOurs = () => setScan({ kind: "scanning", note: { text: "That's not a MarketLingo code.", bad: true } });
  return /* @__PURE__ */ React.createElement(Modal, { visible: true, transparent: true, animationType: "slide", onRequestClose: onClose }, /* @__PURE__ */ React.createElement(Pressable, { style: styles.backdrop, onPress: onClose, accessibilityLabel: "Close" }), /* @__PURE__ */ React.createElement(View, { style: [styles.sheet, { paddingBottom: insets.bottom + 16 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.handle }), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onClose, style: styles.close, accessibilityLabel: "Close" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 18, color: COLORS.textMuted })), /* @__PURE__ */ React.createElement(View, { style: styles.tabs, accessibilityRole: "tablist" }, [["code", "My code", "qrcode"], ["scan", "Scan", "qrcode-scan"]].map(([id, label, icon]) => {
    const on = tab === id;
    return /* @__PURE__ */ React.createElement(Pressable, { key: id, onPress: () => pick(id), style: [styles.tab, on && styles.tabOn], accessibilityRole: "tab", accessibilityState: { selected: on } }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: icon, size: 18, color: on ? "#FFFFFF" : COLORS.textSecondary }), /* @__PURE__ */ React.createElement(Text, { style: [styles.tabText, on && styles.tabTextOn] }, label));
  })), tab === "code" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: styles.sub }, "Friends scan this to add you."), /* @__PURE__ */ React.createElement(View, { style: styles.qrCard }, /* @__PURE__ */ React.createElement(QRCode, { value: inviteAppUrl(code), size: QR_SIZE })), /* @__PURE__ */ React.createElement(View, { style: styles.ticket }, /* @__PURE__ */ React.createElement(Text, { style: styles.ticketLabel }, "CODE"), /* @__PURE__ */ React.createElement(Text, { style: styles.ticketCode, selectable: true }, code)), /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Share invite link", icon: /* @__PURE__ */ React.createElement(Feather, { name: "share", size: 18, color: "#FFFFFF" }), onPress: onShare, style: { alignSelf: "stretch" } })) : scan.kind === "added" ? /* @__PURE__ */ React.createElement(View, { style: [styles.added, { minHeight: WINDOW + 64 }] }, /* @__PURE__ */ React.createElement(LeoAnimated, { clip: "leo-success", size: 140, fallback: LEO_SUCCESS }), /* @__PURE__ */ React.createElement(Text, { style: styles.addedTitle }, scan.message), /* @__PURE__ */ React.createElement(Text, { style: styles.sub }, "Race them, start a streak, or go take the crown."), /* @__PURE__ */ React.createElement(View, { style: styles.addedActions }, /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Scan another", tone: "plain", onPress: () => setScan({ kind: "scanning" }), height: 48, style: { flex: 1 } }), /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Done", onPress: onClose, height: 48, style: { flex: 1 } }))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: styles.sub }, "Point your camera at a friend's code."), /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(QRScanner, { size: WINDOW, paused: scan.kind === "adding", onCode: (c) => {
    void onCode(c);
  }, onNotOurs }), scan.kind === "adding" && /* @__PURE__ */ React.createElement(View, { style: styles.adding, pointerEvents: "none" }, /* @__PURE__ */ React.createElement(ActivityIndicator, { color: "#FFFFFF", size: "large" }), /* @__PURE__ */ React.createElement(Text, { style: styles.addingText }, "Adding your friend\u2026"))), /* @__PURE__ */ React.createElement(Text, { style: [styles.note, scan.kind === "scanning" && scan.note?.bad && styles.noteBad], numberOfLines: 2 }, scan.kind === "scanning" && scan.note ? scan.note.text : "Their code is on their Profile, under their name."), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onShare, style: styles.shareLink, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.shareLinkText }, "Friend doesn't have the app? ", /* @__PURE__ */ React.createElement(Text, { style: styles.shareLinkStrong }, "Send an invite"))))));
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(11, 16, 32, 0.55)" },
  sheet: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, gap: 12, width: "100%", maxWidth: 680, alignSelf: "center", alignItems: "center" },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.border },
  close: { position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.bg1, alignItems: "center", justifyContent: "center", zIndex: 2 },
  tabs: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 16, backgroundColor: COLORS.bg1, borderWidth: 2, borderColor: COLORS.border, marginTop: 4 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, height: 40, paddingHorizontal: 18, borderRadius: 12 },
  tabOn: { backgroundColor: COLORS.accent },
  tabText: { fontSize: 15, fontWeight: "800", color: COLORS.textSecondary },
  tabTextOn: { color: "#FFFFFF" },
  sub: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  qrCard: { padding: 14, borderRadius: 24, backgroundColor: "#FFFFFF", borderWidth: 2, borderBottomWidth: 5, borderColor: COLORS.border },
  ticket: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, height: 52, borderRadius: 16, borderWidth: 2, borderStyle: "dashed", borderColor: COLORS.accent + "70", backgroundColor: COLORS.accentSoft },
  ticketLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2, color: COLORS.accent },
  ticketCode: { fontSize: 26, fontWeight: "900", letterSpacing: 5, color: COLORS.textPrimary },
  adding: { ...StyleSheet.absoluteFillObject, borderRadius: 24, backgroundColor: "rgba(11, 16, 32, 0.6)", alignItems: "center", justifyContent: "center", gap: 10 },
  addingText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  note: { fontSize: 13, fontWeight: "500", color: COLORS.textMuted, textAlign: "center", minHeight: 36, paddingHorizontal: 12 },
  noteBad: { fontWeight: "800", color: COLORS.error },
  shareLink: { paddingVertical: 6 },
  shareLinkText: { fontSize: 14, color: COLORS.textSecondary },
  shareLinkStrong: { fontWeight: "800", color: COLORS.accent },
  added: { alignSelf: "stretch", alignItems: "center", justifyContent: "center", gap: 8 },
  addedTitle: { fontSize: 22, fontWeight: "900", color: COLORS.textPrimary, textAlign: "center", paddingHorizontal: 8 },
  addedActions: { flexDirection: "row", gap: 10, alignSelf: "stretch", marginTop: 8 }
});
export {
  MyCodeSheet
};
