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
import { triggerHaptic } from '../../lib/haptics';
import { playSound } from '../../lib/sounds';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { useUserXP, XP_REWARDS } from '../../hooks/useUserXP';
import { supabase } from '../../lib/supabase';
import { getMarketName } from '../../lib/markets';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';

interface PracticeStats {
  gamesPlayed: number;
  drillsCompleted: number;
  trainerAttempts: number;
}

const PRACTICE_MODES = [
  {
    key: 'games',
    icon: 'play-circle' as const,
    title: 'Trivia Games',
    subtitle: 'Test your market knowledge with interactive quizzes',
    color: '#8B5CF6',
    route: '/games',
    xpKey: 'GAME_COMPLETE' as const,
    statKey: 'gamesPlayed' as const,
  },
  {
    key: 'drills',
    icon: 'zap' as const,
    title: 'Speed Drills',
    subtitle: 'Race the clock with rapid-fire questions',
    color: '#F59E0B',
    route: '/drills',
    xpKey: 'DRILL_CORRECT' as const,
    statKey: 'drillsCompleted' as const,
  },
  {
    key: 'trainer',
    icon: 'target' as const,
    title: 'Scenario Trainer',
    subtitle: 'Navigate real-world strategy decisions',
    color: '#22C55E',
    route: '/trainer',
    xpKey: 'TRAINER_COMPLETE' as const,
    statKey: 'trainerAttempts' as const,
  },
];

const RESOURCES = [
  { icon: 'file-text' as const, label: 'Summaries', route: '/summaries', color: '#3B82F6' },
  { icon: 'shield' as const, label: 'Regulatory Hub', route: '/regulatory-hub', color: '#EF4444' },
  { icon: 'edit-3' as const, label: 'Notebook', route: '/(tabs)/notebook', color: '#8B5CF6' },
  { icon: 'globe' as const, label: 'Passport', route: '/passport', color: '#F59E0B' },
];

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

        {/* Leo encouragement */}
        <View style={styles.leoRow}>
          <LeoCharacter size="sm" animation="idle" />
          <View style={styles.leoBubble}>
            <Text style={styles.leoText}>
              {totalToday > 0
                ? "You're on a roll! Keep practicing 💪"
                : "Pick a mode and sharpen your skills!"}
            </Text>
          </View>
        </View>

        {/* Practice Modes — clean linear rows */}
        <Text style={styles.sectionLabel}>CHOOSE YOUR MODE</Text>

        {PRACTICE_MODES.map((mode, idx) => (
          <TouchableOpacity
            key={mode.key}
            style={styles.modeRow}
            onPress={() => { triggerHaptic('light'); router.push(mode.route as any); }}
            activeOpacity={0.7}
          >
            <View style={[styles.modeIcon, { backgroundColor: mode.color + '14' }]}>
              <Feather name={mode.icon} size={24} color={mode.color} />
            </View>
            <View style={styles.modeText}>
              <Text style={styles.modeTitle}>{mode.title}</Text>
              <Text style={styles.modeSub}>{mode.subtitle}</Text>
              {stats[mode.statKey] > 0 && (
                <View style={styles.modeStat}>
                  <Feather name="check-circle" size={12} color={COLORS.success} />
                  <Text style={styles.modeStatText}>{stats[mode.statKey]} today</Text>
                </View>
              )}
            </View>
            <View style={[styles.modeXP, { backgroundColor: mode.color + '14' }]}>
              <Text style={[styles.modeXPText, { color: mode.color }]}>+{XP_REWARDS[mode.xpKey]}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Resources — simple list */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>RESOURCES</Text>
        {RESOURCES.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.resourceRow}
            onPress={() => { triggerHaptic('light'); router.push(item.route as any); }}
            activeOpacity={0.7}
          >
            <View style={[styles.resourceIcon, { backgroundColor: item.color + '14' }]}>
              <Feather name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={styles.resourceLabel}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  headerTitle: { ...TYPE.hero, color: COLORS.textPrimary },
  headerSub: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 4 },
  todayBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.successSoft, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.15)',
  },
  todayBadgeText: { ...TYPE.caption, color: COLORS.success, fontWeight: '600' },

  // Leo
  leoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 24,
  },
  leoBubble: {
    flex: 1, backgroundColor: COLORS.bg1, borderRadius: 16,
    padding: 12, marginTop: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  leoText: { ...TYPE.body, color: COLORS.textSecondary, fontWeight: '500' },

  sectionLabel: { ...TYPE.overline, color: COLORS.textMuted, marginBottom: 12 },

  // Mode rows
  modeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.bg2, borderRadius: 18, padding: 16,
    marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  modeIcon: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  modeText: { flex: 1 },
  modeTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  modeSub: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  modeStat: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
  },
  modeStatText: { fontSize: 11, color: COLORS.success, fontWeight: '600' },
  modeXP: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  modeXPText: { fontSize: 13, fontWeight: '800' },

  // Resources
  resourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  resourceIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  resourceLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
});
