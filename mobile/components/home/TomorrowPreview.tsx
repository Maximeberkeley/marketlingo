import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { COLORS } from '../../lib/constants';

interface TomorrowPreviewProps {
  /** Tomorrow's day number */
  dayNumber: number;
  /** Tomorrow's lesson title (fetched from DB) */
  lessonTitle: string;
  /** Market emoji */
  marketEmoji: string;
  /** Hours until the next lesson unlocks (midnight reset) */
  hoursUntilUnlock: number;
}

export function TomorrowPreview({
  dayNumber,
  lessonTitle,
  marketEmoji,
  hoursUntilUnlock,
}: TomorrowPreviewProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatCountdown = () => {
    if (hoursUntilUnlock <= 0) return 'Available now';
    if (hoursUntilUnlock < 1) return `${Math.ceil(hoursUntilUnlock * 60)}m`;
    return `${Math.floor(hoursUntilUnlock)}h ${Math.round((hoursUntilUnlock % 1) * 60)}m`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Lock icon + "Coming tomorrow" label */}
      <View style={styles.header}>
        <View style={styles.lockBadge}>
          <Text style={styles.lockIcon}>🔮</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>COMING TOMORROW</Text>
          <Text style={styles.countdown}>Unlocks in {formatCountdown()}</Text>
        </View>
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeText}>Day {dayNumber}</Text>
        </View>
      </View>

      {/* Lesson preview */}
      <View style={styles.previewRow}>
        <Text style={styles.previewEmoji}>{marketEmoji}</Text>
        <Text style={styles.previewTitle} numberOfLines={2}>
          {lessonTitle}
        </Text>
      </View>

      {/* Streak nudge */}
      <View style={styles.nudge}>
        <Text style={styles.nudgeText}>
          Come back tomorrow to keep your streak alive 🔥
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderStyle: 'dashed',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  lockBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: { fontSize: 18 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  countdown: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  dayBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  previewEmoji: { fontSize: 24 },
  previewTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  nudge: {
    alignItems: 'center',
  },
  nudgeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});
