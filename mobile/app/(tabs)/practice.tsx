import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { useUserXP, XP_REWARDS } from '../../hooks/useUserXP';
import { supabase } from '../../lib/supabase';
import { getMarketName, getMarketColor } from '../../lib/markets';

const { width: SCREEN_W } = Dimensions.get('window');

interface PracticeStats {
  gamesPlayed: number;
  drillsCompleted: number;
  trainerAttempts: number;
}

// ── Large Brilliant-style practice card ──
const PRACTICE_MODES = [
  {
    key: 'games',
    icon: 'play-circle' as const,
    title: 'Trivia Games',
    subtitle: 'Test your market knowledge with interactive quizzes and challenges',
    color: '#8B5CF6',
    bgGradientStart: '#F3F0FF',
    route: '/games',
    xpKey: 'GAME_COMPLETE' as const,
    statKey: 'gamesPlayed' as const,
  },
  {
    key: 'drills',
    icon: 'zap' as const,
    title: 'Speed Drills',
    subtitle: 'Race the clock with rapid-fire questions to sharpen your instincts',
    color: '#F59E0B',
    bgGradientStart: '#FFFBEB',
    route: '/drills',
    xpKey: 'DRILL_CORRECT' as const,
    statKey: 'drillsCompleted' as const,
  },
  {
    key: 'trainer',
    icon: 'target' as const,
    title: 'Trainer Scenarios',
    subtitle: 'Navigate real-world strategy decisions like an industry insider',
    color: '#22C55E',
    bgGradientStart: '#F0FDF4',
    route: '/trainer',
    xpKey: 'TRAINER_COMPLETE' as const,
    statKey: 'trainerAttempts' as const,
  },
];

const RESOURCES = [
  { icon: 'file-text' as const, label: 'Summaries', route: '/summaries', color: '#3B82F6' },
  { icon: 'shield' as const, label: 'Regulatory', route: '/regulatory-hub', color: '#EF4444' },
  { icon: 'edit-3' as const, label: 'Notebook', route: '/(tabs)/notebook', color: '#8B5CF6' },
  { icon: 'globe' as const, label: 'Passport', route: '/passport', color: '#F59E0B' },
];

function PracticeCard({
  mode,
  stat,
  index,
  onPress,
}: {
  mode: typeof PRACTICE_MODES[number];
  stat: number;
  index: number;
  onPress: () => void;
}) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideUp, { toValue: 0, tension: 120, friction: 14, useNativeDriver: true }),
      ]).start();
    }, index * 150);
  }, [index]);

  return (
    <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.bigCard, { backgroundColor: mode.bgGradientStart }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => {
          Animated.spring(scaleAnim, { toValue: 0.97, tension: 300, friction: 10, useNativeDriver: true }).start();
        }}
        onPressOut={() => {
          Animated.spring(scaleAnim, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }).start();
        }}
        activeOpacity={1}
      >
        {/* Top section — icon + XP badge */}
        <View style={styles.bigCardTop}>
          <View style={[styles.bigCardIcon, { backgroundColor: mode.color + '18' }]}>
            <Feather name={mode.icon} size={28} color={mode.color} />
          </View>
          <View style={[styles.xpBadge, { backgroundColor: mode.color + '14' }]}>
            <Feather name="trending-up" size={12} color={mode.color} />
            <Text style={[styles.xpBadgeText, { color: mode.color }]}>
              +{XP_REWARDS[mode.xpKey]} XP
            </Text>
          </View>
        </View>

        {/* Title + description */}
        <Text style={styles.bigCardTitle}>{mode.title}</Text>
        <Text style={styles.bigCardSubtitle}>{mode.subtitle}</Text>

        {/* Bottom — stat + start button */}
        <View style={styles.bigCardBottom}>
          {stat > 0 && (
            <View style={styles.statBadge}>
              <Feather name="check-circle" size={14} color={COLORS.success} />
              <Text style={styles.statBadgeText}>{stat} today</Text>
            </View>
          )}
          <View style={[styles.startChip, { backgroundColor: mode.color }]}>
            <Text style={styles.startChipText}>Start</Text>
            <Feather name="arrow-right" size={14} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [stats, setStats] = useState<PracticeStats>({ gamesPlayed: 0, drillsCompleted: 0, trainerAttempts: 0 });
  const [loading, setLoading] = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchData(); }, [user]);

  useEffect(() => {
    if (!loading) {
      Animated.spring(headerAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }).start();
    }
  }, [loading]);

  const fetchData = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles').select('selected_market').eq('id', user.id).single();
    if (profile?.selected_market) {
      setSelectedMarket(profile.selected_market);
      const today = new Date().toISOString().split('T')[0];
      const { data: daily } = await supabase
        .from('daily_completions').select('games_completed, drills_completed')
        .eq('user_id', user.id).eq('market_id', profile.selected_market)
        .eq('completion_date', today).maybeSingle();
      const { count: trainerCount } = await supabase
        .from('trainer_attempts').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setStats({
        gamesPlayed: daily?.games_completed || 0,
        drillsCompleted: daily?.drills_completed || 0,
        trainerAttempts: trainerCount || 0,
      });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const totalToday = stats.gamesPlayed + stats.drillsCompleted;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }]}>
          <View>
            <Text style={styles.headerTitle}>Practice</Text>
            <Text style={styles.headerSub}>
              {selectedMarket ? getMarketName(selectedMarket) : 'Select a market'}
            </Text>
          </View>
          {totalToday > 0 && (
            <View style={styles.todayBadge}>
              <Feather name="check-circle" size={14} color={COLORS.success} />
              <Text style={styles.todayBadgeText}>{totalToday} completed</Text>
            </View>
          )}
        </Animated.View>

        {/* Practice Mode Cards — large vertical layout */}
        <Text style={styles.sectionLabel}>CHOOSE YOUR MODE</Text>

        {PRACTICE_MODES.map((mode, idx) => (
          <PracticeCard
            key={mode.key}
            mode={mode}
            stat={stats[mode.statKey] || 0}
            index={idx}
            onPress={() => router.push(mode.route as any)}
          />
        ))}

        {/* Resources grid */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>RESOURCES</Text>

        <View style={styles.resourceGrid}>
          {RESOURCES.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.resourceItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(item.route as any);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.resourceIconWrap, { backgroundColor: item.color + '10' }]}>
                <Feather name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={styles.resourceLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerTitle: { ...TYPE.hero, color: COLORS.textPrimary },
  headerSub: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 4 },

  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.successSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.15)',
  },
  todayBadgeText: { ...TYPE.caption, color: COLORS.success, fontWeight: '600' },

  sectionLabel: { ...TYPE.overline, color: COLORS.textMuted, marginBottom: 14 },

  // ── Large Brilliant-style card ──
  bigCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  bigCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bigCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  xpBadgeText: { fontSize: 12, fontWeight: '700' },
  bigCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  bigCardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  bigCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statBadgeText: { ...TYPE.caption, color: COLORS.success, fontWeight: '600' },
  startChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginLeft: 'auto',
  },
  startChipText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  // ── Resources ──
  resourceGrid: { flexDirection: 'row', gap: 10 },
  resourceItem: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    ...SHADOWS.sm,
  },
  resourceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceLabel: { ...TYPE.caption, color: COLORS.textSecondary, fontWeight: '600' },
});
