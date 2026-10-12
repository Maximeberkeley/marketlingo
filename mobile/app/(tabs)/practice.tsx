import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { triggerHaptic } from '../../lib/haptics';
import { playSound } from '../../lib/sounds';
import { useStudiedLessons } from '../../hooks/useStudiedLessons';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { getMarketName } from '../../lib/markets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40; // Full width with 20px padding each side
const CARD_GAP = 16;
const SNAP_WIDTH = CARD_WIDTH + CARD_GAP;

interface CardData {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  path: string;
  isPro?: boolean;
}

const ACTIVITY_CARDS: CardData[] = [
  {
    id: 'arena',
    title: 'Daily quiz',
    description: 'Quick questions on what you studied.',
    icon: 'zap',
    path: '/arena',
  },
  {
    id: 'deep-case',
    title: 'Case',
    description: 'A real situation. What would you do?',
    icon: 'briefcase',
    path: '/deep-case',
  },
];

const LAB_CARDS: CardData[] = [
  {
    id: 'interview-lab',
    title: 'Interview practice',
    description: 'Answer a question. Get useful feedback.',
    icon: 'mic',
    path: '/interview-lab',
  },
  {
    id: 'investment',
    title: 'Investment Lab',
    description: 'Would you invest in this company?',
    icon: 'trending-up',
    path: '/investment-lab',
  },
];

/* ─── Premium Carousel ─── */
function PremiumCarousel({ cards, title }: { cards: CardData[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const idx = Math.round(offsetX / SNAP_WIDTH);
      setCurrentIndex(Math.min(Math.max(idx, 0), cards.length - 1));
    },
    [cards.length],
  );

  const scrollToIndex = useCallback((idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * SNAP_WIDTH, animated: true });
    setCurrentIndex(idx);
  }, []);

  return (
    <View style={styles.carouselWrap}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {/* Pill-style page indicator */}
        <View style={styles.pageIndicator}>
          {cards.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => scrollToIndex(i)}
              hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
            >
              <Animated.View
                style={[
                  styles.indicatorDot,
                  i === currentIndex && styles.indicatorDotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Cards */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onMomentumScrollEnd={handleScroll}
      >
        {cards.map((card, index) => (
          <PremiumCard key={card.id} card={card} index={index} />
        ))}
      </ScrollView>
    </View>
  );
}

/* ─── Premium Card ─── */
function PremiumCard({ card, index }: { card: CardData; index: number }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 400,
      friction: 25,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 400,
      friction: 25,
    }).start();
  };

  const onPress = () => {
    triggerHaptic('light');
    playSound('tap').catch(() => {});
    router.push(card.path as any);
  };

  const cardContent = (
    <View style={styles.cardInner}>
      <View style={styles.contentPanel}>
        <View style={styles.metaRow}>
          <View style={styles.iconPill}>
            <Feather name={card.icon} size={16} color={COLORS.accent} />
          </View>
          <Text style={styles.cardTitle}>{card.title}</Text>
        </View>
        <Text style={styles.cardDesc} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{card.description}</Text>
        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>Start</Text>
          <Feather name="arrow-right" size={16} color={COLORS.accent} />
        </View>
      </View>
    </View>
  );

  return (
    <Animated.View style={[styles.cardOuter, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={styles.cardTouch}
      >
        {cardContent}
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ─── Main Screen ─── */
export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<string | null>(null);
  const studied = useStudiedLessons(selectedMarket || undefined);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('selected_market')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.selected_market) {
          setSelectedMarket(data.selected_market);
          supabase.from('user_progress').select('learning_goal').eq('user_id', user.id).eq('market_id', data.selected_market).maybeSingle()
            .then(({ data: prog }) => setGoal((prog as any)?.learning_goal || null));
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
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View>
            <Text style={styles.headerTitle}>Practice</Text>
            {selectedMarket && (
              <View style={styles.marketBadge}>
                <View style={styles.marketDot} />
                <Text style={styles.marketBadgeText}>{getMarketName(selectedMarket)}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        <View style={styles.groundedBand}>
          <View style={styles.groundedIcon}>
            <Feather name={studied.lessons.length > 0 ? 'check-circle' : 'book-open'} size={18} color={studied.lessons.length > 0 ? COLORS.success : COLORS.accent} />
          </View>
          <View style={styles.groundedCopy}>
            <Text style={styles.groundedLabel}>BUILT FROM YOUR COURSE</Text>
            <Text style={styles.groundedTitle} numberOfLines={2}>
              {studied.isLoading
                ? 'Finding the concepts you own…'
                : studied.lessons.length > 0
                  ? `Practice ${studied.lessons[0].title}`
                  : 'Complete your first lesson to unlock practice'}
            </Text>
            {studied.lessons.length === 0 && !studied.isLoading && (
              <Text style={styles.groundedBody}>
                Arena and Deep Case stay locked until they can test something you actually studied.
              </Text>
            )}
          </View>
        </View>

        {studied.lessons.length > 0 ? <PremiumCarousel cards={ACTIVITY_CARDS} title="From your lessons" /> : null}

        {/* Labs */}
        <PremiumCarousel cards={LAB_CARDS.filter(card => card.id !== 'investment' || goal === 'invest')} title="More practice" />

      </ScrollView>
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },

  /* Header */
  header: { paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: {
    ...TYPE.hero,
    fontSize: 32,
    color: COLORS.textPrimary,
    letterSpacing: -0.8,
  },
  marketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.accentSoft,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  marketDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  marketBadgeText: {
    ...TYPE.caption,
    color: COLORS.accent,
    fontSize: 11,
  },
  groundedBand: { marginHorizontal: 20, marginBottom: 22, paddingVertical: 14, borderTopWidth: 2, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.accent, borderBottomColor: COLORS.border, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  groundedIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  groundedCopy: { flex: 1 },
  groundedLabel: { ...TYPE.overline, color: COLORS.accent },
  groundedTitle: { ...TYPE.h3, color: COLORS.textPrimary, marginTop: 3 },
  groundedBody: { ...TYPE.caption, color: COLORS.textSecondary, marginTop: 4, lineHeight: 17 },

  /* Carousel */
  carouselWrap: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  sectionTitle: {
    ...TYPE.h3,
    color: COLORS.textPrimary,
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bg1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.borderLight,
  },
  indicatorDotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: CARD_GAP,
  },

  /* Card */
  cardOuter: {
    width: CARD_WIDTH,
    borderRadius: 8,
    ...SHADOWS.lg,
  },
  cardTouch: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardInner: {
    backgroundColor: COLORS.bg2,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  /* Content panel */
  contentPanel: {
    padding: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  iconPill: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...TYPE.h3,
    color: COLORS.textPrimary,
    flexShrink: 1,
    letterSpacing: 0,
  },
  cardDesc: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 32,
  },
  ctaText: {
    ...TYPE.bodyBold,
    fontSize: 14,
    color: COLORS.accent,
  },
});
