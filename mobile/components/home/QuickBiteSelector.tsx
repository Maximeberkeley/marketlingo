import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../../lib/constants';

interface QuickBiteSelectorProps {
  totalSlides: number;
  completedBites: number[];
  /** Which 2-slide bite to start (0-indexed) */
  onSelectBite: (biteIndex: number) => void;
  onFullLesson: () => void;
  lessonTitle: string;
  isLessonComplete: boolean;
}

export function QuickBiteSelector({
  totalSlides,
  completedBites,
  onSelectBite,
  onFullLesson,
  lessonTitle,
  isLessonComplete,
}: QuickBiteSelectorProps) {
  const biteCount = Math.ceil(totalSlides / 2);
  const bites = Array.from({ length: biteCount }, (_, i) => ({
    index: i,
    startSlide: i * 2 + 1,
    endSlide: Math.min((i + 1) * 2, totalSlides),
    isComplete: completedBites.includes(i),
  }));

  const allBitesComplete = bites.every((b) => b.isComplete);

  const BITE_LABELS = ['Concept', 'Lens', 'Takeaway'];
  const BITE_EMOJIS = ['💡', '🔍', '🎯'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>⚡</Text>
          <View>
            <Text style={styles.headerTitle}>Quick Bites</Text>
            <Text style={styles.headerSubtitle}>2-slide micro-lessons • ~1 min each</Text>
          </View>
        </View>
      </View>

      {/* Lesson title */}
      <Text style={styles.lessonTitle} numberOfLines={2}>
        {lessonTitle}
      </Text>

      {/* Bite cards */}
      <View style={styles.bitesRow}>
        {bites.map((bite) => (
          <TouchableOpacity
            key={bite.index}
            style={[
              styles.biteCard,
              bite.isComplete && styles.biteCardComplete,
            ]}
            onPress={() => onSelectBite(bite.index)}
            activeOpacity={0.7}
          >
            <Text style={styles.biteEmoji}>
              {bite.isComplete ? '✅' : (BITE_EMOJIS[bite.index] || '📖')}
            </Text>
            <Text
              style={[styles.biteLabel, bite.isComplete && styles.biteLabelDone]}
              numberOfLines={1}
            >
              {BITE_LABELS[bite.index] || `Part ${bite.index + 1}`}
            </Text>
            <Text style={styles.biteSlides}>
              Slides {bite.startSlide}–{bite.endSlide}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Full lesson CTA */}
      <TouchableOpacity
        style={[styles.fullLessonBtn, isLessonComplete && styles.fullLessonBtnDone]}
        onPress={onFullLesson}
        activeOpacity={0.8}
      >
        <Text style={styles.fullLessonText}>
          {isLessonComplete ? '📖 Review Full Lesson' : '📚 Full Lesson (all slides)'}
        </Text>
      </TouchableOpacity>

      {allBitesComplete && !isLessonComplete && (
        <Text style={styles.hintText}>
          💡 Complete all bites to earn full lesson XP!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg2,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerEmoji: { fontSize: 22 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  headerSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  lessonTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  bitesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  biteCard: {
    flex: 1,
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.15)',
  },
  biteCardComplete: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.2)',
  },
  biteEmoji: { fontSize: 24 },
  biteLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  biteLabelDone: { color: '#22C55E' },
  biteSlides: { fontSize: 9, color: COLORS.textMuted },
  fullLessonBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center',
  },
  fullLessonBtnDone: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: COLORS.border,
  },
  fullLessonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
  hintText: {
    fontSize: 11,
    color: '#FBBF24',
    textAlign: 'center',
  },
});
