import React, { useState } from "react";
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { resetIndustryForSwitch, switchIndustryCopy } from "../../lib/switchIndustry";
import { triggerHaptic } from "../../lib/haptics";
function SwitchIndustryModal({ visible, userId, marketId, marketName, onClose }) {
  const [busy, setBusy] = useState(false);
  const copy = switchIndustryCopy(marketName);
  const confirm = async () => {
    if (!userId || !marketId || busy) return;
    triggerHaptic("medium");
    setBusy(true);
    const saved = await resetIndustryForSwitch(userId, marketId).catch(() => false);
    setBusy(false);
    if (!saved) {
      Alert.alert("Could not switch industry", "Check your connection and try again. Nothing was changed.");
      return;
    }
    onClose();
    router.replace("/onboarding");
  };
  return /* @__PURE__ */ React.createElement(Modal, { visible, transparent: true, animationType: "fade", onRequestClose: onClose }, /* @__PURE__ */ React.createElement(View, { style: styles.overlay }, /* @__PURE__ */ React.createElement(View, { style: styles.card, accessibilityViewIsModal: true }, /* @__PURE__ */ React.createElement(Feather, { name: "alert-circle", size: 28, color: COLORS.accent, style: styles.icon }), /* @__PURE__ */ React.createElement(Text, { style: styles.title }, copy.title), /* @__PURE__ */ React.createElement(Text, { style: styles.body }, copy.body), /* @__PURE__ */ React.createElement(View, { style: styles.actions }, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.cancel, onPress: onClose, disabled: busy, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.cancelText }, "Cancel")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.destructive, onPress: confirm, disabled: busy, accessibilityRole: "button" }, busy ? /* @__PURE__ */ React.createElement(ActivityIndicator, { color: "#FFFFFF" }) : /* @__PURE__ */ React.createElement(Text, { style: styles.destructiveText }, copy.confirm))))));
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(11, 16, 32, 0.9)", justifyContent: "center", alignItems: "center", padding: 24 },
  card: { backgroundColor: COLORS.bg2, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border, width: "100%", maxWidth: 420 },
  icon: { alignSelf: "center", marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center", marginBottom: 8 },
  body: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginBottom: 20, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 12 },
  cancel: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: COLORS.bg1, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary },
  destructive: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center" },
  destructiveText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" }
});
export {
  SwitchIndustryModal
};
