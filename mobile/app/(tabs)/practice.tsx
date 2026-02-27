import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { useUserXP, XP_REWARDS } from '../../hooks/useUserXP';
import { supabase } from '../../lib/supabase';
import { getMarketEmoji, getMarketName } from '../../lib/markets';
import { DailyNews } from '../../components/home/DailyNews';

const CARD_IMAGES: Record<string, any> = {
  games: require('../../assets/cards/games-hero.jpg'),
  drills: require('../../assets/cards/drills-hero.jpg'),
  trainer: require('../../assets/cards/trainer-hero.jpg'),
};

interface PracticeStats {
  gamesPlayed: number;
  drillsCompleted: number;
  trainerAttempts: number;
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

      // Fetch practice stats
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Practice</Text>
          <Text style={styles.headerSubtitle}>
            {selectedMarket ? `${getMarketEmoji(selectedMarket)} ${getMarketName(selectedMarket)}` : 'Select a market'}
          </Text>
        </View>

        {/* Today's stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.gamesPlayed}</Text>
            <Text style={styles.statLabel}>Games today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.drillsCompleted}</Text>
            <Text style={styles.statLabel}>Drills today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.trainerAttempts}</Text>
            <Text style={styles.statLabel}>Trainer total</Text>
          </View>
        </View>

        {/* Game Modes */}
        <Text style={styles.sectionTitle}>GAME MODES</Text>

        {/* Trivia Games — full width hero */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => router.push('/games' as any)}
          activeOpacity={0.85}
        >
          <ImageBackground
            source={CARD_IMAGES.games}
            style={styles.heroCardBg}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={[styles.heroOverlay, { backgroundColor: 'rgba(88,28,135,0.88)' }]}>
              <View style={styles.heroTagRow}>
                <View style={[styles.heroTag, { backgroundColor: 'rgba(196,181,253,0.2)' }]}>
                  <Text style={[styles.heroTagText, { color: '#C4B5FD' }]}>TRIVIA</Text>
                </View>
                <Text style={styles.heroXP}>+{XP_REWARDS.GAME_COMPLETE} XP</Text>
              </View>
              <Text style={styles.heroTitle}>Games</Text>
              <Text style={styles.heroDesc}>Test your market knowledge with trivia challenges</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* Speed Drills — full width hero */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => router.push('/drills' as any)}
          activeOpacity={0.85}
        >
          <ImageBackground
            source={CARD_IMAGES.drills}
            style={styles.heroCardBg}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={[styles.heroOverlay, { backgroundColor: 'rgba(120,53,15,0.88)' }]}>
              <View style={styles.heroTagRow}>
                <View style={[styles.heroTag, { backgroundColor: 'rgba(253,230,138,0.2)' }]}>
                  <Text style={[styles.heroTagText, { color: '#FDE68A' }]}>SPEED</Text>
                </View>
                <Text style={styles.heroXP}>+{XP_REWARDS.DRILL_CORRECT} XP/correct</Text>
              </View>
              <Text style={styles.heroTitle}>Speed Drills</Text>
              <Text style={styles.heroDesc}>Race against the clock with rapid-fire questions</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* Trainer Scenarios — full width hero */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => router.push('/trainer' as any)}
          activeOpacity={0.85}
        >
          <ImageBackground
            source={CARD_IMAGES.trainer}
            style={styles.heroCardBg}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={[styles.heroOverlay, { backgroundColor: 'rgba(6,78,59,0.88)' }]}>
              <View style={styles.heroTagRow}>
                <View style={[styles.heroTag, { backgroundColor: 'rgba(110,231,183,0.2)' }]}>
                  <Text style={[styles.heroTagText, { color: '#6EE7B7' }]}>STRATEGY</Text>
                </View>
                <Text style={styles.heroXP}>+{XP_REWARDS.TRAINER_COMPLETE} XP</Text>
              </View>
              <Text style={styles.heroTitle}>Trainer Scenarios</Text>
              <Text style={styles.heroDesc}>Real-world strategy decisions with expert feedback</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* Quick access to summaries + regulatory */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>RESOURCES</Text>
        <View style={styles.resourceRow}>
          <TouchableOpacity
            style={styles.resourceCard}
            onPress={() => router.push('/summaries' as any)}
          >
            <Text style={styles.resourceEmoji}>📰</Text>
            <Text style={styles.resourceLabel}>Summaries</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resourceCard}
            onPress={() => router.push('/regulatory-hub' as any)}
          >
            <Text style={styles.resourceEmoji}>⚗️</Text>
            <Text style={styles.resourceLabel}>Regulatory</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resourceCard}
            onPress={() => router.push('/(tabs)/notebook' as any)}
          >
            <Text style={styles.resourceEmoji}>📓</Text>
            <Text style={styles.resourceLabel}>Notebook</Text>
          </TouchableOpacity>
        </View>

        {/* Industry Intel — news feed */}
        {selectedMarket && (
          <View style={{ marginBottom: 20 }}>
            <DailyNews marketId={selectedMarket} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  headerSubtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, fontWeight: '500' },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  heroCard: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  heroCardBg: { flex: 1, justifyContent: 'flex-end' },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    borderRadius: 16,
  },
  heroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heroTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroTagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  heroXP: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  heroDesc: { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 16 },
  resourceRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  resourceCard: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  resourceEmoji: { fontSize: 22 },
  resourceLabel: { fontSize: 11, fontWeight: '500', color: COLORS.textSecondary },
});
