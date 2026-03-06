import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { ReviewItem } from '../../hooks/useSpacedRepetition';
import { triggerHaptic } from '../../lib/haptics';
import { playSound } from '../../lib/sounds';

interface ReviewSessionProps {
  items: ReviewItem[];
  onGrade: (itemId: string, grade: number) => Promise<void>;
  onComplete: () => void;
  marketName: string;
}

export function ReviewSession({ items, onGrade, onComplete, marketName }: ReviewSessionProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const item = items[currentIndex];

  if (!item || completedCount >= items.length) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.doneCard}>
          <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 16 }}></Text>
          <Text style={styles.doneTitle}>Review Complete!</Text>
          <Text style={styles.doneSub}>
            {completedCount} concept{completedCount !== 1 ? 's' : ''} reviewed in {marketName}
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={onComplete} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleGrade = async (grade: number) => {
    triggerHaptic(grade >= 2 ? 'success' : 'light');
    playSound(grade >= 2 ? 'correct' : 'wrong');
    await onGrade(item.id, grade);
    setCompletedCount((prev) => prev + 1);
    setShowAnswer(false);
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {completedCount + 1} / {items.length}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((completedCount + 1) / items.length) * 100}%` }]} />
        </View>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>REVIEW CONCEPT</Text>
        <Text style={styles.cardConcept}>{item.concept}</Text>

        {item.review_count > 0 && (
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Reviewed {item.review_count}x</Text>
            <Text style={styles.metaText}>Interval: {item.interval_days}d</Text>
          </View>
        )}

        {!showAnswer ? (
          <TouchableOpacity
            style={styles.revealBtn}
            onPress={() => setShowAnswer(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.revealBtnText}>Tap to recall — how well do you remember?</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.gradeButtons}>
            <Text style={styles.gradeLabel}>How well did you recall this?</Text>
            <View style={styles.gradeRow}>
              <TouchableOpacity
                style={[styles.gradeBtn, styles.gradeForgot]}
                onPress={() => handleGrade(0)}
              >
                <Text style={styles.gradeBtnEmoji}></Text>
                <Text style={[styles.gradeBtnText, { color: '#EF4444' }]}>Forgot</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.gradeBtn, styles.gradeHard]}
                onPress={() => handleGrade(1)}
              >
                <Text style={styles.gradeBtnEmoji}></Text>
                <Text style={[styles.gradeBtnText, { color: '#F97316' }]}>Hard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.gradeBtn, styles.gradeGood]}
                onPress={() => handleGrade(2)}
              >
                <Text style={styles.gradeBtnEmoji}></Text>
                <Text style={[styles.gradeBtnText, { color: '#22C55E' }]}>Good</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.gradeBtn, styles.gradeEasy]}
                onPress={() => handleGrade(3)}
              >
                <Text style={styles.gradeBtnEmoji}></Text>
                <Text style={[styles.gradeBtnText, { color: '#3B82F6' }]}>Easy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 16 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  progressText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  progressBar: { flex: 1, height: 6, backgroundColor: COLORS.bg2, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 3 },
  card: {
    backgroundColor: COLORS.bg2, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border,
  },
  cardLabel: { fontSize: 10, fontWeight: '700', color: COLORS.accent, letterSpacing: 1, marginBottom: 12 },
  cardConcept: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 30, marginBottom: 16 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaText: { fontSize: 11, color: COLORS.textMuted },
  revealBtn: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  revealBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  gradeButtons: { marginTop: 8 },
  gradeLabel: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 12 },
  gradeRow: { flexDirection: 'row', gap: 8 },
  gradeBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  gradeBtnEmoji: { fontSize: 24, marginBottom: 4 },
  gradeBtnText: { fontSize: 10, fontWeight: '700' },
  gradeForgot: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' },
  gradeHard: { backgroundColor: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.25)' },
  gradeGood: { backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)' },
  gradeEasy: { backgroundColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.25)' },
  doneCard: { alignItems: 'center', paddingTop: 80 },
  doneTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  doneSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32 },
  doneBtn: {
    backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48, alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
