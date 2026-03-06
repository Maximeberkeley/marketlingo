import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPE } from '../../lib/constants';

interface QuickBiteSelectorProps {
  totalSlides: number;
  completedBites: number[];
  onSelectBite: (biteIndex: number) => void;
  onFullLesson: () => void;
  lessonTitle: string;
  isLessonComplete: boolean;
}

const BITE_LABELS = ['Concept', 'Lens', 'Takeaway'];
const BITE_ICONS: (keyof typeof Feather.glyphMap)[] = ['book-open', 'eye', 'award'];
const BITE_COLORS = ['#3B82F6', '#8B5CF6', '#22C55E'];

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="zap" size={18} color="#F59E0B" />
        <View>
          <Text style={styles.headerTitle}>Quick Bites</Text>
          <Text style={styles.headerSubtitle}>2-slide micro-lessons · ~1 min each</Text>
        </View>
      </View>

      <Text style={styles.lessonTitle} numberOfLines={2}>{lessonTitle}</Text>

      <View style={styles.bitesRow}>
        {bites.map((bite) => {
          const color = BITE_COLORS[bite.index] || COLORS.accent;
          const icon = BITE_ICONS[bite.index] || 'book-open';
          return (
            <TouchableOpacity
              key={bite.index}
              style={[styles.biteCard, bite.isComplete && styles.biteCardComplete]}
              onPress={() => onSelectBite(bite.index)}
              activeOpacity={0.7}
            >
              <View style={[styles.biteIconWrap, { backgroundColor: bite.isComplete ? COLORS.successSoft : color + '14' }]}>
                <Feather
                  name={bite.isComplete ? 'check' : icon}
                  size={18}
                  color={bite.isComplete ? COLORS.success : color}
                />
              </View>
              <Text style={[styles.biteLabel, bite.isComplete && styles.biteLabelDone]}>
                {BITE_LABELS[bite.index] || `Part ${bite.index + 1}`}
              </Text>
              <Text style={styles.biteSlides}>Slides {bite.startSlide}–{bite.endSlide}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.fullLessonBtn, isLessonComplete && styles.fullLessonBtnDone]}
        onPress={onFullLesson}
        activeOpacity={0.8}
      >
        <Feather name={isLessonComplete ? 'refresh-cw' : 'play'} size={14} color={COLORS.accent} />
        <Text style={styles.fullLessonText}>
          {isLessonComplete ? 'Review Full Lesson' : 'Full Lesson (all slides)'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg2, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)', gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { ...TYPE.h3, color: COLORS.textPrimary },
  headerSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  lessonTitle: {
    fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 18,
  },
  bitesRow: { flexDirection: 'row', gap: 10 },
  biteCard: {
    flex: 1, backgroundColor: COLORS.bg1, borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: COLORS.border,
  },
  biteCardComplete: {
    backgroundColor: COLORS.successSoft, borderColor: 'rgba(34,197,94,0.2)',
  },
  biteIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  biteLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  biteLabelDone: { color: COLORS.success },
  biteSlides: { fontSize: 9, color: COLORS.textMuted },
  fullLessonBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  fullLessonBtnDone: {
    backgroundColor: COLORS.bg1, borderColor: COLORS.border,
  },
  fullLessonText: { fontSize: 13, fontWeight: '600', color: COLORS.accent },
});
