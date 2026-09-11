import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LessonScreen } from '../../lesson-kit/screens/LessonScreen';
import { tokens } from '../../lesson-kit/theme/tokens';
import { Exercise, Lesson } from '../../lesson-kit/types';
import { parseSlideIntoCards } from './ConceptCard';
import { generateQuizFromSlide, shouldShowQuiz } from './QuizCard';

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
  onComplete: (isReview: boolean, timeSpentSeconds: number) => void;
  onSaveInsight: (slideNumber: number) => void;
  onAddNote: (slideNumber: number, customContent?: string) => void;
  marketId?: string;
  stackId?: string;
  isReview?: boolean;
  dayNumber?: number;
  metadata?: StackMetadata;
  [key: string]: any;
}

/** Slide numbers aligned to each generated exercise, for Note / Save actions. */
function buildLesson(
  stackTitle: string,
  slides: SlideData[],
  marketId: string | undefined,
  metadata: StackMetadata | undefined,
): { lesson: Lesson; slideNumbers: number[] } {
  const exercises: Exercise[] = [];
  const slideNumbers: number[] = [];

  if (metadata?.learning_objectives?.length) {
    exercises.push({
      kind: 'info',
      id: 'objectives',
      title: 'What you will learn',
      body: 'Here is what this lesson covers.',
      bullets: metadata.learning_objectives.slice(0, 4),
    });
    slideNumbers.push(slides[0]?.slideNumber ?? 1);
  }

  slides.forEach((slide, slideIdx) => {
    const cards = parseSlideIntoCards(slide.title, slide.body, slide.sources || [], slideIdx, marketId);

    cards.forEach((card, cardIdx) => {
      exercises.push({
        kind: 'info',
        id: `s${slide.slideNumber}-c${cardIdx}`,
        title: cardIdx === 0 ? slide.title : card.title,
        body: card.content,
        bullets: card.bullets,
        sources: card.sources,
      });
      slideNumbers.push(slide.slideNumber);
    });

    if (shouldShowQuiz(slideIdx, slides.length)) {
      const quiz = generateQuizFromSlide(slide.title, slide.body, slideIdx);
      if (quiz) {
        exercises.push({
          kind: 'multipleChoice',
          id: `s${slide.slideNumber}-quiz`,
          prompt: quiz.question,
          options: quiz.options,
          correctIndex: quiz.correctIndex,
          explanation: quiz.explanation,
        });
        slideNumbers.push(slide.slideNumber);
      }
    }
  });

  if (metadata?.key_takeaway) {
    exercises.push({
      kind: 'info',
      id: 'takeaway',
      title: 'Key takeaway',
      body: metadata.key_takeaway,
      bullets: metadata.next_preview ? [`Next up: ${metadata.next_preview}`] : undefined,
    });
    slideNumbers.push(slides[slides.length - 1]?.slideNumber ?? 1);
  }

  return {
    lesson: { id: stackTitle, title: stackTitle, exercises },
    slideNumbers,
  };
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
  metadata,
}: LessonKitReaderProps) {
  const { lesson, slideNumbers } = useMemo(
    () => buildLesson(stackTitle, slides, marketId, metadata),
    [stackTitle, slides, marketId, metadata],
  );

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
    <LessonScreen
      lesson={lesson}
      onExit={onClose}
      onFinish={({ timeSpentSeconds }) => onComplete(isReview, timeSpentSeconds)}
      renderExtraActions={extraActions}
    />
  );
}
