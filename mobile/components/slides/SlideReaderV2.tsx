import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  Image,
  PanResponder,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { mentors, LEO_VOICE_ID } from '../../data/mentors';
import { getPrimaryMentorForMarket } from '../../data/marketConfig';
import { ConceptCard, parseSlideIntoCards, ConceptCardType } from './ConceptCard';
import { ReflectionCard } from './ImmersiveCards';
import { WordMatchGame, extractTermPairs, shouldShowWordMatch, WordPair } from './WordMatchGame';
import { SwipeFlashcardDrill, generateFlashcardsFromSlides, FlashcardItem } from './SwipeFlashcardDrill';
import { ComboBar } from './ComboBar';
import { FeedbackBanner } from './FeedbackBanner';
import { AnnotationModal } from './AnnotationModal';
import { LessonDecisionModal } from '../decision/LessonDecisionModal';
import { AskLeoOverlay } from '../ai/AskLeoOverlay';
import { playSound } from '../../lib/sounds';
import { useNarration } from '../../hooks/useNarration';
import { ComboState, createComboState, comboCorrect, comboWrong, getComboMessage } from '../../lib/combo';
import { Feather } from '@expo/vector-icons';
import { KnowledgeUnlock, LessonStage, MissionBrief, StageLabel } from './LessonCampaign';

const MENTOR_IMAGES: Record<string, any> = {
  maya: require('../../assets/mentors/mentor-maya.png'),
  alex: require('../../assets/mentors/mentor-alex.png'),
  kai: require('../../assets/mentors/mentor-kai.png'),
  sophia: require('../../assets/mentors/mentor-sophia.png'),
};

const LEO_IMAGE = require('../../assets/mascot/leo-reference.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 35;

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

interface SlideReaderV2Props {
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
  isProUser?: boolean;
  onAskMentor?: () => void;
  mentorName?: string;
  dayNumber?: number;
  previousLessonTitle?: string;
  metadata?: StackMetadata;
}

const MINIMUM_LESSON_TIME_SECONDS = 120;

const TYPE_COLORS: Record<string, string> = {
  LESSON: '#22C55E',
  NEWS: '#3B82F6',
  HISTORY: '#F59E0B',
};

type CardItem = {
  type: 'mission';
  goals: string[];
  slideIndex: number;
} | {
  type: 'concept';
  cardType: ConceptCardType;
  title?: string;
  content: string;
  bullets?: string[];
  sources?: Source[];
  keyTerms?: { term: string; definition: string }[];
  slideIndex: number;
} | {
  type: 'wordmatch';
  pairs: WordPair[];
  slideIndex: number;
} | {
  type: 'objective';
  goals: string[];
  slideIndex: number;
} | {
  type: 'recap';
  previousTopic?: string;
  currentTopic: string;
  slideIndex: number;
} | {
  type: 'reflection';
  keyTakeaway: string;
  nextPreview?: string;
  slideIndex: number;
} | {
  type: 'flashcard';
  cards: FlashcardItem[];
  slideIndex: number;
};

export function SlideReaderV2({
  stackTitle,
  stackType,
  slides,
  onClose,
  onComplete,
  onSaveInsight,
  onAddNote,
  marketId,
  stackId,
  isReview = false,
  isProUser = true,
  onAskMentor,
  mentorName,
  dayNumber,
  previousLessonTitle,
  metadata,
}: SlideReaderV2Props) {
  const insets = useSafeAreaInsets();
  const [currentCard, setCurrentCard] = useState(0);
  const [startTime] = useState(() => Date.now());
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [showAskLeo, setShowAskLeo] = useState(false);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [narrationEnabled, setNarrationEnabled] = useState(false);
  const [earnedInsight, setEarnedInsight] = useState<string | null>(null);
  const cardKey = useRef(0);

  // Combo system state
  const [comboState, setComboState] = useState<ComboState>(createComboState);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  // Feedback banner state
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackExplanation, setFeedbackExplanation] = useState<string | undefined>();
  const [feedbackXP, setFeedbackXP] = useState(0);

  // Swipe animation
  const swipeX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  // Resolve mentor voice for this market
  const mentorId = marketId ? getPrimaryMentorForMarket(marketId) : 'sophia';
  const mentor = mentors.find(m => m.id === mentorId) || mentors[0];
  const mentorVoiceId = mentor.voiceId || LEO_VOICE_ID;

  const { speak, stop: stopNarration, isPlaying, isLoading: narrationLoading } = useNarration({
    voiceId: mentorVoiceId,
    enabled: narrationEnabled,
  });

  const accentColor = TYPE_COLORS[stackType] || COLORS.accent;

  // Timer
  useEffect(() => {
    const interval = setInterval(
      () => setTimeSpentSeconds(Math.floor((Date.now() - startTime) / 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, [startTime]);

  // Auto-narrate when card changes
  useEffect(() => {
    if (!narrationEnabled) return;
    const card = allCards[currentCard];
    if (!card) return;
    if (card.type === 'concept') {
      const textToRead = [card.title, card.content, ...(card.bullets || [])].filter(Boolean).join('. ');
      speak(textToRead);
    } else {
      stopNarration();
    }
  }, [currentCard, narrationEnabled]);

  useEffect(() => { if (!narrationEnabled) stopNarration(); }, [narrationEnabled]);
  useEffect(() => { return () => { stopNarration(); }; }, []);

  const hasMetMinimumTime = timeSpentSeconds >= MINIMUM_LESSON_TIME_SECONDS;

  // Build all cards from slides
  const allCards: CardItem[] = useMemo(() => {
    const items: CardItem[] = [];

    // One briefing replaces separate recap/objective cards and previews the full route.
    if (stackType === 'LESSON' && !isReview) {
      const goals = metadata?.learning_objectives?.length
        ? metadata.learning_objectives.slice(0, 3)
        : slides.map(s => s.title).filter(t => t && t.length > 5).slice(0, 3);
      items.push({
        type: 'mission',
        goals,
        slideIndex: 0,
      });
    }

    slides.forEach((slide, slideIdx) => {
      const parsed = parseSlideIntoCards(slide.title, slide.body, [], slideIdx, marketId);
      parsed.forEach((card) => {
        if (card.type === 'sources') return;
        items.push({
          type: 'concept',
          cardType: card.type,
          title: card.title,
          content: card.content,
          bullets: card.bullets,
          sources: card.sources,
          keyTerms: card.keyTerms,
          slideIndex: slideIdx,
        });
      });
    });

    // ── FLASHCARD DRILL: Swipe-based true/false review before reflection ──
    if (stackType === 'LESSON' && slides.length >= 2 && !isReview) {
      const flashcards = generateFlashcardsFromSlides(slides.map(s => ({ title: s.title, body: s.body })));
      if (flashcards.length >= 3) {
        items.push({
          type: 'flashcard',
          cards: flashcards,
          slideIndex: slides.length - 1,
        });
      }
    }

    // ── REFLECTION CARD: Use generated key_takeaway and next_preview ──
    if (stackType === 'LESSON' && slides.length >= 2) {
      const takeaway = metadata?.key_takeaway
        || `Understanding ${(slides[slides.length - 1]?.title || stackTitle).toLowerCase()} is essential to mastering how this industry operates and where it's heading.`;
      const preview = metadata?.next_preview
        || (dayNumber ? `Day ${dayNumber + 1} continues your journey deeper into the fundamentals.` : undefined);
      items.push({
        type: 'reflection',
        keyTakeaway: takeaway,
        nextPreview: preview,
        slideIndex: slides.length - 1,
      });
    }

    // Single sources card at end
    const lastSlide = slides[slides.length - 1];
    if (lastSlide?.sources?.length > 0) {
      items.push({
        type: 'concept',
        cardType: 'sources',
        content: '',
        sources: lastSlide.sources,
        slideIndex: slides.length - 1,
      });
    }

    // Smart merging for cap
    const MAX_CONCEPT_CARDS = 18;
    if (items.length > MAX_CONCEPT_CARDS) {
      const merged: CardItem[] = [];
      let pendingContent = '';
      let pendingTitle: string | undefined;
      let pendingSlideIdx = 0;

      for (const item of items) {
        if (item.type !== 'concept') {
          if (pendingContent) {
            merged.push({ type: 'concept', cardType: 'concept', title: pendingTitle, content: pendingContent, slideIndex: pendingSlideIdx });
            pendingContent = '';
            pendingTitle = undefined;
          }
          merged.push(item);
          continue;
        }
        const card = item;
        if (card.cardType === 'header' || card.cardType === 'bullet-group' || card.cardType === 'sources') {
          if (pendingContent) {
            merged.push({ type: 'concept', cardType: 'concept', title: pendingTitle, content: pendingContent, slideIndex: pendingSlideIdx });
            pendingContent = '';
            pendingTitle = undefined;
          }
          merged.push(card);
        } else {
          if (pendingContent.length > 0 && (pendingContent.length + (card.content?.length || 0)) > 900) {
            merged.push({ type: 'concept', cardType: 'concept', title: pendingTitle, content: pendingContent, slideIndex: pendingSlideIdx });
            pendingContent = card.content || '';
            pendingTitle = card.title;
            pendingSlideIdx = card.slideIndex;
          } else {
            if (!pendingTitle && card.title) pendingTitle = card.title;
            pendingContent += (pendingContent ? ' ' : '') + (card.content || '');
            pendingSlideIdx = card.slideIndex;
          }
        }
      }
      if (pendingContent) {
        merged.push({ type: 'concept', cardType: 'concept', title: pendingTitle, content: pendingContent, slideIndex: pendingSlideIdx });
      }

      if (merged.length > MAX_CONCEPT_CARDS) {
        const result: CardItem[] = [];
        let headerCount = 0;
        for (const item of merged) {
          if (item.type === 'concept' && item.cardType === 'header') {
            headerCount++;
            if (headerCount === 1 || headerCount % 3 === 0) result.push(item);
          } else {
            result.push(item);
          }
        }
        items.length = 0;
        items.push(...result.slice(0, MAX_CONCEPT_CARDS));
      } else {
        items.length = 0;
        items.push(...merged);
      }
    }

    // Insert word-match games at strategic midpoints
    const wmInsertions: { index: number; pairs: WordPair[]; slideIndex: number }[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type === 'concept' && item.content) {
        const slideData = slides[item.slideIndex];
        if (slideData) {
          const pairs = extractTermPairs(slideData.title, slideData.body);
          if (shouldShowWordMatch(i, items.length, pairs)) {
            wmInsertions.push({ index: i + 1, pairs, slideIndex: item.slideIndex });
          }
        }
      }
    }
    for (let i = wmInsertions.length - 1; i >= 0; i--) {
      const { index, pairs, slideIndex } = wmInsertions[i];
      items.splice(index, 0, { type: 'wordmatch', pairs, slideIndex });
    }

    return items;
  }, [slides, marketId, stackType, stackTitle, isReview, dayNumber, metadata]);

  const totalCards = allCards.length;
  const progress = totalCards > 0 ? (currentCard + 1) / totalCards : 0;
  const currentCardData = allCards[currentCard];
  const currentSlideIndex = currentCardData ? ('slideIndex' in currentCardData ? currentCardData.slideIndex : 0) : 0;
  const currentSlide = slides[currentSlideIndex];
  const isLastCard = currentCard >= totalCards - 1;
  const answeredXP = correctCount * 10;

  const currentStage: LessonStage = useMemo(() => {
    if (!currentCardData || currentCardData.type === 'mission') return 'Brief';
    if (currentCardData.type === 'reflection') return 'Debrief';
    if (currentCardData.type === 'wordmatch' || currentCardData.type === 'flashcard') return 'Apply';
    if (currentCardData.type === 'concept' && currentCardData.cardType === 'example') return 'Predict';
    if (currentCard <= Math.max(2, Math.floor(totalCards * 0.18))) return 'Recall';
    return 'Discover';
  }, [currentCardData, currentCard, totalCards]);

  // All users can complete full lessons — the app is free
  // Pro ad is shown AFTER lesson completion instead

  const animateTransition = useCallback((direction: 'left' | 'right', callback: () => void) => {
    const toX = direction === 'left' ? -SCREEN_WIDTH * 0.3 : SCREEN_WIDTH * 0.3;
    Animated.parallel([
      Animated.timing(swipeX, { toValue: toX, duration: 150, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0.3, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      swipeX.setValue(direction === 'left' ? SCREEN_WIDTH * 0.15 : -SCREEN_WIDTH * 0.15);
      cardOpacity.setValue(0.3);
      Animated.parallel([
        Animated.spring(swipeX, { toValue: 0, tension: 200, friction: 20, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }, [swipeX, cardOpacity]);

  const goNext = useCallback(() => {
    if (isLastCard) {
      setShowDecision(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSound('lessonComplete');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateTransition('left', () => {
      const completed = allCards[currentCard];
      if (completed?.type === 'concept' && completed.title) {
        setEarnedInsight(completed.title);
      } else {
        setEarnedInsight(null);
      }
      cardKey.current++;
      setCurrentCard(prev => prev + 1);
    });
  }, [isLastCard, currentCard, animateTransition, allCards]);

  const goPrev = useCallback(() => {
    if (currentCard <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateTransition('right', () => {
      cardKey.current++;
      setCurrentCard(prev => prev - 1);
    });
  }, [currentCard, animateTransition]);

  // Swipe gesture — use a transparent overlay layer to avoid ScrollView conflict in Expo
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) => {
      return Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.2;
    },
    onMoveShouldSetPanResponderCapture: (_, gs) => {
      // More aggressive capture for Expo: grab horizontal swipes early
      return Math.abs(gs.dx) > 12 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5;
    },
    onPanResponderGrant: () => {
      // Stop any ongoing spring animation when touch starts
      swipeX.stopAnimation();
    },
    onPanResponderMove: (_, gs) => {
      const dampen = (currentCard === 0 && gs.dx > 0) || (isLastCard && gs.dx < 0) ? 0.15 : 0.6;
      swipeX.setValue(gs.dx * dampen);
    },
    onPanResponderRelease: (_, gs) => {
      const vx = gs.vx;
      if (gs.dx < -SWIPE_THRESHOLD || vx < -0.4) {
        Animated.spring(swipeX, { toValue: 0, tension: 200, friction: 20, useNativeDriver: true }).start();
        goNext();
      } else if (gs.dx > SWIPE_THRESHOLD || vx > 0.4) {
        Animated.spring(swipeX, { toValue: 0, tension: 200, friction: 20, useNativeDriver: true }).start();
        goPrev();
      } else {
        Animated.spring(swipeX, { toValue: 0, tension: 200, friction: 20, useNativeDriver: true }).start();
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(swipeX, { toValue: 0, tension: 200, friction: 20, useNativeDriver: true }).start();
    },
  }), [goNext, goPrev, currentCard, isLastCard]);

  // Handle answer from quiz/flashcard/wordmatch → show feedback banner
  const handleAnswer = useCallback((correct: boolean, explanation?: string) => {
    const BASE_XP = 10;
    let xpEarned: number;
    let newCombo: ComboState;

    if (correct) {
      const result = comboCorrect(comboState, BASE_XP);
      newCombo = result.newState;
      xpEarned = result.xpEarned;
      setCorrectCount(prev => prev + 1);
      playSound('correct');
    } else {
      const result = comboWrong(comboState, BASE_XP);
      newCombo = result.newState;
      xpEarned = result.xpEarned;
      playSound('wrong');
    }

    setComboState(newCombo);
    setTotalAnswered(prev => prev + 1);

    // Combo message
    const comboMsg = getComboMessage(newCombo.streak);
    const baseMsg = correct ? 'Signal identified' : 'Review the signal';

    setFeedbackCorrect(correct);
    setFeedbackMessage(comboMsg || baseMsg);
    setFeedbackExplanation(explanation);
    setFeedbackXP(xpEarned);
    setFeedbackVisible(true);
  }, [comboState]);

  const handleFeedbackContinue = useCallback(() => {
    setFeedbackVisible(false);
    goNext();
  }, [goNext]);

  const handleComplete = useCallback(() => {
    setShowCompletion(false);
    onComplete(isReview, timeSpentSeconds);
  }, [isReview, timeSpentSeconds, onComplete]);

  const renderCard = () => {
    if (!currentCardData) return null;
    if (currentCardData.type === 'mission') {
      return (
        <MissionBrief
          title={stackTitle}
          goals={currentCardData.goals}
          previousTopic={metadata?.recap_bridge || previousLessonTitle}
          marketId={marketId}
          dayNumber={dayNumber}
          mentorName={mentorName || mentor.name}
          accentColor={accentColor}
          estimatedMinutes={Math.max(4, Math.ceil(slides.reduce((sum, slide) => sum + slide.body.split(/\s+/).length, 0) / 180))}
        />
      );
    }
    if (currentCardData.type === 'wordmatch') {
      return (
        <WordMatchGame
          key={`wm-${currentCard}`}
          pairs={currentCardData.pairs}
          onComplete={(score, total) => {
            handleAnswer(score === total, `You matched ${score}/${total} pairs correctly.`);
          }}
          accentColor={accentColor}
        />
      );
    }
    if (currentCardData.type === 'flashcard') {
      return (
        <SwipeFlashcardDrill
          key={`flash-${currentCard}`}
          cards={currentCardData.cards}
          onComplete={(score, total) => {
            handleAnswer(score >= total * 0.7, `You got ${score}/${total} correct!`);
          }}
          accentColor={accentColor}
        />
      );
    }
    if (currentCardData.type === 'reflection') {
      return (
        <ReflectionCard
          key={`refl-${currentCard}`}
          keyTakeaway={currentCardData.keyTakeaway}
          nextPreview={currentCardData.nextPreview}
          accentColor={accentColor}
          dayNumber={dayNumber}
        />
      );
    }
    return (
      <View>
        {earnedInsight ? <KnowledgeUnlock label={earnedInsight} accentColor={accentColor} /> : null}
        <ConceptCard
          key={`card-${currentCard}`}
          type={currentCardData.cardType}
          title={currentCardData.title}
          content={currentCardData.content}
          bullets={currentCardData.bullets}
          sources={currentCardData.sources}
          keyTerms={currentCardData.keyTerms}
          cardIndex={currentCard}
          totalCards={totalCards}
          accentColor={accentColor}
        />
      </View>
    );
  };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          <View style={styles.topBarCenter}>
            <StageLabel stage={currentStage} detail={stackTitle} accentColor={accentColor} />
          </View>

          {/* Ask Leo */}
          <TouchableOpacity onPress={() => setShowAskLeo(true)} style={styles.askLeoBtn}>
            <Image source={LEO_IMAGE} style={styles.askLeoImage} />
          </TouchableOpacity>

          {/* Narration toggle */}
          <TouchableOpacity
            onPress={() => setNarrationEnabled(!narrationEnabled)}
            style={[styles.narrationBtn, narrationEnabled && styles.narrationBtnActive]}
          >
            <Feather
              name="volume-2"
              size={20}
              color={narrationEnabled ? COLORS.accent : COLORS.textMuted}
              style={{ opacity: narrationEnabled ? 1 : 0.4 }}
            />
          </TouchableOpacity>

          <View style={styles.xpCounter}>
            <Feather name="zap" size={13} color={COLORS.warning} />
            <Text style={styles.xpCounterText}>{answeredXP}</Text>
          </View>
        </View>

        {/* Segmented campaign progress */}
        <View style={styles.progressBarContainer}>
          {Array.from({ length: Math.min(6, Math.max(4, Math.ceil(totalCards / 4))) }).map((_, index, arr) => {
            const segmentProgress = Math.ceil(progress * arr.length);
            return <View key={index} style={[styles.progressSegment, index < segmentProgress && { backgroundColor: accentColor }]} />;
          })}
        </View>

        {/* Combo Bar — visible when user has answered questions */}
        {totalAnswered > 0 && (
          <ComboBar
            combo={comboState}
            correctCount={correctCount}
            totalAnswered={totalAnswered}
          />
        )}

        {/* Card Area with swipe + edge tap zones for Expo fallback */}
        <View style={styles.cardArea}>
          <Animated.View
            style={[{ flex: 1 }, { transform: [{ translateX: swipeX }], opacity: cardOpacity }]}
            {...panResponder.panHandlers}
          >
            <ScrollView
              style={styles.cardScroll}
              contentContainerStyle={styles.cardContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {renderCard()}
            </ScrollView>
          </Animated.View>

          {/* Edge tap zones as swipe fallback for Expo */}
          <TouchableOpacity
            style={styles.edgeTapLeft}
            onPress={goPrev}
            activeOpacity={0.3}
          />
          <TouchableOpacity
            style={styles.edgeTapRight}
            onPress={goNext}
            activeOpacity={0.3}
          />
        </View>

        {/* Bottom Bar */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.bottomRow}>
            {/* Back button */}
            <TouchableOpacity
              style={[styles.backBtn, currentCard === 0 && { opacity: 0.3 }]}
              onPress={goPrev}
              disabled={currentCard === 0}
            >
              <Feather name="chevron-left" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {/* Action buttons */}
            {currentCardData?.type === 'concept' && currentCardData.cardType !== 'sources' && (
              <>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => currentSlide && setShowAnnotation(true)}
                >
                  <Feather name="edit-3" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => currentSlide && onSaveInsight(currentSlide.slideNumber)}
                >
                  <Feather name="bookmark" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </>
            )}

            <View style={styles.progressDotsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.progressDots}>
                {Array.from({ length: totalCards }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === currentCard
                        ? [styles.dotActive, { backgroundColor: accentColor }]
                        : i < currentCard
                        ? [styles.dotCompleted, { backgroundColor: accentColor }]
                        : styles.dotUpcoming,
                    ]}
                  />
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: accentColor }]}
              onPress={goNext}
            >
              <Feather name={isLastCard ? 'check' : 'chevron-right'} size={18} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.nextBtnText}>
                {currentCardData?.type === 'mission' ? 'Start mission' : isLastCard ? 'Make the call' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Annotation Modal */}
        <AnnotationModal
          visible={showAnnotation}
          slideTitle={currentSlide?.title || ''}
          slideBody={currentCardData?.type === 'concept' ? (currentCardData.content || '') : ''}
          onSave={(annotation) => {
            setShowAnnotation(false);
            if (currentSlide) {
              onAddNote(currentSlide.slideNumber, annotation);
            }
          }}
          onCancel={() => setShowAnnotation(false)}
        />

        {/* Decision Engine — closing decision before completion */}
        <LessonDecisionModal
          visible={showDecision}
          marketId={marketId}
          stackId={stackId}
          dayNumber={dayNumber}
          lessonTitle={stackTitle}
          onDone={() => {
            setShowDecision(false);
            setShowCompletion(true);
          }}
        />

        {/* Completion Modal */}
        <Modal visible={showCompletion} transparent animationType="fade">
          <CompletionOverlay
            isReview={isReview}
            hasMetMinimumTime={hasMetMinimumTime}
            timeSpentSeconds={timeSpentSeconds}
            marketId={marketId}
            lessonTitle={stackTitle}
            keyTakeaway={metadata?.key_takeaway}
            nextPreview={metadata?.next_preview}
            correctCount={correctCount}
            totalAnswered={totalAnswered}
            onComplete={handleComplete}
            onKeepReading={() => setShowCompletion(false)}
          />
        </Modal>

        {/* Ask Leo */}
        <AskLeoOverlay
          visible={showAskLeo}
          onClose={() => setShowAskLeo(false)}
          lessonContext={`Lesson: ${stackTitle}\nCurrent slide: ${currentSlide?.title || ''}\nContent: ${currentCardData?.type === 'concept' ? currentCardData.content : ''}`}
        />

        {/* Feedback Banner — Duolingo-style bottom feedback */}
        <FeedbackBanner
          visible={feedbackVisible}
          isCorrect={feedbackCorrect}
          message={feedbackMessage}
          explanation={feedbackExplanation}
          xpEarned={feedbackXP}
          comboMultiplier={comboState.multiplier}
          onContinue={handleFeedbackContinue}
        />
      </View>
    </Modal>
  );
}

// ── Completion Overlay ──
function CompletionOverlay({
  isReview,
  hasMetMinimumTime,
  timeSpentSeconds,
  marketId,
  lessonTitle,
  keyTakeaway,
  nextPreview,
  correctCount,
  totalAnswered,
  onComplete,
  onKeepReading,
}: {
  isReview: boolean;
  hasMetMinimumTime: boolean;
  timeSpentSeconds: number;
  marketId?: string;
  lessonTitle: string;
  keyTakeaway?: string;
  nextPreview?: string;
  correctCount: number;
  totalAnswered: number;
  onComplete: () => void;
  onKeepReading: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 15, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const remaining = Math.max(0, MINIMUM_LESSON_TIME_SECONDS - timeSpentSeconds);
  const remainMin = Math.floor(remaining / 60);
  const remainSec = remaining % 60;

  return (
    <Animated.View style={[compStyles.overlay, { opacity: opacityAnim }]}>
      <Animated.View style={[compStyles.card, { transform: [{ scale: scaleAnim }] }]}>
        {/* Icon instead of emoji */}
        <View style={compStyles.iconCircle}>
          <Feather
            name={isReview ? 'book-open' : hasMetMinimumTime ? 'award' : 'bar-chart-2'}
            size={36}
            color={hasMetMinimumTime ? COLORS.success : COLORS.accent}
          />
        </View>

        {isReview ? (
          <>
            <Text style={compStyles.title}>Great review!</Text>
            <Text style={compStyles.sub}>Knowledge reinforced</Text>
          </>
        ) : !hasMetMinimumTime ? (
          <>
            <Text style={compStyles.title}>Take your time!</Text>
            <Text style={compStyles.sub}>Read for {remainMin}:{remainSec.toString().padStart(2, '0')} more to earn XP</Text>
            <TouchableOpacity style={compStyles.keepBtn} onPress={onKeepReading}>
              <Text style={compStyles.keepBtnText}>Keep Reading</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={compStyles.kicker}>MISSION DEBRIEF</Text>
            <Text style={compStyles.title}>{lessonTitle}</Text>
            <Text style={compStyles.sub}>You reached the decision point and completed the route.</Text>
            <View style={compStyles.resultRow}>
              <View style={compStyles.resultCell}>
                <Text style={compStyles.resultValue}>+50</Text>
                <Text style={compStyles.resultLabel}>XP EARNED</Text>
              </View>
              <View style={compStyles.resultDivider} />
              <View style={compStyles.resultCell}>
                <Text style={compStyles.resultValue}>{totalAnswered > 0 ? `${correctCount}/${totalAnswered}` : 'Ready'}</Text>
                <Text style={compStyles.resultLabel}>SIGNALS READ</Text>
              </View>
            </View>
            {keyTakeaway ? (
              <View style={compStyles.takeaway}>
                <Text style={compStyles.takeawayLabel}>FIELD NOTE</Text>
                <Text style={compStyles.takeawayText}>{keyTakeaway}</Text>
              </View>
            ) : null}
            {nextPreview ? <Text style={compStyles.nextPreview}>Next mission · {nextPreview}</Text> : null}
          </>
        )}

        {(isReview || hasMetMinimumTime) && (
          <TouchableOpacity style={compStyles.ctaBtn} onPress={onComplete}>
            <Text style={compStyles.ctaBtnText}>Continue</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const compStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8,11,24,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: COLORS.bg2,
    borderRadius: 28,
    padding: 32,
    width: '100%',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
  },
  iconImg: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  title: { ...TYPE.h1, color: COLORS.textPrimary, marginBottom: 6, textAlign: 'center' },
  sub: { ...TYPE.body, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  kicker: { fontSize: 11, fontWeight: '900', color: COLORS.accent, textAlign: 'center', marginBottom: 8, letterSpacing: 0 },
  resultRow: { flexDirection: 'row', alignItems: 'stretch', backgroundColor: COLORS.bg1, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginVertical: 16 },
  resultCell: { flex: 1, alignItems: 'center', paddingVertical: 15, paddingHorizontal: 8 },
  resultDivider: { width: 1, backgroundColor: COLORS.border },
  resultValue: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
  resultLabel: { marginTop: 3, fontSize: 9, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0 },
  takeaway: { backgroundColor: COLORS.accentSoft, borderRadius: 14, borderWidth: 1, borderColor: COLORS.accentMedium, padding: 14, marginBottom: 12 },
  takeawayLabel: { fontSize: 10, fontWeight: '900', color: COLORS.accent, marginBottom: 5, letterSpacing: 0 },
  takeawayText: { fontSize: 14, lineHeight: 20, color: COLORS.textPrimary, fontWeight: '600' },
  nextPreview: { fontSize: 12, lineHeight: 18, color: COLORS.textMuted, textAlign: 'center', marginBottom: 16 },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accentSoft,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
  },
  xpText: { ...TYPE.h2, color: COLORS.accent },
  ctaBtn: {
    width: '100%',
    height: 54,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.accent,
  },
  ctaBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  keepBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  keepBtnText: { ...TYPE.bodyBold, color: COLORS.textSecondary },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  topBarCenter: {
    flex: 1,
    minWidth: 0,
  },
  stackLabel: {
    ...TYPE.bodyBold,
    color: COLORS.textSecondary,
  },
  askLeoBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(249,115,22,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(249,115,22,0.25)',
  },
  askLeoImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  narrationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  narrationBtnActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentMedium,
  },
  xpCounter: { minWidth: 42, height: 32, paddingHorizontal: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: COLORS.warningSoft, borderWidth: 1, borderColor: COLORS.goldSoft },
  xpCounterText: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary },
  narrationImg: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    gap: 5,
  },
  progressSegment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  cardArea: {
    flex: 1,
    position: 'relative',
  },
  cardScroll: {
    flex: 1,
  },
  cardContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48, // pb-12 to clear Next button / home bar
  },
  edgeTapLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 10,
  },
  edgeTapRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 10,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bg1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  counterText: {
    ...TYPE.caption,
    color: COLORS.textMuted,
  },
  progressDotsWrapper: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, overflow: 'hidden' as const },
  progressDots: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 3, paddingHorizontal: 4 },
  dot: { height: 3, borderRadius: 2 },
  dotActive: { width: 16, opacity: 1 },
  dotCompleted: { width: 5, opacity: 0.4 },
  dotUpcoming: { width: 5, backgroundColor: COLORS.border },
  nextBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    ...SHADOWS.accent,
  },
  nextBtnText: {
    ...TYPE.bodyBold,
    color: '#fff',
    fontWeight: '800',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bg1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
