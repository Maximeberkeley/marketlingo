import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptics';
import { playSound } from '../../lib/sounds';
import { LeoAnim, LeoCharacter } from '../mascot/LeoCharacter';

type PrerequisiteActivity = 'arena' | 'case' | 'intel' | 'notes';

const ACTIVITY_COPY: Record<PrerequisiteActivity, { title: string; body: string; mood: LeoAnim }> = {
  arena: {
    title: 'Your first Arena run starts in the course',
    body: 'Complete today’s lesson first. Every round will then test concepts you actually studied.',
    mood: 'thinking',
  },
  case: {
    title: 'Your first case starts in the course',
    body: 'Complete today’s lesson first. Your case will use its real claims, mechanisms, and numbers.',
    mood: 'reading',
  },
  intel: {
    title: 'Today’s Intel starts in the course',
    body: 'Finish today’s lesson, then connect it to what is moving in your industry right now.',
    mood: 'urgent',
  },
  notes: {
    title: 'Today’s notes start in the course',
    body: 'Finish today’s lesson first, then capture the ideas you want to keep. Your saved notes stay untouched.',
    mood: 'thinking',
  },
};

interface LessonPrerequisiteProps {
  activity: PrerequisiteActivity;
  lessonStackId?: string;
}

export function LessonPrerequisite({ activity, lessonStackId }: LessonPrerequisiteProps) {
  const copy = ACTIVITY_COPY[activity];

  const goToCourse = () => {
    triggerHaptic('selection');
    playSound('tap').catch(() => {});
    router.replace({
      pathname: '/(tabs)/home',
      params: lessonStackId ? { openStackId: lessonStackId } : undefined,
    } as any);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.mascotStage}>
        <View style={styles.mascotHalo} />
        <LeoCharacter size="xl" animation={copy.mood} />
        <View style={styles.lockBadge}>
          <Feather name="lock" size={17} color={COLORS.textOnAccent} />
        </View>
      </View>

      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={goToCourse}
        activeOpacity={0.86}
        accessibilityRole="button"
        accessibilityLabel="Go to today’s course lesson"
      >
        <Feather name="book-open" size={19} color={COLORS.textOnAccent} />
        <Text style={styles.buttonText}>Go to Course</Text>
        <Feather name="arrow-right" size={19} color={COLORS.textOnAccent} />
      </TouchableOpacity>
    </View>
  );
}

export type { PrerequisiteActivity };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 34,
    backgroundColor: COLORS.bg0,
  },
  mascotStage: {
    width: 220,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  mascotHalo: {
    position: 'absolute',
    width: 158,
    height: 158,
    borderRadius: 79,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
  },
  lockBadge: {
    position: 'absolute',
    right: 24,
    bottom: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.courseHeader,
    borderWidth: 4,
    borderColor: COLORS.bg0,
    ...SHADOWS.accent,
  },
  title: {
    ...TYPE.h1,
    color: COLORS.textPrimary,
    textAlign: 'center',
    maxWidth: 320,
  },
  body: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 330,
  },
  button: {
    width: '100%',
    maxWidth: 330,
    minHeight: 54,
    marginTop: 26,
    paddingHorizontal: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.courseHeader,
    ...SHADOWS.accent,
  },
  buttonText: {
    ...TYPE.bodyBold,
    flex: 1,
    color: COLORS.textOnAccent,
    textAlign: 'center',
  },
});