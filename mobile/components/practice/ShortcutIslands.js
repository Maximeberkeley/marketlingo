import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../lib/constants";
import { triggerHaptic } from "../../lib/haptics";
const SHORTCUTS = [
  { id: "leo-call", title: "Call Leo", description: "Three minutes on today\u2019s lesson.", icon: "phone", path: "/leo-call", tint: ["#8B5CF6", "#6D28D9"] },
  { id: "leaderboard", title: "League", description: "Your rank this month.", icon: "award", path: "/leaderboard", tint: ["#F59E0B", "#D97706"] },
  { id: "friends", title: "Friends", description: "See how your friends are doing.", icon: "users", path: "/friends", tint: ["#0EA5E9", "#0369A1"] },
  { id: "deliverable", title: "Brief", description: "Your Interview Brief.", icon: "file-text", path: "/deliverable", tint: ["#10B981", "#047857"] },
  { id: "daily-leo", title: "Check-in", description: "Leo\u2019s daily question.", icon: "sun", path: "/daily-leo", tint: ["#F472B6", "#DB2777"] }
];
const DEFAULT_IDS = ["leo-call", "leaderboard", "deliverable"];
const KEY = "@marketlingo/practice_shortcuts_v2";
function useShortcuts() {
  const [ids, setIds] = useState(DEFAULT_IDS);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      try {
        if (raw) setIds(JSON.parse(raw).filter((id) => SHORTCUTS.some((s) => s.id === id)));
      } catch {
      }
    }).catch(() => {
    });
  }, []);
  const save = (next) => {
    setIds(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {
    });
  };
  return {
    ids,
    add: (id) => {
      if (!ids.includes(id)) save([...ids, id]);
    },
    remove: (id) => save(ids.filter((x) => x !== id))
  };
}
function GlassTile({ s, size }) {
  const r = size * 0.28;
  return /* @__PURE__ */ React.createElement(View, { style: [styles.tileShadow, { width: size, height: size, borderRadius: r, shadowColor: s.tint[1] }] }, /* @__PURE__ */ React.createElement(LinearGradient, { colors: s.tint, start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, style: [styles.tile, { borderRadius: r }] }, /* @__PURE__ */ React.createElement(
    LinearGradient,
    {
      colors: ["rgba(255,255,255,0.42)", "rgba(255,255,255,0.06)"],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      style: [styles.sheen, { borderTopLeftRadius: r, borderTopRightRadius: r }]
    }
  ), /* @__PURE__ */ React.createElement(Feather, { name: s.icon, size: size * 0.4, color: "#FFFFFF" })));
}
function ShortcutRow({ ids, editing, setEditing, onRemove, onAdd }) {
  const items = ids.map((id) => SHORTCUTS.find((s) => s.id === id)).filter(Boolean);
  const canAdd = items.length < SHORTCUTS.length;
  return /* @__PURE__ */ React.createElement(View, { style: styles.dock }, /* @__PURE__ */ React.createElement(View, { style: styles.dockHeader }, /* @__PURE__ */ React.createElement(Text, { style: styles.dockTitle }, "Shortcuts"), editing ? /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => setEditing(false), hitSlop: { top: 10, bottom: 10, left: 10, right: 10 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.dockAction }, "Done")) : items.length ? /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => {
    triggerHaptic("light");
    setEditing(true);
  }, hitSlop: { top: 10, bottom: 10, left: 10, right: 10 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.dockAction }, "Edit")) : null), /* @__PURE__ */ React.createElement(View, { style: styles.row }, items.map((s) => /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      key: s.id,
      style: styles.item,
      activeOpacity: 0.85,
      accessibilityLabel: s.title,
      onLongPress: () => {
        triggerHaptic("medium");
        setEditing(true);
      },
      onPress: () => {
        if (editing) {
          setEditing(false);
          return;
        }
        triggerHaptic("light");
        router.push(s.path);
      }
    },
    /* @__PURE__ */ React.createElement(GlassTile, { s, size: 60 }),
    /* @__PURE__ */ React.createElement(Text, { style: styles.label, numberOfLines: 1 }, s.title),
    editing ? /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.minus, accessibilityLabel: `Remove ${s.title}`, hitSlop: { top: 8, bottom: 8, left: 8, right: 8 }, onPress: () => {
      triggerHaptic("light");
      onRemove(s.id);
    } }, /* @__PURE__ */ React.createElement(View, { style: styles.minusBar })) : null
  )), canAdd && !editing ? /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.item, activeOpacity: 0.85, accessibilityLabel: "Add shortcut", onPress: () => {
    triggerHaptic("light");
    onAdd();
  } }, /* @__PURE__ */ React.createElement(View, { style: styles.addTile }, /* @__PURE__ */ React.createElement(Feather, { name: "plus", size: 24, color: COLORS.accent })), /* @__PURE__ */ React.createElement(Text, { style: [styles.label, { color: COLORS.textSecondary }], numberOfLines: 1 }, "Add")) : null));
}
function ShortcutGallery({ visible, ids, onAdd, onRemove, onClose }) {
  const insets = useSafeAreaInsets();
  return /* @__PURE__ */ React.createElement(Modal, { visible, animationType: "slide", presentationStyle: "pageSheet", onRequestClose: onClose }, /* @__PURE__ */ React.createElement(View, { style: [styles.sheet, { paddingBottom: insets.bottom + 20 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.grabber }), /* @__PURE__ */ React.createElement(View, { style: styles.sheetHeader }, /* @__PURE__ */ React.createElement(Text, { style: styles.sheetTitle }, "Shortcuts"), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onClose, hitSlop: { top: 10, bottom: 10, left: 10, right: 10 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.done }, "Done"))), /* @__PURE__ */ React.createElement(Text, { style: styles.sheetSub }, "Choose what sits at the top of Practice."), /* @__PURE__ */ React.createElement(ScrollView, { contentContainerStyle: styles.list, showsVerticalScrollIndicator: false }, SHORTCUTS.map((s) => {
    const added = ids.includes(s.id);
    return /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        key: s.id,
        style: styles.listRow,
        activeOpacity: 0.85,
        onPress: () => {
          triggerHaptic("light");
          added ? onRemove(s.id) : onAdd(s.id);
        }
      },
      /* @__PURE__ */ React.createElement(GlassTile, { s, size: 52 }),
      /* @__PURE__ */ React.createElement(View, { style: styles.listCopy }, /* @__PURE__ */ React.createElement(Text, { style: styles.listTitle }, s.title), /* @__PURE__ */ React.createElement(Text, { style: styles.listDesc, numberOfLines: 1 }, s.description)),
      /* @__PURE__ */ React.createElement(View, { style: [styles.toggle, added && styles.toggleOn] }, /* @__PURE__ */ React.createElement(Feather, { name: added ? "check" : "plus", size: 16, color: added ? "#FFFFFF" : COLORS.accent }))
    );
  }))));
}
const styles = StyleSheet.create({
  dock: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#1E1B4B",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  dockHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingHorizontal: 2 },
  dockTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3, color: COLORS.textSecondary },
  dockAction: { fontSize: 14, fontWeight: "700", color: COLORS.accent },
  row: { flexDirection: "row", flexWrap: "wrap", rowGap: 14 },
  item: { alignItems: "center", width: "25%" },
  tileShadow: { shadowOpacity: 0.32, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  tile: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
  sheen: { position: "absolute", top: 0, left: 0, right: 0, height: "52%" },
  addTile: {
    width: 60,
    height: 60,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.accentMedium,
    backgroundColor: COLORS.accentSoft
  },
  label: { fontSize: 12, fontWeight: "600", color: COLORS.textPrimary, marginTop: 7 },
  minus: {
    position: "absolute",
    top: -6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.error,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bg2
  },
  minusBar: { width: 10, height: 2, borderRadius: 1, backgroundColor: "#FFFFFF" },
  sheet: { flex: 1, backgroundColor: COLORS.bg1, paddingTop: 10 },
  grabber: { alignSelf: "center", width: 38, height: 5, borderRadius: 3, backgroundColor: COLORS.border, marginBottom: 14 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20 },
  sheetTitle: { fontSize: 26, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -0.4 },
  done: { fontSize: 16, fontWeight: "700", color: COLORS.accent },
  sheetSub: { fontSize: 15, color: COLORS.textSecondary, paddingHorizontal: 20, marginTop: 4, marginBottom: 18 },
  list: { paddingHorizontal: 16, gap: 10 },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  listCopy: { flex: 1 },
  listTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  listDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  toggle: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.accentSoft },
  toggleOn: { backgroundColor: COLORS.accent }
});
export {
  SHORTCUTS,
  ShortcutGallery,
  ShortcutRow,
  useShortcuts
};
