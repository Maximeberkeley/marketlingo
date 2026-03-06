import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Share,
} from 'react-native';
import { COLORS } from '../../lib/constants';
import { LeoCharacter } from '../mascot/LeoCharacter';
import { ConfettiBurst } from '../ui/ConfettiBurst';
import { triggerCelebration } from '../../lib/haptics';
import { playSound } from '../../lib/sounds';
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
}

export function SessionCompleteCard({
  dayNumber, marketName, marketEmoji, xpEarned, streak,
  lessonTitle, totalXP, stageName, onContinue, onDismiss, onAskMentor, mentorName,
}: SessionCompleteCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    triggerCelebration();
    playSound('celebration');
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Day ${dayNumber} complete in ${marketName}! ${marketEmoji}\n\n📚 "${lessonTitle}"\n⚡ ${xpEarned} XP earned\n🔥 ${streak} day streak\n🚀 Stage: ${stageName}\n\nLearning markets daily with MarketLingo 💜`,
        title: `MarketLingo — Day ${dayNumber} Complete`,
      });
    } catch (_) {}
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
      <ConfettiBurst show count={24} />
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.leoCircle}>
          <LeoCharacter size="lg" animation="celebrating" />
        </View>

        <Text style={styles.title}>Day {dayNumber} Complete!</Text>
        <Text style={styles.subtitle}>{marketEmoji} {marketName}</Text>
        <Text style={styles.lessonName} numberOfLines={2}>"{lessonTitle}"</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>⚡ {xpEarned}</Text>
            <Text style={styles.statLabel}>XP Earned</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxMiddle]}>
            <Text style={styles.statValue}>🔥 {streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalXP}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>

        <View style={styles.stageBadge}>
          <Text style={styles.stageText}>{stageName}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
            <Text style={styles.shareBtnText}>Share Achievement</Text>
          </TouchableOpacity>
          {onAskMentor && (
            <TouchableOpacity style={styles.mentorBtn} onPress={onAskMentor} activeOpacity={0.7}>
              <Text style={styles.mentorBtnText}>Discuss with {mentorName || 'Mentor'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.continueBtn} onPress={onContinue} activeOpacity={0.8}>
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
    textAlign: 'center', marginBottom: 20, paddingHorizontal: 8,
  },
  statsGrid: { flexDirection: 'row', width: '100%', marginBottom: 14 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statBoxMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
  stageBadge: {
    backgroundColor: COLORS.accentSoft, paddingHorizontal: 16,
    paddingVertical: 6, borderRadius: 12, marginBottom: 20,
  },
  stageText: { fontSize: 12, fontWeight: '600', color: COLORS.accent },
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
