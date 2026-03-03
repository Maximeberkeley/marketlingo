import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { useUserXP, XP_REWARDS } from '../../hooks/useUserXP';
import { supabase } from '../../lib/supabase';
import { getMarketEmoji, getMarketName } from '../../lib/markets';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';

const LEO_IMAGE = require('../../assets/mascot/leo-reference.png');

interface PracticeStats {
  gamesPlayed: number;
  drillsCompleted: number;
  trainerAttempts: number;
}

// ── Animated Practice Card ──
function PracticeCard({
  emoji,
  title,
  subtitle,
  xpLabel,
  accentColor,
  onPress,
  index,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  xpLabel: string;
  accentColor: string;
  onPress: () => void;
  index: number;
}) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    const delay = index * 100;
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideUp, { toValue: 0, tension: 180, friction: 18, useNativeDriver: true }),
      ]).start();
    }, delay);
  }, [index]);

  return (
    <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
      <TouchableOpacity
        style={[styles.practiceCard, { borderLeftColor: accentColor, borderLeftWidth: 4 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.8}
      >
        <View style={styles.practiceCardLeft}>
          <Text style={styles.practiceEmoji}>{emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.practiceTitle}>{title}</Text>
            <Text style={styles.practiceSub}>{subtitle}</Text>
          </View>
        </View>
        <View style={[styles.xpChip, { backgroundColor: accentColor + '20' }]}>
          <Text style={[styles.xpChipText, { color: accentColor }]}>{xpLabel}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Stat Pill ──
function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [stats, setStats] = useState<PracticeStats>({ gamesPlayed: 0, drillsCompleted: 0, trainerAttempts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('selected_market')
      .eq('id', user.id)
      .single();

    if (profile?.selected_market) {
      setSelectedMarket(profile.selected_market);

      const today = new Date().toISOString().split('T')[0];
      const { data: daily } = await supabase
        .from('daily_completions')
        .select('games_completed, drills_completed')
        .eq('user_id', user.id)
        .eq('market_id', profile.selected_market)
        .eq('completion_date', today)
        .maybeSingle();

      const { count: trainerCount } = await supabase
        .from('trainer_attempts')
        .select('id', { count: 'exact', head: true })
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
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Practice</Text>
            <Text style={styles.headerSub}>
              {selectedMarket
                ? `${getMarketEmoji(selectedMarket)} ${getMarketName(selectedMarket)}`
                : 'Select a market'}
            </Text>
          </View>
        </View>

        {/* ── Leo Encouragement ── */}
        <View style={styles.leoRow}>
          <Image source={LEO_IMAGE} style={styles.leoMini} />
          <View style={styles.leoBubble}>
            <Text style={styles.leoBubbleText}>
              {totalToday === 0
                ? "Let's sharpen your skills! Pick a mode below 👇"
                : totalToday >= 3
                  ? "You're on fire today! 🔥 Keep pushing!"
                  : "Nice start! Try another round? 💪"}
            </Text>
          </View>
        </View>

        {/* ── Today's Stats ── */}
        <View style={styles.statsRow}>
          <StatPill value={stats.gamesPlayed} label="Games" />
          <StatPill value={stats.drillsCompleted} label="Drills" />
          <StatPill value={stats.trainerAttempts} label="Scenarios" />
        </View>

        {/* ── Practice Modes ── */}
        <Text style={styles.sectionLabel}>PRACTICE MODES</Text>

        <PracticeCard
          index={0}
          emoji="🎮"
          title="Trivia Games"
          subtitle="Test your market knowledge"
          xpLabel={`+${XP_REWARDS.GAME_COMPLETE} XP`}
          accentColor="#8B5CF6"
          onPress={() => router.push('/games' as any)}
        />
        <PracticeCard
          index={1}
          emoji="⚡"
          title="Speed Drills"
          subtitle="Race the clock with rapid-fire questions"
          xpLabel={`+${XP_REWARDS.DRILL_CORRECT} XP/q`}
          accentColor="#F59E0B"
          onPress={() => router.push('/drills' as any)}
        />
        <PracticeCard
          index={2}
          emoji="🧠"
          title="Trainer Scenarios"
          subtitle="Real-world strategy decisions"
          xpLabel={`+${XP_REWARDS.TRAINER_COMPLETE} XP`}
          accentColor="#22C55E"
          onPress={() => router.push('/trainer' as any)}
        />

        {/* ── Resources ── */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>RESOURCES</Text>

        <View style={styles.resourceGrid}>
          {[
            { emoji: '📰', label: 'Summaries', route: '/summaries' },
            { emoji: '⚗️', label: 'Regulatory', route: '/regulatory-hub' },
            { emoji: '📓', label: 'Notebook', route: '/(tabs)/notebook' },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.resourceItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(item.route as any);
              }}
            >
              <Text style={styles.resourceEmoji}>{item.emoji}</Text>
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

  // Header
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },

  // Leo row
  leoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  leoMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    resizeMode: 'contain',
  },
  leoBubble: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  leoBubbleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statPill: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Section
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 12,
  },

  // Practice Cards
  practiceCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  practiceCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  practiceEmoji: {
    fontSize: 28,
  },
  practiceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  practiceSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  xpChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  xpChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Resources
  resourceGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  resourceItem: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  resourceEmoji: { fontSize: 24 },
  resourceLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
});
