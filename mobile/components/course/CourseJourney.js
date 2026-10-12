import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AccessibilityInfo,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../hooks/useAuth";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { router } from "expo-router";
import { COLORS, SHADOWS, TYPE } from "../../lib/constants";
import { isDark } from "../../lib/theme";
import { supabase } from "../../lib/supabase";
import { goalContentTag } from "../../lib/goals";
import { getMarketById, getMarketName } from "../../lib/markets";
import { dayPromise, seasonThemes, syllabusDay, TOTAL_DAYS } from "../../lib/syllabus";
import { latestAccessibleSection, resolveCourseSections } from "../../lib/courseSections";
import { triggerHaptic } from "../../lib/haptics";
import { playSound } from "../../lib/sounds";
import { StreakBadge } from "../ui/StreakBadge";
import { XPBadge } from "../ui/XPBadge";
import { LeoCharacter } from "../mascot/LeoCharacter";
import { HomeSkeleton } from "../home/HomeSkeleton";
import { lessonDayLabel, realLessonTitle } from "../../lib/lessonIdentity";
function MovingLessonTitle({ title, long, active }) {
  const sweep = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (reduceMotion || !active) {
      sweep.setValue(0);
      return;
    }
    sweep.setValue(0);
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(sweep, { toValue: 1, duration: 1150, useNativeDriver: false }),
      Animated.delay(1850),
      Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: false })
    ]));
    animation.start();
    return () => {
      animation.stop();
      sweep.setValue(0);
    };
  }, [active, reduceMotion, sweep, title]);
  if (!active || reduceMotion) {
    return /* @__PURE__ */ jsx(Text, { style: [styles.weekTitle, long && styles.weekTitleLong], numberOfLines: 2, adjustsFontSizeToFit: true, minimumFontScale: 0.78, children: title });
  }
  const letters = [...title].length;
  return /* @__PURE__ */ jsx(Text, { style: [styles.weekTitle, long && styles.weekTitleLong], numberOfLines: 2, adjustsFontSizeToFit: true, minimumFontScale: 0.78, accessible: true, accessibilityLabel: title, children: [...title].map((letter, index) => {
    const progress = (index + 1) / (letters + 1);
    const width = Math.min(0.095, 2.5 / (letters + 1));
    const range = [0, progress - width, progress, progress + width, 1];
    const peak = isDark ? COLORS.textOnAccent : COLORS.accent;
    return /* @__PURE__ */ jsx(Animated.Text, { accessible: false, style: isDark ? {
      color: sweep.interpolate({ inputRange: range, outputRange: [COLORS.textPrimary, COLORS.textPrimary, peak, COLORS.textPrimary, COLORS.textPrimary] }),
      textShadowColor: sweep.interpolate({ inputRange: range, outputRange: [COLORS.bg0, COLORS.bg0, COLORS.accent, COLORS.bg0, COLORS.bg0] }),
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 6
    } : {
      color: sweep.interpolate({ inputRange: range, outputRange: [COLORS.textPrimary, COLORS.textPrimary, peak, COLORS.textPrimary, COLORS.textPrimary] })
    }, children: letter }, index);
  }) });
}
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
const MODULES = [
  { kind: "lesson", label: "Daily Lesson", icon: "book-open", position: { top: 6, left: "50%", marginLeft: -42 } },
  { kind: "arena", label: "Daily Arena", icon: "target", position: { top: 92, right: 8 } },
  { kind: "case", label: "Deep Case", icon: "help-circle", position: { bottom: 6, right: 44 } },
  { kind: "intel", label: "Intel", icon: "radio", position: { bottom: 6, left: 44 } },
  { kind: "notes", label: "Notes", icon: "edit-3", position: { top: 92, left: 8 } }
];
function SectionHeader({
  section,
  title,
  onPress
}) {
  return /* @__PURE__ */ jsxs(
    TouchableOpacity,
    {
      style: [styles.sectionHeader, !section.unlocked && styles.sectionHeaderLocked],
      onPress,
      activeOpacity: 0.9,
      accessibilityRole: "button",
      accessibilityLabel: `Preview Section ${section.index + 1}, ${title}. ${section.completedCount} of 30 lessons complete`,
      children: [
        /* @__PURE__ */ jsxs(View, { style: styles.sectionHeaderCopy, children: [
          /* @__PURE__ */ jsxs(Text, { style: [styles.sectionEyebrow, !section.unlocked && styles.lockedText], children: [
            "SECTION ",
            section.index + 1
          ] }),
          /* @__PURE__ */ jsx(Text, { style: [styles.sectionTitle, !section.unlocked && styles.lockedText], numberOfLines: 2, children: title }),
          /* @__PURE__ */ jsx(Text, { style: [styles.sectionProgress, !section.unlocked && styles.lockedText], children: section.unlocked ? `${section.completedCount} / 30 lessons` : `Unlocks after Section ${section.index}` }),
          section.unlocked && /* @__PURE__ */ jsx(View, { style: styles.sectionTrack, children: /* @__PURE__ */ jsx(View, { style: [styles.sectionFill, { width: `${section.completedCount / 30 * 100}%` }] }) })
        ] }),
        /* @__PURE__ */ jsx(View, { style: styles.headerArrow, children: /* @__PURE__ */ jsx(Feather, { name: "chevron-right", size: 26, color: section.unlocked ? COLORS.textOnAccent : COLORS.courseMutedText }) })
      ]
    }
  );
}
function Coin({ label, icon, position, locked, completed, onPress, emphasis = false, pulse = false, reveal, muted = false }) {
  const pulseValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    pulseValue.setValue(0);
    if (!pulse) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulseValue, { toValue: 1, duration: 1e3, useNativeDriver: true }),
      Animated.timing(pulseValue, { toValue: 0, duration: 1e3, useNativeDriver: true })
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse, pulseValue]);
  const fill = reveal ? reveal.interpolate({ inputRange: [0, 1], outputRange: [COLORS.courseMutedFill, COLORS.accent] }) : muted || locked ? COLORS.courseMutedFill : COLORS.accent;
  const iconName = locked ? "lock" : completed ? "check" : icon;
  const iconColor = reveal ? COLORS.courseMutedText : muted || locked ? COLORS.courseMutedText : COLORS.textOnAccent;
  const labelColor = reveal ? reveal.interpolate({ inputRange: [0, 1], outputRange: [COLORS.courseMutedText, COLORS.accent] }) : muted || locked ? COLORS.courseMutedText : COLORS.accent;
  return /* @__PURE__ */ jsxs(View, { style: [styles.coinPosition, position], children: [
    /* @__PURE__ */ jsxs(View, { style: styles.coinSlot, children: [
      pulse && /* @__PURE__ */ jsx(Animated.View, { pointerEvents: "none", style: [styles.lessonPulse, {
        opacity: pulseValue.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.18] }),
        transform: [{ scale: pulseValue.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) }]
      }] }),
      /* @__PURE__ */ jsx(TouchableOpacity, { onPress, activeOpacity: 0.82, accessibilityRole: "button", accessibilityLabel: `${label}${locked ? ", locked" : completed ? ", complete" : ""}`, style: styles.coinTouch, children: /* @__PURE__ */ jsxs(Animated.View, { style: [styles.coinFace, { backgroundColor: fill, transform: [{ scale: emphasis ? 1.12 : 1 }] }], children: [
        /* @__PURE__ */ jsx(Feather, { name: iconName, size: 29, color: iconColor }),
        reveal && /* @__PURE__ */ jsx(Animated.View, { pointerEvents: "none", style: [styles.coinIconOverlay, { opacity: reveal }], children: /* @__PURE__ */ jsx(Feather, { name: iconName, size: 29, color: COLORS.textOnAccent }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(Animated.Text, { style: [styles.coinLabel, { color: labelColor }], numberOfLines: 1, children: label })
  ] });
}
function SectionCluster({
  section,
  lesson,
  title,
  weekTitle,
  marketName,
  activeSection,
  lessonCompletedToday,
  arenaCompletedToday,
  caseCompletedToday,
  intelDone,
  isFocused,
  onModule,
  onLeo,
  onHeader,
  activityReveal,
  reduceMotion,
  calendarDay
}) {
  if (!section.unlocked) {
    return /* @__PURE__ */ jsx(View, { style: styles.sectionBlock, children: /* @__PURE__ */ jsx(SectionHeader, { section, title, onPress: onHeader }) });
  }
  const lessonDone = activeSection ? lessonCompletedToday || Boolean(lesson?.completed) : Boolean(lesson?.completed);
  const moduleComplete = (kind) => {
    if (!activeSection) return kind === "lesson" && Boolean(lesson?.completed);
    if (kind === "lesson") return lessonCompletedToday || Boolean(lesson?.completed);
    if (kind === "arena") return arenaCompletedToday;
    if (kind === "case") return caseCompletedToday;
    if (kind === "intel") return intelDone;
    return false;
  };
  const coreCompleted = ["lesson", "arena", "case", "intel"].filter((kind) => moduleComplete(kind)).length;
  const orbitRadius = 132.5;
  const orbitCircumference = 2 * Math.PI * orbitRadius;
  const orbitOffset = orbitCircumference * (1 - coreCompleted / 4);
  const longTitle = weekTitle.length > 35;
  return /* @__PURE__ */ jsxs(View, { style: styles.sectionBlock, children: [
    /* @__PURE__ */ jsx(SectionHeader, { section, title, onPress: onHeader }),
    /* @__PURE__ */ jsxs(View, { style: styles.weekHeading, children: [
      /* @__PURE__ */ jsxs(View, { style: styles.weekHeadingCopy, children: [
        /* @__PURE__ */ jsx(Text, { style: styles.weekEyebrow, children: lessonDayLabel(section.displayDay, calendarDay, lessonDone) }),
        !section.unlocked ? /* @__PURE__ */ jsx(Text, { style: [styles.weekTitle, styles.lockedText], children: weekTitle }) : /* @__PURE__ */ jsx(MovingLessonTitle, { title: weekTitle, long: longTitle, active: isFocused && activeSection && section.unlocked && !lessonCompletedToday && !lesson?.completed }),
        /* @__PURE__ */ jsxs(Text, { style: styles.lessonMeta, children: [
          marketName,
          " \xB7 6 min"
        ] })
      ] }),
      !section.unlocked ? /* @__PURE__ */ jsxs(View, { style: styles.lockPill, children: [
        /* @__PURE__ */ jsx(Feather, { name: "lock", size: 12, color: COLORS.textMuted }),
        /* @__PURE__ */ jsxs(Text, { style: styles.lockPillText, children: [
          "Unlocks after Section ",
          section.index
        ] })
      ] }) : null
    ] }),
    /* @__PURE__ */ jsxs(View, { style: [styles.cluster, !section.unlocked && styles.clusterLocked], children: [
      /* @__PURE__ */ jsxs(Svg, { width: 268, height: 268, style: styles.orbitSvg, pointerEvents: "none", children: [
        /* @__PURE__ */ jsx(Circle, { cx: 134, cy: 134, r: orbitRadius, fill: "none", stroke: COLORS.accentMedium, strokeWidth: 3 }),
        /* @__PURE__ */ jsx(
          Circle,
          {
            cx: 134,
            cy: 134,
            r: orbitRadius,
            fill: "none",
            stroke: COLORS.accent,
            strokeWidth: 4,
            strokeLinecap: "round",
            strokeDasharray: `${orbitCircumference} ${orbitCircumference}`,
            strokeDashoffset: orbitOffset,
            rotation: -90,
            origin: "134, 134"
          }
        )
      ] }),
      MODULES.map((module, index) => /* @__PURE__ */ jsx(View, { style: [styles.orbitMarker, styles[`orbitMarker${index}`], moduleComplete(module.kind) && styles.orbitMarkerComplete] }, `marker-${module.kind}`)),
      MODULES.map((module) => {
        const locked = !section.unlocked && module.kind !== "notes";
        return /* @__PURE__ */ jsx(
          Coin,
          {
            label: activeSection && module.kind === "lesson" && !lessonDone ? "Start here" : module.label,
            icon: module.icon,
            position: module.position,
            locked,
            completed: module.kind === "lesson" ? lessonDone : moduleComplete(module.kind),
            emphasis: activeSection && module.kind === "lesson" && !lessonDone,
            pulse: isFocused && activeSection && module.kind === "lesson" && !lessonDone && !reduceMotion,
            muted: activeSection && module.kind !== "lesson" && !lessonDone,
            reveal: activeSection && module.kind !== "lesson" && !(lessonDone && !lessonCompletedToday) ? activityReveal[["notes", "arena", "intel", "case"].indexOf(module.kind)] : void 0,
            onPress: () => onModule(module.kind)
          },
          module.kind
        );
      }),
      /* @__PURE__ */ jsx(
        TouchableOpacity,
        {
          style: styles.leoCenter,
          onPress: onLeo,
          activeOpacity: 0.82,
          accessibilityRole: "button",
          accessibilityLabel: `Ask Leo about ${title}`,
          children: /* @__PURE__ */ jsx(View, { style: styles.leoVisual, pointerEvents: "none", children: /* @__PURE__ */ jsx(LeoCharacter, { size: "course", animation: (activeSection ? lessonCompletedToday : Boolean(lesson?.completed)) ? "reading" : "sleeping", still: true }) })
        }
      )
    ] })
  ] });
}
function CurriculumPreview({
  visible,
  section,
  title,
  lessons,
  currentDay,
  onClose,
  onOpenLesson
}) {
  if (!section) return null;
  const sectionLessons = lessons.filter((item) => item.day >= section.startDay && item.day <= section.endDay);
  return /* @__PURE__ */ jsx(Modal, { visible, animationType: "slide", presentationStyle: "pageSheet", onRequestClose: onClose, children: /* @__PURE__ */ jsxs(View, { style: styles.previewScreen, children: [
    /* @__PURE__ */ jsxs(View, { style: styles.previewHeader, children: [
      /* @__PURE__ */ jsxs(View, { style: styles.previewHeadingCopy, children: [
        /* @__PURE__ */ jsxs(Text, { style: styles.previewEyebrow, children: [
          "SECTION ",
          section.index + 1,
          " \xB7 30 DAYS"
        ] }),
        /* @__PURE__ */ jsx(Text, { style: styles.previewTitle, numberOfLines: 2, children: title })
      ] }),
      /* @__PURE__ */ jsx(TouchableOpacity, { style: styles.closeButton, onPress: onClose, accessibilityLabel: "Close curriculum", children: /* @__PURE__ */ jsx(Feather, { name: "x", size: 22, color: COLORS.textPrimary }) })
    ] }),
    /* @__PURE__ */ jsxs(ScrollView, { contentContainerStyle: styles.previewList, showsVerticalScrollIndicator: false, children: [
      !section.unlocked ? /* @__PURE__ */ jsxs(View, { style: styles.previewNotice, children: [
        /* @__PURE__ */ jsx(Feather, { name: "eye", size: 18, color: COLORS.courseHeader }),
        /* @__PURE__ */ jsx(Text, { style: styles.previewNoticeText, children: "Preview the curriculum now. Lessons open after the previous section\u2019s 30 lessons are complete." })
      ] }) : null,
      sectionLessons.map((item) => {
        const calendarLocked = item.day > currentDay;
        const locked = !section.unlocked || calendarLocked || !item.stackId;
        return /* @__PURE__ */ jsxs(
          TouchableOpacity,
          {
            style: [styles.lessonRow, locked && styles.lessonRowLocked],
            disabled: locked,
            onPress: () => onOpenLesson(item),
            accessibilityRole: "button",
            accessibilityLabel: `Day ${item.day}, ${item.title}${locked ? ", locked" : item.completed ? ", complete" : ""}`,
            accessibilityState: { disabled: locked },
            children: [
              /* @__PURE__ */ jsx(View, { style: [styles.dayCircle, item.completed && styles.dayCircleComplete], children: item.completed ? /* @__PURE__ */ jsx(Feather, { name: "check", size: 15, color: COLORS.textOnAccent }) : /* @__PURE__ */ jsx(Text, { style: [styles.dayNumber, locked && styles.lockedText], children: item.day }) }),
              /* @__PURE__ */ jsxs(View, { style: styles.lessonCopy, children: [
                /* @__PURE__ */ jsx(
                  Text,
                  {
                    style: [styles.lessonTitle, item.title.length > 35 && styles.lessonTitleLong, locked && styles.lockedText],
                    numberOfLines: 2,
                    adjustsFontSizeToFit: true,
                    minimumFontScale: 0.82,
                    children: item.title
                  }
                ),
                /* @__PURE__ */ jsx(Text, { style: styles.lessonDescription, numberOfLines: 2, children: item.description })
              ] }),
              /* @__PURE__ */ jsx(Feather, { name: locked ? "lock" : "chevron-right", size: 17, color: locked ? COLORS.textMuted : COLORS.courseHeader })
            ]
          },
          item.day
        );
      })
    ] })
  ] }) });
}
function CourseJourney({
  marketId,
  currentDay,
  learningGoal,
  completedStackIds,
  streak,
  totalXp,
  level,
  lessonCompletedToday,
  completedTodayStackId,
  isFocused,
  arenaCompletedToday = false,
  caseCompletedToday = false,
  intelReadToday,
  intelTarget,
  rescueAvailable = false,
  streakCountdown = null,
  safeTop,
  onOpenLesson,
  onAskLeo,
  belowToday
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const activityReveal = useRef(Array.from({ length: 4 }, () => new Animated.Value(lessonCompletedToday ? 1 : 0))).current;
  const seenReveals = useRef(/* @__PURE__ */ new Set()).current;
  const now = /* @__PURE__ */ new Date();
  const localDay = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const revealKey = `@marketlingo/home-reveal/${user?.id ?? "guest"}/${marketId}/${localDay}`;
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduceMotion(value);
    }).catch(() => {
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    if (!lessonCompletedToday) {
      activityReveal.forEach((value) => value.setValue(0));
      return;
    }
    if (!isFocused || loading) return;
    let active = true;
    let animation;
    const reveal = async () => {
      const seen = seenReveals.has(revealKey) || await AsyncStorage.getItem(revealKey).catch(() => null) === "seen";
      if (!active) return;
      if (seen || reduceMotion) {
        activityReveal.forEach((value) => value.setValue(1));
      } else {
        activityReveal.forEach((value) => value.setValue(0));
        animation = Animated.stagger(80, activityReveal.map((value) => Animated.timing(value, { toValue: 1, duration: 250, useNativeDriver: false })));
        triggerHaptic("light").catch(() => {
        });
        animation.start();
      }
      seenReveals.add(revealKey);
      void AsyncStorage.setItem(revealKey, "seen").catch(() => {
      });
    };
    void reveal();
    return () => {
      active = false;
      animation?.stop();
      activityReveal.forEach((value) => value.setValue(1));
    };
  }, [lessonCompletedToday, isFocused, loading, revealKey, reduceMotion, activityReveal, seenReveals]);
  const listRef = useRef(null);
  const initialPositioned = useRef(false);
  const [lessons, setLessons] = useState([]);
  const loadedMarket = useRef(null);
  const [loadError, setLoadError] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [previewSection, setPreviewSection] = useState(null);
  const [showIndustryDetails, setShowIndustryDetails] = useState(false);
  const themes = useMemo(() => seasonThemes(marketId), [marketId]);
  const marketName = getMarketName(marketId);
  const marketDescription = getMarketById(marketId)?.description;
  const marketIllustration = MARKET_ILLUSTRATIONS[marketId] || MARKET_ILLUSTRATIONS.aerospace;
  const openIndustryDetails = () => {
    triggerHaptic("selection");
    setShowIndustryDetails(true);
  };
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (loadedMarket.current !== marketId) setLoading(true);
      setLoadError(false);
      const { data, error } = await supabase.from("stacks").select("id, title, tags, created_at, authored_lesson").eq("market_id", marketId).contains("tags", ["MICRO_LESSON"]).not("published_at", "is", null).order("created_at", { ascending: false });
      if (!active) return;
      if (error) {
        setLoadError(true);
        if (loadedMarket.current !== marketId) setLessons([]);
        setLoading(false);
        return;
      }
      const goalTag = goalContentTag(learningGoal);
      const byDay = /* @__PURE__ */ new Map();
      const completedByDay = /* @__PURE__ */ new Map();
      const completed = new Set(completedStackIds);
      (data || []).forEach((stack) => {
        const tags = Array.isArray(stack.tags) ? stack.tags : [];
        const tag = tags.find((value) => /^day-\d+$/.test(value));
        const day = tag ? Number(tag.slice(4)) : NaN;
        if (!Number.isFinite(day) || day < 1 || day > TOTAL_DAYS) return;
        if (completed.has(stack.id)) completedByDay.set(day, true);
        const goalMatch = tags.includes(goalTag);
        const existing = byDay.get(day);
        if (!existing || stack.id === completedTodayStackId || existing.id !== completedTodayStackId && goalMatch && !existing.goalMatch) byDay.set(day, { id: stack.id, title: realLessonTitle(stack), goalMatch });
      });
      setLessons(Array.from({ length: TOTAL_DAYS }, (_, index) => {
        const day = index + 1;
        const lesson = byDay.get(day);
        const plan = syllabusDay(marketId, day);
        return {
          day,
          title: lesson?.title || dayPromise(marketId, day),
          description: plan.isConsolidation ? `${plan.facet.promise} Review one idea from the week.` : plan.facet.promise,
          stackId: lesson?.id,
          completed: completedByDay.get(day) || false,
          authored: Boolean(lesson?.title)
        };
      }));
      loadedMarket.current = marketId;
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [marketId, learningGoal, completedStackIds, completedTodayStackId, loadKey]);
  const completedDays = useMemo(() => new Set(lessons.filter((item) => item.completed).map((item) => item.day)), [lessons]);
  const sections = useMemo(() => resolveCourseSections(currentDay, completedDays), [currentDay, completedDays]);
  const focusedSectionIndex = useMemo(() => {
    const credited = lessonCompletedToday ? lessons.find((lesson) => lesson.stackId === completedTodayStackId) : void 0;
    if (credited) return Math.floor((credited.day - 1) / 30);
    const nextUnfinished = sections.find((section) => section.unlocked && section.displayDay <= currentDay && !completedDays.has(section.displayDay));
    if (nextUnfinished) return nextUnfinished.index;
    const calendarSection = Math.min(sections.length - 1, Math.floor((Math.max(1, currentDay) - 1) / 30));
    return sections[calendarSection]?.unlocked ? calendarSection : latestAccessibleSection(sections);
  }, [currentDay, sections, lessons, completedDays, lessonCompletedToday, completedTodayStackId]);
  useEffect(() => {
    if (loading || sections.length === 0 || initialPositioned.current) return;
    const timer = setTimeout(() => {
      if (focusedSectionIndex > 0) {
        listRef.current?.scrollToIndex({ index: focusedSectionIndex, animated: false, viewPosition: 0 });
      }
      initialPositioned.current = true;
    }, 120);
    return () => clearTimeout(timer);
  }, [focusedSectionIndex, loading, sections.length]);
  useEffect(() => {
    initialPositioned.current = false;
  }, [marketId]);
  useEffect(() => {
    if (!isFocused) {
      setPreviewSection(null);
      setShowIndustryDetails(false);
    }
  }, [isFocused]);
  const lockedMessage = (section) => {
    triggerHaptic("warning");
    Alert.alert("Section locked", `Complete all 30 lessons in Section ${section.index} to unlock this section. Your course clock and unfinished work will not reset.`);
  };
  const handleModule = (section, lesson, kind) => {
    if (kind === "notes") {
      triggerHaptic("selection");
      playSound("tap").catch(() => {
      });
      router.push("/notes");
      return;
    }
    if (!section.unlocked) {
      lockedMessage(section);
      return;
    }
    triggerHaptic("light");
    playSound("tap").catch(() => {
    });
    if (kind === "lesson") {
      if (lesson?.stackId && lesson.day <= currentDay) onOpenLesson(lesson.stackId);
      else Alert.alert("Lesson unavailable", "This lesson is not ready yet. Your progress is safe.");
    } else if (kind === "arena") {
      router.push({ pathname: "/arena", params: { day: String(section.displayDay) } });
    } else if (kind === "case") {
      router.push({ pathname: "/deep-case", params: { day: String(section.displayDay) } });
    } else if (kind === "intel") {
      router.push("/(tabs)/roadmap");
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx(HomeSkeleton, {});
  }
  if (loadError && loadedMarket.current !== marketId) {
    return /* @__PURE__ */ jsxs(View, { style: styles.loading, children: [
      /* @__PURE__ */ jsx(Feather, { name: "wifi-off", size: 28, color: COLORS.textMuted }),
      /* @__PURE__ */ jsx(Text, { style: styles.emptyTitle, children: "Your course could not load" }),
      /* @__PURE__ */ jsx(Text, { style: styles.loadingText, children: "Your progress is safe. Reconnect and try again." }),
      /* @__PURE__ */ jsx(TouchableOpacity, { style: styles.retryButton, onPress: () => setLoadKey((key) => key + 1), children: /* @__PURE__ */ jsx(Text, { style: styles.retryText, children: "Try again" }) })
    ] });
  }
  return /* @__PURE__ */ jsxs(View, { style: [styles.container, { paddingTop: safeTop }], children: [
    loadError && /* @__PURE__ */ jsx(TouchableOpacity, { style: styles.retryButton, onPress: () => setLoadKey((key) => key + 1), accessibilityRole: "button", children: /* @__PURE__ */ jsx(Text, { style: styles.retryText, children: "Couldn't refresh \xB7 Try again" }) }),
    /* @__PURE__ */ jsx(
      FlatList,
      {
        ref: listRef,
        data: sections,
        keyExtractor: (item) => String(item.index),
        showsVerticalScrollIndicator: false,
        initialNumToRender: 3,
        scrollEnabled: true,
        keyboardShouldPersistTaps: "handled",
        contentContainerStyle: styles.listContent,
        onScrollToIndexFailed: ({ index }) => listRef.current?.scrollToOffset({ offset: Math.max(0, index * 540), animated: false }),
        ListHeaderComponent: /* @__PURE__ */ jsxs(View, { style: [styles.topHeader, { paddingTop: 10 }], children: [
          /* @__PURE__ */ jsx(
            TouchableOpacity,
            {
              style: styles.industryBadge,
              onPress: openIndustryDetails,
              activeOpacity: 0.82,
              accessibilityRole: "button",
              accessibilityLabel: `Current industry: ${marketName}. Open industry details`,
              children: /* @__PURE__ */ jsx(Image, { source: marketIllustration, style: styles.industryImage, resizeMode: "contain" })
            }
          ),
          /* @__PURE__ */ jsxs(View, { style: styles.badges, children: [
            /* @__PURE__ */ jsx(TouchableOpacity, { disabled: !rescueAvailable, onPress: () => router.push("/streak-rescue"), accessibilityLabel: rescueAvailable ? `Streak rescue, ${streakCountdown || "available now"}` : `${streak}-day streak`, children: /* @__PURE__ */ jsx(StreakBadge, { count: streak }) }),
            streakCountdown ? /* @__PURE__ */ jsx(Text, { style: styles.streakCountdown, accessibilityLabel: `${streakCountdown} left to study today`, children: streakCountdown }) : null,
            /* @__PURE__ */ jsx(XPBadge, { xp: totalXp, level })
          ] })
        ] }),
        renderItem: ({ item: section }) => {
          const activeSection = section.index === focusedSectionIndex;
          const creditedLesson = activeSection && lessonCompletedToday ? lessons.find((entry) => entry.stackId === completedTodayStackId) : void 0;
          const lesson = creditedLesson || lessons.find((entry) => entry.day === section.displayDay);
          const displayedLesson = lesson;
          const sectionLead = lessons.find((entry) => entry.day === section.startDay);
          const weekTitle = section.unlocked ? displayedLesson?.stackId ? displayedLesson.title : "Lesson not available yet" : themes[section.index] || sectionLead?.title || dayPromise(marketId, section.startDay);
          return /* @__PURE__ */ jsxs(View, { children: [
            /* @__PURE__ */ jsx(
              SectionCluster,
              {
                section: creditedLesson ? { ...section, displayDay: creditedLesson.day } : section,
                lesson,
                title: themes[section.index] || `Section ${section.index + 1}`,
                weekTitle,
                marketName,
                activeSection,
                lessonCompletedToday,
                isFocused,
                activityReveal,
                reduceMotion,
                calendarDay: currentDay,
                arenaCompletedToday,
                caseCompletedToday,
                intelDone: intelReadToday >= intelTarget,
                onHeader: () => setPreviewSection(section),
                onLeo: () => onAskLeo(section.displayDay),
                onModule: (kind) => handleModule(section, lesson, kind)
              }
            ),
            activeSection && lessonCompletedToday ? /* @__PURE__ */ jsxs(View, { style: styles.completionNotice, accessibilityRole: "text", children: [
              /* @__PURE__ */ jsx(Feather, { name: "check-circle", size: 16, color: COLORS.accent }),
              /* @__PURE__ */ jsx(Text, { style: styles.completionNoticeText, children: "Today's done. Your streak is safe." })
            ] }) : null,
            activeSection ? belowToday : null
          ] });
        }
      }
    ),
    /* @__PURE__ */ jsx(
      CurriculumPreview,
      {
        visible: Boolean(previewSection),
        section: previewSection,
        title: previewSection ? themes[previewSection.index] || `Section ${previewSection.index + 1}` : "",
        lessons,
        currentDay,
        onClose: () => setPreviewSection(null),
        onOpenLesson: (lesson) => {
          setPreviewSection(null);
          if (lesson.stackId) onOpenLesson(lesson.stackId);
        }
      }
    ),
    /* @__PURE__ */ jsx(
      Modal,
      {
        visible: showIndustryDetails,
        transparent: true,
        animationType: "fade",
        statusBarTranslucent: true,
        onRequestClose: () => setShowIndustryDetails(false),
        children: /* @__PURE__ */ jsxs(View, { style: styles.industryModal, children: [
          /* @__PURE__ */ jsx(
            TouchableOpacity,
            {
              style: styles.industryBackdrop,
              onPress: () => setShowIndustryDetails(false),
              accessibilityLabel: "Close industry details"
            }
          ),
          /* @__PURE__ */ jsxs(View, { style: styles.industrySheet, accessibilityViewIsModal: true, children: [
            /* @__PURE__ */ jsx(View, { style: styles.industryHandle }),
            /* @__PURE__ */ jsxs(View, { style: styles.industrySheetHeading, children: [
              /* @__PURE__ */ jsx(View, { style: styles.industryArtwork, children: /* @__PURE__ */ jsx(Image, { source: marketIllustration, style: styles.industryArtworkImage, resizeMode: "contain" }) }),
              /* @__PURE__ */ jsx(
                TouchableOpacity,
                {
                  style: styles.industryClose,
                  onPress: () => setShowIndustryDetails(false),
                  accessibilityLabel: "Close industry details",
                  children: /* @__PURE__ */ jsx(Feather, { name: "x", size: 20, color: COLORS.textSecondary })
                }
              )
            ] }),
            /* @__PURE__ */ jsx(Text, { style: styles.industryEyebrow, children: "YOUR INDUSTRY" }),
            /* @__PURE__ */ jsx(Text, { style: styles.industryTitle, children: marketName }),
            marketDescription ? /* @__PURE__ */ jsx(Text, { style: styles.industryDescription, children: marketDescription }) : null,
            /* @__PURE__ */ jsx(View, { style: styles.industryDivider }),
            /* @__PURE__ */ jsxs(View, { style: styles.industryProgressRow, children: [
              /* @__PURE__ */ jsx(View, { style: styles.industryProgressIcon, children: /* @__PURE__ */ jsx(Feather, { name: "book-open", size: 18, color: COLORS.accent }) }),
              /* @__PURE__ */ jsxs(View, { style: styles.industryProgressCopy, children: [
                /* @__PURE__ */ jsx(Text, { style: styles.industryProgressTitle, children: "Your course" }),
                /* @__PURE__ */ jsxs(Text, { style: styles.industryProgressDetail, children: [
                  lessons.filter((item) => item.completed).length,
                  " of ",
                  TOTAL_DAYS,
                  " lessons complete \xB7 ",
                  themes[focusedSectionIndex] || "Foundations"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(
              TouchableOpacity,
              {
                style: styles.industryAction,
                onPress: () => {
                  setShowIndustryDetails(false);
                  setPreviewSection(sections[focusedSectionIndex] || null);
                },
                accessibilityRole: "button",
                accessibilityLabel: `Explore ${marketName} course`,
                children: [
                  /* @__PURE__ */ jsx(Text, { style: styles.industryActionText, children: "Explore course" }),
                  /* @__PURE__ */ jsx(Feather, { name: "arrow-right", size: 18, color: COLORS.textOnAccent })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              TouchableOpacity,
              {
                style: styles.industrySecondaryAction,
                onPress: () => {
                  setShowIndustryDetails(false);
                  router.push("/(tabs)/roadmap");
                },
                accessibilityRole: "button",
                accessibilityLabel: `Read ${marketName} industry intel`,
                children: [
                  /* @__PURE__ */ jsx(Feather, { name: "radio", size: 18, color: COLORS.accent }),
                  /* @__PURE__ */ jsx(Text, { style: styles.industrySecondaryText, children: "Read industry intel" }),
                  /* @__PURE__ */ jsx(Feather, { name: "arrow-up-right", size: 16, color: COLORS.textMuted })
                ]
              }
            )
          ] })
        ] })
      }
    )
  ] });
}
const styles = StyleSheet.create({
  completionNotice: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 20, marginBottom: 12, paddingVertical: 10 },
  completionNoticeText: { ...TYPE.caption, color: COLORS.textPrimary, flexShrink: 1 },
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  listContent: { paddingBottom: 110 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: COLORS.bg0, paddingHorizontal: 28 },
  loadingCoin: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.accentSoft, borderWidth: 8, borderColor: COLORS.accentMedium },
  loadingText: { ...TYPE.bodyBold, color: COLORS.textSecondary, textAlign: "center" },
  emptyTitle: { ...TYPE.h2, color: COLORS.textPrimary },
  retryButton: { minHeight: 48, minWidth: 140, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.courseHeader },
  retryText: { ...TYPE.bodyBold, color: COLORS.textOnAccent },
  topHeader: { paddingHorizontal: 20, paddingBottom: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  industryBadge: {
    width: 58,
    height: 58,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm
  },
  industryImage: { width: 48, height: 48 },
  industryModal: { flex: 1, justifyContent: "flex-end" },
  industryBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.imageScrim },
  industrySheet: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36, ...SHADOWS.md },
  industryHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 22 },
  industrySheetHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  industryArtwork: { width: 78, height: 78, borderRadius: 18, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  industryArtworkImage: { width: 68, height: 68 },
  industryClose: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.bg1, alignItems: "center", justifyContent: "center" },
  industryEyebrow: { ...TYPE.overline, color: COLORS.accent },
  industryTitle: { ...TYPE.h1, color: COLORS.textPrimary, marginTop: 4 },
  industryDescription: { ...TYPE.body, color: COLORS.textSecondary, marginTop: 7 },
  industryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginVertical: 22 },
  industryProgressRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 22 },
  industryProgressIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.accentSoft, alignItems: "center", justifyContent: "center" },
  industryProgressCopy: { flex: 1 },
  industryProgressTitle: { ...TYPE.bodyBold, color: COLORS.textPrimary },
  industryProgressDetail: { ...TYPE.caption, color: COLORS.textSecondary, marginTop: 3 },
  industryAction: { minHeight: 52, borderRadius: 12, backgroundColor: COLORS.courseHeader, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  industryActionText: { ...TYPE.bodyBold, color: COLORS.textOnAccent },
  industrySecondaryAction: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 4, marginTop: 6 },
  industrySecondaryText: { ...TYPE.bodyBold, color: COLORS.textPrimary, flex: 1 },
  badges: { flexDirection: "row", alignItems: "center", gap: 8 },
  streakCountdown: { ...TYPE.caption, color: COLORS.error, fontWeight: "800", fontVariant: ["tabular-nums"] },
  sectionBlock: { paddingHorizontal: 18, marginBottom: 26 },
  sectionHeader: { minHeight: 98, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 14, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.courseHeader, shadowColor: COLORS.courseHeaderDeep, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.24, shadowRadius: 14, elevation: 7 },
  sectionHeaderLocked: { backgroundColor: COLORS.courseMutedFill, shadowOpacity: 0, elevation: 0 },
  sectionHeaderCopy: { flex: 1, minWidth: 0, paddingRight: 14 },
  sectionEyebrow: { ...TYPE.overline, color: "rgba(255,255,255,0.75)" },
  sectionTitle: { fontSize: 20, lineHeight: 24, fontWeight: "800", color: COLORS.textOnAccent, marginTop: 4 },
  sectionProgress: { ...TYPE.caption, color: "rgba(255,255,255,0.82)", marginTop: 6 },
  sectionTrack: { height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)", marginTop: 5, overflow: "hidden" },
  sectionFill: { height: 5, borderRadius: 3, backgroundColor: COLORS.textOnAccent },
  headerArrow: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(34,28,164,0.32)", alignItems: "center", justifyContent: "center" },
  weekHeading: { minHeight: 112, paddingHorizontal: 7, paddingTop: 20, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  weekHeadingCopy: { flex: 1, minWidth: 0 },
  weekEyebrow: { ...TYPE.overline, color: COLORS.courseHeader },
  weekTitle: { fontSize: 28, lineHeight: 33, fontWeight: "700", color: COLORS.textPrimary, marginTop: 4, maxWidth: 300 },
  weekTitleLong: { fontSize: 18, lineHeight: 23 },
  lessonMeta: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 5 },
  lockPill: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: COLORS.lockedSurface },
  lockPillText: { ...TYPE.caption, color: COLORS.textMuted, maxWidth: 110 },
  cluster: { height: 374, position: "relative", marginTop: 6 },
  clusterLocked: { opacity: 0.66 },
  orbitSvg: { position: "absolute", width: 268, height: 268, left: "50%", marginLeft: -134, top: 42 },
  orbitMarker: { position: "absolute", width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.bg2, borderWidth: 2, borderColor: COLORS.accent, zIndex: 1 },
  orbitMarkerComplete: { backgroundColor: COLORS.accent },
  orbitMarker0: { top: 38, left: "50%", marginLeft: -4 },
  orbitMarker1: { top: 116, right: 30 },
  orbitMarker2: { top: 287, right: 78 },
  orbitMarker3: { top: 287, left: 78 },
  orbitMarker4: { top: 116, left: 30 },
  coinPosition: { position: "absolute", width: 94, alignItems: "center", zIndex: 3 },
  coinGlowWide: {
    position: "absolute",
    top: -7,
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: COLORS.accentSoft,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 22,
    elevation: 7
  },
  coinGlowNear: {
    position: "absolute",
    top: -1,
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.accentMedium,
    shadowColor: COLORS.courseCoinHighlight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.52,
    shadowRadius: 11,
    elevation: 8
  },
  coinShadow: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.courseCoin,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.courseCoinHighlight,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.46,
    shadowRadius: 18,
    elevation: 10
  },
  coinSlot: { width: 94, height: 94, alignItems: "center", justifyContent: "center" },
  coinTouch: { width: 94, height: 94, alignItems: "center", justifyContent: "center" },
  lessonPulse: { position: "absolute", width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.accent },
  coinIconOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  coinFace: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" },
  coinLocked: { backgroundColor: COLORS.lockedSurface, borderColor: COLORS.border, shadowColor: COLORS.cardShadow, shadowOpacity: 0.1, elevation: 3 },
  coinFaceLocked: { backgroundColor: COLORS.lockedSurface, borderColor: COLORS.border },
  coinLabel: { ...TYPE.caption, color: COLORS.textPrimary, marginTop: 7, textAlign: "center" },
  lockedText: { color: COLORS.textMuted },
  leoCenter: { position: "absolute", width: 166, height: 166, left: "50%", marginLeft: -83, top: 107, alignItems: "center", justifyContent: "center", zIndex: 2 },
  leoVisual: { width: 144, height: 144, backfaceVisibility: "hidden" },
  previewScreen: { flex: 1, backgroundColor: COLORS.bg0 },
  previewHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  previewHeadingCopy: { flex: 1, minWidth: 0 },
  previewEyebrow: { ...TYPE.overline, color: COLORS.courseHeader },
  previewTitle: { ...TYPE.h1, color: COLORS.textPrimary, marginTop: 4 },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bg1, alignItems: "center", justifyContent: "center" },
  previewList: { padding: 18, paddingBottom: 60 },
  previewNotice: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 12, backgroundColor: COLORS.accentSoft, marginBottom: 12 },
  previewNoticeText: { ...TYPE.caption, color: COLORS.textSecondary, flex: 1, lineHeight: 18 },
  lessonRow: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  lessonRowLocked: { opacity: 0.58 },
  dayCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  dayCircleComplete: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  dayNumber: { ...TYPE.caption, color: COLORS.textPrimary },
  lessonCopy: { flex: 1, minWidth: 0 },
  lessonTitle: { ...TYPE.bodyBold, color: COLORS.textPrimary },
  lessonTitleLong: { fontSize: 14, lineHeight: 19 },
  lessonDescription: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 3 }
});
export {
  CourseJourney
};
