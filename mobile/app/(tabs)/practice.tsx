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
  ImageBackground,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { triggerHaptic } from '../../lib/haptics';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';
import { getMarketName } from '../../lib/markets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40; // Full width with 20px padding each side
const CARD_GAP = 16;
const SNAP_WIDTH = CARD_WIDTH + CARD_GAP;

interface CardData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  gradientColors: readonly [string, string, string];
  accentGlow: string;
  path: string;
  isPro?: boolean;
  heroImage?: any;
  tag?: string;
}

const ACTIVITY_CARDS: CardData[] = [
  {
    id: 'trainer',
    title: 'Trainer',
    subtitle: 'Scenario Analysis',
    description: 'Real-world case studies with expert feedback.',
    icon: 'target',
    iconColor: '#E9D5FF',
    gradientColors: ['#5B21B6', '#7C3AED', '#A78BFA'] as const,
    accentGlow: 'rgba(167, 139, 250, 0.4)',
    path: '/trainer',
    heroImage: require('../../assets/cards/trainer-hero.jpg'),
    tag: 'FEATURED',
  },
  {
    id: 'games',
    title: 'Games',
    subtitle: 'Test Your Knowledge',
    description: 'Quick MCQ challenges on real patterns.',
    icon: 'play-circle',
    iconColor: '#C7D2FE',
    gradientColors: ['#312E81', '#4338CA', '#6366F1'] as const,
    accentGlow: 'rgba(99, 102, 241, 0.4)',
    path: '/games',
    heroImage: require('../../assets/cards/games-hero.jpg'),
  },
  {
    id: 'drills',
    title: 'Drills',
    subtitle: '15-Second Challenges',
    description: 'Rapid-fire True/False for pattern recognition.',
    icon: 'zap',
    iconColor: '#FDE68A',
    gradientColors: ['#92400E', '#B45309', '#D97706'] as const,
    accentGlow: 'rgba(217, 119, 6, 0.4)',
    path: '/drills',
    heroImage: require('../../assets/cards/drills-hero.jpg'),
  },
];

const RESOURCE_CARDS: CardData[] = [
  {
    id: 'leaderboard',
    title: 'Leaderboard',
    subtitle: 'Friends & Rivals',
    description: 'Compete with friends and climb the rankings.',
    icon: 'users',
    iconColor: '#FDE68A',
    gradientColors: ['#7C2D12', '#B45309', '#F59E0B'] as const,
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    path: '/friends',
    heroImage: require('../../assets/illustrations/leaderboard-hero.png'),
    tag: 'SOCIAL',
  },
  {
    id: 'summaries',
    title: 'Summaries',
    subtitle: 'Market Digests',
    description: 'Daily and weekly recaps of your learnings.',
    icon: 'file-text',
    iconColor: '#FED7AA',
    gradientColors: ['#9A3412', '#C2410C', '#EA580C'] as const,
    accentGlow: 'rgba(234, 88, 12, 0.4)',
    path: '/summaries',
    heroImage: require('../../assets/illustrations/summaries-hero.png'),
  },
  {
    id: 'regulatory',
    title: 'Regulatory Hub',
    subtitle: 'Compliance & Policy',
    description: 'Key regulations shaping your industry.',
    icon: 'shield',
    iconColor: '#BFDBFE',
    gradientColors: ['#1E3A5F', '#1D4ED8', '#3B82F6'] as const,
    accentGlow: 'rgba(59, 130, 246, 0.4)',
    path: '/regulatory-hub',
    heroImage: require('../../assets/illustrations/regulatory-hero.png'),
  },
  {
    id: 'notebook',
    title: 'Notebook',
    subtitle: 'Your Insights',
    description: 'Captured notes and key takeaways.',
    icon: 'edit-3',
    iconColor: '#FECDD3',
    gradientColors: ['#9F1239', '#BE123C', '#E11D48'] as const,
    accentGlow: 'rgba(225, 29, 72, 0.4)',
    path: '/(tabs)/notebook',
    heroImage: require('../../assets/cards/notebook-hero.jpg'),
  },
  {
    id: 'passport',
    title: 'Passport',
    subtitle: 'Industry Credentials',
    description: 'Track verified expertise across industries.',
    icon: 'globe',
    iconColor: '#99F6E4',
    gradientColors: ['#134E4A', '#0F766E', '#0D9488'] as const,
    accentGlow: 'rgba(13, 148, 136, 0.4)',
    path: '/passport',
    heroImage: require('../../assets/illustrations/passport-hero.png'),
  },
  {
    id: 'investment',
    title: 'Investment Lab',
    subtitle: 'With Sophia Hernández',
    description: 'Real-world analysis and portfolio building.',
    icon: 'trending-up',
    iconColor: '#A7F3D0',
    gradientColors: ['#064E3B', '#047857', '#059669'] as const,
    accentGlow: 'rgba(5, 150, 105, 0.4)',
    path: '/investment-lab',
    isPro: true,
    tag: 'PRO',
    heroImage: require('../../assets/cards/investment-lab-hero.jpg'),
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
  const { isProUser: isPro } = useSubscription();

  const locked = card.isPro && !isPro;

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
    if (locked) {
      router.push('/subscription' as any);
    } else {
      router.push(card.path as any);
    }
  };

  const cardContent = (
    <View style={styles.cardInner}>
      {/* Top section: hero image full-bleed */}
      {card.heroImage ? (
        <ImageBackground
          source={card.heroImage}
          style={styles.heroImageBg}
          imageStyle={styles.heroImageStyle}
          resizeMode="cover"
        >
          {/* Dark gradient overlay for readability */}
          <View style={styles.heroOverlay} />
          
          {/* Floating tag */}
          {card.tag && (
            <View style={[styles.floatingTag, locked && styles.floatingTagPro]}>
              {locked && <Feather name="lock" size={9} color="#FFF" />}
              <Text style={styles.floatingTagText}>{card.tag}</Text>
            </View>
          )}
        </ImageBackground>
      ) : (
        <View style={[styles.heroPlaceholder, { backgroundColor: card.gradientColors[1] }]}>
          <Feather name={card.icon} size={48} color="rgba(255,255,255,0.15)" />
          {card.tag && (
            <View style={[styles.floatingTag, locked && styles.floatingTagPro]}>
              {locked && <Feather name="lock" size={9} color="#FFF" />}
              <Text style={styles.floatingTagText}>{card.tag}</Text>
            </View>
          )}
        </View>
      )}

      {/* Bottom content — glass-style panel */}
      <View style={styles.contentPanel}>
        {/* Icon + subtitle row */}
        <View style={styles.metaRow}>
          <View style={[styles.iconPill, { backgroundColor: `${card.gradientColors[1]}18` }]}>
            <Feather name={card.icon} size={13} color={card.gradientColors[1]} />
          </View>
          <Text style={[styles.subtitleText, { color: card.gradientColors[1] }]}>
            {card.subtitle}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.cardTitle}>{card.title}</Text>

        {/* Description */}
        <Text style={styles.cardDesc}>{card.description}</Text>

        {/* Arrow CTA */}
        <View style={styles.ctaRow}>
          <Text style={[styles.ctaText, { color: card.gradientColors[1] }]}>
            {locked ? 'Unlock' : 'Start'}
          </Text>
          <View style={[styles.ctaArrow, { backgroundColor: `${card.gradientColors[1]}12` }]}>
            <Feather
              name={locked ? 'lock' : 'arrow-right'}
              size={14}
              color={card.gradientColors[1]}
            />
          </View>
        </View>
      </View>

      {/* Accent border at top */}
      <View style={[styles.accentStripe, { backgroundColor: card.gradientColors[1] }]} />
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
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('selected_market')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.selected_market) setSelectedMarket(data.selected_market);
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

        {/* Activities */}
        <PremiumCarousel cards={ACTIVITY_CARDS} title="Activities" />

        {/* Resources */}
        <PremiumCarousel cards={RESOURCE_CARDS} title="Resources" />
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
    borderRadius: 22,
    ...SHADOWS.lg,
  },
  cardTouch: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
  },
  cardInner: {
    backgroundColor: COLORS.bg2,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  accentStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },

  /* Hero image area */
  heroImageBg: {
    height: 160,
    justifyContent: 'flex-end',
  },
  heroImageStyle: {
    borderTopLeftRadius: 21,
    borderTopRightRadius: 21,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderTopLeftRadius: 21,
    borderTopRightRadius: 21,
  },
  heroPlaceholder: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 21,
    borderTopRightRadius: 21,
  },

  /* Floating tag */
  floatingTag: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  floatingTagPro: {
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
  },
  floatingTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleText: {
    ...TYPE.overline,
    fontSize: 10,
  },
  cardTitle: {
    ...TYPE.h1,
    color: COLORS.textPrimary,
    marginBottom: 4,
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
    justifyContent: 'space-between',
  },
  ctaText: {
    ...TYPE.bodyBold,
    fontSize: 13,
  },
  ctaArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
