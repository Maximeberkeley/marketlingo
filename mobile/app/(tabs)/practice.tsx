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
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { triggerHaptic } from '../../lib/haptics';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { getMarketName } from '../../lib/markets';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.82;
const CARD_GAP = 12;
const CARD_ASPECT = 4 / 3;

interface CardData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  gradient: readonly [string, string];
  path: string;
  isPro?: boolean;
  heroImage?: any;
}

const ACTIVITY_CARDS: CardData[] = [
  {
    id: 'trainer',
    title: 'Trainer',
    subtitle: 'Scenario Analysis',
    description: 'Real-world case studies with expert feedback and mental models.',
    icon: 'target',
    iconColor: '#C4B5FD',
    gradient: ['#4C1D95', '#7C3AED'] as const,
    path: '/trainer',
  },
  {
    id: 'games',
    title: 'Games',
    subtitle: 'Test Your Knowledge',
    description: 'Quick MCQ challenges based on real industry patterns.',
    icon: 'play-circle',
    iconColor: '#A5B4FC',
    gradient: ['#312E81', '#6366F1'] as const,
    path: '/games',
  },
  {
    id: 'drills',
    title: 'Drills',
    subtitle: '15-Second Challenges',
    description: 'Rapid-fire True/False to build pattern recognition.',
    icon: 'zap',
    iconColor: '#FCD34D',
    gradient: ['#78350F', '#D97706'] as const,
    path: '/drills',
  },
];

const RESOURCE_CARDS: CardData[] = [
  {
    id: 'summaries',
    title: 'Summaries',
    subtitle: 'Market Digests',
    description: 'Daily and weekly recaps of everything you\'ve learned.',
    icon: 'file-text',
    iconColor: '#FDBA74',
    gradient: ['#7C2D12', '#EA580C'] as const,
    path: '/summaries',
  },
  {
    id: 'regulatory',
    title: 'Regulatory Hub',
    subtitle: 'Compliance & Policy',
    description: 'Stay informed on key regulations shaping your industry.',
    icon: 'shield',
    iconColor: '#93C5FD',
    gradient: ['#1E3A5F', '#2563EB'] as const,
    path: '/regulatory-hub',
  },
  {
    id: 'notebook',
    title: 'Notebook',
    subtitle: 'Your Insights',
    description: 'All your captured notes and key takeaways in one place.',
    icon: 'edit-3',
    iconColor: '#FDA4AF',
    gradient: ['#881337', '#E11D48'] as const,
    path: '/(tabs)/notebook',
  },
  {
    id: 'passport',
    title: 'Passport',
    subtitle: 'Industry Credentials',
    description: 'Track your verified expertise across industries.',
    icon: 'globe',
    iconColor: '#5EEAD4',
    gradient: ['#134E4A', '#0D9488'] as const,
    path: '/passport',
  },
  {
    id: 'investment',
    title: 'Investment Lab',
    subtitle: 'Investment Scenarios',
    description: 'Real-world investment analysis and portfolio building.',
    icon: 'trending-up',
    iconColor: '#6EE7B7',
    gradient: ['#064E3B', '#059669'] as const,
    path: '/investment-lab',
    isPro: true,
  },
];

/* ─── Swipeable Carousel ─── */
function SwipeableCarousel({ cards, title }: { cards: CardData[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const idx = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
      setCurrentIndex(Math.min(Math.max(idx, 0), cards.length - 1));
    },
    [cards.length],
  );

  const scrollToIndex = useCallback((idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * (CARD_WIDTH + CARD_GAP), animated: true });
    setCurrentIndex(idx);
  }, []);

  return (
    <View style={styles.carouselContainer}>
      {/* Section header + dots */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.dots}>
          {cards.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => scrollToIndex(i)}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Horizontal scroll */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onMomentumScrollEnd={handleScroll}
      >
        {cards.map((card) => (
          <IslandCard key={card.id} card={card} />
        ))}
      </ScrollView>
    </View>
  );
}

/* ─── Island Card ─── */
function IslandCard({ card }: { card: CardData }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('is_pro_user')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.is_pro_user) setIsPro(true);
      });
  }, [user]);

  const locked = card.isPro && !isPro;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
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

  return (
    <Animated.View style={[styles.cardOuter, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={styles.cardTouch}
      >
        {/* Gradient background */}
        <View style={[styles.cardGradient, { backgroundColor: card.gradient[0] }]}>
          {/* Lighter overlay for depth */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: card.gradient[1],
                opacity: 0.4,
                borderRadius: 20,
              },
            ]}
          />

          {/* Content at bottom */}
          <View style={styles.cardContent}>
            <View style={styles.cardBadgeRow}>
              <View style={[styles.cardIconBox, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Feather name={card.icon} size={16} color={card.iconColor} />
              </View>
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              {locked && (
                <View style={styles.proBadge}>
                  <Feather name="award" size={8} color="#FFF" />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDesc}>{card.description}</Text>
          </View>

          {/* Locked overlay */}
          {locked && (
            <View style={styles.lockedOverlay} />
          )}
        </View>
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
          paddingTop: insets.top + 16,
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
            <Text style={styles.headerSub}>
              {selectedMarket ? getMarketName(selectedMarket) : 'Sharpen your skills'}
            </Text>
          </View>
        </Animated.View>

        {/* Activities Carousel */}
        <SwipeableCarousel cards={ACTIVITY_CARDS} title="Activities" />

        {/* Resources Carousel */}
        <SwipeableCarousel cards={RESOURCE_CARDS} title="Resources" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },

  header: { paddingHorizontal: 20, marginBottom: 8 },
  headerTitle: { ...TYPE.hero, color: COLORS.textPrimary },
  headerSub: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 4 },

  // Carousel
  carouselContainer: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { borderRadius: 4 },
  dotActive: { width: 20, height: 8, backgroundColor: COLORS.accent, borderRadius: 4 },
  dotInactive: { width: 8, height: 8, backgroundColor: COLORS.borderLight, borderRadius: 4 },

  scrollContent: { paddingHorizontal: 20, gap: CARD_GAP },

  // Card
  cardOuter: {
    width: CARD_WIDTH,
    borderRadius: 20,
    ...SHADOWS.md,
  },
  cardTouch: {
    width: '100%',
    aspectRatio: CARD_ASPECT,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    justifyContent: 'flex-end',
  },
  cardContent: {
    padding: 20,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
});
