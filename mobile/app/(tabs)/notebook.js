import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS, SHADOWS } from "../../lib/constants";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Feather } from "@expo/vector-icons";
import { triggerHaptic } from "../../lib/haptics";
import { LeoAnimated } from "../../components/mascot/LeoAnimated";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
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
  { id: "all", label: "All", icon: "layers", color: COLORS.accent },
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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 20 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }).start();
  };
  return /* @__PURE__ */ React.createElement(Animated.View, { style: { transform: [{ scale: scaleAnim }] } }, /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      style: styles.noteCard,
      activeOpacity: 0.9,
      onPressIn,
      onPressOut,
      onPress: () => onOpen(note),
      onLongPress: () => {
        triggerHaptic("warning");
        onDelete(note.id);
      }
    },
    /* @__PURE__ */ React.createElement(View, { style: [styles.noteAccentLine, { backgroundColor: config.color }] }),
    /* @__PURE__ */ React.createElement(View, { style: styles.noteBody }, /* @__PURE__ */ React.createElement(View, { style: styles.noteHeader }, /* @__PURE__ */ React.createElement(View, { style: [styles.noteIconCircle, { backgroundColor: config.bg }] }, /* @__PURE__ */ React.createElement(Feather, { name: config.icon, size: 12, color: config.color })), /* @__PURE__ */ React.createElement(Text, { style: [styles.noteTypeLabel, { color: config.color }] }, note.linked_label || config.label), /* @__PURE__ */ React.createElement(Text, { style: styles.noteTime }, formatTime(note.created_at))), /* @__PURE__ */ React.createElement(Text, { style: styles.noteContent, numberOfLines: 4 }, note.content), /* @__PURE__ */ React.createElement(View, { style: styles.noteTapHint }, /* @__PURE__ */ React.createElement(Feather, { name: "maximize-2", size: 10, color: COLORS.textMuted }), /* @__PURE__ */ React.createElement(Text, { style: styles.noteTapHintText }, "Tap to expand")))
  ));
}
function StreakWeekView({ streak, thisWeek, totalNotes }) {
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const today = (/* @__PURE__ */ new Date()).getDay();
  return /* @__PURE__ */ React.createElement(View, { style: styles.streakCard }, /* @__PURE__ */ React.createElement(View, { style: styles.streakTop }, /* @__PURE__ */ React.createElement(View, { style: styles.streakFlameWrap }, /* @__PURE__ */ React.createElement(Feather, { name: "edit-3", size: 20, color: COLORS.accent })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.streakCount }, streak), /* @__PURE__ */ React.createElement(Text, { style: styles.streakLabel }, "day note streak")), /* @__PURE__ */ React.createElement(View, { style: styles.streakStatPill }, /* @__PURE__ */ React.createElement(Text, { style: styles.streakStatNum }, totalNotes), /* @__PURE__ */ React.createElement(Text, { style: styles.streakStatLabel }, "total"))), /* @__PURE__ */ React.createElement(View, { style: styles.weekRow }, dayLabels.map((label, i) => {
    const isActive = thisWeek.includes(i);
    const isToday = i === today;
    return /* @__PURE__ */ React.createElement(View, { key: i, style: styles.weekDay }, /* @__PURE__ */ React.createElement(Text, { style: [styles.weekDayLabel, isToday && styles.weekDayLabelToday] }, label), /* @__PURE__ */ React.createElement(
      View,
      {
        style: [
          styles.weekDot,
          isActive && styles.weekDotActive,
          isToday && !isActive && styles.weekDotToday
        ]
      },
      isActive && /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 10, color: "#fff" })
    ));
  })), /* @__PURE__ */ React.createElement(Text, { style: styles.streakMotivation }, streak === 0 ? "Add a note today to start your streak!" : streak < 3 ? "Great start! Keep capturing insights daily." : streak < 7 ? "You're building a habit! Keep it up." : "Amazing streak! You're a knowledge machine."));
}
export default function NotebookScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [openNote, setOpenNote] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("selected_market").eq("id", user.id).single();
      if (profile?.selected_market) setSelectedMarket(profile.selected_market);
    };
    fetchData();
  }, [user]);
  useEffect(() => {
    const fetchNotes = async () => {
      if (!user || !selectedMarket) return;
      const { data, error } = await supabase.from("notes").select("*").eq("user_id", user.id).eq("market_id", selectedMarket).order("created_at", { ascending: false });
      if (!error) setNotes(data || []);
      setLoading(false);
      Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }).start();
    };
    if (selectedMarket) fetchNotes();
  }, [user, selectedMarket]);
  const handleDeleteNote = useCallback((noteId) => {
    if (!user) return;
    Alert.alert("Delete Note", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          triggerHaptic("warning");
          await supabase.from("notes").delete().eq("id", noteId).eq("user_id", user.id);
          setNotes((prev) => prev.filter((n) => n.id !== noteId));
        }
      }
    ]);
  }, [user]);
  const handleAddNote = async () => {
    if (!user || !newNoteContent.trim() || !selectedMarket) return;
    triggerHaptic("success");
    const { data, error } = await supabase.from("notes").insert({
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
    return /* @__PURE__ */ React.createElement(View, { style: [styles.container, styles.centered] }, /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "large", color: COLORS.accent }));
  }
  return /* @__PURE__ */ React.createElement(View, { style: styles.container }, /* @__PURE__ */ React.createElement(
    ScrollView,
    {
      contentContainerStyle: [
        styles.scrollContent,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }
      ],
      showsVerticalScrollIndicator: false,
      keyboardShouldPersistTaps: "handled"
    },
    /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.backButton, onPress: () => router.replace("/(tabs)/home"), activeOpacity: 0.75 }, /* @__PURE__ */ React.createElement(Feather, { name: "arrow-left", size: 20, color: COLORS.textPrimary }), /* @__PURE__ */ React.createElement(Text, { style: styles.backText }, "Course")),
    /* @__PURE__ */ React.createElement(
      Animated.View,
      {
        style: [
          styles.header,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }]
          }
        ]
      },
      /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Your notes"), /* @__PURE__ */ React.createElement(Text, { style: styles.subtitle }, notes.length === 0 ? "Keep the ideas worth owning" : `${notes.length} idea${notes.length !== 1 ? "s" : ""} worth keeping`)),
      /* @__PURE__ */ React.createElement(
        TouchableOpacity,
        {
          style: styles.searchToggle,
          onPress: () => setShowSearch((s) => !s)
        },
        /* @__PURE__ */ React.createElement(Feather, { name: "search", size: 18, color: COLORS.textSecondary })
      )
    ),
    showSearch && /* @__PURE__ */ React.createElement(View, { style: styles.searchContainer }, /* @__PURE__ */ React.createElement(Feather, { name: "search", size: 16, color: COLORS.textMuted }), /* @__PURE__ */ React.createElement(
      TextInput,
      {
        style: styles.searchInput,
        placeholder: "Search your notes",
        placeholderTextColor: COLORS.textMuted,
        value: searchQuery,
        onChangeText: setSearchQuery,
        autoFocus: true
      }
    ), searchQuery.length > 0 && /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => setSearchQuery("") }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 16, color: COLORS.textMuted }))),
    /* @__PURE__ */ React.createElement(
      ScrollView,
      {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        style: styles.categoryRow,
        contentContainerStyle: { gap: 8, paddingRight: 16 }
      },
      CATEGORIES.map((cat) => {
        const isActive = selectedCategory === cat.id;
        const count = categoryCounts[cat.id] || 0;
        return /* @__PURE__ */ React.createElement(
          TouchableOpacity,
          {
            key: cat.id,
            style: [styles.categoryChip, isActive && { backgroundColor: cat.color + "18", borderColor: cat.color + "40" }],
            onPress: () => {
              triggerHaptic("light");
              setSelectedCategory(cat.id);
            }
          },
          /* @__PURE__ */ React.createElement(Feather, { name: cat.icon, size: 13, color: isActive ? cat.color : COLORS.textMuted }),
          /* @__PURE__ */ React.createElement(Text, { style: [styles.categoryLabel, isActive && { color: cat.color, fontWeight: "600" }] }, cat.label),
          count > 0 && /* @__PURE__ */ React.createElement(View, { style: [styles.categoryCount, isActive && { backgroundColor: cat.color + "20" }] }, /* @__PURE__ */ React.createElement(Text, { style: [styles.categoryCountText, isActive && { color: cat.color }] }, count))
        );
      })
    ),
    searchTerms.length > 1 && /* @__PURE__ */ React.createElement(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 } }, searchTerms.map((term, i) => {
      const chipColors = ["#EAB308", "#06B6D4", "#EC4899", "#22C55E", "#F97316"];
      const c = chipColors[i % chipColors.length];
      return /* @__PURE__ */ React.createElement(View, { key: i, style: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: c + "40" } }, /* @__PURE__ */ React.createElement(View, { style: { width: 6, height: 6, borderRadius: 3, backgroundColor: c } }), /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 11, fontWeight: "600", color: c } }, term), /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 10, color: c, opacity: 0.7 } }, "(", termMatchCounts[i], ")"));
    })),
    Object.keys(groupedNotes).length > 0 ? /* @__PURE__ */ React.createElement(View, { style: { gap: 20 } }, Object.entries(groupedNotes).map(([date, dateNotes]) => /* @__PURE__ */ React.createElement(View, { key: date }, /* @__PURE__ */ React.createElement(View, { style: styles.dateHeader }, /* @__PURE__ */ React.createElement(View, { style: styles.dateDot }), /* @__PURE__ */ React.createElement(Text, { style: styles.dateText }, date), /* @__PURE__ */ React.createElement(Text, { style: styles.dateCount }, dateNotes.length, " note", dateNotes.length !== 1 ? "s" : "")), /* @__PURE__ */ React.createElement(View, { style: { gap: 10 } }, dateNotes.map((note) => /* @__PURE__ */ React.createElement(NoteCard, { key: note.id, note, onDelete: handleDeleteNote, onOpen: (n) => {
      setOpenNote(n);
      setEditingContent(n.content);
    } })))))) : /* @__PURE__ */ React.createElement(View, { style: styles.emptyState }, /* @__PURE__ */ React.createElement(LeoAnimated, { clip: "leo-idle-loop", size: 160, fallback: "idle" }), /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, searchQuery ? "No notes found" : "Start your notebook"), /* @__PURE__ */ React.createElement(Text, { style: styles.emptySubtitle }, searchQuery ? "Try a different search or category" : "Write one clear line in your own words. It will stay connected to your course."), !searchQuery && /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: styles.emptyCta,
        onPress: () => {
          triggerHaptic("medium");
          setShowAddNote(true);
        }
      },
      /* @__PURE__ */ React.createElement(Feather, { name: "edit-3", size: 16, color: "#fff" }),
      /* @__PURE__ */ React.createElement(Text, { style: styles.emptyCtaText }, "Write your first note")
    ))
  ), notes.length > 0 && /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      style: [styles.fab, { bottom: insets.bottom + 80 }],
      onPress: () => {
        triggerHaptic("medium");
        setShowAddNote(true);
      },
      activeOpacity: 0.85
    },
    /* @__PURE__ */ React.createElement(Feather, { name: "plus", size: 24, color: "#fff" })
  ), /* @__PURE__ */ React.createElement(Modal, { visible: !!openNote, transparent: true, animationType: "slide" }, /* @__PURE__ */ React.createElement(
    KeyboardAvoidingView,
    {
      behavior: Platform.OS === "ios" ? "padding" : "height",
      style: { flex: 1 }
    },
    /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: styles.modalOverlay,
        activeOpacity: 1,
        onPress: () => setOpenNote(null)
      },
      /* @__PURE__ */ React.createElement(TouchableOpacity, { activeOpacity: 1, style: styles.detailCard }, /* @__PURE__ */ React.createElement(View, { style: styles.modalHandle }), /* @__PURE__ */ React.createElement(View, { style: styles.modalHeader }, /* @__PURE__ */ React.createElement(View, { style: styles.modalIconCircle }, /* @__PURE__ */ React.createElement(Feather, { name: "file-text", size: 18, color: COLORS.accent })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.modalTitle }, openNote?.linked_label || "Note"), /* @__PURE__ */ React.createElement(Text, { style: styles.modalSubtitle }, openNote ? formatDate(openNote.created_at) + " \u2022 " + formatTime(openNote.created_at) : "")), /* @__PURE__ */ React.createElement(
        TouchableOpacity,
        {
          onPress: () => {
            if (!openNote) return;
            triggerHaptic("warning");
            handleDeleteNote(openNote.id);
            setOpenNote(null);
          },
          style: styles.detailDeleteBtn
        },
        /* @__PURE__ */ React.createElement(Feather, { name: "trash-2", size: 16, color: "#EF4444" })
      )), /* @__PURE__ */ React.createElement(ScrollView, { style: styles.detailScroll, nestedScrollEnabled: true }, /* @__PURE__ */ React.createElement(
        TextInput,
        {
          style: styles.detailInput,
          value: editingContent,
          onChangeText: setEditingContent,
          multiline: true,
          textAlignVertical: "top",
          placeholder: "Your note...",
          placeholderTextColor: COLORS.textMuted
        }
      )), /* @__PURE__ */ React.createElement(View, { style: styles.modalActions }, /* @__PURE__ */ React.createElement(
        TouchableOpacity,
        {
          style: styles.modalCancel,
          onPress: () => setOpenNote(null)
        },
        /* @__PURE__ */ React.createElement(Text, { style: styles.modalCancelText }, "Close")
      ), /* @__PURE__ */ React.createElement(
        TouchableOpacity,
        {
          style: [styles.modalSave, editingContent === openNote?.content && { opacity: 0.4 }],
          disabled: editingContent === openNote?.content,
          onPress: async () => {
            if (!openNote || !user) return;
            const { error } = await supabase.from("notes").update({ content: editingContent.trim() }).eq("id", openNote.id).eq("user_id", user.id);
            if (!error) {
              setNotes(
                (prev) => prev.map((n) => n.id === openNote.id ? { ...n, content: editingContent.trim() } : n)
              );
              triggerHaptic("success");
            }
            setOpenNote(null);
          }
        },
        /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 16, color: "#fff" }),
        /* @__PURE__ */ React.createElement(Text, { style: styles.modalSaveText }, "Save Changes")
      )))
    )
  )), /* @__PURE__ */ React.createElement(Modal, { visible: showAddNote, transparent: true, animationType: "slide" }, /* @__PURE__ */ React.createElement(
    KeyboardAvoidingView,
    {
      behavior: Platform.OS === "ios" ? "padding" : "height",
      style: { flex: 1 }
    },
    /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: styles.modalOverlay,
        activeOpacity: 1,
        onPress: () => {
          setShowAddNote(false);
          setNewNoteContent("");
        }
      },
      /* @__PURE__ */ React.createElement(TouchableOpacity, { activeOpacity: 1, style: styles.modalCard }, /* @__PURE__ */ React.createElement(View, { style: styles.modalHandle }), /* @__PURE__ */ React.createElement(View, { style: styles.modalHeader }, /* @__PURE__ */ React.createElement(View, { style: styles.modalIconCircle }, /* @__PURE__ */ React.createElement(Feather, { name: "edit-3", size: 18, color: COLORS.accent })), /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Text, { style: styles.modalTitle }, "New Insight"), /* @__PURE__ */ React.createElement(Text, { style: styles.modalSubtitle }, "What did you learn?"))), /* @__PURE__ */ React.createElement(
        TextInput,
        {
          style: styles.modalInput,
          placeholder: "Write your insight, takeaway, or idea...",
          placeholderTextColor: COLORS.textMuted,
          value: newNoteContent,
          onChangeText: setNewNoteContent,
          multiline: true,
          autoFocus: true,
          textAlignVertical: "top"
        }
      ), /* @__PURE__ */ React.createElement(View, { style: styles.modalTip }, /* @__PURE__ */ React.createElement(Feather, { name: "info", size: 12, color: COLORS.textMuted }), /* @__PURE__ */ React.createElement(Text, { style: styles.modalTipText }, `Great notes are specific. Try: "Key insight from today's lesson..."`)), /* @__PURE__ */ React.createElement(View, { style: styles.modalActions }, /* @__PURE__ */ React.createElement(
        TouchableOpacity,
        {
          style: styles.modalCancel,
          onPress: () => {
            setShowAddNote(false);
            setNewNoteContent("");
          }
        },
        /* @__PURE__ */ React.createElement(Text, { style: styles.modalCancelText }, "Cancel")
      ), /* @__PURE__ */ React.createElement(
        TouchableOpacity,
        {
          style: [styles.modalSave, !newNoteContent.trim() && { opacity: 0.4 }],
          onPress: handleAddNote,
          disabled: !newNoteContent.trim()
        },
        /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 16, color: "#fff" }),
        /* @__PURE__ */ React.createElement(Text, { style: styles.modalSaveText }, "Save")
      )))
    )
  )));
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: 16 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", paddingVertical: 8, marginBottom: 8 },
  backText: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  // Header
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  searchToggle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center"
  },
  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.bg2,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: COLORS.textPrimary },
  // Streak card
  streakCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md
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
  streakCount: { fontSize: 28, fontWeight: "800", color: COLORS.accent, lineHeight: 32 },
  streakLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "500" },
  streakStatPill: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  streakStatNum: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  streakStatLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
  weekRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  weekDay: { alignItems: "center", gap: 6, flex: 1 },
  weekDayLabel: { fontSize: 11, fontWeight: "500", color: COLORS.textMuted },
  weekDayLabelToday: { color: COLORS.accent, fontWeight: "700" },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bg1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center"
  },
  weekDotActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  weekDotToday: { borderColor: COLORS.accent, borderWidth: 2 },
  streakMotivation: { fontSize: 12, color: COLORS.textMuted, textAlign: "center", lineHeight: 17 },
  // Category tabs
  categoryRow: { marginBottom: 18, flexGrow: 0 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  categoryLabel: { fontSize: 13, color: COLORS.textMuted },
  categoryCount: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.bg1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5
  },
  categoryCountText: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted },
  // Date headers
  dateHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  dateDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  dateText: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  dateCount: { fontSize: 11, color: COLORS.textMuted, marginLeft: "auto" },
  // Note cards
  noteCard: {
    flexDirection: "row",
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm
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
  noteTime: { fontSize: 10, color: COLORS.textMuted },
  noteContent: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 21 },
  noteTapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    opacity: 0.5
  },
  noteTapHintText: { fontSize: 10, color: COLORS.textMuted },
  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
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
    backgroundColor: COLORS.accent
  },
  emptyCtaText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  // FAB
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.accent
  },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: COLORS.bg1,
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
  modalTitle: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary },
  modalSubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  modalInput: {
    minHeight: 120,
    padding: 16,
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 23
  },
  modalTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4
  },
  modalTipText: { fontSize: 11, color: COLORS.textMuted, flex: 1 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalCancel: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center"
  },
  modalCancelText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: "500" },
  modalSave: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  modalSaveText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  // Detail modal
  detailCard: {
    backgroundColor: COLORS.bg1,
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
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 23
  }
});
