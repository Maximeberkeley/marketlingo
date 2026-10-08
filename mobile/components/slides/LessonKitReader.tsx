import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LessonScreen } from '../../lesson-kit/screens/LessonScreen';
import { tokens } from '../../lesson-kit/theme/tokens';
import { buildBeats, IndustryInput } from '../../lesson-kit/sequencer/buildBeats';
import { SlideLike } from '../../lesson-kit/sequencer/extract';
import { useIndustryContent } from '../../hooks/useIndustryContent';
import { parseSlideIntoCards } from './ConceptCard';
import { DeepDiveProvider } from '../../lesson-kit/components/DeepDiveContext';
import type { Exercise, Lesson } from '../../lesson-kit/types';

/** Authored fields win, but only when actually set. */
function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined && v !== null && v !== '')) as Partial<T>;
}


interface Source {
  label: string;
  url: string;
}

interface SlideData {
  slideNumber: number;
  title: string;
  body: string;
  sources: Source[];
}

interface StackMetadata {
  learning_objectives?: string[];
  key_takeaway?: string;
  recap_bridge?: string;
  next_preview?: string;
}

export interface LessonKitReaderProps {
  stackTitle: string;
  stackType: 'NEWS' | 'HISTORY' | 'LESSON';
  slides: SlideData[];
  onClose: () => void;
  onComplete: (isReview: boolean, timeSpentSeconds: number, accuracy?: number) => void | Promise<void | boolean>;
  onSaveInsight: (slideNumber: number) => void;
  onAddNote: (slideNumber: number, customContent?: string) => void;
  marketId?: string;
  stackId?: string;
  isReview?: boolean;
  dayNumber?: number;
  streakDays?: number;
  /** Stored learning goal, so the deep layer is written through the right lens. */
  learningGoal?: string | null;
  metadata?: StackMetadata;
  /** Hand-written lesson from stacks.authored_lesson; played instead of generated beats. */
  authoredLesson?: unknown;
  [key: string]: any;
}

/**
 * Adapts a stack of lesson slides into a sequence of playable beats.
 * Key terms come from the existing slide parser; everything else is derived
 * from the real slide text by the sequencer.
 */
// Day 1 guardrail: a first lesson must never refer to a "yesterday".
const PRIOR_RE = /^[^.!?]*\b(yesterday|last time|previous lesson|in our orientation)\b[^.!?]*[.!?]\s*/i;
function firstDayText(title: string, body: string) {
  return {
    title: String(title || '').replace(/^recap:\s*/i, 'Foundation: ').replace(/yesterday's\s+/i, 'The '),
    body: String(body || '').replace(PRIOR_RE, ''),
  };
}


/** A hand-written lesson is usable only if it has an exercises array with at least one beat. */
function isAuthoredLesson(value: unknown): value is Lesson {
  const v = value as any;
  return !!v && typeof v === 'object' && Array.isArray(v.exercises) && v.exercises.length > 0;
}

function buildLesson(
  stackTitle: string,
  slides: SlideData[],
  marketId: string | undefined,
  metadata: StackMetadata | undefined,
  industry: IndustryInput,
  isFirstDay = false,
) {
  const enriched: SlideLike[] = slides.map((raw, slideIdx) => {
    const slide = isFirstDay ? { ...raw, ...firstDayText(raw.title, raw.body) } : raw;
    const cards = parseSlideIntoCards(slide.title, slide.body, slide.sources || [], slideIdx, marketId);
    const keyTerms = cards.flatMap((c: any) => c.keyTerms || []);
    return {
      slideNumber: slide.slideNumber,
      title: slide.title,
      body: slide.body,
      sources: slide.sources,
      keyTerms,
    };
  });

  return buildBeats(stackTitle, enriched, metadata, industry);
}

export function LessonKitReader({
  stackTitle,
  slides,
  onClose,
  onComplete,
  onSaveInsight,
  onAddNote,
  marketId,
  isReview = false,
  streakDays,
  dayNumber,
  metadata,
  stackId,
  learningGoal,
  authoredLesson,
}: LessonKitReaderProps) {
  const { trainer, drills, stats } = useIndustryContent(marketId, dayNumber);

  const { lesson: baseLesson, slideNumbers: baseSlideNumbers } = useMemo(
    () => isAuthoredLesson(authoredLesson)
      ? { lesson: { ...authoredLesson, id: authoredLesson.id || stackTitle, title: authoredLesson.title || stackTitle }, slideNumbers: authoredLesson.exercises.map(() => slides[0]?.slideNumber ?? 1) }
      :
      buildLesson(stackTitle, slides, marketId, metadata, {
        marketId,
        trainer,
        drills,
        stats,
        learningGoal,
      }, dayNumber === 1),
    [stackTitle, slides, marketId, metadata, trainer, drills, stats, dayNumber, learningGoal, authoredLesson],
  );

  // "Say it" closes every daily lesson. Hand-written lessons opt in with { kind: 'sayIt' }.
  const { lesson, slideNumbers } = useMemo(() => {
    const sayIt = (id = 'beat-say-it'): Exercise => ({
      kind: 'sayIt',
      id,
      takeaway: metadata?.key_takeaway?.trim() || undefined,
      dayNumber,
      learningGoal,
    });
    if (isAuthoredLesson(authoredLesson)) {
      return {
        lesson: {
          ...baseLesson,
          exercises: baseLesson.exercises.map(ex => (ex.kind === 'sayIt'
            ? { ...sayIt(ex.id || 'beat-say-it'), ...stripUndefined(ex) } as Exercise
            : ex)),
        },
        slideNumbers: baseSlideNumbers,
      };
    }
    const last = baseSlideNumbers[baseSlideNumbers.length - 1] ?? slides[0]?.slideNumber ?? 1;
    return {
      lesson: { ...baseLesson, exercises: [...baseLesson.exercises, sayIt()] },
      slideNumbers: [...baseSlideNumbers, last],
    };
  }, [baseLesson, baseSlideNumbers, authoredLesson, metadata, dayNumber, learningGoal, slides]);


  const extraActions = useCallback(
    (exerciseIndex: number) => {
      const slideNumber = slideNumbers[exerciseIndex] ?? 1;
      return (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={() => onAddNote(slideNumber)}>
            <Feather name="edit-3" size={16} color={tokens.color.textSecondary} />
            <Text style={styles.actionText}>Note</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={() => onSaveInsight(slideNumber)}>
            <Feather name="bookmark" size={16} color={tokens.color.textSecondary} />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
        </View>
      );
    },
    [slideNumbers, onAddNote, onSaveInsight],
  );

  return (
    <DeepDiveProvider stackId={stackId} learningGoal={learningGoal}>
      <LessonScreen
        lesson={lesson}
        marketId={marketId}
        onExit={onClose}
        onFinish={({ timeSpentSeconds, correct, total }) => onComplete(
          isReview,
          timeSpentSeconds,
          total > 0 ? Math.round((correct / total) * 100) : 100,
        )}
        renderExtraActions={extraActions}
        onSaveLeoAnswer={(text, exerciseIndex) =>
          onAddNote(slideNumbers[exerciseIndex] ?? 1, `Leo explained: ${text}`)
        }
        streakDays={streakDays}
        confirmExit={!isReview}
      />
    </DeepDiveProvider>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: tokens.space.md },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.card,
  },
  actionText: { fontSize: tokens.font.caption + 1, fontWeight: '700', color: tokens.color.textSecondary },
});
