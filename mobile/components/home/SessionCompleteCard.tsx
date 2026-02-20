import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Share,
  Platform,
} from 'react-native';
import { COLORS } from '../../lib/constants';

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
  /** Open mentor chat with lesson context */
  onAskMentor?: () => void;
  /** Mentor first name for CTA label */
  mentorName?: string;
}

export function SessionCompleteCard({
  dayNumber,
  marketName,
  marketEmoji,
  xpEarned,
  streak,
  lessonTitle,
  totalXP,
  stageName,
  onContinue,
  onDismiss,
  onAskMentor,
  mentorName,
}: SessionCompleteCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 8 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    // Card entrance
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti burst
    confettiAnims.forEach((anim, i) => {
      const angle = (i / confettiAnims.length) * Math.PI * 2;
      const distance = 60 + Math.random() * 40;
      const delay = i * 50;

      Animated.sequence([
        Animated.delay(delay + 200),
        Animated.parallel([
          Animated.timing(anim.scale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateX, {
            toValue: Math.cos(angle) * distance,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: Math.sin(angle) * distance - 20,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    });
  }, []);

  const handleShare = async () => {
    const shareText = `Day ${dayNumber} complete in ${marketName}! ${marketEmoji}\n\n📚 "${lessonTitle}"\n⚡ ${xpEarned} XP earned\n🔥 ${streak} day streak\n🚀 Stage: ${stageName}\n\nLearning markets daily with MarketLingo 💜`;

    try {
      await Share.share({
        message: shareText,
        title: `MarketLingo — Day ${dayNumber} Complete`,
      });
    } catch (error) {
      // User cancelled
    }
  };

  const confettiEmojis = ['✨', '🎉', '⭐', '💜', '🔥', '⚡', '🚀', '💫'];

  return (
    <Animated.View
      style={[
        styles.overlay,
        { opacity: opacityAnim },
      ]}
    >
      <Animated.View
        style={[
          styles.card,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Confetti burst */}
        <View style={styles.confettiContainer}>
          {confettiAnims.map((anim, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.confetti,
                {
                  transform: [
                    { translateX: anim.translateX },
                    { translateY: anim.translateY },
                    { scale: anim.scale },
                  ],
                  opacity: anim.opacity,
                },
              ]}
            >
              {confettiEmojis[i]}
            </Animated.Text>
          ))}
        </View>

        {/* Trophy */}
        <View style={styles.trophyCircle}>
          <Text style={styles.trophyEmoji}>🏆</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Day {dayNumber} Complete!</Text>
        <Text style={styles.subtitle}>{marketEmoji} {marketName}</Text>

        {/* Lesson name */}
        <Text style={styles.lessonName} numberOfLines={2}>"{lessonTitle}"</Text>

        {/* Stats grid */}
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
            <Text style={styles.statValue}>📊 {totalXP}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>

        {/* Stage badge */}
        <View style={styles.stageBadge}>
          <Text style={styles.stageText}>🚀 {stageName}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
            <Text style={styles.shareBtnText}>📤 Share Achievement</Text>
          </TouchableOpacity>
          {onAskMentor && (
            <TouchableOpacity style={styles.mentorBtn} onPress={onAskMentor} activeOpacity={0.7}>
              <Text style={styles.mentorBtnText}>🧠 Discuss with {mentorName || 'Mentor'}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  confettiContainer: {
    position: 'absolute',
    top: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    position: 'absolute',
    fontSize: 20,
  },
  trophyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  trophyEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  lessonName: {
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statBoxMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  stageBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  shareBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  mentorBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
  },
  mentorBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34D399',
  },
  continueBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
