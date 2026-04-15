import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import type { PrepModule as PrepModuleType } from '../../hooks/useSeminars';

interface Props {
  module: PrepModuleType;
  index: number;
  isCompleted: boolean;
  onComplete: () => void;
}

export function PrepModule({ module, index, isCompleted, onComplete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    if (idx === module.correct_index) {
      onComplete();
    }
  };

  const isCorrect = selectedAnswer === module.correct_index;
  const options = Array.isArray(module.quiz_options) ? module.quiz_options : [];

  return (
    <View style={[styles.container, isCompleted && styles.completedContainer]}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.header} activeOpacity={0.7}>
        <View style={[styles.numberBadge, isCompleted && styles.completedBadge]}>
          {isCompleted ? (
            <Feather name="check" size={14} color="#FFF" />
          ) : (
            <Text style={styles.numberText}>{index + 1}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{module.title}</Text>
          <Text style={styles.xpLabel}>+{module.xp_reward} XP</Text>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {module.content && (
            <ScrollView style={styles.contentScroll} nestedScrollEnabled>
              <Text style={styles.content}>{module.content.replace(/##\s/g, '').replace(/###\s/g, '').replace(/\*\*/g, '')}</Text>
            </ScrollView>
          )}

          {module.quiz_question && options.length > 0 && (
            <View style={styles.quizSection}>
              <Text style={styles.quizQuestion}>{module.quiz_question}</Text>
              {options.map((opt: string, idx: number) => {
                const isSelected = selectedAnswer === idx;
                const showCorrect = answered && idx === module.correct_index;
                const showWrong = answered && isSelected && !isCorrect;

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleAnswer(idx)}
                    disabled={answered}
                    style={[
                      styles.option,
                      showCorrect && styles.correctOption,
                      showWrong && styles.wrongOption,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      showCorrect && styles.correctText,
                      showWrong && styles.wrongText,
                    ]}>
                      {opt}
                    </Text>
                    {showCorrect && <Feather name="check-circle" size={16} color="#059669" />}
                    {showWrong && <Feather name="x-circle" size={16} color="#DC2626" />}
                  </TouchableOpacity>
                );
              })}

              {answered && (
                <View style={[styles.feedbackBanner, isCorrect ? styles.correctBanner : styles.wrongBanner]}>
                  <Feather name={isCorrect ? 'check' : 'x'} size={14} color={isCorrect ? '#059669' : '#DC2626'} />
                  <Text style={[styles.feedbackText, { color: isCorrect ? '#059669' : '#DC2626' }]}>
                    {isCorrect ? 'Correct! Module completed.' : 'Not quite. Review the content and try again.'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  completedContainer: { borderColor: '#D1FAE5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  numberBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  completedBadge: { backgroundColor: '#059669' },
  numberText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  xpLabel: { fontSize: 11, fontWeight: '600', color: '#7C3AED', marginTop: 2 },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  contentScroll: { maxHeight: 200, marginBottom: 16 },
  content: { fontSize: 14, lineHeight: 22, color: COLORS.textSecondary },
  quizSection: { gap: 8 },
  quizQuestion: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  correctOption: { backgroundColor: '#ECFDF5', borderColor: '#059669' },
  wrongOption: { backgroundColor: '#FEF2F2', borderColor: '#DC2626' },
  optionText: { fontSize: 14, color: COLORS.textPrimary, flex: 1 },
  correctText: { color: '#059669', fontWeight: '600' },
  wrongText: { color: '#DC2626', fontWeight: '600' },
  feedbackBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginTop: 4 },
  correctBanner: { backgroundColor: '#ECFDF5' },
  wrongBanner: { backgroundColor: '#FEF2F2' },
  feedbackText: { fontSize: 13, fontWeight: '600' },
});
