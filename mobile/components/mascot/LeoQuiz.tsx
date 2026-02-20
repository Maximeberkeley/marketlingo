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
import { COLORS } from '../../lib/constants';

const LEO_STICKER = require('../../assets/mascot/leo-reference.png');

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface QuizOption {
  label: string;
  isCorrect: boolean;
}

interface LeoQuizProps {
  question: string;
  options: QuizOption[];
  onComplete: (correct: boolean) => void;
  onDismiss?: () => void;
}

// ─────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────
const QUIZ_MESSAGES = ["Quick check! 🧠", "Test yourself!", "What do you think?", "Knowledge check!"];
const CORRECT_MESSAGES = ["Brilliant! 🎉", "You nailed it! ⭐", "Perfect! 🌟", "Exactly right! 💪"];
const INCORRECT_MESSAGES = ["Not quite — let's learn!", "Close! Here's the answer.", "Good effort! 📚", "Keep learning! 💡"];

const getRand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// ─────────────────────────────────────────────
// LeoQuiz Component
// ─────────────────────────────────────────────
export function LeoQuiz({ question, options, onComplete, onDismiss }: LeoQuizProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [leoMessage] = useState(getRand(QUIZ_MESSAGES));
  const [resultMessage, setResultMessage] = useState('');

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelectedIndex(index);

    const isCorrect = options[index].isCorrect;
    setResultMessage(isCorrect ? getRand(CORRECT_MESSAGES) : getRand(INCORRECT_MESSAGES));
    setShowResult(true);

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      onComplete(isCorrect);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* Leo + Message */}
      <View style={styles.header}>
        <Image source={LEO_STICKER} style={styles.leo} />
        <Text style={styles.leoMsg}>{showResult ? resultMessage : leoMessage}</Text>
      </View>

      {/* Question */}
      <Text style={styles.question}>{question}</Text>

      {/* Options */}
      <View style={styles.options}>
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = option.isCorrect;

          let bg = COLORS.bg1;
          let border = COLORS.border;
          let textColor = COLORS.textPrimary;

          if (showResult && isSelected && isCorrect) {
            bg = 'rgba(34,197,94,0.15)'; border = '#22C55E';
          } else if (showResult && isSelected && !isCorrect) {
            bg = 'rgba(239,68,68,0.15)'; border = '#EF4444';
          } else if (showResult && isCorrect) {
            bg = 'rgba(34,197,94,0.08)'; border = 'rgba(34,197,94,0.4)';
          }

          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelect(index)}
              disabled={showResult}
              style={[styles.option, { backgroundColor: bg, borderColor: border }]}
              activeOpacity={0.75}
            >
              {showResult && isSelected && (
                <Text style={styles.resultIcon}>{isCorrect ? '✅' : '❌'}</Text>
              )}
              <Text style={[styles.optionText, { color: textColor }]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Skip */}
      {onDismiss && !showResult && (
        <TouchableOpacity onPress={onDismiss} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────
export function useLeoQuiz() {
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState<{ question: string; options: QuizOption[] } | null>(null);

  const triggerQuiz = (question: string, options: QuizOption[]) => {
    setQuizData({ question, options });
    setShowQuiz(true);
  };

  const hideQuiz = () => {
    setShowQuiz(false);
    setQuizData(null);
  };

  return { showQuiz, quizData, triggerQuiz, hideQuiz };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  leo: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
  },
  leoMsg: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  question: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  options: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultIcon: {
    fontSize: 16,
  },
  optionText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  skipBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});

export default LeoQuiz;
