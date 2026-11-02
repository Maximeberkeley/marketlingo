"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var notebook_exports = {};
__export(notebook_exports, {
  default: () => NotebookScreen
});
module.exports = __toCommonJS(notebook_exports);
var import_react = __toESM(require("react"));
var import_react_native = require("react-native");
var import_react_native_safe_area_context = require("react-native-safe-area-context");
var import_expo_router = require("expo-router");
var import_constants = require("../../lib/constants");
var import_supabase = require("../../lib/supabase");
var import_useAuth = require("../../hooks/useAuth");
var import_vector_icons = require("@expo/vector-icons");
var import_haptics = require("../../lib/haptics");
var import_LeoAnimated = require("../../components/mascot/LeoAnimated");
const { width: SCREEN_WIDTH } = import_react_native.Dimensions.get("window");
function getLinkedType(label) {
  if (!label) return "lesson";
  const lower = label.toLowerCase();
  if (lower.includes("interview")) return "interview";
  if (lower.includes("news") || lower.includes("daily")) return "news";
  if (lower.includes("trainer")) return "trainer";
  if (lower.includes("personal")) return "personal";
  return "lesson";
}
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = /* @__PURE__ */ new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function groupNotesByDate(notes) {
  const groups = {};
  notes.forEach((note) => {
    const key = formatDate(note.created_at);
    if (!groups[key]) groups[key] = [];
    groups[key].push(note);
  });
  return groups;
}
const CATEGORIES = [
  { id: "all", label: "All", icon: "layers", color: import_constants.COLORS.accent },
  { id: "lesson", label: "Lessons", icon: "book-open", color: "#8B5CF6" },
  { id: "trainer", label: "Trainer", icon: "target", color: "#F59E0B" },
  { id: "news", label: "News", icon: "file-text", color: "#3B82F6" },
  { id: "personal", label: "Personal", icon: "edit-3", color: "#10B981" }
];
const TYPE_CONFIG = {
  lesson: { icon: "book-open", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", label: "Lesson" },
  news: { icon: "file-text", color: "#3B82F6", bg: "rgba(59,130,246,0.12)", label: "News" },
  trainer: { icon: "target", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", label: "Trainer" },
  personal: { icon: "edit-3", color: "#10B981", bg: "rgba(16,185,129,0.12)", label: "Personal" }
};
function computeNoteStreak(notes) {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 864e5;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const thisWeek = [];
  for (let d = 0; d < 7; d++) {
    const day = new Date(weekStart.getTime() + d * dayMs);
    const dayStr = day.toDateString();
    if (notes.some((n) => new Date(n.created_at).toDateString() === dayStr)) {
      thisWeek.push(d);
    }
  }
  let streak = 0;
  let checkDate = new Date(today);
  const hasToday = notes.some((n) => new Date(n.created_at).toDateString() === today.toDateString());
  if (!hasToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  while (true) {
    const dayStr = checkDate.toDateString();
    if (notes.some((n) => new Date(n.created_at).toDateString() === dayStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return { current: streak, thisWeek };
}
function NoteCard({ note, onDelete, onOpen }) {
  const linkedType = getLinkedType(note.linked_label);
  const config = TYPE_CONFIG[linkedType] || TYPE_CONFIG.lesson;
  const scaleAnim = (0, import_react.useRef)(new import_react_native.Animated.Value(1)).current;
  const onPressIn = () => {
    import_react_native.Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 20 }).start();
  };
  const onPressOut = () => {
    import_react_native.Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }).start();
  };
  return /* @__PURE__ */ import_react.default.createElement(import_react_native.Animated.View, { style: { transform: [{ scale: scaleAnim }] } }, /* @__PURE__ */ import_react.default.createElement(
    import_react_native.TouchableOpacity,
    {
      style: styles.noteCard,
      activeOpacity: 0.9,
      onPressIn,
      onPressOut,
      onPress: () => onOpen(note),
      onLongPress: () => {
        (0, import_haptics.triggerHaptic)("warning");
        onDelete(note.id);
      }
    },
    /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: [styles.noteAccentLine, { backgroundColor: config.color }] }),
    /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.noteBody }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.noteHeader }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: [styles.noteIconCircle, { backgroundColor: config.bg }] }, /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: config.icon, size: 12, color: config.color })), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: [styles.noteTypeLabel, { color: config.color }] }, note.linked_label || config.label), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.noteTime }, formatTime(note.created_at))), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.noteContent, numberOfLines: 4 }, note.content), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.noteTapHint }, /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "maximize-2", size: 10, color: import_constants.COLORS.textMuted }), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.noteTapHintText }, "Tap to expand")))
  ));
}
function StreakWeekView({ streak, thisWeek, totalNotes }) {
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const today = (/* @__PURE__ */ new Date()).getDay();
  return /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.streakCard }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.streakTop }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.streakFlameWrap }, /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "edit-3", size: 20, color: import_constants.COLORS.accent })), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: { flex: 1 } }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.streakCount }, streak), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.streakLabel }, "day note streak")), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.streakStatPill }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.streakStatNum }, totalNotes), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.streakStatLabel }, "total"))), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.weekRow }, dayLabels.map((label, i) => {
    const isActive = thisWeek.includes(i);
    const isToday = i === today;
    return /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { key: i, style: styles.weekDay }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: [styles.weekDayLabel, isToday && styles.weekDayLabelToday] }, label), /* @__PURE__ */ import_react.default.createElement(
      import_react_native.View,
      {
        style: [
          styles.weekDot,
          isActive && styles.weekDotActive,
          isToday && !isActive && styles.weekDotToday
        ]
      },
      isActive && /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "check", size: 10, color: "#fff" })
    ));
  })), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.streakMotivation }, streak === 0 ? "Add a note today to start your streak!" : streak < 3 ? "Great start! Keep capturing insights daily." : streak < 7 ? "You're building a habit! Keep it up." : "Amazing streak! You're a knowledge machine."));
}
function NotebookScreen() {
  const insets = (0, import_react_native_safe_area_context.useSafeAreaInsets)();
  const { user } = (0, import_useAuth.useAuth)();
  const [notes, setNotes] = (0, import_react.useState)([]);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
  const [selectedCategory, setSelectedCategory] = (0, import_react.useState)("all");
  const [showAddNote, setShowAddNote] = (0, import_react.useState)(false);
  const [newNoteContent, setNewNoteContent] = (0, import_react.useState)("");
  const [selectedMarket, setSelectedMarket] = (0, import_react.useState)(null);
  const [showSearch, setShowSearch] = (0, import_react.useState)(false);
  const [openNote, setOpenNote] = (0, import_react.useState)(null);
  const [editingContent, setEditingContent] = (0, import_react.useState)("");
  const headerAnim = (0, import_react.useRef)(new import_react_native.Animated.Value(0)).current;
  (0, import_react.useEffect)(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: profile } = await import_supabase.supabase.from("profiles").select("selected_market").eq("id", user.id).single();
      if (profile?.selected_market) setSelectedMarket(profile.selected_market);
    };
    fetchData();
  }, [user]);
  (0, import_react.useEffect)(() => {
    const fetchNotes = async () => {
      if (!user || !selectedMarket) return;
      const { data, error } = await import_supabase.supabase.from("notes").select("*").eq("user_id", user.id).eq("market_id", selectedMarket).order("created_at", { ascending: false });
      if (!error) setNotes(data || []);
      setLoading(false);
      import_react_native.Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }).start();
    };
    if (selectedMarket) fetchNotes();
  }, [user, selectedMarket]);
  const handleDeleteNote = (0, import_react.useCallback)((noteId) => {
    if (!user) return;
    import_react_native.Alert.alert("Delete Note", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          (0, import_haptics.triggerHaptic)("warning");
          await import_supabase.supabase.from("notes").delete().eq("id", noteId).eq("user_id", user.id);
          setNotes((prev) => prev.filter((n) => n.id !== noteId));
        }
      }
    ]);
  }, [user]);
  const handleAddNote = async () => {
    if (!user || !newNoteContent.trim() || !selectedMarket) return;
    (0, import_haptics.triggerHaptic)("success");
    const { data, error } = await import_supabase.supabase.from("notes").insert({
      user_id: user.id,
      content: newNoteContent.trim(),
      linked_label: "Personal Note",
      market_id: selectedMarket
    }).select().single();
    if (!error && data) {
      setNotes((prev) => [data, ...prev]);
      setNewNoteContent("");
      setShowAddNote(false);
    }
  };
  const searchTerms = searchQuery.trim().split(/\s+/).filter((t) => t.length > 0).slice(0, 5);
  const filteredNotes = notes.filter((note) => {
    const matchesSearch = searchTerms.length === 0 || searchTerms.some((t) => note.content.toLowerCase().includes(t.toLowerCase()));
    const linkedType = getLinkedType(note.linked_label);
    const matchesFilter = selectedCategory === "all" || linkedType === selectedCategory;
    return matchesSearch && matchesFilter;
  });
  const termMatchCounts = searchTerms.map((term) => {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    return filteredNotes.reduce((sum, n) => sum + (n.content.match(re) || []).length, 0);
  });
  const groupedNotes = groupNotesByDate(filteredNotes);
  const { current: streak, thisWeek } = computeNoteStreak(notes);
  const categoryCounts = { all: notes.length };
  notes.forEach((n) => {
    const t = getLinkedType(n.linked_label);
    categoryCounts[t] = (categoryCounts[t] || 0) + 1;
  });
  if (loading) {
    return /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: [styles.container, styles.centered] }, /* @__PURE__ */ import_react.default.createElement(import_react_native.ActivityIndicator, { size: "large", color: import_constants.COLORS.accent }));
  }
  return /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.container }, /* @__PURE__ */ import_react.default.createElement(
    import_react_native.ScrollView,
    {
      contentContainerStyle: [
        styles.scrollContent,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }
      ],
      showsVerticalScrollIndicator: false,
      keyboardShouldPersistTaps: "handled"
    },
    /* @__PURE__ */ import_react.default.createElement(import_react_native.TouchableOpacity, { style: styles.backButton, onPress: () => import_expo_router.router.replace("/(tabs)/home"), activeOpacity: 0.75 }, /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "arrow-left", size: 20, color: import_constants.COLORS.textPrimary }), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.backText }, "Course")),
    /* @__PURE__ */ import_react.default.createElement(
      import_react_native.Animated.View,
      {
        style: [
          styles.header,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }]
          }
        ]
      },
      /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: { flex: 1 } }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.title }, "Your notes"), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.subtitle }, notes.length === 0 ? "Keep the ideas worth owning" : `${notes.length} idea${notes.length !== 1 ? "s" : ""} worth keeping`)),
      /* @__PURE__ */ import_react.default.createElement(
        import_react_native.TouchableOpacity,
        {
          style: styles.searchToggle,
          onPress: () => setShowSearch((s) => !s)
        },
        /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "search", size: 18, color: import_constants.COLORS.textSecondary })
      )
    ),
    showSearch && /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.searchContainer }, /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "search", size: 16, color: import_constants.COLORS.textMuted }), /* @__PURE__ */ import_react.default.createElement(
      import_react_native.TextInput,
      {
        style: styles.searchInput,
        placeholder: "Search your notes",
        placeholderTextColor: import_constants.COLORS.textMuted,
        value: searchQuery,
        onChangeText: setSearchQuery,
        autoFocus: true
      }
    ), searchQuery.length > 0 && /* @__PURE__ */ import_react.default.createElement(import_react_native.TouchableOpacity, { onPress: () => setSearchQuery("") }, /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "x", size: 16, color: import_constants.COLORS.textMuted }))),
    /* @__PURE__ */ import_react.default.createElement(
      import_react_native.ScrollView,
      {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        style: styles.categoryRow,
        contentContainerStyle: { gap: 8, paddingRight: 16 }
      },
      CATEGORIES.map((cat) => {
        const isActive = selectedCategory === cat.id;
        const count = categoryCounts[cat.id] || 0;
        return /* @__PURE__ */ import_react.default.createElement(
          import_react_native.TouchableOpacity,
          {
            key: cat.id,
            style: [styles.categoryChip, isActive && { backgroundColor: cat.color + "18", borderColor: cat.color + "40" }],
            onPress: () => {
              (0, import_haptics.triggerHaptic)("light");
              setSelectedCategory(cat.id);
            }
          },
          /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: cat.icon, size: 13, color: isActive ? cat.color : import_constants.COLORS.textMuted }),
          /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: [styles.categoryLabel, isActive && { color: cat.color, fontWeight: "600" }] }, cat.label),
          count > 0 && /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: [styles.categoryCount, isActive && { backgroundColor: cat.color + "20" }] }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: [styles.categoryCountText, isActive && { color: cat.color }] }, count))
        );
      })
    ),
    searchTerms.length > 1 && /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 } }, searchTerms.map((term, i) => {
      const chipColors = ["#EAB308", "#06B6D4", "#EC4899", "#22C55E", "#F97316"];
      const c = chipColors[i % chipColors.length];
      return /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { key: i, style: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: c + "40" } }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: { width: 6, height: 6, borderRadius: 3, backgroundColor: c } }), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: { fontSize: 11, fontWeight: "600", color: c } }, term), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: { fontSize: 10, color: c, opacity: 0.7 } }, "(", termMatchCounts[i], ")"));
    })),
    Object.keys(groupedNotes).length > 0 ? /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: { gap: 20 } }, Object.entries(groupedNotes).map(([date, dateNotes]) => /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { key: date }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.dateHeader }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.dateDot }), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.dateText }, date), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.dateCount }, dateNotes.length, " note", dateNotes.length !== 1 ? "s" : "")), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: { gap: 10 } }, dateNotes.map((note) => /* @__PURE__ */ import_react.default.createElement(NoteCard, { key: note.id, note, onDelete: handleDeleteNote, onOpen: (n) => {
      setOpenNote(n);
      setEditingContent(n.content);
    } })))))) : /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.emptyState }, /* @__PURE__ */ import_react.default.createElement(import_LeoAnimated.LeoAnimated, { clip: "leo-idle-loop", size: 160, fallback: "idle" }), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.emptyTitle }, searchQuery ? "No notes found" : "Start your notebook"), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.emptySubtitle }, searchQuery ? "Try a different search or category" : "Write one clear line in your own words. It will stay connected to your course."), !searchQuery && /* @__PURE__ */ import_react.default.createElement(
      import_react_native.TouchableOpacity,
      {
        style: styles.emptyCta,
        onPress: () => {
          (0, import_haptics.triggerHaptic)("medium");
          setShowAddNote(true);
        }
      },
      /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "edit-3", size: 16, color: "#fff" }),
      /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.emptyCtaText }, "Write your first note")
    ))
  ), notes.length > 0 && /* @__PURE__ */ import_react.default.createElement(
    import_react_native.TouchableOpacity,
    {
      style: [styles.fab, { bottom: insets.bottom + 80 }],
      onPress: () => {
        (0, import_haptics.triggerHaptic)("medium");
        setShowAddNote(true);
      },
      activeOpacity: 0.85
    },
    /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "plus", size: 24, color: "#fff" })
  ), /* @__PURE__ */ import_react.default.createElement(import_react_native.Modal, { visible: !!openNote, transparent: true, animationType: "slide" }, /* @__PURE__ */ import_react.default.createElement(
    import_react_native.KeyboardAvoidingView,
    {
      behavior: import_react_native.Platform.OS === "ios" ? "padding" : "height",
      style: { flex: 1 }
    },
    /* @__PURE__ */ import_react.default.createElement(
      import_react_native.TouchableOpacity,
      {
        style: styles.modalOverlay,
        activeOpacity: 1,
        onPress: () => setOpenNote(null)
      },
      /* @__PURE__ */ import_react.default.createElement(import_react_native.TouchableOpacity, { activeOpacity: 1, style: styles.detailCard }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.modalHandle }), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.modalHeader }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.modalIconCircle }, /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "file-text", size: 18, color: import_constants.COLORS.accent })), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: { flex: 1 } }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.modalTitle }, openNote?.linked_label || "Note"), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.modalSubtitle }, openNote ? formatDate(openNote.created_at) + " \u2022 " + formatTime(openNote.created_at) : "")), /* @__PURE__ */ import_react.default.createElement(
        import_react_native.TouchableOpacity,
        {
          onPress: () => {
            if (!openNote) return;
            (0, import_haptics.triggerHaptic)("warning");
            handleDeleteNote(openNote.id);
            setOpenNote(null);
          },
          style: styles.detailDeleteBtn
        },
        /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "trash-2", size: 16, color: "#EF4444" })
      )), /* @__PURE__ */ import_react.default.createElement(import_react_native.ScrollView, { style: styles.detailScroll, nestedScrollEnabled: true }, /* @__PURE__ */ import_react.default.createElement(
        import_react_native.TextInput,
        {
          style: styles.detailInput,
          value: editingContent,
          onChangeText: setEditingContent,
          multiline: true,
          textAlignVertical: "top",
          placeholder: "Your note...",
          placeholderTextColor: import_constants.COLORS.textMuted
        }
      )), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.modalActions }, /* @__PURE__ */ import_react.default.createElement(
        import_react_native.TouchableOpacity,
        {
          style: styles.modalCancel,
          onPress: () => setOpenNote(null)
        },
        /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.modalCancelText }, "Close")
      ), /* @__PURE__ */ import_react.default.createElement(
        import_react_native.TouchableOpacity,
        {
          style: [styles.modalSave, editingContent === openNote?.content && { opacity: 0.4 }],
          disabled: editingContent === openNote?.content,
          onPress: async () => {
            if (!openNote || !user) return;
            const { error } = await import_supabase.supabase.from("notes").update({ content: editingContent.trim() }).eq("id", openNote.id).eq("user_id", user.id);
            if (!error) {
              setNotes(
                (prev) => prev.map((n) => n.id === openNote.id ? { ...n, content: editingContent.trim() } : n)
              );
              (0, import_haptics.triggerHaptic)("success");
            }
            setOpenNote(null);
          }
        },
        /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "check", size: 16, color: "#fff" }),
        /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.modalSaveText }, "Save Changes")
      )))
    )
  )), /* @__PURE__ */ import_react.default.createElement(import_react_native.Modal, { visible: showAddNote, transparent: true, animationType: "slide" }, /* @__PURE__ */ import_react.default.createElement(
    import_react_native.KeyboardAvoidingView,
    {
      behavior: import_react_native.Platform.OS === "ios" ? "padding" : "height",
      style: { flex: 1 }
    },
    /* @__PURE__ */ import_react.default.createElement(
      import_react_native.TouchableOpacity,
      {
        style: styles.modalOverlay,
        activeOpacity: 1,
        onPress: () => {
          setShowAddNote(false);
          setNewNoteContent("");
        }
      },
      /* @__PURE__ */ import_react.default.createElement(import_react_native.TouchableOpacity, { activeOpacity: 1, style: styles.modalCard }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.modalHandle }), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.modalHeader }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.modalIconCircle }, /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "edit-3", size: 18, color: import_constants.COLORS.accent })), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, null, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.modalTitle }, "New Insight"), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.modalSubtitle }, "What did you learn?"))), /* @__PURE__ */ import_react.default.createElement(
        import_react_native.TextInput,
        {
          style: styles.modalInput,
          placeholder: "Write your insight, takeaway, or idea...",
          placeholderTextColor: import_constants.COLORS.textMuted,
          value: newNoteContent,
          onChangeText: setNewNoteContent,
          multiline: true,
          autoFocus: true,
          textAlignVertical: "top"
        }
      ), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.modalTip }, /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "info", size: 12, color: import_constants.COLORS.textMuted }), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.modalTipText }, `Great notes are specific. Try: "Key insight from today's lesson..."`)), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.modalActions }, /* @__PURE__ */ import_react.default.createElement(
        import_react_native.TouchableOpacity,
        {
          style: styles.modalCancel,
          onPress: () => {
            setShowAddNote(false);
            setNewNoteContent("");
          }
        },
        /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.modalCancelText }, "Cancel")
      ), /* @__PURE__ */ import_react.default.createElement(
        import_react_native.TouchableOpacity,
        {
          style: [styles.modalSave, !newNoteContent.trim() && { opacity: 0.4 }],
          onPress: handleAddNote,
          disabled: !newNoteContent.trim()
        },
        /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "check", size: 16, color: "#fff" }),
        /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.modalSaveText }, "Save")
      )))
    )
  )));
}
const styles = import_react_native.StyleSheet.create({
  container: { flex: 1, backgroundColor: import_constants.COLORS.bg0 },
  centered: { alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: 16 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", paddingVertical: 8, marginBottom: 8 },
  backText: { fontSize: 13, fontWeight: "700", color: import_constants.COLORS.textPrimary },
  // Header
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: import_constants.COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: import_constants.COLORS.textMuted, marginTop: 2 },
  searchToggle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: import_constants.COLORS.bg2,
    borderWidth: 1,
    borderColor: import_constants.COLORS.border,
    alignItems: "center",
    justifyContent: "center"
  },
  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: import_constants.COLORS.bg2,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: import_constants.COLORS.border
  },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: import_constants.COLORS.textPrimary },
  // Streak card
  streakCard: {
    backgroundColor: import_constants.COLORS.bg2,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: import_constants.COLORS.border,
    ...import_constants.SHADOWS.md
  },
  streakTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  streakFlameWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(139,92,246,0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  streakCount: { fontSize: 28, fontWeight: "800", color: import_constants.COLORS.accent, lineHeight: 32 },
  streakLabel: { fontSize: 12, color: import_constants.COLORS.textMuted, fontWeight: "500" },
  streakStatPill: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: import_constants.COLORS.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: import_constants.COLORS.border
  },
  streakStatNum: { fontSize: 18, fontWeight: "700", color: import_constants.COLORS.textPrimary },
  streakStatLabel: { fontSize: 10, color: import_constants.COLORS.textMuted, marginTop: 1 },
  weekRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  weekDay: { alignItems: "center", gap: 6, flex: 1 },
  weekDayLabel: { fontSize: 11, fontWeight: "500", color: import_constants.COLORS.textMuted },
  weekDayLabelToday: { color: import_constants.COLORS.accent, fontWeight: "700" },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: import_constants.COLORS.bg1,
    borderWidth: 1.5,
    borderColor: import_constants.COLORS.border,
    alignItems: "center",
    justifyContent: "center"
  },
  weekDotActive: { backgroundColor: import_constants.COLORS.accent, borderColor: import_constants.COLORS.accent },
  weekDotToday: { borderColor: import_constants.COLORS.accent, borderWidth: 2 },
  streakMotivation: { fontSize: 12, color: import_constants.COLORS.textMuted, textAlign: "center", lineHeight: 17 },
  // Category tabs
  categoryRow: { marginBottom: 18, flexGrow: 0 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: import_constants.COLORS.bg2,
    borderWidth: 1,
    borderColor: import_constants.COLORS.border
  },
  categoryLabel: { fontSize: 13, color: import_constants.COLORS.textMuted },
  categoryCount: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    backgroundColor: import_constants.COLORS.bg1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5
  },
  categoryCountText: { fontSize: 10, fontWeight: "700", color: import_constants.COLORS.textMuted },
  // Date headers
  dateHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  dateDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: import_constants.COLORS.accent },
  dateText: { fontSize: 13, fontWeight: "600", color: import_constants.COLORS.textPrimary },
  dateCount: { fontSize: 11, color: import_constants.COLORS.textMuted, marginLeft: "auto" },
  // Note cards
  noteCard: {
    flexDirection: "row",
    backgroundColor: import_constants.COLORS.bg2,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: import_constants.COLORS.border,
    ...import_constants.SHADOWS.sm
  },
  noteAccentLine: { width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  noteBody: { flex: 1, padding: 14 },
  noteHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  noteIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  noteTypeLabel: { fontSize: 11, fontWeight: "600", flex: 1 },
  noteTime: { fontSize: 10, color: import_constants.COLORS.textMuted },
  noteContent: { fontSize: 14, color: import_constants.COLORS.textPrimary, lineHeight: 21 },
  noteTapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    opacity: 0.5
  },
  noteTapHintText: { fontSize: 10, color: import_constants.COLORS.textMuted },
  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: import_constants.COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14,
    color: import_constants.COLORS.textMuted,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
    paddingHorizontal: 24
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: import_constants.COLORS.accent
  },
  emptyCtaText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  // FAB
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: import_constants.COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    ...import_constants.SHADOWS.accent
  },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: import_constants.COLORS.bg1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(100,116,139,0.3)",
    alignSelf: "center",
    marginBottom: 20
  },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(139,92,246,0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: import_constants.COLORS.textPrimary },
  modalSubtitle: { fontSize: 13, color: import_constants.COLORS.textMuted, marginTop: 2 },
  modalInput: {
    minHeight: 120,
    padding: 16,
    backgroundColor: import_constants.COLORS.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: import_constants.COLORS.border,
    fontSize: 15,
    color: import_constants.COLORS.textPrimary,
    lineHeight: 23
  },
  modalTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4
  },
  modalTipText: { fontSize: 11, color: import_constants.COLORS.textMuted, flex: 1 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalCancel: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: import_constants.COLORS.bg2,
    borderWidth: 1,
    borderColor: import_constants.COLORS.border,
    alignItems: "center"
  },
  modalCancelText: { color: import_constants.COLORS.textSecondary, fontSize: 15, fontWeight: "500" },
  modalSave: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: import_constants.COLORS.accent,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  modalSaveText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  // Detail modal
  detailCard: {
    backgroundColor: import_constants.COLORS.bg1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "85%"
  },
  detailDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.1)",
    alignItems: "center",
    justifyContent: "center"
  },
  detailScroll: { maxHeight: 300, marginBottom: 8 },
  detailInput: {
    minHeight: 200,
    padding: 16,
    backgroundColor: import_constants.COLORS.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: import_constants.COLORS.border,
    fontSize: 15,
    color: import_constants.COLORS.textPrimary,
    lineHeight: 23
  }
});
