import React, { useEffect, useMemo, useRef, useState } from "react";
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
    return /* @__PURE__ */ React.createElement(Text, { style: [styles.weekTitle, long && styles.weekTitleLong], numberOfLines: 2, adjustsFontSizeToFit: true, minimumFontScale: 0.78 }, title);
  }
  const letters = [...title].length;
  return /* @__PURE__ */ React.createElement(Text, { style: [styles.weekTitle, long && styles.weekTitleLong], numberOfLines: 2, adjustsFontSizeToFit: true, minimumFontScale: 0.78, accessible: true, accessibilityLabel: title }, [...title].map((letter, index) => {
    const progress = (index + 1) / (letters + 1);
    const width = Math.min(0.095, 2.5 / (letters + 1));
    const range = [0, progress - width, progress, progress + width, 1];
    const peak = isDark ? COLORS.textOnAccent : COLORS.accent;
    return /* @__PURE__ */ React.createElement(Animated.Text, { key: index, accessible: false, style: isDark ? {
      color: sweep.interpolate({ inputRange: range, outputRange: [COLORS.textPrimary, COLORS.textPrimary, peak, COLORS.textPrimary, COLORS.textPrimary] }),
      textShadowColor: sweep.interpolate({ inputRange: range, outputRange: [COLORS.bg0, COLORS.bg0, COLORS.accent, COLORS.bg0, COLORS.bg0] }),
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 6
    } : {
      color: sweep.interpolate({ inputRange: range, outputRange: [COLORS.textPrimary, COLORS.textPrimary, peak, COLORS.textPrimary, COLORS.textPrimary] })
    } }, letter);
  }));
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
  return /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      style: [styles.sectionHeader, !section.unlocked && styles.sectionHeaderLocked],
      onPress,
      activeOpacity: 0.9,
      accessibilityRole: "button",
      accessibilityLabel: `Preview Section ${section.index + 1}, ${title}. ${section.completedCount} of 30 lessons complete`
    },
    /* @__PURE__ */ React.createElement(View, { style: styles.sectionHeaderCopy }, /* @__PURE__ */ React.createElement(Text, { style: [styles.sectionEyebrow, !section.unlocked && styles.lockedText] }, "SECTION ", section.index + 1), /* @__PURE__ */ React.createElement(Text, { style: [styles.sectionTitle, !section.unlocked && styles.lockedText], numberOfLines: 2 }, title), /* @__PURE__ */ React.createElement(Text, { style: [styles.sectionProgress, !section.unlocked && styles.lockedText] }, section.unlocked ? `${section.completedCount} / 30 lessons` : `Unlocks after Section ${section.index}`), section.unlocked && /* @__PURE__ */ React.createElement(View, { style: styles.sectionTrack }, /* @__PURE__ */ React.createElement(View, { style: [styles.sectionFill, { width: `${section.completedCount / 30 * 100}%` }] }))),
    /* @__PURE__ */ React.createElement(View, { style: styles.headerArrow }, /* @__PURE__ */ React.createElement(Feather, { name: "chevron-right", size: 26, color: section.unlocked ? COLORS.textOnAccent : COLORS.courseMutedText }))
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
  return /* @__PURE__ */ React.createElement(View, { style: [styles.coinPosition, position] }, /* @__PURE__ */ React.createElement(View, { style: styles.coinSlot }, pulse && /* @__PURE__ */ React.createElement(Animated.View, { pointerEvents: "none", style: [styles.lessonPulse, {
    opacity: pulseValue.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.18] }),
    transform: [{ scale: pulseValue.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) }]
  }] }), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress, activeOpacity: 0.82, accessibilityRole: "button", accessibilityLabel: `${label}${locked ? ", locked" : completed ? ", complete" : ""}`, style: styles.coinTouch }, /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.coinFace, { backgroundColor: fill, transform: [{ scale: emphasis ? 1.12 : 1 }] }] }, /* @__PURE__ */ React.createElement(Feather, { name: iconName, size: 29, color: iconColor }), reveal && /* @__PURE__ */ React.createElement(Animated.View, { pointerEvents: "none", style: [styles.coinIconOverlay, { opacity: reveal }] }, /* @__PURE__ */ React.createElement(Feather, { name: iconName, size: 29, color: COLORS.textOnAccent }))))), /* @__PURE__ */ React.createElement(Animated.Text, { style: [styles.coinLabel, { color: labelColor }], numberOfLines: 1 }, label));
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
  notesCompletedToday,
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
    return /* @__PURE__ */ React.createElement(View, { style: styles.sectionBlock }, /* @__PURE__ */ React.createElement(SectionHeader, { section, title, onPress: onHeader }));
  }
  const lessonDone = activeSection ? lessonCompletedToday || Boolean(lesson?.completed) : Boolean(lesson?.completed);
  const moduleComplete = (kind) => {
    if (!activeSection) return kind === "lesson" && Boolean(lesson?.completed);
    if (kind === "lesson") return lessonCompletedToday || Boolean(lesson?.completed);
    if (kind === "arena") return arenaCompletedToday;
    if (kind === "case") return caseCompletedToday;
    if (kind === "intel") return intelDone;
    if (kind === "notes") return notesCompletedToday;
    return false;
  };
  const coreCompleted = MODULES.filter((module) => moduleComplete(module.kind)).length;
  const orbitRadius = 132.5;
  const orbitCircumference = 2 * Math.PI * orbitRadius;
  const orbitOffset = orbitCircumference * (1 - coreCompleted / MODULES.length);
  const longTitle = weekTitle.length > 35;
  return /* @__PURE__ */ React.createElement(View, { style: styles.sectionBlock }, /* @__PURE__ */ React.createElement(SectionHeader, { section, title, onPress: onHeader }), /* @__PURE__ */ React.createElement(View, { style: styles.weekHeading }, /* @__PURE__ */ React.createElement(View, { style: styles.weekHeadingCopy }, /* @__PURE__ */ React.createElement(Text, { style: styles.weekEyebrow }, lessonDayLabel(section.displayDay, calendarDay, lessonDone)), !section.unlocked ? /* @__PURE__ */ React.createElement(Text, { style: [styles.weekTitle, styles.lockedText] }, weekTitle) : /* @__PURE__ */ React.createElement(MovingLessonTitle, { title: weekTitle, long: longTitle, active: isFocused && activeSection && section.unlocked && !lessonCompletedToday && !lesson?.completed }), /* @__PURE__ */ React.createElement(Text, { style: styles.lessonMeta }, marketName, " \xB7 6 min")), !section.unlocked ? /* @__PURE__ */ React.createElement(View, { style: styles.lockPill }, /* @__PURE__ */ React.createElement(Feather, { name: "lock", size: 12, color: COLORS.textMuted }), /* @__PURE__ */ React.createElement(Text, { style: styles.lockPillText }, "Unlocks after Section ", section.index)) : null), /* @__PURE__ */ React.createElement(View, { style: [styles.cluster, !section.unlocked && styles.clusterLocked] }, /* @__PURE__ */ React.createElement(Svg, { width: 268, height: 268, style: styles.orbitSvg, pointerEvents: "none" }, /* @__PURE__ */ React.createElement(Circle, { cx: 134, cy: 134, r: orbitRadius, fill: "none", stroke: COLORS.accentMedium, strokeWidth: 3 }), /* @__PURE__ */ React.createElement(
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
  )), MODULES.map((module, index) => /* @__PURE__ */ React.createElement(View, { key: `marker-${module.kind}`, style: [styles.orbitMarker, styles[`orbitMarker${index}`], moduleComplete(module.kind) && styles.orbitMarkerComplete] })), MODULES.map((module) => {
    const locked = !section.unlocked && module.kind !== "notes";
    return /* @__PURE__ */ React.createElement(
      Coin,
      {
        key: module.kind,
        label: activeSection && module.kind === "lesson" && !lessonDone ? "Start here" : module.label,
        icon: module.icon,
        position: module.position,
        locked,
        completed: module.kind === "lesson" ? lessonDone : moduleComplete(module.kind),
        emphasis: activeSection && module.kind === "lesson" && !lessonDone,
        pulse: isFocused && activeSection && module.kind === "lesson" && !lessonDone && !reduceMotion,
        muted: activeSection && module.kind !== "lesson" && !lessonDone && !moduleComplete(module.kind),
        reveal: activeSection && module.kind !== "lesson" && !moduleComplete(module.kind) && !(lessonDone && !lessonCompletedToday) ? activityReveal[["notes", "arena", "intel", "case"].indexOf(module.kind)] : void 0,
        onPress: () => onModule(module.kind)
      }
    );
  }), /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      style: styles.leoCenter,
      onPress: onLeo,
      activeOpacity: 0.82,
      accessibilityRole: "button",
      accessibilityLabel: `Ask Leo about ${title}`
    },
    /* @__PURE__ */ React.createElement(View, { style: styles.leoVisual, pointerEvents: "none" }, /* @__PURE__ */ React.createElement(LeoCharacter, { size: "course", animation: (activeSection ? lessonCompletedToday : Boolean(lesson?.completed)) ? "reading" : "sleeping", still: true }))
  )));
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
  return /* @__PURE__ */ React.createElement(Modal, { visible, animationType: "slide", presentationStyle: "pageSheet", onRequestClose: onClose }, /* @__PURE__ */ React.createElement(View, { style: styles.previewScreen }, /* @__PURE__ */ React.createElement(View, { style: styles.previewHeader }, /* @__PURE__ */ React.createElement(View, { style: styles.previewHeadingCopy }, /* @__PURE__ */ React.createElement(Text, { style: styles.previewEyebrow }, "SECTION ", section.index + 1, " \xB7 30 DAYS"), /* @__PURE__ */ React.createElement(Text, { style: styles.previewTitle, numberOfLines: 2 }, title)), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.closeButton, onPress: onClose, accessibilityLabel: "Close curriculum" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 22, color: COLORS.textPrimary }))), /* @__PURE__ */ React.createElement(ScrollView, { contentContainerStyle: styles.previewList, showsVerticalScrollIndicator: false }, !section.unlocked ? /* @__PURE__ */ React.createElement(View, { style: styles.previewNotice }, /* @__PURE__ */ React.createElement(Feather, { name: "eye", size: 18, color: COLORS.courseHeader }), /* @__PURE__ */ React.createElement(Text, { style: styles.previewNoticeText }, "Preview the curriculum now. Lessons open after the previous section\u2019s 30 lessons are complete.")) : null, sectionLessons.map((item) => {
    const calendarLocked = item.day > currentDay;
    const locked = !section.unlocked || calendarLocked || !item.stackId;
    return /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        key: item.day,
        style: [styles.lessonRow, locked && styles.lessonRowLocked],
        disabled: locked,
        onPress: () => onOpenLesson(item),
        accessibilityRole: "button",
        accessibilityLabel: `Day ${item.day}, ${item.title}${locked ? ", locked" : item.completed ? ", complete" : ""}`,
        accessibilityState: { disabled: locked }
      },
      /* @__PURE__ */ React.createElement(View, { style: [styles.dayCircle, item.completed && styles.dayCircleComplete] }, item.completed ? /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 15, color: COLORS.textOnAccent }) : /* @__PURE__ */ React.createElement(Text, { style: [styles.dayNumber, locked && styles.lockedText] }, item.day)),
      /* @__PURE__ */ React.createElement(View, { style: styles.lessonCopy }, /* @__PURE__ */ React.createElement(
        Text,
        {
          style: [styles.lessonTitle, item.title.length > 35 && styles.lessonTitleLong, locked && styles.lockedText],
          numberOfLines: 2,
          adjustsFontSizeToFit: true,
          minimumFontScale: 0.82
        },
        item.title
      ), /* @__PURE__ */ React.createElement(Text, { style: styles.lessonDescription, numberOfLines: 2 }, item.description)),
      /* @__PURE__ */ React.createElement(Feather, { name: locked ? "lock" : "chevron-right", size: 17, color: locked ? COLORS.textMuted : COLORS.courseHeader })
    );
  }))));
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
  notesCompletedToday = false,
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
      const { data, error } = await supabase.from("stacks").select("id, title, tags, created_at, authored_lesson, slides(count)").eq("market_id", marketId).contains("tags", ["MICRO_LESSON"]).not("published_at", "is", null).order("created_at", { ascending: false });
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
        if (!(stack.slides?.[0]?.count > 0) && !stack.authored_lesson) return;
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
      if (lesson?.stackId && lesson.day <= currentDay) onOpenLesson(lesson.stackId, lesson.day);
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
    return /* @__PURE__ */ React.createElement(HomeSkeleton, null);
  }
  if (loadError && loadedMarket.current !== marketId) {
    return /* @__PURE__ */ React.createElement(View, { style: styles.loading }, /* @__PURE__ */ React.createElement(Feather, { name: "wifi-off", size: 28, color: COLORS.textMuted }), /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, "Your course could not load"), /* @__PURE__ */ React.createElement(Text, { style: styles.loadingText }, "Your progress is safe. Reconnect and try again."), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.retryButton, onPress: () => setLoadKey((key) => key + 1) }, /* @__PURE__ */ React.createElement(Text, { style: styles.retryText }, "Try again")));
  }
  return /* @__PURE__ */ React.createElement(View, { style: [styles.container, { paddingTop: safeTop }] }, loadError && /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.retryButton, onPress: () => setLoadKey((key) => key + 1), accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.retryText }, "Couldn't refresh \xB7 Try again")), /* @__PURE__ */ React.createElement(
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
      ListHeaderComponent: /* @__PURE__ */ React.createElement(View, { style: [styles.topHeader, { paddingTop: 10 }] }, /* @__PURE__ */ React.createElement(
        TouchableOpacity,
        {
          style: styles.industryBadge,
          onPress: openIndustryDetails,
          activeOpacity: 0.82,
          accessibilityRole: "button",
          accessibilityLabel: `Current industry: ${marketName}. Open industry details`
        },
        /* @__PURE__ */ React.createElement(Image, { source: marketIllustration, style: styles.industryImage, resizeMode: "contain" })
      ), /* @__PURE__ */ React.createElement(View, { style: styles.badges }, /* @__PURE__ */ React.createElement(TouchableOpacity, { disabled: !rescueAvailable, onPress: () => router.push("/streak-rescue"), accessibilityLabel: rescueAvailable ? `Streak rescue, ${streakCountdown || "available now"}` : `${streak}-day streak` }, /* @__PURE__ */ React.createElement(StreakBadge, { count: streak })), streakCountdown ? /* @__PURE__ */ React.createElement(Text, { style: styles.streakCountdown, accessibilityLabel: `${streakCountdown} left to study today` }, streakCountdown) : null, /* @__PURE__ */ React.createElement(XPBadge, { xp: totalXp, level }))),
      renderItem: ({ item: section }) => {
        const activeSection = section.index === focusedSectionIndex;
        const creditedLesson = activeSection && lessonCompletedToday ? lessons.find((entry) => entry.stackId === completedTodayStackId) : void 0;
        const lesson = creditedLesson || lessons.find((entry) => entry.day === section.displayDay);
        const displayedLesson = lesson;
        const sectionLead = lessons.find((entry) => entry.day === section.startDay);
        const weekTitle = section.unlocked ? displayedLesson?.stackId ? displayedLesson.title : "Lesson not available yet" : themes[section.index] || sectionLead?.title || dayPromise(marketId, section.startDay);
        return /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(
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
            notesCompletedToday,
            intelDone: intelReadToday >= intelTarget,
            onHeader: () => setPreviewSection(section),
            onLeo: () => onAskLeo(section.displayDay),
            onModule: (kind) => handleModule(section, lesson, kind)
          }
        ), activeSection && lessonCompletedToday ? /* @__PURE__ */ React.createElement(View, { style: styles.completionNotice, accessibilityRole: "text" }, /* @__PURE__ */ React.createElement(Feather, { name: "check-circle", size: 16, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.completionNoticeText }, "Today's done. Your streak is safe.")) : null, activeSection ? belowToday : null);
      }
    }
  ), /* @__PURE__ */ React.createElement(
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
        if (lesson.stackId) onOpenLesson(lesson.stackId, lesson.day);
      }
    }
  ), /* @__PURE__ */ React.createElement(
    Modal,
    {
      visible: showIndustryDetails,
      transparent: true,
      animationType: "fade",
      statusBarTranslucent: true,
      onRequestClose: () => setShowIndustryDetails(false)
    },
    /* @__PURE__ */ React.createElement(View, { style: styles.industryModal }, /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: styles.industryBackdrop,
        onPress: () => setShowIndustryDetails(false),
        accessibilityLabel: "Close industry details"
      }
    ), /* @__PURE__ */ React.createElement(View, { style: styles.industrySheet, accessibilityViewIsModal: true }, /* @__PURE__ */ React.createElement(View, { style: styles.industryHandle }), /* @__PURE__ */ React.createElement(View, { style: styles.industrySheetHeading }, /* @__PURE__ */ React.createElement(View, { style: styles.industryArtwork }, /* @__PURE__ */ React.createElement(Image, { source: marketIllustration, style: styles.industryArtworkImage, resizeMode: "contain" })), /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: styles.industryClose,
        onPress: () => setShowIndustryDetails(false),
        accessibilityLabel: "Close industry details"
      },
      /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 20, color: COLORS.textSecondary })
    )), /* @__PURE__ */ React.createElement(Text, { style: styles.industryEyebrow }, "YOUR INDUSTRY"), /* @__PURE__ */ React.createElement(Text, { style: styles.industryTitle }, marketName), marketDescription ? /* @__PURE__ */ React.createElement(Text, { style: styles.industryDescription }, marketDescription) : null, /* @__PURE__ */ React.createElement(View, { style: styles.industryDivider }), /* @__PURE__ */ React.createElement(View, { style: styles.industryProgressRow }, /* @__PURE__ */ React.createElement(View, { style: styles.industryProgressIcon }, /* @__PURE__ */ React.createElement(Feather, { name: "book-open", size: 18, color: COLORS.accent })), /* @__PURE__ */ React.createElement(View, { style: styles.industryProgressCopy }, /* @__PURE__ */ React.createElement(Text, { style: styles.industryProgressTitle }, "Your course"), /* @__PURE__ */ React.createElement(Text, { style: styles.industryProgressDetail }, lessons.filter((item) => item.completed).length, " of ", TOTAL_DAYS, " lessons complete \xB7 ", themes[focusedSectionIndex] || "Foundations"))), /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: styles.industryAction,
        onPress: () => {
          setShowIndustryDetails(false);
          setPreviewSection(sections[focusedSectionIndex] || null);
        },
        accessibilityRole: "button",
        accessibilityLabel: `Explore ${marketName} course`
      },
      /* @__PURE__ */ React.createElement(Text, { style: styles.industryActionText }, "Explore course"),
      /* @__PURE__ */ React.createElement(Feather, { name: "arrow-right", size: 18, color: COLORS.textOnAccent })
    ), /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: styles.industrySecondaryAction,
        onPress: () => {
          setShowIndustryDetails(false);
          router.push("/(tabs)/roadmap");
        },
        accessibilityRole: "button",
        accessibilityLabel: `Read ${marketName} industry intel`
      },
      /* @__PURE__ */ React.createElement(Feather, { name: "radio", size: 18, color: COLORS.accent }),
      /* @__PURE__ */ React.createElement(Text, { style: styles.industrySecondaryText }, "Read industry intel"),
      /* @__PURE__ */ React.createElement(Feather, { name: "arrow-up-right", size: 16, color: COLORS.textMuted })
    )))
  ));
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
