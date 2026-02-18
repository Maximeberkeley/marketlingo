import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ACHIEVEMENTS, tierColors } from '../data/achievements';

interface AchievementDisplay {
  id: string;
  name: string;
  description: string;
  emoji: string;
  xpReward: number;
  tier: string;
  unlocked: boolean;
  unlocked_at: string | null;
}

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementDisplay[]>([]);
  const [loading, setLoading] = useState(true);

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
        emoji: def.emoji,
        xpReward: def.xpReward,
        tier: def.tier,
        unlocked: unlockedMap.has(def.id),
        unlocked_at: unlockedMap.get(def.id) || null,
      }));

      setAchievements(merged);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalXP = achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0);

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
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.subtitle}>{unlockedCount} of {achievements.length} unlocked • {totalXP} XP earned</Text>

        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%` }]} />
          </View>
          <Text style={styles.progressText}>{achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0}%</Text>
        </View>

        {/* Tier sections */}
        {(['bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => {
          const tierAchievements = achievements.filter((a) => a.tier === tier);
          if (tierAchievements.length === 0) return null;
          const tc = tierColors[tier];
          return (
            <View key={tier} style={{ marginTop: 20 }}>
              <View style={styles.tierHeader}>
                <View style={[styles.tierBadge, { backgroundColor: tc.bg, borderColor: tc.border }]}>
                  <Text style={[styles.tierBadgeText, { color: tc.text }]}>
                    {tier === 'bronze' ? '🥉' : tier === 'silver' ? '🥈' : tier === 'gold' ? '🥇' : '💎'} {tier.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.tierCount}>
                  {tierAchievements.filter((a) => a.unlocked).length}/{tierAchievements.length}
                </Text>
              </View>
              <View style={{ gap: 8 }}>
                {tierAchievements.map((a) => (
                  <View key={a.id} style={[styles.card, { backgroundColor: a.unlocked ? tc.bg : COLORS.bg2, borderColor: a.unlocked ? tc.border : COLORS.border }, !a.unlocked && styles.cardLocked]}>
                    <View style={[styles.emojiCircle, a.unlocked && { backgroundColor: tc.bg }]}>
                      <Text style={{ fontSize: 22, opacity: a.unlocked ? 1 : 0.3 }}>{a.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, !a.unlocked && styles.textLocked]}>{a.name}</Text>
                      <Text style={styles.cardDesc}>{a.description}</Text>
                      <Text style={[styles.xpReward, a.unlocked && { color: tc.text }]}>+{a.xpReward} XP</Text>
                      {a.unlocked && a.unlocked_at && (
                        <Text style={styles.unlockedDate}>
                          Unlocked {new Date(a.unlocked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      )}
                    </View>
                    {a.unlocked && <Text style={{ fontSize: 16 }}>✅</Text>}
                    {!a.unlocked && <Text style={{ fontSize: 14, color: COLORS.textMuted }}>🔒</Text>}
                  </View>
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
  scrollContent: { paddingHorizontal: 16 },
  backText: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textMuted },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  progressBarBg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: COLORS.bg2, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.accent },
  progressText: { fontSize: 13, fontWeight: '600', color: COLORS.accent },
  tierHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  tierBadgeText: { fontSize: 11, fontWeight: '600' },
  tierCount: { fontSize: 11, color: COLORS.textMuted },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 1,
  },
  cardLocked: { opacity: 0.5 },
  emojiCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bg1,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  textLocked: { color: COLORS.textMuted },
  cardDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  xpReward: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
  unlockedDate: { fontSize: 9, color: COLORS.accent, marginTop: 2 },
});
