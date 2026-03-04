import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { COLORS } from '../../lib/constants';

interface TodaysMissionProps {
  dayNumber: number;
  totalDays?: number;
  lessonTitle: string;
  marketEmoji: string;
  marketName: string;
  xpReward: number;
  duration: number;
  progress: number;
  isCompleted: boolean;
  streak: number;
  onStart: () => void;
  onReview?: () => void;
  onPractice?: () => void;
}

function CircularProgress({
  progress,
  size,
  strokeWidth,
  isCompleted,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  isCompleted: boolean;
}) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: progress,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [progress]);

  const clampedProgress = Math.min(1, Math.max(0, progress));
  const degrees = clampedProgress * 360;
  const accentColor = isCompleted ? COLORS.success : COLORS.accent;
  const trackColor = COLORS.surfaceLight;

  return (
    <Animated.View style={{ width: size, height: size, opacity: fadeAnim }}>
      <View
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth, borderColor: trackColor, position: 'absolute',
        }}
      />
      <View style={{ width: size, height: size, position: 'absolute', overflow: 'hidden' }}>
        <View style={{ width: size / 2, height: size, position: 'absolute', right: 0, overflow: 'hidden' }}>
          {degrees > 0 && (
            <View
              style={{
                width: size, height: size, borderRadius: size / 2,
                borderWidth: strokeWidth, borderColor: accentColor,
                borderLeftColor: 'transparent', borderBottomColor: 'transparent',
                position: 'absolute', right: 0,
                transform: [{ rotate: `${Math.min(degrees, 180) - 90}deg` }],
              }}
            />
          )}
        </View>
        {degrees > 180 && (
          <View style={{ width: size / 2, height: size, position: 'absolute', left: 0, overflow: 'hidden' }}>
            <View
              style={{
                width: size, height: size, borderRadius: size / 2,
                borderWidth: strokeWidth, borderColor: accentColor,
                borderRightColor: 'transparent', borderTopColor: 'transparent',
                position: 'absolute', left: 0,
                transform: [{ rotate: `${degrees - 270}deg` }],
              }}
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export function TodaysMission({
  dayNumber, totalDays = 180, lessonTitle, marketEmoji, marketName,
  xpReward, duration, progress, isCompleted, streak, onStart, onReview, onPractice,
}: TodaysMissionProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    if (!isCompleted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ).start();
    }
  }, [isCompleted]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
      <View style={[styles.accentBar, isCompleted && styles.accentBarCompleted]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>DAY {dayNumber}</Text>
          </View>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streak} day streak</Text>
            </View>
          )}
        </View>

        <View style={styles.mainRow}>
          <View style={styles.ringContainer}>
            <CircularProgress progress={progress} size={88} strokeWidth={5} isCompleted={isCompleted} />
            <View style={styles.ringCenter}>
              {isCompleted ? (
                <Text style={styles.ringCheckmark}>✓</Text>
              ) : (
                <>
                  <Text style={styles.ringEmoji}>{marketEmoji}</Text>
                  <Text style={styles.ringDay}>{dayNumber}</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.infoColumn}>
            <Text style={styles.missionLabel}>
              {isCompleted ? "TODAY'S MISSION COMPLETE" : "TODAY'S MISSION"}
            </Text>
            <Text style={styles.lessonTitle} numberOfLines={2}>{lessonTitle}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>⚡ {xpReward} XP</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>⏱ {duration} min</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>{marketName}</Text>
              </View>
            </View>
          </View>
        </View>

        {isCompleted ? (
          <View style={styles.completedActions}>
            <TouchableOpacity style={styles.reviewBtn} onPress={onReview} activeOpacity={0.7}>
              <Text style={styles.reviewBtnText}>📖 Review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.practiceBtn} onPress={onPractice} activeOpacity={0.7}>
              <Text style={styles.practiceBtnText}>⚡ Practice</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.8}>
              <Text style={styles.startBtnText}>Start Lesson</Text>
              <Text style={styles.startBtnArrow}>→</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20, overflow: 'hidden', backgroundColor: COLORS.bg2,
    borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.15)', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  accentBar: { height: 3, backgroundColor: COLORS.accent },
  accentBarCompleted: { backgroundColor: COLORS.success },
  content: { padding: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  dayBadge: { backgroundColor: COLORS.accentSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dayBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.accent, letterSpacing: 1 },
  streakBadge: { backgroundColor: COLORS.orangeSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  streakText: { fontSize: 11, fontWeight: '600', color: COLORS.orange },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  ringContainer: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringEmoji: { fontSize: 24 },
  ringDay: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: -2 },
  ringCheckmark: { fontSize: 32, fontWeight: '700', color: COLORS.success },
  infoColumn: { flex: 1 },
  missionLabel: { fontSize: 10, fontWeight: '700', color: COLORS.accent, letterSpacing: 0.8, marginBottom: 4 },
  lessonTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 22, marginBottom: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: { backgroundColor: COLORS.bg1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  metaText: { fontSize: 10, fontWeight: '500', color: COLORS.textMuted },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accent, paddingVertical: 16, borderRadius: 14, gap: 8,
  },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  startBtnArrow: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  completedActions: { flexDirection: 'row', gap: 10 },
  reviewBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.bg1,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  reviewBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  practiceBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.success, alignItems: 'center' },
  practiceBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
