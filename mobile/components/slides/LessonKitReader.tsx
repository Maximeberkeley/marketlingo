import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LessonScreen } from '../../lesson-kit/screens/LessonScreen';
import { tokens } from '../../lesson-kit/theme/tokens';
import { buildBeats, IndustryInput } from '../../lesson-kit/sequencer/buildBeats';
import { SlideLike } from '../../lesson-kit/sequencer/extract';
import { useIndustryContent } from '../../hooks/useIndustryContent';
import { parseSlideIntoCards } from './ConceptCard';
import { useCollectibles, CollectibleCard } from '../../hooks/useCollectibles';
import { CardRevealModal } from '../collectibles/CardRevealModal';


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
  onComplete: (isReview: boolean, timeSpentSeconds: number) => void | Promise<void>;
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

/**
 * Adapts a stack of lesson slides into a sequence of playable beats.
 * Key terms come from the existing slide parser; everything else is derived
 * from the real slide text by the sequencer.
 */
function buildLesson(
  stackTitle: string,
  slides: SlideData[],
  marketId: string | undefined,
  metadata: StackMetadata | undefined,
  industry: IndustryInput,
) {
  const enriched: SlideLike[] = slides.map((slide, slideIdx) => {
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
}: LessonKitReaderProps) {
  const { trainer, drills, stats } = useIndustryContent(marketId, dayNumber);
  const { evaluateRewards } = useCollectibles(marketId);
  const [revealedCard, setRevealedCard] = useState<Partial<CollectibleCard> | null>(null);

  const { lesson, slideNumbers } = useMemo(
    () =>
      buildLesson(stackTitle, slides, marketId, metadata, {
        marketId,
        trainer,
        drills,
        stats,
      }),
    [stackTitle, slides, marketId, metadata, trainer, drills, stats],
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
    <>
      <LessonScreen
        lesson={lesson}
        marketId={marketId}
        onExit={onClose}
        onFinish={async ({ timeSpentSeconds, correct, total }) => {
          await onComplete(isReview, timeSpentSeconds);
          if (!isReview && marketId && stackId) {
            const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
            const result = await evaluateRewards('lesson', `lesson:${stackId}`, accuracy);
            if (result?.collectibles?.[0]) setRevealedCard(result.collectibles[0]);
          }
        }}
        renderExtraActions={extraActions}
        streakDays={streakDays}
        confirmExit={!isReview}
      />
      <CardRevealModal card={revealedCard} marketId={marketId} onClose={() => setRevealedCard(null)} />
    </>
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
