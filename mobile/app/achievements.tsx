import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SHADOWS, TYPE } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ACHIEVEMENTS, tierColors } from '../data/achievements';
import { Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;

const FEATHER_ACHIEVE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  games: 'play-circle',
  drills: 'zap',
  trainer: 'target',
  progress: 'trending-up',
  achievements: 'award',
  streak: 'activity',
  learn: 'book-open',
  notebook: 'edit-3',
  concept: 'compass',
};

const TIER_CONFIG = {
  platinum: { label: 'PLATINUM', icon: 'star' as keyof typeof Feather.glyphMap, color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.18)' },
  gold: { label: 'GOLD', icon: 'award' as keyof typeof Feather.glyphMap, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)' },
  silver: { label: 'SILVER', icon: 'target' as keyof typeof Feather.glyphMap, color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.18)' },
  bronze: { label: 'BRONZE', icon: 'circle' as keyof typeof Feather.glyphMap, color: '#F97316', bg: 'rgba(234,88,12,0.08)', border: 'rgba(234,88,12,0.18)' },
} as const;

interface AchievementDisplay {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  tier: string;
  unlocked: boolean;
  unlocked_at: string | null;
}

function AchievementCard({ item, index }: { item: AchievementDisplay; index: number }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const tc = TIER_CONFIG[item.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze;
  const featherIcon = FEATHER_ACHIEVE_ICONS[item.icon] || 'award';

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 60,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.gridCard, {
      transform: [{ scale: scaleAnim }],
      opacity: scaleAnim,
      backgroundColor: item.unlocked ? tc.bg : COLORS.bg1,
      borderColor: item.unlocked ? tc.border : COLORS.border,
    }]}>
      <View style={styles.cardTop}>
        <View style={[styles.iconCircle, {
          backgroundColor: item.unlocked ? tc.bg : COLORS.surfaceLight,
        }]}>
          {item.unlocked ? (
            <Feather name={featherIcon} size={18} color={tc.color} />
          ) : (
            <Feather name="lock" size={14} color={COLORS.textMuted} />
          )}
        </View>
        {item.unlocked && (
          <View style={[styles.checkDot, { backgroundColor: COLORS.success }]}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        )}
      </View>

      <Text style={[styles.cardName, !item.unlocked && { color: COLORS.textMuted }]} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardFooter}>
        <Feather name="zap" size={10} color={item.unlocked ? tc.color : COLORS.textMuted} />
        <Text style={[styles.xpText, item.unlocked && { color: tc.color }]}>
          +{item.xpReward} XP
        </Text>
      </View>
    </Animated.View>
  );
}

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);

      const unlockedMap = new Map(
        (userAchievements || []).map((a) => [a.achievement_id, a.unlocked_at])
      );

      const merged = ACHIEVEMENTS.map((def) => ({
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        xpReward: def.xpReward,
        tier: def.tier,
        unlocked: unlockedMap.has(def.id),
        unlocked_at: unlockedMap.get(def.id) || null,
      }));

      setAchievements(merged);
      setLoading(false);

      const pct = merged.length > 0 ? merged.filter(a => a.unlocked).length / merged.length : 0;
      Animated.timing(progressAnim, {
        toValue: pct,
        duration: 800,
        useNativeDriver: false,
      }).start();
    };
    fetchData();
  }, [user]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progressPercent = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const tierOrder = ['platinum', 'gold', 'silver', 'bronze'] as const;

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Achievements</Text>
          <Text style={styles.headerSub}>{unlockedCount} / {achievements.length} unlocked</Text>
        </View>
        <View style={styles.countBadge}>
          <Feather name="award" size={13} color={COLORS.accent} />
          <Text style={styles.countText}>{unlockedCount}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Image
            source={require('../assets/illustrations/achievements-hero.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel}>Your Progress</Text>
              <Text style={styles.heroPercent}>{progressPercent}% Complete</Text>
            </View>
            <View style={styles.heroBadgePill}>
              <Feather name="zap" size={11} color="#FBBF24" />
              <Text style={styles.heroBadgeText}>{unlockedCount} badges</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={styles.heroProgressBg}>
            <Animated.View style={[styles.heroProgressFill, {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }]} />
          </View>
        </View>

        {/* Tier Sections with 2-col Grid */}
        {tierOrder.map((tier) => {
          const tierAchievements = achievements.filter((a) => a.tier === tier);
          if (tierAchievements.length === 0) return null;
          const tc = TIER_CONFIG[tier];

          return (
            <View key={tier} style={styles.tierSection}>
              <Text style={styles.tierLabel}>{tc.label} TIER</Text>
              <View style={styles.grid}>
                {tierAchievements.map((a, i) => (
                  <AchievementCard key={a.id} item={a} index={i} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },

  // Sticky header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg0,
  },
  backBtn: { padding: 6, marginLeft: -6 },
  headerTitle: { ...TYPE.h3, color: COLORS.textPrimary },
  headerSub: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 1 },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
  },
  countText: { ...TYPE.caption, color: COLORS.accent },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Hero banner
  heroBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    ...SHADOWS.md,
  },
  heroImage: {
    width: '100%',
    height: 140,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(120, 53, 15, 0.55)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 26,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroLeft: {},
  heroLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  heroPercent: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 },
  heroBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  heroProgressBg: {
    position: 'absolute',
    bottom: 10,
    left: 16,
    right: 16,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FBBF24',
  },

  // Tier sections
  tierSection: { marginBottom: 24 },
  tierLabel: {
    ...TYPE.overline,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },

  // Achievement card (2-col)
  gridCard: {
    width: CARD_WIDTH,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 11, color: '#fff', fontWeight: '700' },
  cardName: { ...TYPE.bodyBold, fontSize: 13, color: COLORS.textPrimary, marginBottom: 2 },
  cardDesc: { fontSize: 11, color: COLORS.textMuted, lineHeight: 15, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  xpText: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
});
