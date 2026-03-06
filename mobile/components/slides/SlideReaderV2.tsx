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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { mentors, LEO_VOICE_ID } from '../../data/mentors';
import { getPrimaryMentorForMarket } from '../../data/marketConfig';
import { ConceptCard, parseSlideIntoCards, ConceptCardType } from './ConceptCard';
import { LeoInterstitial, shouldShowLeoCard } from './LeoInterstitial';
import { AskLeoOverlay } from '../ai/AskLeoOverlay';
import { playSound } from '../../lib/sounds';
import { useNarration } from '../../hooks/useNarration';
import { Feather } from '@expo/vector-icons';

const MENTOR_IMAGES: Record<string, any> = {
  maya: require('../../assets/mentors/mentor-maya.png'),
  alex: require('../../assets/mentors/mentor-alex.png'),
  kai: require('../../assets/mentors/mentor-kai.png'),
  sophia: require('../../assets/mentors/mentor-sophia.png'),
};

const LEO_IMAGE = require('../../assets/mascot/leo-reference.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

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

interface SlideReaderV2Props {
  stackTitle: string;
  stackType: 'NEWS' | 'HISTORY' | 'LESSON';
  slides: SlideData[];
  onClose: () => void;
  onComplete: (isReview: boolean, timeSpentSeconds: number) => void;
  onSaveInsight: (slideNumber: number) => void;
  onAddNote: (slideNumber: number) => void;
  marketId?: string;
  isReview?: boolean;
  isProUser?: boolean;
  onPaywallTrigger?: () => void;
  onAskMentor?: () => void;
  mentorName?: string;
}

const MINIMUM_LESSON_TIME_SECONDS = 120;

const TYPE_COLORS: Record<string, string> = {
  LESSON: '#22C55E',
  NEWS: '#3B82F6',
  HISTORY: '#F59E0B',
};

type CardItem = {
  type: 'concept';
  cardType: ConceptCardType;
  title?: string;
  content: string;
  bullets?: string[];
  sources?: Source[];
  slideIndex: number;
} | {
  type: 'leo';
  leoType: 'encouragement' | 'fun-fact' | 'check-in' | 'celebration' | 'halfway';
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
  isReview = false,
  isProUser = true,
  onPaywallTrigger,
  onAskMentor,
  mentorName,
}: SlideReaderV2Props) {
  const insets = useSafeAreaInsets();
  const [currentCard, setCurrentCard] = useState(0);
  const [startTime] = useState(() => Date.now());
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showAskLeo, setShowAskLeo] = useState(false);
  const [narrationEnabled, setNarrationEnabled] = useState(false);
  const cardKey = useRef(0);

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

    slides.forEach((slide, slideIdx) => {
      const parsed = parseSlideIntoCards(slide.title, slide.body, [], slideIdx);
      parsed.forEach((card) => {
        if (card.type === 'sources') return;
        items.push({
          type: 'concept',
          cardType: card.type,
          title: card.title,
          content: card.content,
          bullets: card.bullets,
          sources: card.sources,
          slideIndex: slideIdx,
        });
      });
    });

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
    const MAX_CONCEPT_CARDS = 12;
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
          if (pendingContent.length > 0 && (pendingContent.length + (card.content?.length || 0)) > 600) {
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

    // Insert Leo cards
    const totalItems = items.length;
    const leoPositions: { index: number; leoType: any }[] = [];
    for (let i = 0; i < totalItems; i++) {
      const leoType = shouldShowLeoCard(i, totalItems);
      if (leoType) leoPositions.push({ index: i, leoType });
    }
    for (let i = leoPositions.length - 1; i >= 0; i--) {
      const { index, leoType } = leoPositions[i];
      const nearbyItem = items[index];
      const slideIndex = nearbyItem && 'slideIndex' in nearbyItem ? nearbyItem.slideIndex : 0;
      items.splice(index, 0, { type: 'leo', leoType, slideIndex });
    }

    return items;
  }, [slides]);

  const totalCards = allCards.length;
  const progress = totalCards > 0 ? (currentCard + 1) / totalCards : 0;
  const currentCardData = allCards[currentCard];
  const currentSlideIndex = currentCardData ? ('slideIndex' in currentCardData ? currentCardData.slideIndex : 0) : 0;
  const currentSlide = slides[currentSlideIndex];
  const isLastCard = currentCard >= totalCards - 1;

  // Paywall
  const paywallCardIndex = useMemo(() => {
    if (isProUser || isReview) return -1;
    let count = 0;
    for (let i = 0; i < allCards.length; i++) {
      const card = allCards[i];
      if (card.type === 'concept' && card.cardType === 'header') {
        count++;
        if (count > 3) return i;
      }
    }
    return -1;
  }, [allCards, isProUser, isReview]);

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
      setShowCompletion(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSound('lessonComplete');
      return;
    }
    if (paywallCardIndex > 0 && currentCard + 1 >= paywallCardIndex) {
      onPaywallTrigger?.();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateTransition('left', () => {
      cardKey.current++;
      setCurrentCard(prev => prev + 1);
    });
  }, [isLastCard, currentCard, paywallCardIndex, onPaywallTrigger, animateTransition]);

  const goPrev = useCallback(() => {
    if (currentCard <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateTransition('right', () => {
      cardKey.current++;
      setCurrentCard(prev => prev - 1);
    });
  }, [currentCard, animateTransition]);

  // Swipe gesture
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
    },
    onPanResponderMove: (_, gestureState) => {
      swipeX.setValue(gestureState.dx * 0.4);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -SWIPE_THRESHOLD) {
        goNext();
      } else if (gestureState.dx > SWIPE_THRESHOLD) {
        goPrev();
      } else {
        Animated.spring(swipeX, { toValue: 0, tension: 200, friction: 20, useNativeDriver: true }).start();
      }
    },
  }), [goNext, goPrev]);

  const handleComplete = useCallback(() => {
    setShowCompletion(false);
    onComplete(isReview, timeSpentSeconds);
  }, [isReview, timeSpentSeconds, onComplete]);

  const renderCard = () => {
    if (!currentCardData) return null;
    if (currentCardData.type === 'leo') {
      return (
        <LeoInterstitial
          key={`leo-${currentCard}`}
          type={currentCardData.leoType}
          progress={progress}
          slideTitle={currentSlide?.title}
        />
      );
    }
    return (
      <ConceptCard
        key={`card-${currentCard}`}
        type={currentCardData.cardType}
        title={currentCardData.title}
        content={currentCardData.content}
        bullets={currentCardData.bullets}
        sources={currentCardData.sources}
        cardIndex={currentCard}
        totalCards={totalCards}
        accentColor={accentColor}
      />
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
            <Text style={styles.stackLabel} numberOfLines={1}>{stackTitle}</Text>
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
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { backgroundColor: accentColor, width: `${progress * 100}%` }]} />
        </View>

        {/* Card Area with swipe */}
        <Animated.View
          style={[styles.cardArea, { transform: [{ translateX: swipeX }], opacity: cardOpacity }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.cardContent}>
            {renderCard()}
          </View>
        </Animated.View>

        {/* Bottom Bar */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.bottomRow}>
            {/* Action buttons */}
            {currentCardData?.type === 'concept' && currentCardData.cardType !== 'sources' && (
              <>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => currentSlide && onAddNote(currentSlide.slideNumber)}
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

            <View style={{ flex: 1 }} />

            <Text style={styles.counterText}>
              {currentCard + 1} / {totalCards}
            </Text>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: accentColor }]}
              onPress={goNext}
            >
              <Text style={styles.nextBtnText}>
                {isLastCard ? 'Done' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Completion Modal */}
        <Modal visible={showCompletion} transparent animationType="fade">
          <CompletionOverlay
            isReview={isReview}
            hasMetMinimumTime={hasMetMinimumTime}
            timeSpentSeconds={timeSpentSeconds}
            marketId={marketId}
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
  onComplete,
  onKeepReading,
}: {
  isReview: boolean;
  hasMetMinimumTime: boolean;
  timeSpentSeconds: number;
  marketId?: string;
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
            <Text style={compStyles.title}>Lesson Complete!</Text>
            <View style={compStyles.xpBadge}>
              <Feather name="activity" size={18} color={COLORS.accent} />
              <Text style={compStyles.xpText}>+50 XP</Text>
            </View>
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
    alignItems: 'center',
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
    gap: 12,
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
  narrationImg: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardArea: {
    flex: 1,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
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
  nextBtn: {
    height: 44,
    paddingHorizontal: 28,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.accent,
  },
  nextBtnText: {
    ...TYPE.bodyBold,
    color: '#fff',
  },
});
