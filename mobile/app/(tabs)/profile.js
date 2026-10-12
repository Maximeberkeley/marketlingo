import { InterviewTargetForm } from "../../components/interview/InterviewTargetForm";
import { useInterviewReadiness } from "../../hooks/useInterviewReadiness";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  Modal,
  Animated
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { storage } from "../../lib/storage";
import { COLORS, FAMILIARITY_LEVELS } from "../../lib/constants";
import { getMarketName } from "../../lib/markets";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useUserProgress } from "../../hooks/useUserProgress";
import { useUserXP } from "../../hooks/useUserXP";
import { Feather } from "@expo/vector-icons";
import { triggerHaptic } from "../../lib/haptics";
import { useCollectibles } from "../../hooks/useCollectibles";
import { useDeliverable } from "../../hooks/useDeliverable";
import { dossierRank } from "../../lib/deliverables";
const MARKET_ILLUSTRATIONS = {
  aerospace: require("../../assets/illustrations/aerospace.png"),
  ai: require("../../assets/illustrations/ai.png"),
  biotech: require("../../assets/illustrations/biotech.png"),
  cleanenergy: require("../../assets/illustrations/cleanenergy.png"),
  fintech: require("../../assets/illustrations/fintech.png"),
  ev: require("../../assets/illustrations/ev.png"),
  cybersecurity: require("../../assets/illustrations/cybersecurity.png"),
  robotics: require("../../assets/illustrations/robotics.png"),
  spacetech: require("../../assets/illustrations/spacetech.png"),
  healthtech: require("../../assets/illustrations/healthtech.png"),
  web3: require("../../assets/illustrations/web3.png"),
  agtech: require("../../assets/illustrations/agtech.png"),
  logistics: require("../../assets/illustrations/logistics.png"),
  climatetech: require("../../assets/illustrations/climatetech.png"),
  neuroscience: require("../../assets/illustrations/neuroscience.png")
};
function goalSentence(goal, market) {
  const m = market.toLowerCase();
  if (goal === "invest") return `Learning to invest in ${m}`;
  if (goal === "build_startup") return `Building a ${m} startup`;
  if (goal === "curiosity") return `Exploring ${m}`;
  return `Getting ready for ${/^[aeiou]/.test(m) ? "an" : "a"} ${m} job`;
}
const GOAL_OPTIONS = [
  { id: "join_industry", icon: "briefcase", title: "Join the industry", color: "#3B82F6" },
  { id: "invest", icon: "trending-up", title: "Invest & evaluate", color: "#8B5CF6" },
  { id: "build_startup", icon: "layers", title: "Build a startup", color: "#22C55E" },
  { id: "curiosity", icon: "compass", title: "Pure curiosity", color: "#F59E0B" }
];
function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, loading: authLoading } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [showChangeWarning, setShowChangeWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const { progress, availableDay } = useUserProgress(selectedMarket || void 0);
  const { xpData, getCurrentStage, getProgressToNextStage } = useUserXP(selectedMarket || void 0);
  const { cards, featuredId } = useCollectibles(selectedMarket || void 0);
  const featuredCard = cards.find((card) => card.id === featuredId);
  const dossier = useDeliverable(selectedMarket || void 0, currentGoal);
  const dossierRankInfo = dossierRank(dossier.completion);
  const interviewPrep = useInterviewReadiness(selectedMarket);
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("selected_market, familiarity_level").eq("id", user.id).single();
      if (profile) {
        setSelectedMarket(profile.selected_market);
        setCurrentLevel(profile.familiarity_level || null);
      }
      if (profile?.selected_market) {
        const { data: prog } = await supabase.from("user_progress").select("learning_goal, familiarity_level").eq("user_id", user.id).eq("market_id", profile.selected_market).maybeSingle();
        if (prog) {
          setCurrentGoal(prog.learning_goal || null);
          if (prog.familiarity_level) setCurrentLevel(prog.familiarity_level);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);
  const currentStage = getCurrentStage();
  const stageProgress = getProgressToNextStage();
  const certProgress = availableDay;
  const certPercentage = Math.round(certProgress / 180 * 100);
  const isCertEligible = certProgress >= 180;
  const handleChangeMarket = async () => {
    if (!user || !selectedMarket) return;
    await supabase.from("user_progress").update({ current_streak: 0, current_day: 1, completed_stacks: [] }).eq("user_id", user.id).eq("market_id", selectedMarket);
    setShowChangeWarning(false);
    router.replace("/onboarding");
  };
  const handleChangeGoal = async (goal) => {
    if (!user || !selectedMarket) return;
    triggerHaptic("medium");
    setSavingPreference(true);
    try {
      const { error } = await supabase.from("user_progress").upsert(
        { user_id: user.id, market_id: selectedMarket, learning_goal: goal },
        { onConflict: "user_id,market_id" }
      );
      if (error) throw error;
      setCurrentGoal(goal);
      setShowGoalPicker(false);
      Alert.alert("Goal Updated", "Your lessons will now be tailored to this goal. Go back to Home to see updated content.");
    } catch (err) {
      Alert.alert("Error", "Failed to update goal.");
    } finally {
      setSavingPreference(false);
    }
  };
  const handleChangeLevel = async (level) => {
    if (!user || !selectedMarket) return;
    triggerHaptic("medium");
    setSavingPreference(true);
    try {
      const results = await Promise.all([
        supabase.from("profiles").update({ familiarity_level: level }).eq("id", user.id),
        supabase.from("user_progress").upsert(
          { user_id: user.id, market_id: selectedMarket, familiarity_level: level },
          { onConflict: "user_id,market_id" }
        )
      ]);
      if (results.some((result) => result.error)) throw new Error("Preference update failed");
      setCurrentLevel(level);
      setShowLevelPicker(false);
      Alert.alert("Level Updated", "Content difficulty will adjust to your new experience level.");
    } catch (err) {
      Alert.alert("Error", "Failed to update level.");
    } finally {
      setSavingPreference(false);
    }
  };
  const handleExportNotebook = async () => {
    if (!user) return;
    const { data: notes } = await supabase.from("notes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (!notes || notes.length === 0) {
      Alert.alert("No Notes", "No notes to export yet.");
      return;
    }
    await Share.share({
      title: "My MarketLingo notes",
      message: notes.map((note, index) => `${index + 1}. ${note.content}`).join("\n\n")
    });
  };
  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          await storage.clearAll();
          router.replace("/");
        }
      }
    ]);
  };
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!loading) {
      Animated.stagger(120, [
        Animated.spring(headerAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.spring(statsAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.spring(bodyAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true })
      ]).start();
    }
  }, [loading]);
  const animStyle = (anim) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
  });
  if (loading || authLoading) {
    return /* @__PURE__ */ React.createElement(View, { style: [styles.container, styles.centered] }, /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "large", color: COLORS.accent }));
  }
  return /* @__PURE__ */ React.createElement(View, { style: styles.container }, /* @__PURE__ */ React.createElement(
    ScrollView,
    {
      contentContainerStyle: [styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }],
      showsVerticalScrollIndicator: false
    },
    /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.header, animStyle(headerAnim)] }, /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Profile"), user && /* @__PURE__ */ React.createElement(Text, { style: styles.email }, user.email)), /* @__PURE__ */ React.createElement(View, { style: styles.headerRight })),
    /* @__PURE__ */ React.createElement(Animated.View, { style: animStyle(bodyAnim) }, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.stageCard, activeOpacity: 0.85, onPress: () => setShowChangeWarning(true) }, /* @__PURE__ */ React.createElement(Text, { style: styles.stageTitle }, goalSentence(currentGoal, getMarketName(selectedMarket || "aerospace"))), /* @__PURE__ */ React.createElement(Text, { style: styles.stageDesc }, "Change industry \u203A")), /* @__PURE__ */ React.createElement(View, { style: styles.section }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionTitle }, "INTERVIEW"), /* @__PURE__ */ React.createElement(InterviewTargetForm, { target: interviewPrep.target, onSave: interviewPrep.saveTarget })), /* @__PURE__ */ React.createElement(View, { style: styles.section }, /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: styles.menuItem,
        activeOpacity: 0.88,
        onPress: () => {
          triggerHaptic("light");
          router.push("/deliverable");
        }
      },
      /* @__PURE__ */ React.createElement(View, { style: [styles.menuIcon, { backgroundColor: COLORS.accentSoft }] }, /* @__PURE__ */ React.createElement(Feather, { name: "file-text", size: 18, color: COLORS.accent })),
      /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.menuTitle }, "Interview Brief"), /* @__PURE__ */ React.createElement(Text, { style: styles.menuSubtitle }, `${Math.round(dossier.completion)}% written`)),
      /* @__PURE__ */ React.createElement(Text, { style: styles.chevron }, "\u203A")
    ), /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: styles.menuItem,
        activeOpacity: 0.88,
        onPress: () => {
          triggerHaptic("light");
          router.push("/leaderboard");
        }
      },
      /* @__PURE__ */ React.createElement(View, { style: [styles.menuIcon, { backgroundColor: COLORS.bg1 }] }, /* @__PURE__ */ React.createElement(Feather, { name: "award", size: 18, color: COLORS.accent })),
      /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.menuTitle }, "League"), /* @__PURE__ */ React.createElement(Text, { style: styles.menuSubtitle }, "Your rank this month")),
      /* @__PURE__ */ React.createElement(Text, { style: styles.chevron }, "\u203A")
    ), /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: styles.menuItem,
        activeOpacity: 0.88,
        onPress: () => {
          triggerHaptic("light");
          router.push("/friends");
        }
      },
      /* @__PURE__ */ React.createElement(View, { style: [styles.menuIcon, { backgroundColor: COLORS.bg1 }] }, /* @__PURE__ */ React.createElement(Feather, { name: "users", size: 18, color: COLORS.accent })),
      /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.menuTitle }, "Friends"), /* @__PURE__ */ React.createElement(Text, { style: styles.menuSubtitle }, "Add friends and compare streaks")),
      /* @__PURE__ */ React.createElement(Text, { style: styles.chevron }, "\u203A")
    ), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.menuItem, onPress: () => setShowGoalPicker(true) }, /* @__PURE__ */ React.createElement(View, { style: [styles.menuIcon, { backgroundColor: COLORS.bg1 }] }, /* @__PURE__ */ React.createElement(Feather, { name: GOAL_OPTIONS.find((g) => g.id === currentGoal)?.icon || "target", size: 18, color: COLORS.accent })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.menuTitle }, "Goal"), /* @__PURE__ */ React.createElement(Text, { style: styles.menuSubtitle }, GOAL_OPTIONS.find((g) => g.id === currentGoal)?.title || "Not set")), /* @__PURE__ */ React.createElement(Text, { style: styles.chevron }, "\u203A")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.menuItem, onPress: () => setShowLevelPicker(true) }, /* @__PURE__ */ React.createElement(View, { style: [styles.menuIcon, { backgroundColor: COLORS.bg1 }] }, /* @__PURE__ */ React.createElement(Feather, { name: "sliders", size: 18, color: COLORS.accent })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.menuTitle }, "Level"), /* @__PURE__ */ React.createElement(Text, { style: styles.menuSubtitle }, FAMILIARITY_LEVELS.find((l) => l.id === currentLevel)?.name || "Not set")), /* @__PURE__ */ React.createElement(Text, { style: styles.chevron }, "\u203A")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.menuItem, onPress: () => router.push("/settings") }, /* @__PURE__ */ React.createElement(View, { style: [styles.menuIcon, { backgroundColor: COLORS.bg1 }] }, /* @__PURE__ */ React.createElement(Feather, { name: "settings", size: 18, color: COLORS.accent })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.menuTitle }, "Settings"), /* @__PURE__ */ React.createElement(Text, { style: styles.menuSubtitle }, "Notifications and account")), /* @__PURE__ */ React.createElement(Text, { style: styles.chevron }, "\u203A")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.logoutLink, onPress: handleSignOut, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.logoutText }, "Log out"))), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.push("/achievements"), hitSlop: 10 }, /* @__PURE__ */ React.createElement(Text, { style: [styles.versionText, { color: COLORS.accent, marginBottom: 6 }] }, "Achievements")), /* @__PURE__ */ React.createElement(Text, { style: styles.versionText }, "MarketLingo v1.1.1"))
  ), /* @__PURE__ */ React.createElement(Modal, { visible: showChangeWarning, transparent: true, animationType: "fade" }, /* @__PURE__ */ React.createElement(View, { style: styles.modalOverlay }, /* @__PURE__ */ React.createElement(View, { style: styles.modalCard }, /* @__PURE__ */ React.createElement(Feather, { name: "alert-circle", size: 28, color: COLORS.accent, style: { alignSelf: "center", marginBottom: 12 } }), /* @__PURE__ */ React.createElement(Text, { style: styles.modalTitle }, "Change Market?"), /* @__PURE__ */ React.createElement(Text, { style: styles.modalSubtitle }, "Changing your market will reset your path and streak. This action cannot be undone."), /* @__PURE__ */ React.createElement(View, { style: styles.modalActions }, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.modalCancel, onPress: () => setShowChangeWarning(false) }, /* @__PURE__ */ React.createElement(Text, { style: styles.modalCancelText }, "Cancel")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.modalDestructive, onPress: handleChangeMarket }, /* @__PURE__ */ React.createElement(Text, { style: styles.modalDestructiveText }, "Change Market")))))), /* @__PURE__ */ React.createElement(Modal, { visible: showGoalPicker, transparent: true, animationType: "fade" }, /* @__PURE__ */ React.createElement(View, { style: styles.modalOverlay }, /* @__PURE__ */ React.createElement(View, { style: styles.modalCard }, /* @__PURE__ */ React.createElement(Text, { style: styles.modalTitle }, "Change Learning Goal"), /* @__PURE__ */ React.createElement(Text, { style: styles.modalSubtitle }, "Your lessons and practice content will adapt to match your new objective."), /* @__PURE__ */ React.createElement(View, { style: { gap: 8, marginBottom: 16 } }, GOAL_OPTIONS.map((goal) => /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      key: goal.id,
      style: [
        styles.pickerOption,
        currentGoal === goal.id && { borderColor: goal.color, backgroundColor: goal.color + "08" }
      ],
      onPress: () => handleChangeGoal(goal.id),
      disabled: savingPreference
    },
    /* @__PURE__ */ React.createElement(View, { style: [styles.pickerIcon, { backgroundColor: goal.color + "18" }] }, /* @__PURE__ */ React.createElement(Feather, { name: goal.icon, size: 18, color: goal.color })),
    /* @__PURE__ */ React.createElement(Text, { style: [styles.pickerText, currentGoal === goal.id && { color: goal.color, fontWeight: "700" }] }, goal.title),
    currentGoal === goal.id && /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 18, color: goal.color })
  ))), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.modalCancel, onPress: () => setShowGoalPicker(false) }, /* @__PURE__ */ React.createElement(Text, { style: styles.modalCancelText }, "Cancel"))))), /* @__PURE__ */ React.createElement(Modal, { visible: showLevelPicker, transparent: true, animationType: "fade" }, /* @__PURE__ */ React.createElement(View, { style: styles.modalOverlay }, /* @__PURE__ */ React.createElement(View, { style: styles.modalCard }, /* @__PURE__ */ React.createElement(Text, { style: styles.modalTitle }, "Change Experience Level"), /* @__PURE__ */ React.createElement(Text, { style: styles.modalSubtitle }, "This adjusts the depth and complexity of your daily lessons."), /* @__PURE__ */ React.createElement(View, { style: { gap: 8, marginBottom: 16 } }, FAMILIARITY_LEVELS.map((level) => /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      key: level.id,
      style: [
        styles.pickerOption,
        currentLevel === level.id && { borderColor: "#10B981", backgroundColor: "rgba(16, 185, 129, 0.06)" }
      ],
      onPress: () => handleChangeLevel(level.id),
      disabled: savingPreference
    },
    /* @__PURE__ */ React.createElement(View, { style: [styles.pickerIcon, { backgroundColor: "rgba(16, 185, 129, 0.15)" }] }, /* @__PURE__ */ React.createElement(
      Feather,
      {
        name: level.id === "beginner" ? "sunrise" : level.id === "intermediate" ? "sun" : "zap",
        size: 18,
        color: "#10B981"
      }
    )),
    /* @__PURE__ */ React.createElement(View, { style: { flex: 1, gap: 3 } }, /* @__PURE__ */ React.createElement(Text, { style: [styles.pickerText, { flex: 0 }, currentLevel === level.id && { color: "#10B981", fontWeight: "700" }] }, level.name), /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 11, color: COLORS.textMuted, lineHeight: 15 } }, level.description)),
    currentLevel === level.id && /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 18, color: "#10B981" })
  ))), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.modalCancel, onPress: () => setShowLevelPicker(false) }, /* @__PURE__ */ React.createElement(Text, { style: styles.modalCancelText }, "Cancel"))))));
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 28, fontWeight: "700", color: COLORS.textPrimary },
  email: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  proBadge: { backgroundColor: "rgba(139, 92, 246, 0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  proBadgeText: { fontSize: 12, fontWeight: "600", color: COLORS.accent },
  statsGrid: { flexDirection: "row", gap: 8, marginBottom: 16 },
  proBanner: { width: "100%", height: void 0, aspectRatio: 728 / 200, borderRadius: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statIconImg: { width: 24, height: 24, resizeMode: "contain" },
  statValue: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  stageCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  stageHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  stageTitle: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  stageDesc: { fontSize: 11, color: COLORS.textMuted },
  xpText: { fontSize: 12, fontWeight: "700", color: "#EAB308" },
  section: { marginBottom: 20 },
  collectionCard: { backgroundColor: COLORS.bg2, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: COLORS.border },
  collectionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 11, fontWeight: "600", color: COLORS.textMuted, letterSpacing: 1, marginBottom: 10 },
  certCard: { backgroundColor: COLORS.bg2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  certRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  certIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.bg1, alignItems: "center", justifyContent: "center" },
  certTitle: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary },
  certSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  certProgressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  certProgressLabel: { fontSize: 11, color: COLORS.textMuted },
  certButton: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 14 },
  certButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  menuItem: {
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
    gap: 12
  },
  logoutLink: { alignSelf: "flex-start", paddingVertical: 14, paddingHorizontal: 4, minHeight: 44 },
  logoutText: { fontSize: 15, color: COLORS.textMuted },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuIconImg: { width: 24, height: 24, resizeMode: "contain" },
  menuTitle: { fontSize: 15, fontWeight: "500", color: COLORS.textPrimary },
  menuSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  chevron: { fontSize: 22, color: COLORS.textMuted },
  versionText: { textAlign: "center", fontSize: 12, color: COLORS.textMuted, marginTop: 20, marginBottom: 10 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(11, 16, 32, 0.9)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalCard: { backgroundColor: COLORS.bg2, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border, width: "100%" },
  modalTitle: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center", marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginBottom: 20, lineHeight: 20 },
  modalActions: { flexDirection: "row", gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.bg1, alignItems: "center" },
  modalCancelText: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary },
  modalDestructive: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#EF4444", alignItems: "center" },
  modalDestructiveText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg2
  },
  pickerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  pickerText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textPrimary,
    flex: 1
  }
});
export {
  ProfileScreen as default
};
