import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { getMarketName } from '../lib/markets';
import { Feather } from '@expo/vector-icons';

interface CertificateData {
  userName: string;
  completionDate: string;
  marketName: string;
  totalXP: number;
  lessonsCompleted: number;
  trainersCompleted: number;
  longestStreak: number;
  skillAreas: string[];
}

function determineSkillAreas(currentDay: number): string[] {
  const skills: string[] = [];
  if (currentDay >= 30) skills.push('Industry Fundamentals', 'Supply Chain Dynamics');
  if (currentDay >= 60) skills.push('Commercial Aviation', 'Airline Economics');
  if (currentDay >= 90) skills.push('Defense Procurement', 'Government Contracting');
  if (currentDay >= 120) skills.push('Space Commerce', 'Satellite Systems');
  if (currentDay >= 150) skills.push('Emerging Technologies', 'Sustainable Aviation');
  if (currentDay >= 180) skills.push('Aerospace Business Strategy', 'Investment Analysis');
  return skills.slice(0, 6);
}

export default function CertificateScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [data, setData] = useState<CertificateData | null>(null);
  const [isEligible, setIsEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 180 });

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      try {
        const [profileRes, progressRes, xpRes, trainerRes] = await Promise.all([
          supabase.from('profiles').select('selected_market, username').eq('id', user.id).single(),
          supabase.from('user_progress').select('*').eq('user_id', user.id),
          supabase.from('user_xp').select('*').eq('user_id', user.id),
          supabase.from('trainer_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_correct', true),
        ]);

        const marketId = profileRes.data?.selected_market;
        if (!marketId) { setLoading(false); return; }

        const prog = progressRes.data?.find((p) => p.market_id === marketId);
        const xp = xpRes.data?.find((x) => x.market_id === marketId);
        const currentDay = prog?.current_day || 1;
        const completedStacks = prog?.completed_stacks?.length || 0;

        setProgress({ current: Math.min(currentDay, 180), total: 180 });
        const eligible = currentDay >= 180 || completedStacks >= 180;
        setIsEligible(eligible);

        setData({
          userName: profileRes.data?.username || user.email?.split('@')[0] || 'Learner',
          completionDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          marketName: getMarketName(marketId),
          totalXP: xp?.total_xp || 0,
          lessonsCompleted: completedStacks,
          trainersCompleted: trainerRes.count || 0,
          longestStreak: prog?.longest_streak || 0,
          skillAreas: determineSkillAreas(currentDay),
        });
      } catch (e) {
        console.error('Certificate fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  const handleShare = async () => {
    if (!data) return;
    const text =
      `I just completed the 180-day ${data.marketName} Industry Mastery Program!\n\n` +
      `${data.totalXP.toLocaleString()} XP earned\n` +
      `${data.lessonsCompleted} lessons completed\n` +
      `${data.trainersCompleted} decision scenarios mastered\n` +
      `${data.longestStreak}-day learning streak\n\n` +
      `Key skills: ${data.skillAreas.join(', ')}\n\n` +
      `#${data.marketName.replace(/\s+/g, '')} #ProfessionalDevelopment #MarketLingo`;
    try { await Share.share({ message: text }); } catch {}
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!isEligible) {
    const pct = Math.round((progress.current / progress.total) * 100);
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Certificate</Text>
        </View>

        <View style={[styles.centered, { flex: 1 }]}>
          <View style={styles.lockedIcon}>
            <Feather name="award" size={40} color={COLORS.textMuted} />
          </View>
          <Text style={styles.lockedTitle}>Not Yet Eligible</Text>
          <Text style={styles.lockedSubtitle}>
            Complete the full 180-day program to earn your Certificate of Completion
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.progressLabel}>
              Day {progress.current} / {progress.total} ({pct}%)
            </Text>
          </View>

          <TouchableOpacity style={styles.ctaButton} onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.ctaText}>Continue Learning</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!data) return null;

  const STAT_ITEMS = [
    { icon: APP_ICONS.progress, value: data.totalXP.toLocaleString(), label: 'XP Earned' },
    { icon: APP_ICONS.learn, value: data.lessonsCompleted, label: 'Lessons' },
    { icon: APP_ICONS.trainer, value: data.trainersCompleted, label: 'Scenarios' },
    { icon: APP_ICONS.streak, value: data.longestStreak, label: 'Day Streak' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Certificate of Completion</Text>
            <Text style={styles.headerSub}>Share your achievement</Text>
          </View>
        </View>

        <View style={styles.certOuter}>
          <View style={styles.accentLine} />

          <View style={styles.certInner}>
            <View style={styles.badge}>
              <Image source={APP_ICONS.achievements} style={{ width: 36, height: 36, resizeMode: 'contain' }} />
            </View>

            <Text style={styles.certTitle}>CERTIFICATE OF COMPLETION</Text>
            <Text style={styles.certProgram}>{data.marketName} Industry Mastery Program</Text>

            <View style={styles.divider} />

            <Text style={styles.certAwardLabel}>This certifies that</Text>
            <Text style={styles.certName}>{data.userName}</Text>
            <Text style={styles.certAwardLabel}>has successfully completed the 180-day</Text>
            <Text style={styles.certMarket}>{data.marketName} Industry Mastery Program</Text>

            <View style={styles.divider} />

            <View style={styles.statsGrid}>
              {STAT_ITEMS.map((s, i) => (
                <View key={i} style={styles.statItem}>
                  <Image source={s.icon} style={styles.statIcon} />
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.skillsLabel}>Demonstrated proficiency in:</Text>
            <View style={styles.skillsWrap}>
              {data.skillAreas.map((skill, i) => (
                <View key={i} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.certDate}>Issued on {data.completionDate}</Text>
            <Text style={styles.certIssuer}>MarketLingo</Text>
          </View>

          <View style={styles.accentLine} />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkedinButton}
            onPress={async () => {
              const text =
                `I just completed the 180-day ${data.marketName} Industry Mastery Program on MarketLingo!\n\n` +
                `Key skills: ${data.skillAreas.join(', ')}\n\n#ProfessionalDevelopment`;
              try { await Share.share({ message: text }); } catch {}
            }}
          >
            <Text style={styles.linkedinText}>LinkedIn</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  scrollContent: { paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, paddingHorizontal: 4 },
  backText: { fontSize: 15, color: COLORS.textSecondary },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  lockedIcon: { width: 88, height: 88, borderRadius: 22, backgroundColor: 'rgba(245,158,11,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  lockedTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  lockedSubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', maxWidth: 280, marginBottom: 24, lineHeight: 20 },
  progressContainer: { width: '80%', marginBottom: 28 },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: COLORS.bg2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.accent },
  progressLabel: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },
  ctaButton: { backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 36, alignItems: 'center' },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  certOuter: { borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(139,92,246,0.3)', backgroundColor: COLORS.bg1, marginBottom: 16 },
  accentLine: { height: 3, backgroundColor: COLORS.accent },
  certInner: { padding: 24, alignItems: 'center' },
  badge: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(139,92,246,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: 'rgba(139,92,246,0.3)' },
  certTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: 3, marginBottom: 4 },
  certProgram: { fontSize: 10, color: COLORS.textMuted, letterSpacing: 2, textTransform: 'uppercase' },
  divider: { width: '80%', height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  certAwardLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  certName: { fontSize: 28, fontWeight: '700', color: COLORS.accent, marginBottom: 8 },
  certMarket: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  statItem: { width: '44%', backgroundColor: 'rgba(11,16,32,0.5)', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statIcon: { width: 24, height: 24, resizeMode: 'contain', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  skillsLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 10, textAlign: 'center' },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  skillChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(139,92,246,0.1)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  skillText: { fontSize: 11, color: COLORS.accent, fontWeight: '500' },
  certDate: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  certIssuer: { fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic' },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  shareButton: { flex: 1, backgroundColor: COLORS.bg2, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  shareText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  linkedinButton: { flex: 1, backgroundColor: '#0A66C2', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  linkedinText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
