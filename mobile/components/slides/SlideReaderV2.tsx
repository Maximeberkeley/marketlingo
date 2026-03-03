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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../lib/constants';
import { mentors } from '../../data/mentors';
import { getPrimaryMentorForMarket } from '../../data/marketConfig';
import { ConceptCard, parseSlideIntoCards, ConceptCardType } from './ConceptCard';
import { LeoInterstitial, shouldShowLeoCard } from './LeoInterstitial';
import { AskLeoOverlay } from '../ai/AskLeoOverlay';
import { playSound } from '../../lib/sounds';

const MENTOR_IMAGES: Record<string, any> = {
  maya: require('../../assets/mentors/mentor-maya.png'),
  alex: require('../../assets/mentors/mentor-alex.png'),
  kai: require('../../assets/mentors/mentor-kai.png'),
  sophia: require('../../assets/mentors/mentor-sophia.png'),
};

const LEO_IMAGE = require('../../assets/mascot/leo-reference.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

const MINIMUM_LESSON_TIME_SECONDS = 120; // Reduced since cards are bite-sized

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

  const accentColor = TYPE_COLORS[stackType] || COLORS.accent;

  // Timer
  useEffect(() => {
    const interval = setInterval(
      () => setTimeSpentSeconds(Math.floor((Date.now() - startTime) / 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, [startTime]);

  const hasMetMinimumTime = timeSpentSeconds >= MINIMUM_LESSON_TIME_SECONDS;

  // Build all cards from all slides, inserting Leo interstitials
  const allCards: CardItem[] = useMemo(() => {
    const items: CardItem[] = [];

    slides.forEach((slide, slideIdx) => {
      // Only include sources on the last slide to reduce card count
      const isLastSlide = slideIdx === slides.length - 1;
      const slideSources = isLastSlide ? slide.sources : [];
      const parsed = parseSlideIntoCards(slide.title, slide.body, slideSources, slideIdx);
      parsed.forEach((card) => {
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

    // Cap at ~18 concept cards max (trim from the middle if needed)
    const MAX_CONCEPT_CARDS = 18;
    if (items.length > MAX_CONCEPT_CARDS) {
      // Keep first 4, last 4, evenly sample middle
      const head = items.slice(0, 4);
      const tail = items.slice(-4);
      const middle = items.slice(4, -4);
      const middleTarget = MAX_CONCEPT_CARDS - 8;
      const step = Math.max(1, Math.floor(middle.length / middleTarget));
      const sampledMiddle: CardItem[] = [];
      for (let i = 0; i < middle.length && sampledMiddle.length < middleTarget; i += step) {
        sampledMiddle.push(middle[i]);
      }
      items.length = 0;
      items.push(...head, ...sampledMiddle, ...tail);
    }

    // Insert Leo cards at strategic positions
    const totalItems = items.length;
    const leoPositions: { index: number; leoType: any }[] = [];

    for (let i = 0; i < totalItems; i++) {
      const leoType = shouldShowLeoCard(i, totalItems);
      if (leoType) {
        leoPositions.push({ index: i, leoType });
      }
    }

    // Insert in reverse to maintain indices
    for (let i = leoPositions.length - 1; i >= 0; i--) {
      const { index, leoType } = leoPositions[i];
      const nearbyItem = items[index];
      const slideIndex = nearbyItem && 'slideIndex' in nearbyItem ? nearbyItem.slideIndex : 0;
      items.splice(index, 0, {
        type: 'leo',
        leoType,
        slideIndex,
      });
    }

    return items;
  }, [slides]);

  const totalCards = allCards.length;
  const progress = totalCards > 0 ? (currentCard + 1) / totalCards : 0;
  const currentCardData = allCards[currentCard];
  const currentSlideIndex = currentCardData ? ('slideIndex' in currentCardData ? currentCardData.slideIndex : 0) : 0;
  const currentSlide = slides[currentSlideIndex];
  const isLastCard = currentCard >= totalCards - 1;

  // Paywall check
  const paywallCardIndex = useMemo(() => {
    if (isProUser || isReview) return -1;
    // Find the card index corresponding to slide 3 (4th slide, 0-indexed)
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

  const goNext = useCallback(() => {
    if (isLastCard) {
      setShowCompletion(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSound('lessonComplete');
      return;
    }

    // Paywall
    if (paywallCardIndex > 0 && currentCard + 1 >= paywallCardIndex) {
      onPaywallTrigger?.();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cardKey.current++;
    setCurrentCard(prev => prev + 1);
  }, [isLastCard, currentCard, paywallCardIndex, onPaywallTrigger]);

  const goPrev = useCallback(() => {
    if (currentCard <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cardKey.current++;
    setCurrentCard(prev => prev - 1);
  }, [currentCard]);

  const handleComplete = useCallback(() => {
    setShowCompletion(false);
    onComplete(isReview, timeSpentSeconds);
  }, [isReview, timeSpentSeconds, onComplete]);

  // Render the current card
  const renderCard = () => {
    if (!currentCardData) return null;

    if (currentCardData.type === 'leo') {
      return (
        <LeoInterstitial
          key={`leo-${cardKey.current}`}
          type={currentCardData.leoType}
          progress={progress}
          slideTitle={currentSlide?.title}
        />
      );
    }

    return (
      <ConceptCard
        key={`card-${cardKey.current}`}
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

        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          <View style={styles.topBarCenter}>
            <Text style={styles.stackLabel} numberOfLines={1}>{stackTitle}</Text>
          </View>

          {/* Ask Leo button */}
          <TouchableOpacity
            onPress={() => setShowAskLeo(true)}
            style={styles.askLeoBtn}
          >
            <Image source={LEO_IMAGE} style={styles.askLeoImage} />
            <Text style={styles.askLeoText}>?</Text>
          </TouchableOpacity>

          {/* Narration toggle */}
          <TouchableOpacity
            onPress={() => setNarrationEnabled(!narrationEnabled)}
            style={[styles.narrationBtn, narrationEnabled && styles.narrationBtnActive]}
          >
            <Text style={styles.narrationIcon}>{narrationEnabled ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Progress Bar ── */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: accentColor,
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>

        {/* ── Card Area (tap zones) ── */}
        <View style={styles.cardArea}>
          {/* Left tap zone - go back */}
          <TouchableOpacity
            style={styles.tapZoneLeft}
            onPress={goPrev}
            activeOpacity={1}
          />

          {/* Card content */}
          <View style={styles.cardContent}>
            {renderCard()}
          </View>

          {/* Right tap zone - go forward */}
          <TouchableOpacity
            style={styles.tapZoneRight}
            onPress={goNext}
            activeOpacity={1}
          />
        </View>

        {/* ── Bottom Bar ── */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.bottomRow}>
            {/* Note/Save buttons - only for concept cards */}
            {currentCardData?.type === 'concept' && currentCardData.cardType !== 'sources' && (
              <>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => currentSlide && onAddNote(currentSlide.slideNumber)}
                >
                  <Text style={styles.actionEmoji}>📝</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => currentSlide && onSaveInsight(currentSlide.slideNumber)}
                >
                  <Text style={styles.actionEmoji}>🔖</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={{ flex: 1 }} />

            {/* Card counter */}
            <Text style={styles.counterText}>
              {currentCard + 1} / {totalCards}
            </Text>

            <View style={{ flex: 1 }} />

            {/* Next CTA */}
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: accentColor }]}
              onPress={goNext}
            >
              <Text style={styles.nextBtnText}>
                {isLastCard ? '✅ Done' : 'Next →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Completion Modal ── */}
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

        {/* ── Ask Leo Overlay ── */}
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
  const leoY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 15, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(leoY, { toValue: -10, duration: 800, useNativeDriver: true }),
        Animated.timing(leoY, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const remaining = Math.max(0, MINIMUM_LESSON_TIME_SECONDS - timeSpentSeconds);
  const remainMin = Math.floor(remaining / 60);
  const remainSec = remaining % 60;

  return (
    <Animated.View style={[compStyles.overlay, { opacity: opacityAnim }]}>
      <Animated.View style={[compStyles.card, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.Image
          source={require('../../assets/mascot/leo-reference.png')}
          style={[compStyles.leo, { transform: [{ translateY: leoY }] }]}
        />

        {isReview ? (
          <>
            <Text style={compStyles.emoji}>📖</Text>
            <Text style={compStyles.title}>Great review!</Text>
            <Text style={compStyles.sub}>Knowledge reinforced 💪</Text>
          </>
        ) : !hasMetMinimumTime ? (
          <>
            <Text style={compStyles.emoji}>⏱️</Text>
            <Text style={compStyles.title}>Take your time!</Text>
            <Text style={compStyles.sub}>Read for {remainMin}:{remainSec.toString().padStart(2, '0')} more to earn XP</Text>
            <TouchableOpacity style={compStyles.keepBtn} onPress={onKeepReading}>
              <Text style={compStyles.keepBtnText}>⏱ Keep Reading</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={compStyles.emoji}>🔥</Text>
            <Text style={compStyles.title}>Lesson Complete!</Text>
            <View style={compStyles.xpBadge}>
              <Text style={compStyles.xpText}>⚡ +50 XP</Text>
            </View>
          </>
        )}

        {(isReview || hasMetMinimumTime) && (
          <TouchableOpacity style={compStyles.ctaBtn} onPress={onComplete}>
            <Text style={compStyles.ctaBtnText}>Continue 🚀</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const compStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8,11,24,0.95)',
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
  },
  leo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginTop: -64,
    marginBottom: 8,
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6, textAlign: 'center' },
  sub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 12 },
  xpBadge: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  xpText: { fontSize: 20, fontWeight: '800', color: COLORS.accent },
  ctaBtn: {
    width: '100%',
    height: 54,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  keepBtnText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  topBarCenter: {
    flex: 1,
  },
  stackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  askLeoBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(249,115,22,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(249,115,22,0.3)',
    position: 'relative',
  },
  askLeoImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  askLeoText: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F97316',
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 16,
    overflow: 'hidden',
  },
  narrationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  narrationBtnActive: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderColor: 'rgba(139,92,246,0.3)',
  },
  narrationIcon: {
    fontSize: 16,
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
    flexDirection: 'row',
    position: 'relative',
  },
  tapZoneLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '25%',
    zIndex: 10,
  },
  tapZoneRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '25%',
    zIndex: 10,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionEmoji: {
    fontSize: 18,
  },
  counterText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  nextBtn: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});