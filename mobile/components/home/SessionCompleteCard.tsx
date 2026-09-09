import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Share,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { LeoCharacter } from '../mascot/LeoCharacter';
import { ConfettiBurst } from '../ui/ConfettiBurst';
import { triggerCelebration, triggerHaptic } from '../../lib/haptics';
import { playSound } from '../../lib/sounds';
import { tierMeta } from '../../lib/leagues';

interface SessionCompleteCardProps {
  dayNumber: number;
  marketName: string;
  marketEmoji: string;
  xpEarned: number;
  streak: number;
  lessonTitle: string;
  totalXP: number;
  stageName: string;
  onContinue: () => void;
  onDismiss: () => void;
  onAskMentor?: () => void;
  mentorName?: string;
  /** Extra celebration context */
  questsCompleted?: number;
  questsTotal?: number;
  leagueTier?: string;
  leagueRank?: number | null;
  leveledUp?: boolean;
  newLevel?: number;
}

/** Milestone streaks get an extra beat of celebration. */
function streakLine(streak: number): string | null {
  if (streak >= 100) return `${streak} days. That is elite consistency.`;
  if (streak === 30) return '30 days straight — a full month of compounding.';
  if (streak === 7) return 'One full week. The habit is forming.';
  if (streak > 0 && streak % 50 === 0) return `${streak} days without missing. Remarkable.`;
  if (streak >= 3) return `${streak} days in a row — keep the chain alive.`;
  return null;
}

export function SessionCompleteCard({
  dayNumber, marketName, marketEmoji, xpEarned, streak,
  lessonTitle, totalXP, stageName, onContinue, onDismiss, onAskMentor, mentorName,
  questsCompleted = 0, questsTotal = 0, leagueTier, leagueRank, leveledUp, newLevel,
}: SessionCompleteCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;
  const [xpShown, setXpShown] = useState(0);
  const celebrated = useRef(false);

  useEffect(() => {
    // Guard: never fire the celebration twice if the card re-mounts.
    if (!celebrated.current) {
      celebrated.current = true;
      triggerCelebration();
      playSound('celebration');
    }

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.timing(statsAnim, {
        toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(bannerAnim, {
        toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();

    // XP counts up so the reward feels earned.
    const id = xpAnim.addListener(({ value }) => setXpShown(Math.round(value)));
    Animated.timing(xpAnim, {
      toValue: xpEarned,
      duration: 900,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setXpShown(xpEarned);
      playSound('xpEarn');
    });

    return () => xpAnim.removeListener(id);
  }, []);

  useEffect(() => {
    if (leveledUp) {
      const t = setTimeout(() => { playSound('levelUp'); triggerHaptic('heavy'); }, 1100);
      return () => clearTimeout(t);
    }
  }, [leveledUp]);

  const milestone = streakLine(streak);
  const meta = leagueTier ? tierMeta(leagueTier) : null;

  const handleShare = async () => {
    triggerHaptic('light');
    try {
      await Share.share({
        message: `Day ${dayNumber} complete in ${marketName} ${marketEmoji}\n\n"${lessonTitle}"\n+${xpEarned} XP · ${streak} day streak · ${stageName}\n\nLearning markets daily with MarketLingo`,
        title: `MarketLingo — Day ${dayNumber} Complete`,
      });
    } catch (_) {}
  };

  const revealStyle = {
    opacity: statsAnim,
    transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  };
  const bannerStyle = {
    opacity: bannerAnim,
    transform: [{ scale: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
      <ConfettiBurst show count={leveledUp || milestone ? 40 : 24} />
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.leoCircle}>
          <LeoCharacter size="lg" animation="celebrating" />
        </View>

        <Text style={styles.title}>Day {dayNumber} Complete</Text>
        <Text style={styles.subtitle}>{marketEmoji} {marketName}</Text>
        <Text style={styles.lessonName} numberOfLines={2}>"{lessonTitle}"</Text>

        <Animated.View style={[styles.xpHero, revealStyle]}>
          <Text style={styles.xpHeroValue}>+{xpShown}</Text>
          <Text style={styles.xpHeroLabel}>XP earned</Text>
        </Animated.View>

        <Animated.View style={[styles.statsGrid, revealStyle]}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxMiddle]}>
            <Text style={styles.statValue}>{totalXP.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {questsTotal > 0 ? `${questsCompleted}/${questsTotal}` : stageName}
            </Text>
            <Text style={styles.statLabel}>{questsTotal > 0 ? 'Quests' : 'Stage'}</Text>
          </View>
        </Animated.View>

        {leveledUp && (
          <Animated.View style={[styles.levelBanner, bannerStyle]}>
            <Feather name="chevrons-up" size={15} color="#FFF" />
            <Text style={styles.levelBannerText}>Level {newLevel} unlocked</Text>
          </Animated.View>
        )}

        {!!milestone && (
          <Animated.View style={[styles.milestoneBanner, bannerStyle]}>
            <Feather name="activity" size={14} color={COLORS.accent} />
            <Text style={styles.milestoneText}>{milestone}</Text>
          </Animated.View>
        )}

        {!!meta && (
          <Animated.View style={[styles.leagueBanner, bannerStyle, { backgroundColor: meta.soft }]}>
            <Feather name="award" size={14} color={meta.color} />
            <Text style={[styles.leagueText, { color: meta.color }]}>
              {meta.name}{leagueRank ? ` · rank #${leagueRank} this week` : ''}
            </Text>
          </Animated.View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
            <Text style={styles.shareBtnText}>Share Achievement</Text>
          </TouchableOpacity>
          {onAskMentor && (
            <TouchableOpacity style={styles.mentorBtn} onPress={onAskMentor} activeOpacity={0.7}>
              <Text style={styles.mentorBtnText}>Discuss with {mentorName || 'Mentor'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => { triggerHaptic('light'); onContinue(); }}
            activeOpacity={0.8}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 100,
  },
  card: {
    width: '100%', maxWidth: 360, backgroundColor: COLORS.bg2,
    borderRadius: 28, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.25)',
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 30, elevation: 12,
  },
  leoCircle: { marginBottom: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  lessonName: {
    fontSize: 13, fontStyle: 'italic', color: COLORS.textMuted,
    textAlign: 'center', marginBottom: 16, paddingHorizontal: 8,
  },
  xpHero: { alignItems: 'center', marginBottom: 12 },
  xpHeroValue: { fontSize: 40, fontWeight: '900', color: COLORS.accent, letterSpacing: -1 },
  xpHeroLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statsGrid: { flexDirection: 'row', width: '100%', marginBottom: 14 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statBoxMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
  levelBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.accent, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 10, marginBottom: 10,
  },
  levelBannerText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  milestoneBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.accentSoft, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10,
  },
  milestoneText: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.accent },
  leagueBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
  },
  leagueText: { fontSize: 12, fontWeight: '700' },
  actions: { width: '100%', gap: 10 },
  shareBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 14,
    backgroundColor: COLORS.accentSoft, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.25)',
    alignItems: 'center',
  },
  shareBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  mentorBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 14,
    backgroundColor: COLORS.successSoft, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
  },
  mentorBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.success },
  continueBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 14,
    backgroundColor: COLORS.accent, alignItems: 'center',
  },
  continueBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
