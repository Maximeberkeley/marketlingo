import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../lib/constants";
import { getMarketName } from "../../lib/markets";
import { log } from "../../lib/logger";
import { SocialAvatar } from "./SocialAvatar";
function FindFriendsSheet({ visible, searchPeople, friendIds, sentRequests, incomingRequests = [], incomingFromIds, myCode, busyId, onAdd, onAccept, onDecline, onCancelSent, onRedeem, onScan, onShare, onClose }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [codeNote, setCodeNote] = useState(null);
  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      setCode("");
      setCodeNote(null);
    }
  }, [visible]);
  const seqRef = useRef(0);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError(false);
      return;
    }
    const seq = ++seqRef.current;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const found = await searchPeople(q);
        if (seq !== seqRef.current) return;
        setResults(found);
        setSearchError(false);
      } catch (err) {
        if (seq !== seqRef.current) return;
        log.warn("Friend search failed", err);
        setResults([]);
        setSearchError(true);
      } finally {
        if (seq === seqRef.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, searchPeople]);
  const redeem = async () => {
    if (redeeming || code.trim().length < 4) return;
    setRedeeming(true);
    const note = await onRedeem(code);
    setRedeeming(false);
    setCodeNote(note);
    if (note.ok) setCode("");
  };
  if (!visible) return null;
  const typing = query.trim().length >= 2;
  return /* @__PURE__ */ React.createElement(Modal, { visible: true, transparent: true, animationType: "slide", onRequestClose: onClose }, /* @__PURE__ */ React.createElement(Pressable, { style: styles.backdrop, onPress: onClose, accessibilityLabel: "Close" }), /* @__PURE__ */ React.createElement(View, { style: styles.kav, pointerEvents: "box-none" }, /* @__PURE__ */ React.createElement(View, { style: [styles.sheet, { paddingBottom: insets.bottom + 12 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.handle }), /* @__PURE__ */ React.createElement(View, { style: styles.head }, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Find friends"), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onClose, style: styles.close, accessibilityLabel: "Close" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 18, color: COLORS.textMuted }))), /* @__PURE__ */ React.createElement(View, { style: styles.search }, /* @__PURE__ */ React.createElement(Feather, { name: "search", size: 18, color: COLORS.textMuted }), /* @__PURE__ */ React.createElement(
    TextInput,
    {
      style: styles.searchInput,
      placeholder: "Name or friend code",
      placeholderTextColor: COLORS.textMuted,
      value: query,
      onChangeText: setQuery,
      autoCapitalize: "none",
      autoCorrect: false,
      returnKeyType: "search",
      clearButtonMode: "while-editing"
    }
  ), searching && /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "small", color: COLORS.accent })), /* @__PURE__ */ React.createElement(ScrollView, { style: { flex: 1 }, contentContainerStyle: { gap: 8, paddingBottom: 8 }, keyboardShouldPersistTaps: "handled", keyboardDismissMode: "on-drag", automaticallyAdjustKeyboardInsets: true }, typing ? searchError ? /* @__PURE__ */ React.createElement(Text, { style: styles.note }, "Search is unavailable right now. Please try again.") : !searching && results.length === 0 ? /* @__PURE__ */ React.createElement(View, { style: styles.empty }, /* @__PURE__ */ React.createElement(Text, { style: styles.note }, "No one found with that name. Send them your link instead."), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.linkBtn, onPress: onShare }, /* @__PURE__ */ React.createElement(Feather, { name: "share", size: 15, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.linkBtnText }, "Share invite link"))) : results.map((p) => {
    const isFriend = friendIds.has(p.id);
    const sent = sentRequests.some((r) => r.toUserId === p.id);
    const incoming = incomingFromIds.has(p.id);
    return /* @__PURE__ */ React.createElement(View, { key: p.id, style: styles.row }, /* @__PURE__ */ React.createElement(SocialAvatar, { name: p.displayName, size: 44 }), /* @__PURE__ */ React.createElement(View, { style: styles.rowInfo }, /* @__PURE__ */ React.createElement(Text, { style: styles.rowName, numberOfLines: 1 }, p.displayName), /* @__PURE__ */ React.createElement(Text, { style: styles.rowMeta, numberOfLines: 1 }, [p.selectedMarket ? getMarketName(p.selectedMarket) : null, p.friendCode].filter(Boolean).join(" \xB7 "))), isFriend ? /* @__PURE__ */ React.createElement(Text, { style: styles.friends }, "Friends") : busyId === p.id ? /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "small", color: COLORS.accent }) : /* @__PURE__ */ React.createElement(TouchableOpacity, { style: [styles.add, sent && styles.addGhost], onPress: () => onAdd(p), accessibilityLabel: sent ? `Cancel request to ${p.displayName}` : `Add ${p.displayName}` }, !sent && /* @__PURE__ */ React.createElement(Feather, { name: incoming ? "check" : "user-plus", size: 15, color: "#FFFFFF" }), /* @__PURE__ */ React.createElement(Text, { style: sent ? styles.addGhostText : styles.addText }, sent ? "Requested" : incoming ? "Accept" : "Add")));
  }) : /* @__PURE__ */ React.createElement(React.Fragment, null, incomingRequests.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: styles.label }, incomingRequests.length === 1 ? "Friend request" : `${incomingRequests.length} friend requests`), incomingRequests.map((r) => /* @__PURE__ */ React.createElement(View, { key: r.id, style: styles.row }, /* @__PURE__ */ React.createElement(SocialAvatar, { name: r.fromUsername, size: 44, ring: COLORS.accent }), /* @__PURE__ */ React.createElement(View, { style: styles.rowInfo }, /* @__PURE__ */ React.createElement(Text, { style: styles.rowName, numberOfLines: 1 }, r.fromUsername), /* @__PURE__ */ React.createElement(Text, { style: styles.rowMeta, numberOfLines: 1 }, r.fromMarket ? getMarketName(r.fromMarket) : "Wants to be friends")), busyId === r.id ? /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "small", color: COLORS.accent }) : /* @__PURE__ */ React.createElement(React.Fragment, null, onDecline && /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.decline, onPress: () => onDecline(r.id), accessibilityLabel: `Decline ${r.fromUsername}` }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 17, color: COLORS.textMuted })), onAccept && /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.add, onPress: () => onAccept(r.id), accessibilityLabel: `Accept ${r.fromUsername}` }, /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 15, color: "#FFFFFF" }), /* @__PURE__ */ React.createElement(Text, { style: styles.addText }, "Accept"))))), /* @__PURE__ */ React.createElement(View, { style: styles.divider })), /* @__PURE__ */ React.createElement(Text, { style: styles.label }, "Have a friend's code?"), /* @__PURE__ */ React.createElement(View, { style: styles.codeRow }, /* @__PURE__ */ React.createElement(
    TextInput,
    {
      style: styles.codeInput,
      placeholder: "ABC123",
      placeholderTextColor: COLORS.textMuted,
      value: code,
      onChangeText: (t) => {
        setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, ""));
        setCodeNote(null);
      },
      autoCapitalize: "characters",
      autoCorrect: false,
      maxLength: 12,
      returnKeyType: "done",
      onSubmitEditing: redeem
    }
  ), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: [styles.add, code.trim().length < 4 && { opacity: 0.4 }], onPress: redeem, disabled: code.trim().length < 4 || redeeming, accessibilityLabel: "Add friend by code" }, redeeming ? /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "small", color: "#FFFFFF" }) : /* @__PURE__ */ React.createElement(Text, { style: styles.addText }, "Add")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.scan, onPress: onScan, accessibilityRole: "button", accessibilityLabel: "Scan a friend's code" }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "qrcode-scan", size: 20, color: COLORS.accent }))), !!codeNote && /* @__PURE__ */ React.createElement(Text, { style: [styles.note, { color: codeNote.ok ? COLORS.success : COLORS.error }] }, codeNote.message), /* @__PURE__ */ React.createElement(Text, { style: [styles.label, { marginTop: 10 }] }, "Your code"), /* @__PURE__ */ React.createElement(View, { style: styles.mine }, /* @__PURE__ */ React.createElement(Text, { style: styles.mineCode, selectable: true }, myCode || "\xB7\xB7\xB7\xB7\xB7\xB7"), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: [styles.linkBtn, styles.mineShare], onPress: onShare, accessibilityRole: "button", accessibilityLabel: "Share invite link" }, /* @__PURE__ */ React.createElement(Feather, { name: "share", size: 15, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.linkBtnText }, "Share invite link"))), sentRequests.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: [styles.label, { marginTop: 10 }] }, "Waiting for them to accept"), sentRequests.map((r) => /* @__PURE__ */ React.createElement(View, { key: r.id, style: styles.row }, /* @__PURE__ */ React.createElement(SocialAvatar, { name: r.toUsername, size: 40, dashed: true }), /* @__PURE__ */ React.createElement(View, { style: styles.rowInfo }, /* @__PURE__ */ React.createElement(Text, { style: styles.rowName, numberOfLines: 1 }, r.toUsername), /* @__PURE__ */ React.createElement(Text, { style: styles.rowMeta, numberOfLines: 1 }, r.toMarket ? getMarketName(r.toMarket) : "Request sent")), busyId === r.id ? /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "small", color: COLORS.accent }) : /* @__PURE__ */ React.createElement(TouchableOpacity, { style: [styles.add, styles.addGhost], onPress: () => onCancelSent(r.id), accessibilityLabel: `Cancel request to ${r.toUsername}` }, /* @__PURE__ */ React.createElement(Text, { style: styles.addGhostText }, "Cancel"))))))))));
}
const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(11, 16, 32, 0.55)" },
  kav: { flex: 1, justifyContent: "flex-end" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 6 },
  decline: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  mine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingHorizontal: 14, height: 56, borderRadius: 16, backgroundColor: COLORS.bg1 },
  mineShare: { alignSelf: "center", flexShrink: 0 },
  mineCode: { fontSize: 20, fontWeight: "900", letterSpacing: 3, color: COLORS.textPrimary },
  sheet: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, gap: 12, width: "100%", maxWidth: 680, alignSelf: "center", height: "88%" },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.border },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "900", color: COLORS.textPrimary },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.bg1, alignItems: "center", justifyContent: "center" },
  search: { flexDirection: "row", alignItems: "center", gap: 10, height: 52, borderRadius: 16, paddingHorizontal: 14, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.bg1 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 16, color: COLORS.textPrimary, height: "100%" },
  label: { fontSize: 12, fontWeight: "800", letterSpacing: 0.8, color: COLORS.textMuted, textTransform: "uppercase" },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  codeInput: { flex: 1, minWidth: 0, height: 50, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, paddingHorizontal: 14, fontSize: 18, fontWeight: "800", letterSpacing: 3, color: COLORS.textPrimary },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  rowMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  add: { flexDirection: "row", alignItems: "center", gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 12, backgroundColor: COLORS.accentFill },
  addText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  scan: { width: 50, height: 50, borderRadius: 14, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border, backgroundColor: COLORS.bg2, alignItems: "center", justifyContent: "center" },
  addGhost: { backgroundColor: COLORS.bg2, borderWidth: 2, borderColor: COLORS.border },
  addGhostText: { fontSize: 13, fontWeight: "800", color: COLORS.textSecondary },
  friends: { fontSize: 13, fontWeight: "800", color: COLORS.success },
  note: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  empty: { gap: 10, paddingVertical: 8 },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, height: 38, borderRadius: 12, backgroundColor: COLORS.accentSoft },
  linkBtnText: { fontSize: 14, fontWeight: "800", color: COLORS.accent }
});
export {
  FindFriendsSheet
};
