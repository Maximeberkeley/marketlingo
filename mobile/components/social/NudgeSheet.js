import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../lib/constants";
import { triggerHaptic } from "../../lib/haptics";
import { LeoAnimated } from "../mascot/LeoAnimated";
import { ChunkyButton } from "./ChunkyButton";
import { NUDGE_MESSAGES } from "../../lib/nudges";
const LEO_SASSY = require("../../assets/mascot/leo-sassy.png");
const LEO_SUCCESS = require("../../assets/mascot/leo-success.png");
function NudgeSheet({ target, onSend, onClose }) {
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState(null);
  const [status, setStatus] = useState("idle");
  useEffect(() => {
    setPicked(target?.options[0] ?? null);
    setStatus("idle");
  }, [target?.friendId]);
  if (!target) return null;
  const done = status === "sent" || status === "saved" || status === "already";
  const send = async () => {
    if (!picked || status === "sending") return;
    triggerHaptic("medium");
    setStatus("sending");
    const result = await onSend(target.friendId, picked);
    setStatus(result);
    if (result === "sent" || result === "saved") triggerHaptic("success");
  };
  return /* @__PURE__ */ React.createElement(Modal, { visible: true, transparent: true, animationType: "slide", onRequestClose: onClose }, /* @__PURE__ */ React.createElement(Pressable, { style: styles.backdrop, onPress: onClose, accessibilityLabel: "Close" }), /* @__PURE__ */ React.createElement(View, { style: [styles.sheet, { paddingBottom: insets.bottom + 16 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.handle }), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onClose, style: styles.close, accessibilityLabel: "Close" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 18, color: COLORS.textMuted })), done ? /* @__PURE__ */ React.createElement(View, { style: styles.doneWrap }, /* @__PURE__ */ React.createElement(LeoAnimated, { clip: "leo-success", size: 130, fallback: LEO_SUCCESS }), /* @__PURE__ */ React.createElement(Text, { style: styles.title }, status === "already" ? `You already nudged ${target.name} today` : "Nudge sent!"), status !== "already" && picked && /* @__PURE__ */ React.createElement(View, { style: styles.bubble }, /* @__PURE__ */ React.createElement(Text, { style: styles.bubbleText }, "\u201C", NUDGE_MESSAGES[picked], "\u201D")), /* @__PURE__ */ React.createElement(Text, { style: styles.sub }, status === "already" ? "One nudge a day, so it stays fun. Try again tomorrow." : `${target.name} gets it as a notification from you.`), /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Done", onPress: onClose, style: { alignSelf: "stretch", marginTop: 8 } })) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(View, { style: styles.head }, /* @__PURE__ */ React.createElement(LeoAnimated, { clip: "leo-encourage", size: 96, fallback: LEO_SASSY }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Nudge ", target.name), /* @__PURE__ */ React.createElement(Text, { style: styles.sub }, target.context))), /* @__PURE__ */ React.createElement(Text, { style: styles.pickLabel }, "Pick your message"), /* @__PURE__ */ React.createElement(ScrollView, { style: { maxHeight: 330 }, contentContainerStyle: { gap: 10, paddingBottom: 4 } }, target.options.map((id) => {
    const on = picked === id;
    return /* @__PURE__ */ React.createElement(
      Pressable,
      {
        key: id,
        onPress: () => {
          triggerHaptic("light");
          setPicked(id);
        },
        style: [styles.option, on && styles.optionOn],
        accessibilityRole: "radio",
        accessibilityState: { selected: on }
      },
      /* @__PURE__ */ React.createElement(Text, { style: [styles.optionText, on && styles.optionTextOn] }, NUDGE_MESSAGES[id]),
      /* @__PURE__ */ React.createElement(View, { style: [styles.radio, on && styles.radioOn] }, on && /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 13, color: "#FFFFFF" }))
    );
  })), (status === "error" || status === "offline") && /* @__PURE__ */ React.createElement(Text, { style: styles.error }, status === "offline" ? "Nudge not sent. Check your connection." : "Nudge not sent. Please try again."), /* @__PURE__ */ React.createElement(
    ChunkyButton,
    {
      label: `Send to ${target.name}`,
      icon: /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "hand-wave", size: 20, color: "#FFFFFF" }),
      onPress: () => {
        void send();
      },
      busy: status === "sending",
      disabled: !picked,
      style: { marginTop: 14 }
    }
  ))));
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(11, 16, 32, 0.55)" },
  sheet: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, width: "100%", maxWidth: 680, alignSelf: "center" },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.border, marginBottom: 6 },
  close: { position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.bg1, alignItems: "center", justifyContent: "center", zIndex: 2 },
  head: { flexDirection: "row", alignItems: "center", gap: 12, paddingRight: 36 },
  title: { fontSize: 22, fontWeight: "900", color: COLORS.textPrimary },
  sub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 3, lineHeight: 19 },
  pickLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 0.8, color: COLORS.textMuted, textTransform: "uppercase", marginTop: 14, marginBottom: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg2
  },
  optionOn: { borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },
  optionText: { flex: 1, fontSize: 15, fontWeight: "600", color: COLORS.textPrimary, lineHeight: 20 },
  optionTextOn: { color: COLORS.accentDark },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  radioOn: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  error: { fontSize: 13, fontWeight: "700", color: COLORS.error, marginTop: 10 },
  doneWrap: { alignItems: "center", gap: 8, paddingTop: 6 },
  bubble: { backgroundColor: COLORS.accentSoft, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1.5, borderColor: COLORS.accentMedium, marginTop: 4 },
  bubbleText: { fontSize: 15, fontWeight: "700", color: COLORS.accentDark, textAlign: "center", lineHeight: 21 }
});
export {
  NudgeSheet
};
