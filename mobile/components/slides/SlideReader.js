import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  Linking,
  Image
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { mentors } from "../../data/mentors";
import { getPrimaryMentorForMarket } from "../../data/marketConfig";
import { SlideIntroCard } from "./SlideIntroCard";
const MENTOR_IMAGES = {
  maya: require("../../assets/mentors/mentor-maya.png"),
  alex: require("../../assets/mentors/mentor-alex.png"),
  kai: require("../../assets/mentors/mentor-kai.png"),
  sophia: require("../../assets/mentors/mentor-sophia.png")
};
const MINIMUM_LESSON_TIME_SECONDS = 180;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TYPE_CONFIG = {
  LESSON: { color: "#4ADE80", bg: "rgba(34,197,94,0.15)", label: "LESSON", emoji: "" },
  NEWS: { color: "#60A5FA", bg: "rgba(59,130,246,0.15)", label: "INTEL", emoji: "\u26A1" },
  HISTORY: { color: "#FBBF24", bg: "rgba(245,158,11,0.15)", label: "HISTORY", emoji: "" }
};
function MentorCard({
  position,
  marketId,
  slideIndex,
  totalSlides,
  onChat
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const bobY = useRef(new Animated.Value(0)).current;
  const mentorId = marketId ? getPrimaryMentorForMarket(marketId) : "sophia";
  const mentor = mentors.find((m) => m.id === mentorId) || mentors[0];
  const avatarSrc = MENTOR_IMAGES[mentor.id] || MENTOR_IMAGES.sophia;
  const progress = Math.round((slideIndex + 1) / totalSlides * 100);
  const firstName = mentor.name.split(" ")[0];
  const MESSAGES = {
    first: { text: `Ready to dive in? `, sub: `${firstName} here to guide you` },
    middle: { text: `${progress}% done \u2014 keep it up! `, sub: "Great momentum \u2014 stay focused" },
    last: { text: `You crushed it! `, sub: "Tap to discuss what you learned" }
  };
  const ACCENT = {
    first: "#8B5CF6",
    middle: "#F59E0B",
    last: "#22C55E"
  };
  const msg = MESSAGES[position];
  const accent = ACCENT[position];
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 260, friction: 20, useNativeDriver: true })
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobY, { toValue: -6, duration: 1400, useNativeDriver: true }),
        Animated.timing(bobY, { toValue: 0, duration: 1400, useNativeDriver: true })
      ])
    ).start();
  }, []);
  return /* @__PURE__ */ React.createElement(Animated.View, { style: [mcStyles.card, { borderColor: accent + "40", backgroundColor: accent + "10", opacity, transform: [{ translateY }] }] }, /* @__PURE__ */ React.createElement(Animated.Image, { source: avatarSrc, style: [mcStyles.avatar, { borderColor: accent + "60", transform: [{ translateY: bobY }] }] }), /* @__PURE__ */ React.createElement(View, { style: mcStyles.textBlock }, /* @__PURE__ */ React.createElement(Text, { style: [mcStyles.greeting, { color: accent }] }, msg.text), /* @__PURE__ */ React.createElement(Text, { style: mcStyles.sub }, msg.sub), position === "last" && /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onChat, style: [mcStyles.chatBtn, { backgroundColor: accent + "25", borderColor: accent + "60" }] }, /* @__PURE__ */ React.createElement(Text, { style: [mcStyles.chatBtnText, { color: accent }] }, " Discuss with ", firstName))));
}
const mcStyles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 18, padding: 14, borderWidth: 1, marginBottom: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, resizeMode: "cover" },
  textBlock: { flex: 1 },
  greeting: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  chatBtn: { marginTop: 8, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5, alignSelf: "flex-start" },
  chatBtnText: { fontSize: 12, fontWeight: "600" }
});
const PROACTIVE_TIPS = [
  { slideIndex: 1, text: "Try to connect this concept to a company you know." },
  { slideIndex: 2, text: "Notice the pattern here \u2014 it shows up across markets." },
  { slideIndex: 3, text: "This is often asked in analyst interviews. Note it!" },
  { slideIndex: 4, text: "Consider how a startup could disrupt this dynamic." }
];
function TipBubble({ tip, marketId, onDismiss }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  const mentorId = marketId ? getPrimaryMentorForMarket(marketId) : "sophia";
  const mentor = mentors.find((m) => m.id === mentorId) || mentors[0];
  const avatarSrc = MENTOR_IMAGES[mentor.id] || MENTOR_IMAGES.sophia;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 240, friction: 20, useNativeDriver: true })
    ]).start();
  }, []);
  return /* @__PURE__ */ React.createElement(Animated.View, { style: [tipStyles.bubble, { opacity, transform: [{ translateY }] }] }, /* @__PURE__ */ React.createElement(Image, { source: avatarSrc, style: tipStyles.avatar }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: tipStyles.mentorName }, mentor.name.split(" ")[0]), /* @__PURE__ */ React.createElement(Text, { style: tipStyles.tipText }, tip)), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onDismiss, style: tipStyles.dismissBtn }, /* @__PURE__ */ React.createElement(Text, { style: tipStyles.dismissText }, "\u2715")));
}
const tipStyles = StyleSheet.create({
  bubble: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
    padding: 12,
    marginBottom: 12
  },
  avatar: { width: 36, height: 36, borderRadius: 18, resizeMode: "cover", borderWidth: 1, borderColor: "rgba(139,92,246,0.4)" },
  mentorName: { fontSize: 11, fontWeight: "700", color: "#8B5CF6", marginBottom: 2 },
  tipText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  dismissBtn: { padding: 4 },
  dismissText: { fontSize: 13, color: COLORS.textMuted }
});
function renderBody(body) {
  const paragraphs = body.split("\n").filter((p) => p.trim());
  return paragraphs.map((paragraph, idx) => {
    const isBullet = paragraph.trim().startsWith("\u2022") || paragraph.trim().startsWith("-");
    const isHeader = paragraph.trim().startsWith("##") || paragraph.trim().startsWith("**");
    let cleanText = paragraph.trim();
    if (isHeader) cleanText = cleanText.replace(/^#{1,3}\s*/, "").replace(/\*\*/g, "");
    if (isBullet) {
      return /* @__PURE__ */ React.createElement(View, { key: idx, style: bodyStyles.bulletRow }, /* @__PURE__ */ React.createElement(View, { style: bodyStyles.bulletDot }), /* @__PURE__ */ React.createElement(Text, { style: bodyStyles.bodyText }, cleanText.replace(/^[•\-]\s*/, "")));
    }
    if (isHeader) {
      return /* @__PURE__ */ React.createElement(Text, { key: idx, style: bodyStyles.sectionHeader }, cleanText);
    }
    return /* @__PURE__ */ React.createElement(Text, { key: idx, style: bodyStyles.bodyText }, cleanText);
  });
}
const bodyStyles = StyleSheet.create({
  bodyText: {
    fontSize: 17,
    color: COLORS.textSecondary,
    lineHeight: 28,
    marginBottom: 16,
    letterSpacing: 0.1
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 10
  },
  bulletRow: { flexDirection: "row", gap: 10, marginBottom: 12, alignItems: "flex-start" },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent, marginTop: 11, flexShrink: 0 }
});
function CompletionModal({
  isReview,
  hasMetMinimumTime,
  remainingMinutes,
  remainingSecondsDisplay,
  marketId,
  onComplete,
  onClose,
  timeSpentSeconds
}) {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const avatarY = useRef(new Animated.Value(0)).current;
  const mentorId = marketId ? getPrimaryMentorForMarket(marketId) : "sophia";
  const mentor = mentors.find((m) => m.id === mentorId) || mentors[0];
  const avatarSrc = MENTOR_IMAGES[mentor.id] || MENTOR_IMAGES.sophia;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 280, friction: 20, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true })
    ]).start();
    Animated.sequence([
      Animated.spring(avatarY, { toValue: -14, tension: 200, friction: 8, useNativeDriver: true }),
      Animated.spring(avatarY, { toValue: -8, tension: 200, friction: 8, useNativeDriver: true }),
      Animated.spring(avatarY, { toValue: 0, tension: 200, friction: 8, useNativeDriver: true })
    ]).start();
  }, []);
  return /* @__PURE__ */ React.createElement(Animated.View, { style: [cStyles.overlay] }, /* @__PURE__ */ React.createElement(Animated.View, { style: [cStyles.card, { transform: [{ scale }], opacity }] }, /* @__PURE__ */ React.createElement(
    Animated.Image,
    {
      source: avatarSrc,
      style: [cStyles.mentorAvatar, { transform: [{ translateY: avatarY }] }]
    }
  ), /* @__PURE__ */ React.createElement(Text, { style: cStyles.mentorName }, mentor.name), isReview ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: cStyles.emoji }), /* @__PURE__ */ React.createElement(Text, { style: cStyles.title }, "Great review session!"), /* @__PURE__ */ React.createElement(Text, { style: cStyles.sub }, "Reviewing solidifies your knowledge."), /* @__PURE__ */ React.createElement(Text, { style: cStyles.muted }, "No XP on review \u2014 but you're reinforcing expertise!")) : !hasMetMinimumTime ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: cStyles.emoji }, "\u23F1\uFE0F"), /* @__PURE__ */ React.createElement(Text, { style: cStyles.title }, "Take your time!"), /* @__PURE__ */ React.createElement(Text, { style: cStyles.sub }, "Spend at least 3 minutes to earn XP."), /* @__PURE__ */ React.createElement(View, { style: cStyles.timerBig }, /* @__PURE__ */ React.createElement(Text, { style: cStyles.timerBigText }, remainingMinutes, ":", remainingSecondsDisplay.toString().padStart(2, "0")), /* @__PURE__ */ React.createElement(Text, { style: cStyles.timerLabel }, "remaining"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: cStyles.emoji }), /* @__PURE__ */ React.createElement(Text, { style: cStyles.title }, "You're on fire!"), /* @__PURE__ */ React.createElement(Text, { style: cStyles.sub }, "Lesson complete! Your streak is building."), /* @__PURE__ */ React.createElement(View, { style: cStyles.xpBadge }, /* @__PURE__ */ React.createElement(View, { style: { flexDirection: "row", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "flask", size: 14, color: COLORS.xpBadgeIcon }), /* @__PURE__ */ React.createElement(Text, { style: cStyles.xpText }, "+50 XP earned")))), /* @__PURE__ */ React.createElement(View, { style: cStyles.btnGroup }, !isReview && !hasMetMinimumTime ? /* @__PURE__ */ React.createElement(TouchableOpacity, { style: cStyles.outlineBtn, onPress: onClose }, /* @__PURE__ */ React.createElement(Text, { style: cStyles.outlineBtnText }, "\u23F1 Keep Reading")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: cStyles.ctaBtn, onPress: onComplete }, /* @__PURE__ */ React.createElement(Text, { style: cStyles.ctaBtnText }, " Continue")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: cStyles.outlineBtn, onPress: onComplete }, /* @__PURE__ */ React.createElement(Text, { style: cStyles.outlineBtnText }, " Practice with Drills"))))));
}
const cStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(8,11,24,0.94)", justifyContent: "center", alignItems: "center", padding: 24 },
  card: { backgroundColor: COLORS.bg2, borderRadius: 28, padding: 28, borderWidth: 1, borderColor: COLORS.border, width: "100%", alignItems: "center" },
  mentorAvatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: COLORS.bg2, resizeMode: "cover", marginTop: -56, marginBottom: 6, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
  mentorName: { fontSize: 12, fontWeight: "600", color: COLORS.accent, marginBottom: 6 },
  emoji: { fontSize: 44, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary, textAlign: "center", marginBottom: 6 },
  sub: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginBottom: 8 },
  muted: { fontSize: 12, color: COLORS.textMuted, textAlign: "center" },
  timerBig: { alignItems: "center", marginTop: 8 },
  timerBigText: { fontSize: 36, fontWeight: "800", color: "#FBBF24" },
  timerLabel: { fontSize: 12, color: COLORS.textMuted },
  xpBadge: { backgroundColor: "rgba(139,92,246,0.15)", borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8, borderWidth: 1, borderColor: "rgba(139,92,246,0.3)" },
  xpText: { fontSize: 17, fontWeight: "800", color: COLORS.accent },
  btnGroup: { gap: 10, width: "100%", marginTop: 20 },
  ctaBtn: { height: 52, backgroundColor: COLORS.accent, borderRadius: 16, alignItems: "center", justifyContent: "center", shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
  ctaBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  outlineBtn: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)" },
  outlineBtnText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "600" }
});
function SlideReader({
  stackTitle,
  stackType,
  slides,
  onClose,
  onComplete,
  onSaveInsight,
  onAddNote,
  isReview = false,
  marketId,
  isProUser = true,
  onAskMentor,
  mentorName
}) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showCompletion, setShowCompletion] = useState(false);
  const [activeTip, setActiveTip] = useState(null);
  const [shownTipIndices, setShownTipIndices] = useState(/* @__PURE__ */ new Set());
  const [startTime] = useState(() => Date.now());
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const scrollRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const interval = setInterval(() => setTimeSpentSeconds(Math.floor((Date.now() - startTime) / 1e3)), 1e3);
    return () => clearInterval(interval);
  }, [startTime]);
  const hasMetMinimumTime = timeSpentSeconds >= MINIMUM_LESSON_TIME_SECONDS;
  const remainingSeconds = Math.max(0, MINIMUM_LESSON_TIME_SECONDS - timeSpentSeconds);
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingSecondsDisplay = remainingSeconds % 60;
  const isIntroSlide = currentIndex === -1;
  const currentSlide = isIntroSlide ? null : slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;
  useEffect(() => {
    if (isIntroSlide) return;
    const tip = PROACTIVE_TIPS.find((t) => t.slideIndex === currentIndex && !shownTipIndices.has(currentIndex));
    if (!tip) return;
    const timer = setTimeout(() => {
      setActiveTip(tip.text);
      setShownTipIndices((prev) => new Set(prev).add(currentIndex));
    }, 2e3);
    return () => clearTimeout(timer);
  }, [currentIndex, isIntroSlide]);
  const animateSlide = useCallback((direction, callback) => {
    slideAnim.setValue(direction * 36);
    Animated.spring(slideAnim, { toValue: 0, tension: 300, friction: 26, useNativeDriver: true }).start();
    callback();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setActiveTip(null);
  }, [slideAnim]);
  const goToNext = useCallback(() => {
    if (currentIndex < slides.length - 1) animateSlide(1, () => setCurrentIndex((prev) => prev + 1));
  }, [currentIndex, slides.length, animateSlide]);
  const goToPrev = useCallback(() => {
    if (currentIndex > -1) animateSlide(-1, () => setCurrentIndex((prev) => prev - 1));
  }, [currentIndex, animateSlide]);
  const cfg = TYPE_CONFIG[stackType];
  const progressPercent = isIntroSlide ? 0 : (currentIndex + 1) / slides.length * 100;
  const totalSlides = slides.length;
  const midpoint = Math.floor(totalSlides / 2);
  const mentorPosition = currentIndex === 0 ? "first" : currentIndex === midpoint && totalSlides > 3 ? "middle" : currentIndex === totalSlides - 1 ? "last" : null;
  return /* @__PURE__ */ React.createElement(Modal, { visible: true, animationType: "slide", presentationStyle: "fullScreen" }, /* @__PURE__ */ React.createElement(View, { style: styles.container }, /* @__PURE__ */ React.createElement(View, { style: styles.topBar }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onClose, style: styles.closeBtn }, /* @__PURE__ */ React.createElement(Text, { style: styles.closeIcon }, "\u2715")), /* @__PURE__ */ React.createElement(View, { style: [styles.typePill, { backgroundColor: cfg.bg }] }, /* @__PURE__ */ React.createElement(Text, { style: styles.typeEmoji }, cfg.emoji), /* @__PURE__ */ React.createElement(Text, { style: [styles.typeLabel, { color: cfg.color }] }, cfg.label)), !isReview && stackType === "LESSON" && !hasMetMinimumTime && !isIntroSlide && /* @__PURE__ */ React.createElement(View, { style: styles.timerPill }, /* @__PURE__ */ React.createElement(Text, { style: styles.timerText }, "\u23F1 ", remainingMinutes, ":", remainingSecondsDisplay.toString().padStart(2, "0"))), !isIntroSlide && (isReview || stackType !== "LESSON" || hasMetMinimumTime) && /* @__PURE__ */ React.createElement(Text, { style: styles.slideCounter }, currentIndex + 1, "/", slides.length)), /* @__PURE__ */ React.createElement(View, { style: styles.progressRow }, /* @__PURE__ */ React.createElement(View, { style: [styles.progressDot, { backgroundColor: currentIndex >= -1 ? cfg.color : COLORS.border }] }), slides.map((_, idx) => /* @__PURE__ */ React.createElement(
    View,
    {
      key: idx,
      style: [
        styles.progressSegment,
        { backgroundColor: idx <= currentIndex ? cfg.color : "rgba(255,255,255,0.08)" }
      ]
    }
  ))), /* @__PURE__ */ React.createElement(Text, { style: styles.stackTitle, numberOfLines: 2 }, stackTitle), /* @__PURE__ */ React.createElement(ScrollView, { ref: scrollRef, style: styles.contentScroll, contentContainerStyle: styles.contentContainer, showsVerticalScrollIndicator: false }, isIntroSlide ? (
    /* Use the proper SlideIntroCard — identical to web */
    /* @__PURE__ */ React.createElement(
      SlideIntroCard,
      {
        stackTitle,
        stackType,
        totalSlides: slides.length,
        marketId
      }
    )
  ) : /* @__PURE__ */ React.createElement(Animated.View, { style: { transform: [{ translateX: slideAnim }] } }, mentorPosition && /* @__PURE__ */ React.createElement(
    MentorCard,
    {
      position: mentorPosition,
      marketId,
      slideIndex: currentIndex,
      totalSlides,
      onChat: () => {
      }
    }
  ), activeTip && /* @__PURE__ */ React.createElement(TipBubble, { tip: activeTip, marketId, onDismiss: () => setActiveTip(null) }), /* @__PURE__ */ React.createElement(View, { style: styles.slideCard }, /* @__PURE__ */ React.createElement(View, { style: [styles.slideNumberBadge, { backgroundColor: cfg.color + "18" }] }, /* @__PURE__ */ React.createElement(Text, { style: [styles.slideNumberText, { color: cfg.color }] }, "Slide ", currentIndex + 1)), /* @__PURE__ */ React.createElement(Text, { style: styles.slideTitle }, currentSlide?.title), /* @__PURE__ */ React.createElement(View, { style: [styles.slideDivider, { backgroundColor: cfg.color + "60" }] }), currentSlide && renderBody(currentSlide.body), currentSlide?.sources && currentSlide.sources.length > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.sourcesContainer }, /* @__PURE__ */ React.createElement(Text, { style: styles.sourcesLabel }, "Sources"), /* @__PURE__ */ React.createElement(View, { style: styles.sourceChips }, currentSlide.sources.map((source, idx) => /* @__PURE__ */ React.createElement(TouchableOpacity, { key: idx, onPress: () => Linking.openURL(source.url), style: styles.sourceChip }, /* @__PURE__ */ React.createElement(Text, { style: styles.sourceChipText }, source.label, " \u2197")))))))), !isIntroSlide && /* @__PURE__ */ React.createElement(View, { style: styles.navRow }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: goToPrev, style: [styles.navBtn, currentIndex <= 0 && styles.navBtnDisabled], disabled: currentIndex <= 0 }, /* @__PURE__ */ React.createElement(Text, { style: styles.navBtnText }, "\u2039")), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: goToNext, style: [styles.navBtn, isLastSlide && styles.navBtnDisabled], disabled: isLastSlide }, /* @__PURE__ */ React.createElement(Text, { style: styles.navBtnText }, "\u203A"))), /* @__PURE__ */ React.createElement(View, { style: styles.bottomBar }, !isIntroSlide && /* @__PURE__ */ React.createElement(View, { style: styles.progressDots }, slides.map((_, i) => /* @__PURE__ */ React.createElement(
    View,
    {
      key: i,
      style: [
        styles.dot,
        i === currentIndex ? styles.dotActive : i < currentIndex ? styles.dotCompleted : styles.dotUpcoming
      ]
    }
  ))), isIntroSlide ? /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.ctaBtn, onPress: goToNext }, /* @__PURE__ */ React.createElement(Text, { style: styles.ctaBtnText }, "Begin \u2192")) : isLastSlide ? /* @__PURE__ */ React.createElement(View, { style: { gap: 8 } }, /* @__PURE__ */ React.createElement(View, { style: styles.actionRow }, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.secondaryBtn, onPress: () => currentSlide && onAddNote(currentSlide.slideNumber) }, /* @__PURE__ */ React.createElement(Text, { style: styles.secondaryBtnText }, " Note")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.secondaryBtn, onPress: () => currentSlide && onSaveInsight(currentSlide.slideNumber) }, /* @__PURE__ */ React.createElement(Text, { style: styles.secondaryBtnText }, " Save")), onAskMentor && /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.mentorCTA, onPress: onAskMentor }, /* @__PURE__ */ React.createElement(Text, { style: styles.mentorCTAText }, " ", mentorName || "Mentor"))), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.ctaBtn, onPress: () => setShowCompletion(true) }, /* @__PURE__ */ React.createElement(Text, { style: styles.ctaBtnText }, "\u2705 Complete Stack"))) : /* @__PURE__ */ React.createElement(View, { style: styles.actionRow }, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.secondaryBtn, onPress: () => currentSlide && onAddNote(currentSlide.slideNumber) }, /* @__PURE__ */ React.createElement(Text, { style: styles.secondaryBtnText }, " Note")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.secondaryBtn, onPress: () => currentSlide && onSaveInsight(currentSlide.slideNumber) }, /* @__PURE__ */ React.createElement(Text, { style: styles.secondaryBtnText }, " Save")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.nextBtn, onPress: goToNext }, /* @__PURE__ */ React.createElement(Text, { style: styles.nextBtnText }, "Next \u2192")))), /* @__PURE__ */ React.createElement(Modal, { visible: showCompletion, transparent: true, animationType: "fade" }, /* @__PURE__ */ React.createElement(
    CompletionModal,
    {
      isReview,
      hasMetMinimumTime,
      remainingMinutes,
      remainingSecondsDisplay,
      marketId,
      onComplete: () => {
        setShowCompletion(false);
        onComplete(isReview, timeSpentSeconds);
      },
      onClose: () => setShowCompletion(false),
      timeSpentSeconds
    }
  ))));
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  // Top bar
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 56, paddingBottom: 10, gap: 10 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  closeIcon: { fontSize: 16, color: COLORS.textSecondary },
  typePill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  typeEmoji: { fontSize: 12 },
  typeLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  timerPill: { marginLeft: "auto", backgroundColor: "rgba(251,191,36,0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  timerText: { fontSize: 12, color: "#FBBF24", fontWeight: "600" },
  slideCounter: { marginLeft: "auto", fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
  // Progress — segmented like web
  progressRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 3, marginBottom: 12 },
  progressDot: { width: 14, height: 4, borderRadius: 2 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  stackTitle: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary, paddingHorizontal: 16, marginBottom: 4, lineHeight: 28 },
  contentScroll: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  // Slide card
  slideCard: { backgroundColor: COLORS.bg2, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: COLORS.border },
  slideNumberBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14 },
  slideNumberText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  slideTitle: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, lineHeight: 30, marginBottom: 14 },
  slideDivider: { height: 2, borderRadius: 1, marginBottom: 20, width: 44 },
  // Sources
  sourcesContainer: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.border },
  sourcesLabel: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  sourceChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  sourceChip: { backgroundColor: COLORS.bg1, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 5 },
  sourceChipText: { fontSize: 11, color: COLORS.textMuted },
  // Nav arrows
  navRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 6 },
  navBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  navBtnDisabled: { opacity: 0.18 },
  navBtnText: { fontSize: 26, color: COLORS.textPrimary, fontWeight: "300", lineHeight: 30 },
  // Bottom actions
  bottomBar: { paddingHorizontal: 16, paddingBottom: 36, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  progressDots: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 10 },
  dot: { height: 3, borderRadius: 2 },
  dotActive: { width: 18, backgroundColor: COLORS.accent },
  dotCompleted: { width: 6, backgroundColor: COLORS.accent, opacity: 0.4 },
  dotUpcoming: { width: 6, backgroundColor: COLORS.border },
  actionRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  secondaryBtn: { flex: 1, height: 46, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  nextBtn: { flex: 1.5, height: 46, backgroundColor: COLORS.accent, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  nextBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  ctaBtn: { height: 52, backgroundColor: COLORS.accent, borderRadius: 16, alignItems: "center", justifyContent: "center", shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
  ctaBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  mentorCTA: { flex: 1, height: 46, backgroundColor: "rgba(16, 185, 129, 0.1)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(16, 185, 129, 0.3)", alignItems: "center", justifyContent: "center" },
  mentorCTAText: { fontSize: 13, fontWeight: "600", color: "#34D399" }
});
export {
  SlideReader
};
