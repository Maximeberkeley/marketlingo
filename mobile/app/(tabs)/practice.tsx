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
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { useUserXP, XP_REWARDS } from '../../hooks/useUserXP';
import { supabase } from '../../lib/supabase';
import { getMarketName, getMarketColor } from '../../lib/markets';
import { APP_ICONS } from '../../lib/icons';

interface PracticeStats {
  gamesPlayed: number;
  drillsCompleted: number;
  trainerAttempts: number;
}

// ── Animated Practice Card ──
function PracticeCard({
  icon,
  title,
  subtitle,
  xpLabel,
  accentColor,
  onPress,
  index,
  stat,
}: {
  icon: any;
  title: string;
  subtitle: string;
  xpLabel: string;
  accentColor: string;
  onPress: () => void;
  index: number;
  stat?: number;
}) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = index * 120;
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideUp, { toValue: 0, tension: 180, friction: 18, useNativeDriver: true }),
      ]).start();
    }, delay);
  }, [index]);

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, tension: 300, friction: 10, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.practiceCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={[styles.accentStripe, { backgroundColor: accentColor }]} />
        <View style={styles.practiceCardInner}>
          <View style={[styles.practiceIcon, { backgroundColor: accentColor + '12' }]}>
            <Image source={icon} style={styles.practiceIconImg} />
          </View>
          <View style={styles.practiceCardMid}>
            <Text style={styles.practiceTitle}>{title}</Text>
            <Text style={styles.practiceSub}>{subtitle}</Text>
          </View>
          <View style={styles.practiceCardRight}>
            <View style={[styles.xpChip, { backgroundColor: accentColor + '14' }]}>
              <Text style={[styles.xpChipText, { color: accentColor }]}>{xpLabel}</Text>
            </View>
            {stat !== undefined && stat > 0 && (
              <Text style={styles.statText}>{stat} today</Text>
            )}
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
  const bodyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchData(); }, [user]);

  useEffect(() => {
    if (!loading) {
      Animated.stagger(120, [
        Animated.spring(headerAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.spring(bodyAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const animStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  });

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
  const marketColor = selectedMarket ? getMarketColor(selectedMarket) : COLORS.accent;

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
        <Animated.View style={[styles.header, animStyle(headerAnim)]}>
          <View>
            <Text style={styles.headerTitle}>Practice</Text>
            <Text style={styles.headerSub}>
              {selectedMarket ? getMarketName(selectedMarket) : 'Select a market'}
            </Text>
          </View>
          {totalToday > 0 && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>{totalToday} completed</Text>
            </View>
          )}
        </Animated.View>

        {/* Motivation card — clean, no mascot */}
        <Animated.View style={animStyle(headerAnim)}>
          <View style={styles.motivationCard}>
            <View style={[styles.motivationAccent, { backgroundColor: marketColor }]} />
            <Text style={styles.motivationText}>
              {totalToday === 0
                ? "Sharpen your skills with quick challenges below."
                : totalToday >= 3
                  ? "On fire today! Keep the momentum going."
                  : "Nice start — try another round?"}
            </Text>
          </View>
        </Animated.View>

        {/* Practice Modes */}
        <Animated.View style={animStyle(bodyAnim)}>
          <Text style={styles.sectionLabel}>PRACTICE MODES</Text>

          <PracticeCard
            index={0}
            icon={APP_ICONS.games}
            title="Trivia Games"
            subtitle="Test your market knowledge"
            xpLabel={`+${XP_REWARDS.GAME_COMPLETE} XP`}
            accentColor="#8B5CF6"
            stat={stats.gamesPlayed}
            onPress={() => router.push('/games' as any)}
          />
          <PracticeCard
            index={1}
            icon={APP_ICONS.drills}
            title="Speed Drills"
            subtitle="Race the clock with rapid-fire questions"
            xpLabel={`+${XP_REWARDS.DRILL_CORRECT} XP/q`}
            accentColor="#F59E0B"
            stat={stats.drillsCompleted}
            onPress={() => router.push('/drills' as any)}
          />
          <PracticeCard
            index={2}
            icon={APP_ICONS.trainer}
            title="Trainer Scenarios"
            subtitle="Real-world strategy decisions"
            xpLabel={`+${XP_REWARDS.TRAINER_COMPLETE} XP`}
            accentColor="#22C55E"
            onPress={() => router.push('/trainer' as any)}
          />

          {/* Resources */}
          <Text style={[styles.sectionLabel, { marginTop: 28 }]}>RESOURCES</Text>

          <View style={styles.resourceGrid}>
            {[
              { icon: APP_ICONS.news, label: 'Summaries', route: '/summaries', color: '#3B82F6' },
              { icon: APP_ICONS.regulatory, label: 'Regulatory', route: '/regulatory-hub', color: '#EF4444' },
              { icon: APP_ICONS.notebook, label: 'Notebook', route: '/(tabs)/notebook', color: '#8B5CF6' },
              { icon: APP_ICONS.passport, label: 'Passport', route: '/passport', color: '#F59E0B' },
            ].map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.resourceItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(item.route as any);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.resourceIcon, { backgroundColor: item.color + '10' }]}>
                  <Image source={item.icon} style={styles.resourceIconImg} />
                </View>
                <Text style={styles.resourceLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerTitle: { ...TYPE.hero, color: COLORS.textPrimary },
  headerSub: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 4 },

  todayBadge: {
    backgroundColor: COLORS.successSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.15)',
  },
  todayBadgeText: { ...TYPE.caption, color: COLORS.success },

  motivationCard: {
    backgroundColor: COLORS.bg1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  motivationAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  motivationText: { ...TYPE.body, color: COLORS.textSecondary, paddingLeft: 8 },

  sectionLabel: { ...TYPE.overline, color: COLORS.textMuted, marginBottom: 14 },

  practiceCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  accentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  practiceCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    paddingLeft: 20,
    gap: 14,
  },
  practiceIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceIconImg: { width: 32, height: 32, resizeMode: 'contain' },
  practiceCardMid: { flex: 1 },
  practiceTitle: { ...TYPE.h3, color: COLORS.textPrimary, marginBottom: 2 },
  practiceSub: { ...TYPE.caption, color: COLORS.textMuted, fontWeight: '500' },
  practiceCardRight: { alignItems: 'flex-end', gap: 4 },
  xpChip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  xpChipText: { fontSize: 11, fontWeight: '700' },
  statText: { ...TYPE.caption, color: COLORS.textMuted, fontWeight: '500' },

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
  resourceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceIconImg: { width: 28, height: 28, resizeMode: 'contain' },
  resourceLabel: { ...TYPE.caption, color: COLORS.textSecondary, fontWeight: '600' },
});
