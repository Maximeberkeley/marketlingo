import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPE, SHADOWS } from '../../lib/constants';
import { playSound } from '../../lib/sounds';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

const LEO_HAPPY = require('../../assets/mascot/leo-happy.png');

export interface FlashcardItem {
  statement: string;
  isTrue: boolean;
  explanation: string;
  source?: string;
}

interface SwipeFlashcardDrillProps {
  cards: FlashcardItem[];
  onComplete: (score: number, total: number) => void;
  accentColor?: string;
}

export function generateFlashcardsFromSlides(
  slides: { title: string; body: string }[],
): FlashcardItem[] {
  const cards: FlashcardItem[] = [];

  for (const slide of slides) {
    const sentences = slide.body
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200);

    // Pick up to 2 factual sentences per slide
    const picked = sentences.slice(0, 2);
    for (const sentence of picked) {
      // True statement
      cards.push({
        statement: sentence + '.',
        isTrue: true,
        explanation: `This is correct. From: "${slide.title}"`,
        source: slide.title,
      });
    }
  }

  // Shuffle and cap at 8 cards
  return cards.sort(() => Math.random() - 0.5).slice(0, 8);
}

export function SwipeFlashcardDrill({ cards, onComplete, accentColor = COLORS.accent }: SwipeFlashcardDrillProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const swipeX = useRef(new Animated.Value(0)).current;
  const cardRotate = swipeX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-12deg', '0deg', '12deg'],
  });
  const leftOpacity = swipeX.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.3, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const rightOpacity = swipeX.interpolate({
    inputRange: [0, SCREEN_WIDTH * 0.3],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const currentCard = cards[currentIndex];

  const handleAnswer = useCallback((answeredTrue: boolean) => {
    if (!currentCard || showFeedback) return;

    const isCorrect = answeredTrue === currentCard.isTrue;
    if (isCorrect) {
      setScore(prev => prev + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSound('correct');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      playSound('wrong');
    }

    setShowFeedback(isCorrect ? 'correct' : 'wrong');

    setTimeout(() => {
      setShowFeedback(null);
      if (currentIndex + 1 >= cards.length) {
        const finalScore = isCorrect ? score + 1 : score;
        setIsComplete(true);
        onComplete(finalScore, cards.length);
      } else {
        setCurrentIndex(prev => prev + 1);
        swipeX.setValue(0);
      }
    }, 1500);
  }, [currentCard, currentIndex, cards.length, score, showFeedback]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 15 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_, gs) => {
        swipeX.setValue(gs.dx);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) {
          // Swiped right = TRUE
          Animated.timing(swipeX, { toValue: SCREEN_WIDTH, duration: 200, useNativeDriver: true }).start(() => {
            handleAnswer(true);
          });
        } else if (gs.dx < -SWIPE_THRESHOLD) {
          // Swiped left = FALSE
          Animated.timing(swipeX, { toValue: -SCREEN_WIDTH, duration: 200, useNativeDriver: true }).start(() => {
            handleAnswer(false);
          });
        } else {
          Animated.spring(swipeX, { toValue: 0, tension: 200, friction: 20, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (isComplete) {
    const pct = Math.round((score / cards.length) * 100);
    return (
      <View style={styles.completeContainer}>
        <Image source={LEO_HAPPY} style={styles.completeMascot} />
        <Text style={styles.completeTitle}>
          {pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!'}
        </Text>
        <Text style={styles.completeScore}>{score}/{cards.length} correct</Text>
        <View style={[styles.scoreBadge, { backgroundColor: accentColor + '20' }]}>
          <Text style={[styles.scorePct, { color: accentColor }]}>{pct}%</Text>
        </View>
      </View>
    );
  }

  if (!currentCard) return null;

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {cards.length}
        </Text>
        <View style={styles.scoreRow}>
          <Feather name="check-circle" size={14} color={COLORS.success} />
          <Text style={[styles.progressText, { color: COLORS.success }]}>{score}</Text>
        </View>
      </View>

      {/* Swipe hints */}
      <View style={styles.hintRow}>
        <Animated.View style={[styles.hintBadge, styles.hintFalse, { opacity: leftOpacity }]}>
          <Feather name="x" size={16} color="#EF4444" />
          <Text style={[styles.hintText, { color: '#EF4444' }]}>FALSE</Text>
        </Animated.View>
        <Animated.View style={[styles.hintBadge, styles.hintTrue, { opacity: rightOpacity }]}>
          <Text style={[styles.hintText, { color: '#22C55E' }]}>TRUE</Text>
          <Feather name="check" size={16} color="#22C55E" />
        </Animated.View>
      </View>

      {/* Card */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          showFeedback === 'correct' && styles.cardCorrect,
          showFeedback === 'wrong' && styles.cardWrong,
          {
            transform: [
              { translateX: swipeX },
              { rotate: cardRotate },
            ],
          },
        ]}
      >
        {showFeedback ? (
          <View style={styles.feedbackContent}>
            <View style={[
              styles.feedbackIcon,
              { backgroundColor: showFeedback === 'correct' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' },
            ]}>
              <Feather
                name={showFeedback === 'correct' ? 'check' : 'x'}
                size={28}
                color={showFeedback === 'correct' ? '#22C55E' : '#EF4444'}
              />
            </View>
            <Text style={styles.feedbackLabel}>
              {showFeedback === 'correct' ? 'Correct!' : 'Not quite'}
            </Text>
            <Text style={styles.explanation}>{currentCard.explanation}</Text>
          </View>
        ) : (
          <View style={styles.questionContent}>
            <View style={styles.questionIcon}>
              <Feather name="help-circle" size={24} color={accentColor} />
            </View>
            <Text style={styles.statement}>{currentCard.statement}</Text>
            {currentCard.source && (
              <Text style={styles.source}>From: {currentCard.source}</Text>
            )}
          </View>
        )}
      </Animated.View>

      {/* Tap buttons as fallback */}
      {!showFeedback && (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.falseBtn} onPress={() => handleAnswer(false)}>
            <Feather name="x" size={20} color="#EF4444" />
            <Text style={styles.falseBtnText}>False</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.trueBtn} onPress={() => handleAnswer(true)}>
            <Feather name="check" size={20} color="#22C55E" />
            <Text style={styles.trueBtnText}>True</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.swipeHint}>← Swipe left for False · Swipe right for True →</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    ...TYPE.caption,
    color: COLORS.textMuted,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  hintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hintFalse: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  hintTrue: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  hintText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    padding: 28,
    minHeight: 280,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
  },
  cardCorrect: {
    borderColor: 'rgba(34,197,94,0.5)',
    backgroundColor: 'rgba(34,197,94,0.05)',
  },
  cardWrong: {
    borderColor: 'rgba(239,68,68,0.5)',
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  questionContent: {
    alignItems: 'center',
    gap: 16,
  },
  questionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statement: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
  },
  source: {
    ...TYPE.caption,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  feedbackContent: {
    alignItems: 'center',
    gap: 12,
  },
  feedbackIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackLabel: {
    ...TYPE.h2,
    color: COLORS.textPrimary,
  },
  explanation: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  falseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  falseBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  trueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(34,197,94,0.25)',
  },
  trueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22C55E',
  },
  swipeHint: {
    ...TYPE.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.6,
  },
  completeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  completeMascot: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  completeTitle: {
    ...TYPE.h1,
    color: COLORS.textPrimary,
  },
  completeScore: {
    ...TYPE.body,
    color: COLORS.textSecondary,
  },
  scoreBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  scorePct: {
    fontSize: 20,
    fontWeight: '800',
  },
});
