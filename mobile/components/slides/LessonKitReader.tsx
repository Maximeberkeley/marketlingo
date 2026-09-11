import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LessonScreen } from '../../lesson-kit/screens/LessonScreen';
import { tokens } from '../../lesson-kit/theme/tokens';
import { Exercise, Lesson } from '../../lesson-kit/types';
import { parseSlideIntoCards } from './ConceptCard';

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
  streakDays?: number;
  metadata?: StackMetadata;
  [key: string]: any;
}

// ── Text helpers ────────────────────────────────────────────────────
const normalize = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const isMeaningful = (s?: string) => !!s && s.trim().replace(/\s+/g, ' ').length >= 12;

function sentencesOf(text: string): string[] {
  return (text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= 40 && s.length <= 180);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Comprehension question built from real lesson sentences:
 * the correct answer comes from this slide, decoys from other slides.
 */
function buildQuiz(
  slide: SlideData,
  otherSentences: string[],
  id: string,
): Exercise | null {
  const own = sentencesOf(slide.body);
  if (!own.length) return null;
  const correct = own[Math.floor(own.length / 2)] || own[0];

  const decoys = shuffle(
    otherSentences.filter(s => normalize(s) !== normalize(correct)),
  ).slice(0, 3);
  if (decoys.length < 2) return null;

  const options = shuffle([correct, ...decoys]);
  const correctIndex = options.findIndex(o => o === correct);
  if (correctIndex < 0) return null;

  // Every option must be distinct
  const seen = new Set(options.map(normalize));
  if (seen.size !== options.length) return null;

  return {
    kind: 'multipleChoice',
    id,
    prompt: `Which statement matches "${slide.title}"?`,
    options,
    correctIndex,
    explanation: 'This is stated directly in the lesson you just read.',
  };
}

function buildLesson(
  stackTitle: string,
  slides: SlideData[],
  marketId: string | undefined,
  metadata: StackMetadata | undefined,
): { lesson: Lesson; slideNumbers: number[] } {
  const exercises: Exercise[] = [];
  const slideNumbers: number[] = [];

  const push = (ex: Exercise, slideNumber: number) => {
    exercises.push(ex);
    slideNumbers.push(slideNumber);
  };

  if (metadata?.learning_objectives?.length) {
    const objectives = metadata.learning_objectives.filter(isMeaningful).slice(0, 4);
    if (objectives.length) {
      push(
        {
          kind: 'info',
          id: 'objectives',
          eyebrow: 'Lesson goals',
          title: 'What you will learn',
          body: '',
          bullets: objectives,
        },
        slides[0]?.slideNumber ?? 1,
      );
    }
  }

  // Sentence pool used for quiz decoys (from other slides).
  const poolBySlide = slides.map(s => sentencesOf(s.body));

  slides.forEach((slide, slideIdx) => {
    const cards = parseSlideIntoCards(slide.title, slide.body, slide.sources || [], slideIdx, marketId);
    let emittedForSlide = 0;

    cards.forEach((card, cardIdx) => {
      const hasTerms = !!card.keyTerms?.length;
      const bullets = (card.bullets || []).filter(isMeaningful);
      const body = (card.content || '').trim();
      const hasBody = isMeaningful(body);

      // Drop empty cards entirely (headers with nothing, blank term groups, etc.)
      if (!hasBody && !bullets.length && !hasTerms) {
        // A sources-only card folds into the previous card instead of standing alone.
        if (card.sources?.length && exercises.length) {
          const prev = exercises[exercises.length - 1];
          if (prev.kind === 'info' && !prev.sources?.length) prev.sources = card.sources;
        }
        return;
      }

      const rawTitle = cardIdx === 0 ? slide.title : card.title;
      // Never repeat the slide/lesson title as a card heading twice in a row.
      const titleIsEcho =
        !!rawTitle &&
        (normalize(rawTitle) === normalize(body) ||
          (emittedForSlide > 0 && normalize(rawTitle) === normalize(slide.title)));

      push(
        {
          kind: 'info',
          id: `s${slide.slideNumber}-c${cardIdx}`,
          eyebrow: emittedForSlide === 0 ? `Part ${slideIdx + 1} of ${slides.length}` : undefined,
          title: titleIsEcho ? undefined : rawTitle,
          body: hasBody ? body : '',
          bullets: bullets.length ? bullets : undefined,
          keyTerms: hasTerms ? card.keyTerms : undefined,
          sources: card.sources?.length ? card.sources : undefined,
        },
        slide.slideNumber,
      );
      emittedForSlide += 1;
    });

    // A check after every second slide, never on the first or last.
    const isCheckpoint = slideIdx > 0 && slideIdx < slides.length - 1 && slideIdx % 2 === 1;
    if (isCheckpoint) {
      const others = poolBySlide.filter((_, i) => i !== slideIdx).flat();
      const quiz = buildQuiz(slide, others, `s${slide.slideNumber}-quiz`);
      if (quiz) push(quiz, slide.slideNumber);
    }
  });

  if (isMeaningful(metadata?.key_takeaway)) {
    push(
      {
        kind: 'info',
        id: 'takeaway',
        eyebrow: 'Remember this',
        title: 'Key takeaway',
        body: metadata!.key_takeaway!,
        bullets: isMeaningful(metadata?.next_preview)
          ? [`Next up: ${metadata!.next_preview!}`]
          : undefined,
      },
      slides[slides.length - 1]?.slideNumber ?? 1,
    );
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
  streakDays,
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
      streakDays={streakDays}
      confirmExit={!isReview}
    />
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
