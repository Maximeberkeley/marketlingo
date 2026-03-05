import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { getMarketName } from '../lib/markets';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { APP_ICONS } from '../lib/icons';

interface StampData {
  month: number;
  theme: string;
  completed: boolean;
  grade: 'A+' | 'A' | 'B' | 'C' | null;
  completedDate: string | null;
  daysCompleted: number;
  totalDays: number;
}

function getGradeFromCompletion(daysCompleted: number, totalDays: number): 'A+' | 'A' | 'B' | 'C' | null {
  if (daysCompleted === 0) return null;
  const pct = daysCompleted / totalDays;
  if (pct >= 0.95) return 'A+';
  if (pct >= 0.8) return 'A';
  if (pct >= 0.6) return 'B';
  return 'C';
}

const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
  'A+': { bg: 'rgba(250, 204, 21, 0.15)', text: '#FACC15', border: 'rgba(250, 204, 21, 0.4)' },
  A: { bg: 'rgba(52, 211, 153, 0.15)', text: '#34D399', border: 'rgba(52, 211, 153, 0.4)' },
  B: { bg: 'rgba(96, 165, 250, 0.15)', text: '#60A5FA', border: 'rgba(96, 165, 250, 0.4)' },
  C: { bg: COLORS.bg2, text: COLORS.textMuted, border: COLORS.border },
};

const STAMP_ICONS: any[] = [
  APP_ICONS.learn, APP_ICONS.concept, APP_ICONS.trainer,
  APP_ICONS.lens, APP_ICONS.achievements, APP_ICONS.progress,
];

const goalLabels: Record<string, string> = {
  career: 'Career Move',
  invest: 'Investor Lens',
  startup: 'Founder Path',
  curiosity: 'Explorer Mode',
};

export default function PassportScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [marketId, setMarketId] = useState<string | null>(null);
  const [stamps, setStamps] = useState<StampData[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [totalXP, setTotalXP] = useState(0);
  const [learningGoal, setLearningGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchPassportData();
  }, [user]);

  const fetchPassportData = async () => {
    if (!user) return;

    const [profileRes, xpRes] = await Promise.all([
      supabase.from('profiles').select('selected_market').eq('id', user.id).single(),
      supabase.from('user_xp').select('total_xp, market_id').eq('user_id', user.id),
    ]);

    const mId = profileRes.data?.selected_market;
    if (!mId) { setLoading(false); return; }
    setMarketId(mId);

    const marketXP = xpRes.data?.find((x) => x.market_id === mId);
    setTotalXP(marketXP?.total_xp || 0);

    const { data: progress } = await supabase
      .from('user_progress')
      .select('current_day, learning_goal, completed_stacks, start_date')
      .eq('user_id', user.id)
      .eq('market_id', mId)
      .single();

    let day = 1;
    if (progress?.start_date) {
      const start = new Date(progress.start_date);
      const today = new Date();
      start.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      day = Math.min(180, Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86400000) + 1));
    }
    setCurrentDay(day);
    setLearningGoal(progress?.learning_goal || null);

    const themes = ['Foundations', 'Deep Dive', 'Strategy', 'Innovation', 'Mastery', 'Leadership'];

    const builtStamps: StampData[] = themes.map((theme, i) => {
      const monthStart = i * 30 + 1;
      const monthEnd = (i + 1) * 30;
      const isCompleted = day > monthEnd;
      const isActive = day >= monthStart && day <= monthEnd;
      const daysInMonth = isCompleted ? 30 : isActive ? Math.max(0, day - monthStart) : 0;

      return {
        month: i + 1,
        theme,
        completed: isCompleted,
        grade: isCompleted || isActive ? getGradeFromCompletion(daysInMonth, 30) : null,
        completedDate: isCompleted
          ? new Date(Date.now() - (day - monthEnd) * 86400000).toLocaleDateString()
          : null,
        daysCompleted: daysInMonth,
        totalDays: 30,
      };
    });

    setStamps(builtStamps);
    setLoading(false);
  };

  const handleShare = async () => {
    const completedStamps = stamps.filter((s) => s.completed);
    const text = `My ${getMarketName(marketId || '')} Industry Passport\n\n${completedStamps
      .map((s) => `${s.theme} — Grade ${s.grade}`)
      .join('\n')}\n\n${totalXP} XP earned · Day ${currentDay}/180\n\nBuilding industry mastery on MarketLingo`;

    try {
      await Share.share({ message: text, title: 'My Industry Passport' });
    } catch {}
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const completedCount = stamps.filter((s) => s.completed).length;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.passportCard}>
          <View style={styles.passportHeader}>
            <Image source={APP_ICONS.passport} style={styles.passportIcon} />
            <Text style={styles.passportTitle}>INDUSTRY PASSPORT</Text>
            {marketId && (
              <View style={styles.marketRow}>
                <Text style={styles.marketLabel}>{getMarketName(marketId)}</Text>
              </View>
            )}
            {learningGoal && (
              <View style={styles.goalBadge}>
                <Text style={styles.goalBadgeText}>{goalLabels[learningGoal] || learningGoal}</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentDay}</Text>
              <Text style={styles.statLabel}>Day</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalXP.toLocaleString()}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedCount}/6</Text>
              <Text style={styles.statLabel}>Stamps</Text>
            </View>
          </View>

          <View style={styles.stampsGrid}>
            {stamps.map((stamp, index) => {
              const gc = stamp.grade ? gradeColors[stamp.grade] || gradeColors.C : null;
              return (
                <View
                  key={stamp.month}
                  style={[
                    styles.stampCard,
                    stamp.completed
                      ? { borderColor: 'rgba(139, 92, 246, 0.4)', backgroundColor: 'rgba(139, 92, 246, 0.05)' }
                      : stamp.grade !== null
                      ? { borderColor: COLORS.border, backgroundColor: COLORS.bg1 }
                      : { borderColor: 'rgba(100,116,139,0.2)', backgroundColor: COLORS.bg2, opacity: 0.5 },
                  ]}
                >
                  <Image
                    source={stamp.completed ? STAMP_ICONS[index] || APP_ICONS.achievements : stamp.grade !== null ? APP_ICONS.learn : APP_ICONS.progress}
                    style={[styles.stampIcon, { opacity: stamp.completed ? 1 : stamp.grade !== null ? 0.7 : 0.3 }]}
                  />
                  <Text style={styles.stampTheme} numberOfLines={1}>{stamp.theme}</Text>
                  <Text style={styles.stampMonth}>Month {stamp.month}</Text>
                  {stamp.grade ? (
                    <View style={[styles.gradeBadge, { backgroundColor: gc!.bg, borderColor: gc!.border }]}>
                      <Text style={[styles.gradeText, { color: gc!.text }]}>{stamp.grade}</Text>
                    </View>
                  ) : (
                    <View style={styles.lockedRow}>
                      <View style={styles.lockIconSmall}>
                        <View style={styles.lockBarSmall} />
                        <View style={styles.lockBodySmall} />
                      </View>
                      <Text style={styles.lockedText}>Locked</Text>
                    </View>
                  )}
                  {stamp.completedDate && (
                    <Text style={styles.completedDate}>{stamp.completedDate}</Text>
                  )}
                  {stamp.completed && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <Text style={styles.passportFooter}>
            {completedCount === 6
              ? 'Full mastery achieved — Congratulations!'
              : `${6 - completedCount} stamps remaining to complete your passport`}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
            <Text style={styles.shareBtnText}>Share Progress</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 14, color: COLORS.textSecondary },
  passportCard: {
    borderRadius: 24, borderWidth: 2, borderColor: 'rgba(139, 92, 246, 0.3)',
    backgroundColor: COLORS.bg2, overflow: 'hidden',
  },
  passportHeader: { padding: 24, paddingBottom: 16, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  passportIcon: { width: 40, height: 40, resizeMode: 'contain', marginBottom: 8 },
  passportTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 2, marginTop: 4 },
  marketRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  marketLabel: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  goalBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(139, 92, 246, 0.15)' },
  goalBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.accent },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  stampsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  stampCard: { width: '47%' as any, padding: 16, borderRadius: 16, borderWidth: 2, alignItems: 'center', position: 'relative' },
  stampIcon: { width: 32, height: 32, resizeMode: 'contain', marginBottom: 6 },
  stampTheme: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 2 },
  stampMonth: { fontSize: 10, color: COLORS.textMuted, marginBottom: 8 },
  gradeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  gradeText: { fontSize: 12, fontWeight: '800' },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockedText: { fontSize: 10, color: COLORS.textMuted },
  lockIconSmall: { alignItems: 'center' },
  lockBarSmall: { width: 6, height: 5, borderRadius: 3, borderWidth: 1, borderColor: COLORS.textMuted, borderBottomWidth: 0, marginBottom: -0.5 },
  lockBodySmall: { width: 9, height: 6, borderRadius: 1.5, backgroundColor: COLORS.textMuted },
  completedDate: { fontSize: 9, color: COLORS.textMuted, marginTop: 4 },
  checkBadge: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 12, color: '#fff', fontWeight: '700' },
  passportFooter: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 16 },
  actions: { marginTop: 20, flexDirection: 'row', gap: 10 },
  shareBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.12)', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)', alignItems: 'center',
  },
  shareBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
});
