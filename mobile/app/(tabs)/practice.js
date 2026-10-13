import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Image,
  Dimensions
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { triggerHaptic } from "../../lib/haptics";
import { playSound } from "../../lib/sounds";
import { useStudiedLessons } from "../../hooks/useStudiedLessons";
import { COLORS, SHADOWS, TYPE } from "../../lib/constants";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { getMarketName } from "../../lib/markets";
import { INTERVIEW_ARTWORK } from "../../lib/interviewArtwork";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_GAP = 16;
const SNAP_WIDTH = CARD_WIDTH + CARD_GAP;
const ACTIVITY_CARDS = [
  {
    id: "arena",
    title: "Daily quiz",
    description: "Quick questions on what you studied.",
    icon: "zap",
    path: "/arena",
    hero: require("../../assets/cards/daily-arena-hero.jpg")
  },
  {
    id: "deep-case",
    title: "Case",
    description: "A real situation. What would you do?",
    icon: "briefcase",
    path: "/deep-case",
    hero: require("../../assets/cards/deep-case-hero.jpg")
  }
];
const LAB_CARDS = [
  {
    id: "interview-lab",
    title: "Interview practice",
    description: "Answer a question. Get useful feedback.",
    icon: "mic",
    path: "/interview-lab",
    hero: INTERVIEW_ARTWORK.practice
  },
  {
    id: "investment",
    title: "Investment Lab",
    description: "Would you invest in this company?",
    icon: "trending-up",
    path: "/investment-lab"
  }
];
function PremiumCarousel({ cards, title }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);
  const handleScroll = useCallback(
    (e) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const idx = Math.round(offsetX / SNAP_WIDTH);
      setCurrentIndex(Math.min(Math.max(idx, 0), cards.length - 1));
    },
    [cards.length]
  );
  const scrollToIndex = useCallback((idx) => {
    scrollRef.current?.scrollTo({ x: idx * SNAP_WIDTH, animated: true });
    setCurrentIndex(idx);
  }, []);
  return /* @__PURE__ */ React.createElement(View, { style: styles.carouselWrap }, /* @__PURE__ */ React.createElement(View, { style: styles.sectionHeader }, /* @__PURE__ */ React.createElement(View, { style: styles.sectionTitleRow }, /* @__PURE__ */ React.createElement(View, { style: styles.sectionDot }), /* @__PURE__ */ React.createElement(Text, { style: styles.sectionTitle }, title)), /* @__PURE__ */ React.createElement(View, { style: styles.pageIndicator }, cards.map((_, i) => /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      key: i,
      onPress: () => scrollToIndex(i),
      hitSlop: { top: 10, bottom: 10, left: 4, right: 4 }
    },
    /* @__PURE__ */ React.createElement(
      Animated.View,
      {
        style: [
          styles.indicatorDot,
          i === currentIndex && styles.indicatorDotActive
        ]
      }
    )
  )))), /* @__PURE__ */ React.createElement(
    ScrollView,
    {
      ref: scrollRef,
      horizontal: true,
      pagingEnabled: false,
      showsHorizontalScrollIndicator: false,
      snapToInterval: SNAP_WIDTH,
      decelerationRate: "fast",
      contentContainerStyle: styles.scrollContent,
      onMomentumScrollEnd: handleScroll
    },
    cards.map((card, index) => /* @__PURE__ */ React.createElement(PremiumCard, { key: card.id, card, index }))
  ));
}
function PremiumCard({ card, index }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 400,
      friction: 25
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 400,
      friction: 25
    }).start();
  };
  const onPress = () => {
    triggerHaptic("light");
    playSound("tap").catch(() => {
    });
    router.push(card.path);
  };
  const cardContent = /* @__PURE__ */ React.createElement(View, { style: styles.cardInner }, card.hero ? /* @__PURE__ */ React.createElement(
    Image,
    {
      source: card.hero,
      style: styles.cardHero,
      resizeMode: "contain",
      pointerEvents: "none"
    }
  ) : null, /* @__PURE__ */ React.createElement(View, { style: styles.contentPanel }, /* @__PURE__ */ React.createElement(View, { style: styles.metaRow }, /* @__PURE__ */ React.createElement(View, { style: styles.iconPill }, /* @__PURE__ */ React.createElement(Feather, { name: card.icon, size: 16, color: COLORS.accent })), /* @__PURE__ */ React.createElement(Text, { style: styles.cardTitle }, card.title)), /* @__PURE__ */ React.createElement(Text, { style: styles.cardDesc, numberOfLines: 1, adjustsFontSizeToFit: true, minimumFontScale: 0.85 }, card.description), /* @__PURE__ */ React.createElement(View, { style: styles.ctaRow }, /* @__PURE__ */ React.createElement(Text, { style: styles.ctaText }, "Start"), /* @__PURE__ */ React.createElement(Feather, { name: "arrow-right", size: 16, color: COLORS.accent }))));
  return /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.cardOuter, { transform: [{ scale: scaleAnim }] }] }, /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      activeOpacity: 0.92,
      onPressIn,
      onPressOut,
      onPress,
      style: styles.cardTouch
    },
    cardContent
  ));
}
function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState(null);
  const studied = useStudiedLessons(selectedMarket || void 0);
  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("selected_market").eq("id", user.id).single().then(({ data }) => {
      if (data?.selected_market) {
        setSelectedMarket(data.selected_market);
        supabase.from("user_progress").select("learning_goal").eq("user_id", user.id).eq("market_id", data.selected_market).maybeSingle().then(({ data: prog }) => setGoal(prog?.learning_goal || null));
      }
      setLoading(false);
    });
  }, [user]);
  useEffect(() => {
    if (!loading) {
      Animated.spring(headerAnim, {
        toValue: 1,
        tension: 80,
        friction: 12,
        useNativeDriver: true
      }).start();
    }
  }, [loading]);
  if (loading) {
    return /* @__PURE__ */ React.createElement(View, { style: [styles.container, styles.centered] }, /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "large", color: COLORS.accent }));
  }
  return /* @__PURE__ */ React.createElement(View, { style: styles.container }, /* @__PURE__ */ React.createElement(
    ScrollView,
    {
      contentContainerStyle: {
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 100
      },
      showsVerticalScrollIndicator: false
    },
    /* @__PURE__ */ React.createElement(
      Animated.View,
      {
        style: [
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }
            ]
          }
        ]
      },
      /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Text, { style: styles.headerTitle }, "Practice"), selectedMarket && /* @__PURE__ */ React.createElement(View, { style: styles.marketBadge }, /* @__PURE__ */ React.createElement(View, { style: styles.marketDot }), /* @__PURE__ */ React.createElement(Text, { style: styles.marketBadgeText }, getMarketName(selectedMarket))))
    ),
    /* @__PURE__ */ React.createElement(View, { style: styles.groundedBand }, /* @__PURE__ */ React.createElement(View, { style: styles.groundedIcon }, /* @__PURE__ */ React.createElement(Feather, { name: studied.lessons.length > 0 ? "check-circle" : "book-open", size: 18, color: studied.lessons.length > 0 ? COLORS.success : COLORS.accent })), /* @__PURE__ */ React.createElement(View, { style: styles.groundedCopy }, /* @__PURE__ */ React.createElement(Text, { style: styles.groundedLabel }, "BUILT FROM YOUR COURSE"), /* @__PURE__ */ React.createElement(Text, { style: styles.groundedTitle, numberOfLines: 2 }, studied.isLoading ? "Finding the concepts you own\u2026" : studied.lessons.length > 0 ? `Practice ${studied.lessons[0].title}` : "Complete your first lesson to unlock practice"), studied.lessons.length === 0 && !studied.isLoading && /* @__PURE__ */ React.createElement(Text, { style: styles.groundedBody }, "Arena and Deep Case stay locked until they can test something you actually studied."))),
    studied.lessons.length > 0 ? /* @__PURE__ */ React.createElement(PremiumCarousel, { cards: ACTIVITY_CARDS, title: "From your lessons" }) : null,
    /* @__PURE__ */ React.createElement(PremiumCarousel, { cards: LAB_CARDS.filter((card) => card.id !== "investment" || goal === "invest"), title: "More practice" })
  ));
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: "center", justifyContent: "center" },
  /* Header */
  header: { paddingHorizontal: 20, marginBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerTitle: {
    ...TYPE.hero,
    fontSize: 32,
    color: COLORS.textPrimary,
    letterSpacing: -0.8
  },
  marketBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.accentSoft,
    borderRadius: 20,
    alignSelf: "flex-start"
  },
  marketDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent
  },
  marketBadgeText: {
    ...TYPE.caption,
    color: COLORS.accent,
    fontSize: 11
  },
  groundedBand: { marginHorizontal: 20, marginBottom: 22, paddingVertical: 14, borderTopWidth: 2, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.accent, borderBottomColor: COLORS.border, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  groundedIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg1, alignItems: "center", justifyContent: "center" },
  groundedCopy: { flex: 1 },
  groundedLabel: { ...TYPE.overline, color: COLORS.accent },
  groundedTitle: { ...TYPE.h3, color: COLORS.textPrimary, marginTop: 3 },
  groundedBody: { ...TYPE.caption, color: COLORS.textSecondary, marginTop: 4, lineHeight: 17 },
  /* Carousel */
  carouselWrap: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  sectionDot: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: COLORS.accent
  },
  sectionTitle: {
    ...TYPE.h3,
    color: COLORS.textPrimary
  },
  pageIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.bg1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.borderLight
  },
  indicatorDotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: CARD_GAP
  },
  /* Card */
  cardOuter: {
    width: CARD_WIDTH,
    borderRadius: 8,
    ...SHADOWS.lg
  },
  cardTouch: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden"
  },
  cardInner: {
    backgroundColor: COLORS.bg2,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border
  },
  /* Illustration band at the top of the card */
  cardHero: {
    width: "100%",
    height: 140,
    backgroundColor: "#F3EEFA"
  },
  /* Content panel */
  contentPanel: {
    padding: 18
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10
  },
  iconPill: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  cardTitle: {
    ...TYPE.h3,
    color: COLORS.textPrimary,
    flexShrink: 1,
    letterSpacing: 0
  },
  cardDesc: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: 14
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 32
  },
  ctaText: {
    ...TYPE.bodyBold,
    fontSize: 14,
    color: COLORS.accent
  }
});
export {
  PracticeScreen as default
};
