import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';

type SectionType = 'daily_pattern' | 'micro_lesson' | 'games' | 'drills' | 'trainer' | 'summaries';

interface SectionIntroSlideProps {
  type: SectionType;
  dayNumber?: number;
  monthTheme?: string;
}

const sectionInfo: Record<SectionType, {
  icon: string;
  title: string;
  tagline: string;
  color: string;
  bgColor: string;
}> = {
  daily_pattern: {
    icon: '',
    title: 'Daily Pattern',
    tagline: 'Recognize recurring market forces',
    color: '#60A5FA',
    bgColor: 'rgba(59,130,246,0.1)',
  },
  micro_lesson: {
    icon: '',
    title: 'Micro Lesson',
    tagline: '5-minute concept deep dive',
    color: '#34D399',
    bgColor: 'rgba(16,185,129,0.1)',
  },
  games: {
    icon: '',
    title: 'Knowledge Game',
    tagline: 'Test what you\'ve learned',
    color: '#A78BFA',
    bgColor: 'rgba(139,92,246,0.1)',
  },
  drills: {
    icon: '⚡',
    title: 'Speed Drill',
    tagline: '15-second fact checks',
    color: '#FCD34D',
    bgColor: 'rgba(251,191,36,0.1)',
  },
  trainer: {
    icon: '',
    title: 'Pro Trainer',
    tagline: 'Think like an industry expert',
    color: '#F87171',
    bgColor: 'rgba(239,68,68,0.1)',
  },
  summaries: {
    icon: '',
    title: 'Summary',
    tagline: 'Key takeaways consolidated',
    color: '#22D3EE',
    bgColor: 'rgba(6,182,212,0.1)',
  },
};

export function SectionIntroSlide({ type, dayNumber, monthTheme }: SectionIntroSlideProps) {
  const info = sectionInfo[type];

  return (
    <View style={[styles.container, { backgroundColor: info.bgColor }]}>
      {/* Day/Month badges */}
      {(dayNumber || monthTheme) && (
        <View style={styles.badgesRow}>
          {dayNumber && (
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Day {dayNumber}</Text>
            </View>
          )}
          {monthTheme && (
            <View style={[styles.themeBadge, { backgroundColor: 'rgba(139,92,246,0.2)' }]}>
              <Text style={[styles.themeBadgeText, { color: COLORS.accent }]}>{monthTheme}</Text>
            </View>
          )}
        </View>
      )}

      {/* Icon & Title */}
      <View style={styles.mainRow}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
          <Text style={{ fontSize: 24 }}>{info.icon}</Text>
        </View>
        <View>
          <Text style={[styles.title, { color: info.color }]}>{info.title}</Text>
          <Text style={styles.tagline}>{info.tagline}</Text>
        </View>
      </View>

      {/* Swipe hint */}
      <Text style={styles.swipeHint}>Swipe to begin →</Text>

      {/* Decorative sparkle */}
      <Text style={styles.decorSparkle}>✨</Text>
    </View>
  );
}

export function createIntroSlide(stackType: string, stackTitle: string) {
  let sectionType: SectionType = 'micro_lesson';

  if (stackType === 'NEWS' || stackTitle.toLowerCase().includes('pattern')) {
    sectionType = 'daily_pattern';
  } else if (stackType === 'LESSON') {
    sectionType = 'micro_lesson';
  }

  return {
    slideNumber: 0,
    title: sectionInfo[sectionType].title,
    body: sectionInfo[sectionType].tagline,
    sources: [],
    isIntro: true,
    sectionType,
  };
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 20,
  },
  dayBadgeText: { fontSize: 12, color: '#E2E8F0', fontWeight: '600' },
  themeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  themeBadgeText: { fontSize: 12, fontWeight: '600' },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  tagline: { fontSize: 13, color: COLORS.textSecondary },
  swipeHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  decorSparkle: {
    position: 'absolute',
    top: 12,
    right: 16,
    fontSize: 24,
    opacity: 0.15,
  },
});
