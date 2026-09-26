import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, TYPE } from '../lib/constants';
import { isDark } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ACHIEVEMENTS, tierColors } from '../data/achievements';
import { Feather } from '@expo/vector-icons';
import { getMarketName } from '../lib/markets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2;

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

interface MarketMilestone {
  id: string;
  market_id: string;
  milestone_key: string;
  title: string;
  milestone_day: number | null;
  unlocked_at: string;
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
  const [marketMilestones, setMarketMilestones] = useState<MarketMilestone[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [showAllMarkets, setShowAllMarkets] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const [{ data: userAchievements }, { data: milestoneRows }, { data: profileRow }] = await Promise.all([
        supabase.from('user_achievements').select('achievement_id, unlocked_at').eq('user_id', user.id),
        supabase.from('user_market_milestones').select('id, market_id, milestone_key, title, milestone_day, unlocked_at').eq('user_id', user.id).order('unlocked_at', { ascending: false }),
        supabase.from('profiles').select('selected_market').eq('id', user.id).maybeSingle(),
      ]);

      setSelectedMarket(profileRow?.selected_market || null);

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
      setMarketMilestones((milestoneRows || []) as MarketMilestone[]);
      setLoading(false);

    };
    fetchData();
  }, [user]);

  // Milestones are scoped to the industry you're studying; other industries roll
  // up into a single "+N elsewhere" chip so the screen stays focused.
  const industryMilestones = selectedMarket
    ? marketMilestones.filter((m) => m.market_id === selectedMarket)
    : marketMilestones;
  const otherMilestones = selectedMarket
    ? marketMilestones.filter((m) => m.market_id !== selectedMarket)
    : [];
  const visibleMilestones = showAllMarkets ? marketMilestones : industryMilestones;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

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
        {marketMilestones.length > 0 && (
          <View style={styles.milestoneSection}>
            <View style={styles.milestoneHeading}>
              <Text style={styles.tierLabel}>
                {selectedMarket && !showAllMarkets ? `${getMarketName(selectedMarket).toUpperCase()} JOURNEY` : 'MARKET JOURNEY'}
              </Text>
              {otherMilestones.length > 0 ? (
                <TouchableOpacity onPress={() => setShowAllMarkets((v) => !v)} style={styles.otherChip} activeOpacity={0.85}>
                  <Feather name={showAllMarkets ? 'chevron-up' : 'plus'} size={11} color={COLORS.accent} />
                  <Text style={styles.otherChipText}>
                    {showAllMarkets ? 'Show only my industry' : `${otherMilestones.length} in other industries`}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.milestoneCount}>{visibleMilestones.length} reached</Text>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.milestoneRow}>
              {visibleMilestones.map((milestone) => (
                <View key={milestone.id} style={styles.milestoneCard}>
                  <View style={styles.milestoneIcon}><Feather name="flag" size={18} color={COLORS.accent} /></View>
                  <Text style={styles.milestoneMarket}>{milestone.market_id.toUpperCase()}</Text>
                  <Text style={styles.milestoneTitle} numberOfLines={2}>{milestone.title}</Text>
                  <Text style={styles.milestoneDay}>{milestone.milestone_day ? `DAY ${milestone.milestone_day}` : 'MASTERED'}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

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
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.bg0,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginLeft: -8, borderRadius: 19 },
  headerTitle: { fontSize: 24, lineHeight: 29, fontWeight: '900', color: COLORS.textPrimary },
  headerSub: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginTop: 1 },
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
  otherChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
    backgroundColor: COLORS.accentSoft, borderWidth: 1, borderColor: COLORS.accentMedium,
  },
  otherChipText: { fontSize: 10, fontWeight: '700', color: COLORS.accent, letterSpacing: 0.2 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  // Tier sections
  milestoneSection: { marginBottom: 24 },
  milestoneHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  milestoneCount: { fontSize: 11, fontWeight: '700', color: COLORS.accent, marginBottom: 10 },
  milestoneRow: { gap: 10 },
  milestoneCard: { width: 142, minHeight: 132, padding: 14, borderRadius: 20, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.accentMedium },
  milestoneIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  milestoneMarket: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, marginBottom: 4 },
  milestoneTitle: { fontSize: 13, lineHeight: 17, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
  milestoneDay: { fontSize: 9, fontWeight: '900', color: COLORS.accent, marginTop: 8 },
  tierSection: { marginBottom: 28 },
  tierLabel: {
    ...TYPE.overline,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },

  // Achievement card (2-col)
  gridCard: {
    width: CARD_WIDTH,
    minHeight: 158,
    padding: 15,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: COLORS.accent,
    shadowOpacity: isDark ? 0.08 : 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 11,
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
  checkMark: { fontSize: 11, color: COLORS.textOnAccent, fontWeight: '800' },
  cardName: { ...TYPE.bodyBold, fontSize: 14, lineHeight: 18, color: COLORS.textPrimary, marginBottom: 3 },
  cardDesc: { fontSize: 11, color: COLORS.textMuted, lineHeight: 15, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  xpText: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
});
