import React, { useMemo, useCallback, useRef } from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LessonScreen } from '../../lesson-kit/screens/LessonScreen';
import { tokens } from '../../lesson-kit/theme/tokens';
import { buildBeats } from '../../lesson-kit/sequencer/buildBeats';
import { useIndustryContent } from '../../hooks/useIndustryContent';
import { parseSlideIntoCards } from './ConceptCard';
import { DeepDiveProvider } from '../../lesson-kit/components/DeepDiveContext';
import { useDeliverable } from '../../hooks/useDeliverable';
import { sectionForLesson } from '../../lib/deliverables';
/** Authored fields win, but only when actually set. */
function stripUndefined(value) {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}
/**
 * Adapts a stack of lesson slides into a sequence of playable beats.
 * Key terms come from the existing slide parser; everything else is derived
 * from the real slide text by the sequencer.
 */
// Day 1 guardrail: a first lesson must never refer to a "yesterday".
const PRIOR_RE = /^[^.!?]*\b(yesterday|last time|previous lesson|in our orientation)\b[^.!?]*[.!?]\s*/i;
function firstDayText(title, body) {
    return {
        title: String(title || '').replace(/^recap:\s*/i, 'Foundation: ').replace(/yesterday's\s+/i, 'The '),
        body: String(body || '').replace(PRIOR_RE, ''),
    };
}
/** A hand-written lesson is usable only if it has an exercises array with at least one beat. */
function isAuthoredLesson(value) {
    const v = value;
    return !!v && typeof v === 'object' && Array.isArray(v.exercises) && v.exercises.length > 0;
}
function buildLesson(stackTitle, slides, marketId, metadata, industry, isFirstDay = false) {
    const enriched = slides.map((raw, slideIdx) => {
        const slide = isFirstDay ? { ...raw, ...firstDayText(raw.title, raw.body) } : raw;
        const cards = parseSlideIntoCards(slide.title, slide.body, slide.sources || [], slideIdx, marketId);
        const keyTerms = cards.flatMap((c) => c.keyTerms || []);
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
export function LessonKitReader({ stackTitle, slides, onClose, onComplete, onSaveInsight, onAddNote, marketId, isReview = false, streakDays, dayNumber, metadata, stackId, learningGoal, authoredLesson, }) {
    const { trainer, drills, stats } = useIndustryContent(marketId, dayNumber);
    const dossier = useDeliverable(marketId, learningGoal);
    // Freeze the default once progress loads, so saving cannot change the active lesson beat.
    const matchedSection = useRef(undefined);
    if (!dossier.loading && !matchedSection.current) {
        matchedSection.current = sectionForLesson(dossier.template, new Set(dossier.learnerEntries.map(entry => entry.sectionKey)), [{ title: stackTitle, body: metadata?.key_takeaway ?? '' }, ...slides]).key;
    }
    const defaultSectionKey = matchedSection.current;
    const { lesson: baseLesson, slideNumbers: baseSlideNumbers } = useMemo(() => isAuthoredLesson(authoredLesson)
        ? { lesson: { ...authoredLesson, id: authoredLesson.id || stackTitle, title: authoredLesson.title || stackTitle }, slideNumbers: authoredLesson.exercises.map(() => slides[0]?.slideNumber ?? 1) }
        :
            buildLesson(stackTitle, slides, marketId, metadata, {
                marketId,
                trainer,
                drills,
                stats,
                learningGoal,
            }, dayNumber === 1), [stackTitle, slides, marketId, metadata, trainer, drills, stats, dayNumber, learningGoal, authoredLesson]);
    // "Say it" closes every daily lesson. Hand-written lessons opt in with { kind: 'sayIt' }.
    const { lesson, slideNumbers } = useMemo(() => {
        const sayIt = (id = 'beat-say-it') => ({
            kind: 'sayIt',
            id,
            takeaway: metadata?.key_takeaway?.trim() || undefined,
            dayNumber,
            learningGoal,
            sectionKey: defaultSectionKey,
        });
        if (isAuthoredLesson(authoredLesson)) {
            return {
                lesson: {
                    ...baseLesson,
                    exercises: baseLesson.exercises.map(ex => (ex.kind === 'sayIt'
                        ? { ...sayIt(ex.id || 'beat-say-it'), ...stripUndefined(ex) }
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
    }, [baseLesson, baseSlideNumbers, authoredLesson, metadata, dayNumber, learningGoal, slides, defaultSectionKey]);
    const extraActions = useCallback((exerciseIndex, dismiss, exercise) => {
        const slideNumber = (exercise?.kind === 'microInsight' ? exercise.sourceSlideNumber : undefined) ?? slideNumbers[exerciseIndex] ?? 1;
        return (<View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={() => { dismiss(); onAddNote(slideNumber); }}>
            <Feather name="edit-3" size={16} color={tokens.color.textSecondary}/>
            <Text style={styles.actionText}>Note</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={() => { dismiss(); onSaveInsight(slideNumber); }}>
            <Feather name="bookmark" size={16} color={tokens.color.textSecondary}/>
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
        </View>);
    }, [slideNumbers, onAddNote, onSaveInsight]);
    // LessonScreen snapshots its queue on mount: wait for the writing default before mounting it.
    if (!defaultSectionKey)
        return <View style={styles.opening}><ActivityIndicator color={tokens.color.accent}/></View>;
    return (<DeepDiveProvider stackId={stackId} learningGoal={learningGoal}>
      <LessonScreen lesson={lesson} marketId={marketId} onExit={onClose} onFinish={({ timeSpentSeconds, correct, total }) => onComplete(isReview, timeSpentSeconds, total > 0 ? Math.round((correct / total) * 100) : 100)} renderExtraActions={extraActions} onSaveLeoAnswer={(text, exerciseIndex, exercise) => onAddNote((exercise?.kind === 'microInsight' ? exercise.sourceSlideNumber : undefined) ?? slideNumbers[exerciseIndex] ?? 1, `Leo explained: ${text}`)} streakDays={streakDays} confirmExit={!isReview}/>
    </DeepDiveProvider>);
}
const styles = StyleSheet.create({
    opening: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    actions: { gap: tokens.space.xs },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 6,
        minHeight: 44,
        paddingHorizontal: tokens.space.md,
        borderRadius: tokens.radius.md,
        backgroundColor: tokens.color.card,
    },
    actionText: { fontSize: tokens.font.caption + 1, fontWeight: '700', color: tokens.color.textSecondary },
});
