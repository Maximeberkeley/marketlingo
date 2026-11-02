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
var home_exports = {};
__export(home_exports, {
  default: () => HomeScreen
});
module.exports = __toCommonJS(home_exports);
var import_react = __toESM(require("react"));
var import_expo_router = require("expo-router");
var import_react_native = require("react-native");
var import_AchievementPopup = require("../../components/achievements/AchievementPopup");
var import_HomeSkeleton = require("../../components/home/HomeSkeleton");
var import_react_native_safe_area_context = require("react-native-safe-area-context");
var import_expo_router2 = require("expo-router");
var import_constants = require("../../lib/constants");
var import_supabase = require("../../lib/supabase");
var import_markets = require("../../lib/markets");
var import_useAuth = require("../../hooks/useAuth");
var import_useUserProgress = require("../../hooks/useUserProgress");
var import_useUserXP = require("../../hooks/useUserXP");
var import_WelcomeBackModal = require("../../components/home/WelcomeBackModal");
var import_LeoStreakGift = require("../../components/home/LeoStreakGift");
var import_useReturnVisit = require("../../hooks/useReturnVisit");
var import_LessonKitReader = require("../../components/slides/LessonKitReader");
var import_vector_icons = require("@expo/vector-icons");
var import_SessionCompleteCard = require("../../components/home/SessionCompleteCard");
var import_MilestoneShareCard = require("../../components/sharing/MilestoneShareCard");
var import_useDailyQuests = require("../../hooks/useDailyQuests");
var import_useQuestRewards = require("../../hooks/useQuestRewards");
var import_useMilestoneSharing = require("../../hooks/useMilestoneSharing");
var import_useHomeData = require("../../hooks/useHomeData");
var import_useSessionFlow = require("../../hooks/useSessionFlow");
var import_haptics = require("../../lib/haptics");
var import_useStreakFreeze = require("../../hooks/useStreakFreeze");
var import_sounds = require("../../lib/sounds");
var import_useSpacedRepetition = require("../../hooks/useSpacedRepetition");
var import_useOfflineCache = require("../../hooks/useOfflineCache");
var import_useDisplayName = require("../../hooks/useDisplayName");
var import_LeoPopup = require("../../components/mascot/LeoPopup");
var import_useLeoPopups = require("../../hooks/useLeoPopups");
var import_useAchievements = require("../../hooks/useAchievements");
var import_LeoVoiceChatOverlay = require("../../components/ai/LeoVoiceChatOverlay");
var import_logger = require("../../lib/logger");
var import_LeagueCeremonyModal = require("../../components/league/LeagueCeremonyModal");
var import_useLeague = require("../../hooks/useLeague");
var import_useWeeklyRecap = require("../../hooks/useWeeklyRecap");
var import_useCollectibles = require("../../hooks/useCollectibles");
var import_lessonIdentity = require("../../lib/lessonIdentity");
var import_LessonGoalsScreen = require("../../components/home/LessonGoalsScreen");
var import_useDeliverable = require("../../hooks/useDeliverable");
var import_useFocusTopic = require("../../hooks/useFocusTopic");
var import_CourseJourney = require("../../components/course/CourseJourney");
var import_useIntelHabit = require("../../hooks/useIntelHabit");
var import_dayMath = require("../../lib/dayMath");
var import_leoNudges = require("../../lib/leoNudges");
var import_leoLines = require("../../lib/leoLines");
var import_lessonNavigation = require("../../lib/lessonNavigation");
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
const MARKET_GRADIENTS = {
  aerospace: ["#8B5CF6", "#6D28D9"],
  ai: ["#3B82F6", "#1D4ED8"],
  biotech: ["#EC4899", "#DB2777"],
  cleanenergy: ["#F59E0B", "#D97706"],
  fintech: ["#10B981", "#059669"],
  ev: ["#06B6D4", "#0891B2"],
  cybersecurity: ["#EF4444", "#DC2626"],
  robotics: ["#64748B", "#475569"],
  spacetech: ["#6366F1", "#4F46E5"],
  healthtech: ["#0EA5E9", "#0284C7"],
  web3: ["#7C3AED", "#6D28D9"],
  agtech: ["#22C55E", "#16A34A"],
  logistics: ["#F97316", "#EA580C"],
  climatetech: ["#14B8A6", "#0D9488"],
  neuroscience: ["#F43F5E", "#E11D48"]
};
const LEO_GREETINGS = {
  morning: [
    "Rise and learn! Your industry awaits.",
    "Good morning! Let's make today count.",
    "Fresh day, fresh insights. Let's go!"
  ],
  afternoon: [
    "Perfect time for a quick lesson!",
    "Afternoon brain boost? I'm ready!",
    "Let's keep the momentum going!"
  ],
  evening: [
    "Wind down with some learning!",
    "Evening session? Love the dedication!",
    "One more lesson before rest?"
  ],
  completed: [
    "You crushed it today! Come back tomorrow.",
    "Lesson done! Your streak is safe.",
    "Great work! Rest up for tomorrow."
  ]
};
function getRandomGreeting(key) {
  const msgs = LEO_GREETINGS[key];
  return msgs[Math.floor(Math.random() * msgs.length)];
}
function HomeScreen() {
  const insets = (0, import_react_native_safe_area_context.useSafeAreaInsets)();
  const { user, loading: authLoading } = (0, import_useAuth.useAuth)();
  const { openStackId } = (0, import_expo_router.useLocalSearchParams)();
  const [selectedMarketLocal, setSelectedMarketLocal] = (0, import_react.useState)(null);
  const [revealedCard, setRevealedCard] = (0, import_react.useState)(null);
  const { progress, completeStack, updateStreak, refetch: refetchProgress, loading: progressLoading } = (0, import_useUserProgress.useUserProgress)(selectedMarketLocal || void 0);
  const {
    xpData,
    dailyCompletion,
    completeLessonForToday,
    getCurrentStage,
    getProgressToNextStage,
    isLessonCompletedToday,
    addXP,
    refetch: refetchXP,
    loading: xpLoading,
    completionReady
  } = (0, import_useUserXP.useUserXP)(selectedMarketLocal || void 0);
  const lessonCompletedToday = isLessonCompletedToday();
  const stackDayNumber = (stack) => {
    const tag = (stack?.tags || []).find((t) => t.startsWith("day-"));
    const parsed = tag ? parseInt(tag.replace("day-", ""), 10) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  };
  const currentStage = getCurrentStage();
  const streak = progress?.current_streak || 0;
  const homeData = (0, import_useHomeData.useHomeData)(user?.id, progress, xpData, lessonCompletedToday);
  const {
    selectedMarket,
    isProUser,
    lessonStack,
    newsStack,
    newsItems,
    streakRiskHours,
    socialNudge,
    tomorrowLesson,
    loading,
    refreshing,
    currentDay,
    learningGoal,
    fetchData,
    onRefresh
  } = homeData;
  const { evaluateRewards } = (0, import_useCollectibles.useCollectibles)(selectedMarket || void 0);
  const { canFreeze, freezesUsedThisWeek, maxFreezes, useFreeze } = (0, import_useStreakFreeze.useStreakFreeze)(
    selectedMarketLocal || void 0,
    isProUser
  );
  const league = (0, import_useLeague.useLeague)(selectedMarketLocal || void 0);
  const recap = (0, import_useWeeklyRecap.useWeeklyRecap)(selectedMarketLocal || void 0);
  const [recapDismissed, setRecapDismissed] = (0, import_react.useState)(false);
  const showRecap = recap.isRecapDay && !recap.loading && !recap.seen && !recapDismissed && recap.xpThisWeek >= 0;
  (0, import_react.useEffect)(() => {
    if (selectedMarket) setSelectedMarketLocal(selectedMarket);
  }, [selectedMarket]);
  const bootReady = Boolean(
    user && selectedMarket && selectedMarketLocal === selectedMarket && progress?.user_id === user.id && progress?.market_id === selectedMarket && xpData?.user_id === user.id && xpData?.market_id === selectedMarket && completionReady && lessonStack?.id && currentDay > 0
  );
  const { dueCount } = (0, import_useSpacedRepetition.useSpacedRepetition)(selectedMarketLocal || void 0);
  const deliverable = (0, import_useDeliverable.useDeliverable)(selectedMarketLocal || void 0, learningGoal);
  const focusTopic = (0, import_useFocusTopic.useFocusTopic)(selectedMarketLocal || void 0, currentDay || 1);
  const intelHabit = (0, import_useIntelHabit.useIntelHabit)(selectedMarketLocal || void 0);
  const { syncLessons } = (0, import_useOfflineCache.useOfflineCache)(selectedMarketLocal || void 0);
  (0, import_react.useEffect)(() => {
    if (currentDay && selectedMarket) syncLessons(currentDay);
  }, [currentDay, selectedMarket]);
  const { milestone, dismissMilestone, checkStreakMilestone, checkLevelMilestone } = (0, import_useMilestoneSharing.useMilestoneSharing)();
  const { checkAndUnlockAchievements, newUnlocks, clearNewUnlocks } = (0, import_useAchievements.useAchievements)();
  (0, import_react.useEffect)(() => {
    if (!user || !xpData || !progress) return;
    const completedLessons = progress?.completed_stacks?.length || 0;
    checkAndUnlockAchievements({
      streak: progress?.current_streak || 0,
      xp: xpData?.total_xp || 0,
      lessons: completedLessons,
      drills: 0,
      games: 0,
      days: completedLessons,
      level: xpData?.current_level || 1
    });
  }, [xpData?.total_xp, progress?.current_streak, progress?.completed_stacks?.length]);
  const [achievementPopup, setAchievementPopup] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    if (newUnlocks.length > 0) {
      setAchievementPopup(newUnlocks[0]);
      clearNewUnlocks();
    }
  }, [newUnlocks]);
  const session = (0, import_useSessionFlow.useSessionFlow)({
    user,
    selectedMarket,
    lessonStack,
    progress,
    xpData,
    lessonCompletedToday: Boolean(dailyCompletion?.lesson_completed && dailyCompletion.completion_date === (0, import_dayMath.localDateString)()),
    currentDay,
    completeStack,
    updateStreak,
    completeLessonForToday,
    addXP,
    checkStreakMilestone,
    checkLevelMilestone,
    xpRewardLessonComplete: import_useUserXP.XP_REWARDS.LESSON_COMPLETE,
    xpRewardStreakBonus: import_useUserXP.XP_REWARDS.STREAK_BONUS,
    onDataRefresh: async () => {
      await Promise.all([fetchData(), refetchXP()]);
    }
  });
  const openStackHandled = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (!openStackId || !selectedMarket || !user || session.showReader) return;
    if (openStackHandled.current === openStackId) return;
    openStackHandled.current = openStackId;
    (async () => {
      const { data: stack } = await import_supabase.supabase.from("stacks").select("id, title, stack_type, tags, duration_minutes, metadata, authored_lesson, slides (id, slide_number, title, body, sources)").eq("id", openStackId).not("published_at", "is", null).single();
      if (stack && stack.slides?.length > 0) {
        const formatted = {
          ...stack,
          tags: stack.tags || [],
          slides: (stack.slides || []).sort((a, b) => a.slide_number - b.slide_number).map((s) => ({
            ...s,
            sources: Array.isArray(s.sources) ? s.sources.map((src) => typeof src === "string" ? { label: "Source", url: src } : src).filter(Boolean) : []
          }))
        };
        session.handleOpenStack(formatted);
      }
    })().finally(() => {
      import_expo_router2.router.setParams({ openStackId: void 0 });
      openStackHandled.current = null;
    });
  }, [openStackId, selectedMarket, user, session.showReader]);
  const openingLesson = (0, import_react.useRef)(false);
  const openLessonById = (0, import_react.useCallback)(async (stackId, day) => {
    if (openingLesson.current) return;
    openingLesson.current = true;
    try {
      const { data: stack } = await import_supabase.supabase.from("stacks").select("id, title, stack_type, tags, duration_minutes, metadata, authored_lesson, slides (id, slide_number, title, body, sources)").eq("id", stackId).not("published_at", "is", null).single();
      if (stack && stack.slides?.length > 0) {
        const formatted = {
          ...stack,
          tags: stack.tags || [],
          slides: (stack.slides || []).sort((a, b) => a.slide_number - b.slide_number).map((s) => ({
            ...s,
            sources: Array.isArray(s.sources) ? s.sources.map((src) => typeof src === "string" ? { label: "Source", url: src } : src).filter(Boolean) : []
          }))
        };
        session.handleOpenStack(formatted);
      } else {
        import_react_native.Alert.alert("Lesson unavailable", "This lesson could not load. Your progress is safe.");
      }
    } catch {
      import_react_native.Alert.alert("Lesson unavailable", "Please reconnect and try again. Your progress is safe.");
    } finally {
      openingLesson.current = false;
    }
  }, [session.handleOpenStack]);
  const [showSocialNudge, setShowSocialNudge] = (0, import_react.useState)(true);
  const [showLeoChat, setShowLeoChat] = (0, import_react.useState)(false);
  const [courseFocused, setCourseFocused] = (0, import_react.useState)(true);
  const [clockNow, setClockNow] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
  const refreshStreakData = (0, import_react.useRef)({ refetchXP, refetchProgress });
  refreshStreakData.current = { refetchXP, refetchProgress };
  (0, import_react.useEffect)(() => {
    const ticker = setInterval(() => setClockNow(/* @__PURE__ */ new Date()), 15e3);
    return () => clearInterval(ticker);
  }, []);
  (0, import_expo_router.useFocusEffect)((0, import_react.useCallback)(() => {
    setCourseFocused(true);
    setClockNow(/* @__PURE__ */ new Date());
    void refreshStreakData.current.refetchXP();
    void refreshStreakData.current.refetchProgress();
    return () => setCourseFocused(false);
  }, []));
  const reloadDossier = deliverable.reload;
  (0, import_expo_router.useFocusEffect)((0, import_react.useCallback)(() => {
    void reloadDossier();
  }, [reloadDossier]));
  (0, import_react.useEffect)(() => {
    if (!session.showReader) void reloadDossier();
  }, [session.showReader, reloadDossier]);
  const clockDay = (0, import_dayMath.localDateString)(clockNow);
  const refreshIntel = intelHabit.refresh;
  (0, import_react.useEffect)(() => {
    if (courseFocused) void refreshIntel();
  }, [courseFocused, clockDay, refreshIntel]);
  const [notesCompletedToday, setNotesCompletedToday] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    let active = true;
    setNotesCompletedToday(false);
    if (!courseFocused || !user?.id || !selectedMarketLocal) return;
    const start = new Date(clockNow);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    void (async () => {
      const { data, error } = await import_supabase.supabase.from("notes").select("id").eq("user_id", user.id).eq("market_id", selectedMarketLocal).gte("created_at", start.toISOString()).lt("created_at", end.toISOString()).limit(1);
      if (active && !error) setNotesCompletedToday(Boolean(data?.length));
    })().catch((error) => import_logger.log.warn("[Home] Could not refresh daily notes:", error));
    return () => {
      active = false;
    };
  }, [courseFocused, user?.id, selectedMarketLocal, clockDay]);
  const completedOnClockDay = Boolean(dailyCompletion?.lesson_completed && dailyCompletion.completion_date === clockDay);
  const leoDayScope = `${user?.id ?? "guest"}/${selectedMarketLocal}/${clockDay}`;
  const leoCompletionEdge = (0, import_react.useRef)({ scope: leoDayScope, ready: false, done: false });
  const [leoCelebrationScope, setLeoCelebrationScope] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    const ready = completionReady && Boolean(user && selectedMarketLocal && xpData?.user_id === user.id && xpData?.market_id === selectedMarketLocal);
    const previous = leoCompletionEdge.current;
    if (ready && previous.scope === leoDayScope && previous.ready && !previous.done && completedOnClockDay) {
      setLeoCelebrationScope(leoDayScope);
    }
    leoCompletionEdge.current = { scope: leoDayScope, ready, done: completedOnClockDay };
  }, [completionReady, user?.id, selectedMarketLocal, xpData?.user_id, xpData?.market_id, leoDayScope, completedOnClockDay]);
  (0, import_react.useEffect)(() => {
    if (clockDay !== (0, import_dayMath.localDateString)()) return;
    void refreshStreakData.current.refetchXP();
    void refreshStreakData.current.refetchProgress();
  }, [clockDay]);
  const streakCountdown = (0, import_dayMath.streakCountdownLabel)(streak, completedOnClockDay, clockNow);
  const introDay = stackDayNumber(session.activeStack) ?? currentDay;
  const { quests, completedCount, totalBonusXP, allComplete } = (0, import_useDailyQuests.useDailyQuests)(dailyCompletion, streak);
  (0, import_useQuestRewards.useQuestRewards)(quests, selectedMarketLocal || selectedMarket, addXP);
  const { displayName } = (0, import_useDisplayName.useDisplayName)();
  const leoPopups = (0, import_useLeoPopups.useLeoPopups)({ cooldownMs: 45e3, maxPerSession: 4, displayName });
  const returnVisit = (0, import_useReturnVisit.useReturnVisit)(!!xpData && !loading);
  const hasTriggeredWelcome = (0, import_react.useRef)(false);
  const previousLessonComplete = (0, import_react.useRef)(lessonCompletedToday);
  (0, import_react.useEffect)(() => {
    if (lessonCompletedToday) {
      (0, import_sounds.playSound)("lessonComplete");
      leoPopups.clear();
    }
    previousLessonComplete.current = lessonCompletedToday;
  }, [lessonCompletedToday]);
  (0, import_react.useEffect)(() => {
    if (loading || authLoading || hasTriggeredWelcome.current) return;
    if (!selectedMarket || !user) return;
    if (!courseFocused || session.showGoals || session.showReader || session.showSessionComplete) return;
    hasTriggeredWelcome.current = true;
    if (lessonCompletedToday) return;
    const openLesson = () => {
      if (lessonStack) {
        session.handleOpenStack(lessonStack);
      }
    };
    const timedWindow = (0, import_leoNudges.currentLeoNudgeWindow)();
    const timedTimer = timedWindow ? setTimeout(() => {
      void (0, import_leoNudges.claimLeoNudge)(`window:${timedWindow}`).then((claimed) => {
        if (!claimed) return;
        const script = (0, import_leoNudges.getLeoNudge)(timedWindow, displayName);
        leoPopups.triggerSassyNudge(script.title, (0, import_leoLines.contextualLeoLine)({ day: currentDay, streak, todayHook: lessonStack?.title }), openLesson);
      });
    }, 6500) : null;
    const idleTimer = setTimeout(() => {
      void (0, import_leoNudges.claimLeoNudge)("idle").then((claimed) => {
        if (!claimed) return;
        const script = (0, import_leoNudges.getLeoNudge)("idle", displayName);
        leoPopups.triggerSassyNudge(script.title, (0, import_leoLines.contextualLeoLine)({ day: currentDay, streak, todayHook: lessonStack?.title }), openLesson);
      });
    }, 9e4);
    return () => {
      if (timedTimer) clearTimeout(timedTimer);
      clearTimeout(idleTimer);
    };
  }, [loading, authLoading, selectedMarket, user, lessonCompletedToday, lessonStack?.id, displayName, courseFocused, session.showGoals, session.showReader, session.showSessionComplete]);
  (0, import_react.useEffect)(() => {
    if (session.showGoals || session.showReader || lessonCompletedToday) leoPopups.clear();
  }, [session.showGoals, session.showReader, lessonCompletedToday]);
  const onboardingRedirectAttempted = (0, import_react.useRef)(false);
  (0, import_react.useEffect)(() => {
    if (!authLoading && !user) {
      import_expo_router2.router.replace("/");
      return;
    }
    fetchData().then((result) => {
      if (result === "onboarding" || result === "familiarity") {
        if (onboardingRedirectAttempted.current) {
          import_logger.log.warn("[Home] Skipping repeat onboarding redirect to avoid loop:", result);
          return;
        }
        onboardingRedirectAttempted.current = true;
        if (result === "onboarding") import_expo_router2.router.replace("/onboarding");
        else import_expo_router2.router.replace("/onboarding/familiarity");
      }
    });
  }, [user, authLoading]);
  const hasLoadedOnce = (0, import_react.useRef)(false);
  (0, import_expo_router.useFocusEffect)(
    (0, import_react.useCallback)(() => {
      if (hasLoadedOnce.current && user && !authLoading) {
        void Promise.all([fetchData(), refetchXP()]);
      }
      hasLoadedOnce.current = true;
    }, [user, authLoading, fetchData, refetchXP])
  );
  const [greeting] = (0, import_react.useState)(() => {
    const hour = (/* @__PURE__ */ new Date()).getHours();
    if (lessonCompletedToday) return getRandomGreeting("completed");
    if (hour < 12) return getRandomGreeting("morning");
    if (hour < 17) return getRandomGreeting("afternoon");
    return getRandomGreeting("evening");
  });
  const activeLessonScreen = session.showGoals || session.showReader || session.showSessionComplete;
  (0, import_lessonNavigation.useLessonTabsHidden)(courseFocused && activeLessonScreen);
  if (!activeLessonScreen && (loading || authLoading || !bootReady)) return /* @__PURE__ */ import_react.default.createElement(import_HomeSkeleton.HomeSkeleton, null);
  const marketIllustration = MARKET_ILLUSTRATIONS[selectedMarket || "aerospace"] || MARKET_ILLUSTRATIONS.aerospace;
  const marketGradient = MARKET_GRADIENTS[selectedMarket || "aerospace"] || MARKET_GRADIENTS.aerospace;
  const marketAccent = marketGradient[0];
  const journeyProgress = (currentDay || 1) / 180 * 100;
  return /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.container }, /* @__PURE__ */ import_react.default.createElement(import_LeoPopup.LeoPopup, { message: leoPopups.currentMessage, onDismiss: leoPopups.dismiss }), /* @__PURE__ */ import_react.default.createElement(
    import_WelcomeBackModal.WelcomeBackModal,
    {
      visible: returnVisit.isReturningVisit && !session.showReader,
      level: xpData?.current_level || 1,
      xp: xpData?.total_xp || 0,
      xpToNextLevel: xpData?.xp_to_next_level,
      streak,
      marketId: selectedMarketLocal || selectedMarket || "aerospace",
      marketName: (0, import_markets.getMarketName)(selectedMarketLocal || selectedMarket || "aerospace"),
      onClose: returnVisit.dismiss,
      onStart: () => {
        returnVisit.dismiss();
        if (lessonCompletedToday || !lessonStack) return;
        session.handleOpenStack(lessonStack);
      },
      lessonDone: lessonCompletedToday
    }
  ), /* @__PURE__ */ import_react.default.createElement(
    import_LeoStreakGift.LeoStreakGift,
    {
      marketId: selectedMarketLocal || selectedMarket,
      userId: user?.id,
      blocked: session.showReader || returnVisit.isReturningVisit,
      onRestored: () => fetchData?.()
    }
  ), /* @__PURE__ */ import_react.default.createElement(
    import_LeoVoiceChatOverlay.LeoVoiceChatOverlay,
    {
      visible: showLeoChat,
      onClose: () => setShowLeoChat(false),
      marketId: selectedMarket || void 0,
      lessonContext: `${(0, import_markets.getMarketName)(selectedMarket || "aerospace")} industry learning \u2014 Day ${currentDay}`
    }
  ), session.showGoals && session.activeStack ? /* @__PURE__ */ import_react.default.createElement(
    import_LessonGoalsScreen.LessonGoalsScreen,
    {
      title: session.activeStack.title,
      slides: session.activeStack.slides,
      objectives: session.activeStack.metadata?.learning_objectives,
      marketId: selectedMarket || void 0,
      day: introDay,
      dayLabel: introDay < currentDay && !completedOnClockDay ? (0, import_lessonIdentity.lessonDayLabel)(introDay, currentDay, false) : void 0,
      isBite: session.activeBiteIndex !== null,
      onStart: session.beginLesson,
      onBack: session.closeReader
    }
  ) : session.showReader && session.activeStack ? /* @__PURE__ */ import_react.default.createElement(
    import_LessonKitReader.LessonKitReader,
    {
      stackTitle: session.activeStack.title,
      stackType: session.activeStack.stack_type,
      slides: session.activeStack.slides.map((s) => ({
        slideNumber: s.slide_number,
        title: s.title,
        body: s.body,
        sources: s.sources
      })),
      onClose: session.closeReader,
      onComplete: session.activeBiteIndex !== null ? session.handleBiteComplete : async (reviewMode, timeSpentSeconds, accuracy) => {
        const synced = await session.handleStackComplete(reviewMode, timeSpentSeconds);
        if (!synced || reviewMode || !selectedMarket || !session.activeStack?.id) return;
        const rewards = await evaluateRewards(
          "lesson",
          `lesson:${selectedMarket}:${session.activeStack.id}`,
          accuracy
        );
      },
      onSaveInsight: session.handleSaveInsight,
      onAddNote: session.handleAddNote,
      marketId: selectedMarket || void 0,
      stackId: session.activeStack.id,
      learningGoal,
      isReview: (() => {
        return (progress?.completed_stacks || []).includes(session.activeStack.id);
      })(),
      isProUser,
      streakDays: streak,
      dayNumber: stackDayNumber(session.activeStack) || currentDay,
      metadata: session.activeStack.metadata,
      authoredLesson: session.activeStack.authored_lesson
    }
  ) : session.showSessionComplete ? /* @__PURE__ */ import_react.default.createElement(
    import_SessionCompleteCard.SessionCompleteCard,
    {
      dayNumber: session.activeStack ? stackDayNumber(session.activeStack) || currentDay : currentDay,
      marketName: (0, import_markets.getMarketName)(selectedMarket || "aerospace"),
      marketEmoji: "",
      xpEarned: session.sessionXPEarned,
      streak,
      lessonTitle: session.activeStack?.title || lessonStack?.title || "Lesson",
      totalXP: xpData?.total_xp || 0,
      stageName: currentStage.name,
      onContinue: () => {
        session.dismissSessionComplete();
      },
      onDismiss: () => {
        session.dismissSessionComplete();
      }
    }
  ) : selectedMarket ? /* @__PURE__ */ import_react.default.createElement(
    import_CourseJourney.CourseJourney,
    {
      marketId: selectedMarket,
      currentDay,
      learningGoal,
      completedStackIds: progress?.completed_stacks || [],
      streak,
      totalXp: xpData?.total_xp || 0,
      level: xpData?.current_level || 1,
      lessonCompletedToday: completedOnClockDay,
      completedTodayStackId: completedOnClockDay ? dailyCompletion?.completed_stack_id : null,
      isFocused: courseFocused,
      leoCallOpen: showLeoChat,
      leoCelebrationPending: leoCelebrationScope === leoDayScope,
      onLeoCelebrated: () => setLeoCelebrationScope(null),
      arenaCompletedToday: (dailyCompletion?.drills_completed || 0) > 0,
      caseCompletedToday: (dailyCompletion?.games_completed || 0) > 0,
      notesCompletedToday,
      intelReadToday: intelHabit.done ? intelHabit.target : intelHabit.readToday,
      intelTarget: intelHabit.target,
      rescueAvailable: Boolean(streakCountdown),
      streakCountdown,
      safeTop: insets.top,
      onOpenLesson: (stackId, day) => {
        void openLessonById(stackId, day);
      },
      onAskLeo: () => setShowLeoChat(true),
      belowToday: deliverable.loading ? null : /* @__PURE__ */ import_react.default.createElement(
        import_react_native.TouchableOpacity,
        {
          style: styles.dossierChip,
          activeOpacity: 0.85,
          accessibilityRole: "button",
          onPress: () => {
            (0, import_haptics.triggerHaptic)("light");
            import_expo_router2.router.push("/deliverable");
          }
        },
        /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "file-text", size: 14, color: import_constants.COLORS.accent }),
        /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.dossierChipText, numberOfLines: 1 }, `${deliverable.template.title} \xB7 ${deliverable.filledSections} of ${deliverable.template.sections.length} sections`),
        /* @__PURE__ */ import_react.default.createElement(import_vector_icons.Feather, { name: "chevron-right", size: 14, color: import_constants.COLORS.textMuted })
      )
    }
  ) : /* @__PURE__ */ import_react.default.createElement(import_HomeSkeleton.HomeSkeleton, null), /* @__PURE__ */ import_react.default.createElement(
    import_MilestoneShareCard.MilestoneShareCard,
    {
      visible: milestone.visible,
      type: milestone.type,
      data: milestone.data,
      onDismiss: dismissMilestone
    }
  ), /* @__PURE__ */ import_react.default.createElement(
    import_AchievementPopup.AchievementPopup,
    {
      visible: !!achievementPopup && !leoPopups.currentMessage,
      achievement: achievementPopup,
      onDismiss: () => setAchievementPopup(null)
    }
  ), false);
}
const styles = import_react_native.StyleSheet.create({
  dossierChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: import_constants.COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: import_constants.COLORS.accentMedium,
    maxWidth: "90%"
  },
  dossierChipText: { ...import_constants.TYPE.caption, color: import_constants.COLORS.textPrimary, fontWeight: "700", flexShrink: 1 },
  container: { flex: 1, backgroundColor: import_constants.COLORS.bg0 },
  scrollContent: { paddingHorizontal: 20 },
  rescueLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.3)",
    backgroundColor: import_constants.COLORS.orangeSoft,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 16
  },
  rescueLinkText: { fontSize: 13, fontWeight: "700", color: import_constants.COLORS.streak },
  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 20
  },
  // Leo section
  leoSection: {
    alignItems: "center",
    marginBottom: 16
  },
  speechBubble: {
    maxWidth: "85%",
    marginTop: 8
  },
  speechText: {
    ...import_constants.TYPE.body,
    color: import_constants.COLORS.textPrimary,
    textAlign: "center",
    fontWeight: "500"
  },
  // Lesson card — the hero
  lessonCard: {
    backgroundColor: import_constants.COLORS.bg2,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 12
  },
  lessonHero: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    position: "relative",
    minHeight: 180
  },
  heroOrb: {
    position: "absolute",
    borderRadius: 999
  },
  heroOrbLeft: {
    width: 200,
    height: 200,
    top: -60,
    left: -40
  },
  heroOrbRight: {
    width: 160,
    height: 160,
    bottom: -40,
    right: -30
  },
  lessonIllustration: { width: 180, height: 150, zIndex: 2 },
  dayBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    zIndex: 3
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1
  },
  lessonContent: { padding: 18, paddingTop: 16 },
  lessonOverline: {
    ...import_constants.TYPE.overline,
    marginBottom: 8
  },
  lessonTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: import_constants.COLORS.textPrimary,
    letterSpacing: -0.4,
    lineHeight: 27,
    marginBottom: 14
  },
  lessonMeta: { flexDirection: "row", gap: 12, alignItems: "center" },
  lessonMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  lessonMetaText: { fontSize: 12, color: import_constants.COLORS.textMuted, fontWeight: "500" },
  xpChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  xpChipText: { fontSize: 12, fontWeight: "700" },
  lessonCTA: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  lessonCTAText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.3 },
  // Progress
  progressSection: { marginBottom: 20, paddingHorizontal: 4 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  progressLabel: { ...import_constants.TYPE.caption, color: import_constants.COLORS.textSecondary },
  progressPct: { ...import_constants.TYPE.caption, color: import_constants.COLORS.textMuted },
  // Review banner
  reviewBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: import_constants.COLORS.accentSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: import_constants.COLORS.accent + "15"
  },
  reviewText: { flex: 1, fontSize: 14, fontWeight: "600", color: import_constants.COLORS.textPrimary },
  // Tomorrow
  tomorrowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: import_constants.COLORS.bg1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: import_constants.COLORS.border
  },
  tomorrowLabel: { ...import_constants.TYPE.caption, color: import_constants.COLORS.textMuted },
  tomorrowTitle: { fontSize: 14, fontWeight: "600", color: import_constants.COLORS.textPrimary, marginTop: 2 }
});
