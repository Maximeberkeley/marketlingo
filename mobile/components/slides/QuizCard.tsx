import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';

const LEO_IMAGE = require('../../assets/mascot/leo-reference.png');

export interface QuizCardData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface QuizCardProps {
  quiz: QuizCardData;
  onAnswer: (correct: boolean) => void;
  accentColor: string;
}

const CORRECT_MSGS = ['Nailed it! 🎯', 'Exactly right! ⭐', 'Perfect! 💡', 'You got it! ✅'];
const WRONG_MSGS = ['Not quite!', 'Close one!', 'Good try!', 'Almost!'];
const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export function QuizCard({ quiz, onAnswer, accentColor }: QuizCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (index: number) => {
    if (revealed) return;
    setSelected(index);
    setRevealed(true);

    const correct = index === quiz.correctIndex;
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => onAnswer(correct), 1800);
  };

  const isCorrect = selected === quiz.correctIndex;

  return (
    <View style={styles.container}>
      {/* Leo header */}
      <View style={styles.header}>
        <Image source={LEO_IMAGE} style={styles.leo} />
        <View style={[styles.badge, { backgroundColor: accentColor + '18' }]}>
          <Feather name="help-circle" size={14} color={accentColor} />
          <Text style={[styles.badgeText, { color: accentColor }]}>Quick Check</Text>
        </View>
      </View>

      {/* Question */}
      <Text style={styles.question}>{quiz.question}</Text>

      {/* Options */}
      <View style={styles.options}>
        {quiz.options.map((option, i) => {
          const isSelected = selected === i;
          const isCorrectOption = i === quiz.correctIndex;

          let bg = COLORS.bg1;
          let border = COLORS.border;

          if (revealed && isSelected && isCorrectOption) {
            bg = 'rgba(34,197,94,0.15)';
            border = '#22C55E';
          } else if (revealed && isSelected && !isCorrectOption) {
            bg = 'rgba(239,68,68,0.15)';
            border = '#EF4444';
          } else if (revealed && isCorrectOption) {
            bg = 'rgba(34,197,94,0.08)';
            border = 'rgba(34,197,94,0.4)';
          }

          return (
            <TouchableOpacity
              key={i}
              onPress={() => handleSelect(i)}
              disabled={revealed}
              style={[styles.option, { backgroundColor: bg, borderColor: border }]}
              activeOpacity={0.75}
            >
              <View style={[styles.optionLetter, { borderColor: border }]}>
                <Text style={[styles.letterText, revealed && isCorrectOption && { color: '#22C55E' }]}>
                  {String.fromCharCode(65 + i)}
                </Text>
              </View>
              <Text style={styles.optionText}>{option}</Text>
              {revealed && isSelected && (
                <Feather
                  name={isCorrectOption ? 'check-circle' : 'x-circle'}
                  size={18}
                  color={isCorrectOption ? '#22C55E' : '#EF4444'}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Result feedback */}
      {revealed && (
        <View style={[styles.feedback, { borderColor: isCorrect ? '#22C55E40' : '#EF444440' }]}>
          <Text style={styles.feedbackMsg}>
            {isCorrect ? rand(CORRECT_MSGS) : rand(WRONG_MSGS)}
          </Text>
          {quiz.explanation && (
            <Text style={styles.feedbackExplain}>{quiz.explanation}</Text>
          )}
        </View>
      )}

      {!revealed && (
        <Text style={styles.tapHint}>Select the best answer</Text>
      )}
    </View>
  );
}

/** Generate a simple quiz from slide content */
export function generateQuizFromSlide(
  slideTitle: string,
  slideBody: string,
  _slideIndex: number,
): QuizCardData | null {
  // Only generate for slides with enough content
  if (!slideBody || slideBody.length < 100) return null;

  // Extract key sentences for quiz generation
  const sentences = slideBody
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200);

  if (sentences.length < 2) return null;

  // Pick a key sentence as the "correct" answer concept
  const keyIdx = Math.min(1, sentences.length - 1);
  const keySentence = sentences[keyIdx];

  // Create a fill-in/comprehension question
  const question = `Based on "${slideTitle}", which of the following is accurate?`;

  // The correct answer is a paraphrase of the key point
  const correctOption = keySentence.length > 80
    ? keySentence.substring(0, 80) + '...'
    : keySentence;

  // Generate plausible distractors by modifying the key sentence
  const distractors = [
    `The opposite of what was described in the lesson`,
    `This topic is not covered in the current market analysis`,
    `None of the concepts discussed apply to real-world scenarios`,
  ];

  const options = [correctOption, ...distractors.slice(0, 3)];

  // Shuffle options
  const shuffled = [...options];
  let correctIndex = 0;
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    if (shuffled[i] === correctOption) correctIndex = i;
    if (shuffled[j] === correctOption) correctIndex = j;
  }

  return {
    question,
    options: shuffled,
    correctIndex,
    explanation: `Key insight: ${keySentence}`,
  };
}

/** Determine if a quiz should appear after this card index */
export function shouldShowQuiz(cardIndex: number, totalCards: number): boolean {
  if (totalCards < 6) return false;
  if (cardIndex < 3 || cardIndex >= totalCards - 2) return false;
  // Show quiz roughly every 5 concept cards
  const quizInterval = Math.max(4, Math.floor(totalCards / 3));
  return (cardIndex - 3) % quizInterval === 0;
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  leo: { width: 48, height: 48, resizeMode: 'contain' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { fontSize: 13, fontWeight: '600' },
  question: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  options: { gap: 10, width: '100%' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  optionText: { fontSize: 14, lineHeight: 20, color: COLORS.textPrimary, flex: 1 },
  feedback: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: COLORS.bg2,
    width: '100%',
  },
  feedbackMsg: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  feedbackExplain: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  tapHint: { fontSize: 13, color: COLORS.textMuted, marginTop: 16, opacity: 0.6 },
});
