import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../lib/constants';
import type { PrepModule as PrepModuleType, PrepModuleType as PrepKind } from '../../hooks/useSeminars';

interface Props {
  module: PrepModuleType;
  index: number;
  isCompleted: boolean;
  onComplete: () => void;
}

const TYPE_META: Record<PrepKind, { label: string; icon: keyof typeof Feather.glyphMap; color: string; bg: string }> = {
  concept_quiz: { label: 'Concept', icon: 'book-open', color: '#4338CA', bg: '#EEF2FF' },
  flashcards:   { label: 'Flashcards', icon: 'layers', color: '#0E7490', bg: '#ECFEFF' },
  scenario:     { label: 'Scenario', icon: 'briefcase', color: '#7C3AED', bg: '#FAF5FF' },
  reflection:   { label: 'Reflection', icon: 'edit-3', color: '#B45309', bg: '#FFFBEB' },
};

export function PrepModule({ module, index, isCompleted, onComplete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[module.module_type] || TYPE_META.concept_quiz;

  const toggleExpanded = () => {
    Haptics.selectionAsync().catch(() => {});
    setExpanded(e => !e);
  };

  const handleComplete = () => {
    if (isCompleted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onComplete();
  };

  return (
    <View style={[styles.container, isCompleted && styles.completedContainer]}>
      <TouchableOpacity onPress={toggleExpanded} style={styles.header} activeOpacity={0.7}>
        <View style={[styles.numberBadge, isCompleted && styles.completedBadge]}>
          {isCompleted ? (
            <Feather name="check" size={14} color="#FFF" />
          ) : (
            <Text style={styles.numberText}>{index + 1}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <View style={[styles.typeChip, { backgroundColor: meta.bg }]}>
              <Feather name={meta.icon} size={10} color={meta.color} />
              <Text style={[styles.typeChipText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <Text style={styles.minutesText}>· {module.estimated_minutes}m</Text>
          </View>
          <Text style={styles.title}>{module.title}</Text>
          <Text style={styles.xpLabel}>+{module.xp_reward} XP</Text>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {module.module_type === 'concept_quiz' && (
            <ConceptQuizContent module={module} isCompleted={isCompleted} onComplete={handleComplete} />
          )}
          {module.module_type === 'flashcards' && (
            <FlashcardsContent module={module} isCompleted={isCompleted} onComplete={handleComplete} />
          )}
          {module.module_type === 'scenario' && (
            <ScenarioContent module={module} isCompleted={isCompleted} onComplete={handleComplete} />
          )}
          {module.module_type === 'reflection' && (
            <ReflectionContent module={module} isCompleted={isCompleted} onComplete={handleComplete} />
          )}
        </View>
      )}
    </View>
  );
}

// ---------- CONCEPT QUIZ ----------
function ConceptQuizContent({ module, isCompleted, onComplete }: { module: PrepModuleType; isCompleted: boolean; onComplete: () => void }) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(isCompleted);
  const options = module.quiz_options || [];

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    if (idx === module.correct_index) onComplete();
  };

  const isCorrect = selectedAnswer === module.correct_index;

  return (
    <>
      {module.content && (
        <ScrollView style={styles.contentScroll} nestedScrollEnabled>
          <Text style={styles.content}>{module.content.replace(/##\s/g, '').replace(/###\s/g, '').replace(/\*\*/g, '')}</Text>
        </ScrollView>
      )}

      {module.key_takeaways.length > 0 && (
        <View style={styles.takeawaysBox}>
          <Text style={styles.takeawaysTitle}>Key Takeaways</Text>
          {module.key_takeaways.map((t, i) => (
            <View key={i} style={styles.takeawayItem}>
              <View style={styles.bulletDot} />
              <Text style={styles.takeawayText}>{t}</Text>
            </View>
          ))}
        </View>
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
                style={[styles.option, showCorrect && styles.correctOption, showWrong && styles.wrongOption]}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, showCorrect && styles.correctText, showWrong && styles.wrongText]}>{opt}</Text>
                {showCorrect && <Feather name="check-circle" size={16} color="#059669" />}
                {showWrong && <Feather name="x-circle" size={16} color="#DC2626" />}
              </TouchableOpacity>
            );
          })}
          {answered && (
            <View style={[styles.feedbackBanner, isCorrect ? styles.correctBanner : styles.wrongBanner]}>
              <Feather name={isCorrect ? 'check' : 'x'} size={14} color={isCorrect ? '#059669' : '#DC2626'} />
              <Text style={[styles.feedbackText, { color: isCorrect ? '#059669' : '#DC2626' }]}>
                {isCorrect ? 'Correct! Module completed.' : 'Not quite. Review the content above and reflect on the right answer.'}
              </Text>
            </View>
          )}
        </View>
      )}
    </>
  );
}

// ---------- FLASHCARDS ----------
function FlashcardsContent({ module, isCompleted, onComplete }: { module: PrepModuleType; isCompleted: boolean; onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const cards = module.flashcards || [];
  const total = cards.length;

  if (total === 0) {
    return <Text style={styles.placeholder}>No flashcards configured.</Text>;
  }
  const card = cards[index];
  const isLast = index >= total - 1;

  const next = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setFlipped(false);
    setIndex(i => i + 1);
  };

  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.flashProgress}>{index + 1} / {total}</Text>
      <TouchableOpacity onPress={() => { Haptics.selectionAsync().catch(() => {}); setFlipped(f => !f); }} activeOpacity={0.85}>
        <LinearGradient
          colors={flipped ? ['#0E7490', '#06B6D4'] : ['#312E81', '#4338CA']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.flashcard}
        >
          <Text style={styles.flashcardLabel}>{flipped ? 'ANSWER' : 'TAP TO REVEAL'}</Text>
          <Text style={styles.flashcardText}>{flipped ? card.back : card.front}</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity onPress={next} style={styles.primaryBtn} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>{isLast ? (isCompleted ? 'Completed' : 'Finish & Mark Complete') : 'Next Card'}</Text>
        <Feather name={isLast ? 'check' : 'arrow-right'} size={16} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

// ---------- SCENARIO ----------
function ScenarioContent({ module, isCompleted, onComplete }: { module: PrepModuleType; isCompleted: boolean; onComplete: () => void }) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(isCompleted);
  const options = module.quiz_options || [];

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    if (idx === module.correct_index) onComplete();
  };

  const isCorrect = selectedAnswer === module.correct_index;

  return (
    <>
      {module.scenario_brief && (
        <View style={styles.scenarioBox}>
          <View style={styles.scenarioHeader}>
            <Feather name="briefcase" size={14} color="#7C3AED" />
            <Text style={styles.scenarioLabel}>The Situation</Text>
          </View>
          <Text style={styles.scenarioText}>{module.scenario_brief}</Text>
        </View>
      )}
      {module.quiz_question && (
        <Text style={styles.quizQuestion}>{module.quiz_question}</Text>
      )}
      {options.map((opt: string, idx: number) => {
        const isSelected = selectedAnswer === idx;
        const showCorrect = answered && idx === module.correct_index;
        const showWrong = answered && isSelected && !isCorrect;
        return (
          <TouchableOpacity
            key={idx}
            onPress={() => handleAnswer(idx)}
            disabled={answered}
            style={[styles.option, showCorrect && styles.correctOption, showWrong && styles.wrongOption]}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, showCorrect && styles.correctText, showWrong && styles.wrongText]}>{opt}</Text>
            {showCorrect && <Feather name="check-circle" size={16} color="#059669" />}
            {showWrong && <Feather name="x-circle" size={16} color="#DC2626" />}
          </TouchableOpacity>
        );
      })}
      {answered && module.content && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationLabel}>Why this matters</Text>
          <Text style={styles.explanationText}>{module.content}</Text>
        </View>
      )}
    </>
  );
}

// ---------- REFLECTION ----------
function ReflectionContent({ module, isCompleted, onComplete }: { module: PrepModuleType; isCompleted: boolean; onComplete: () => void }) {
  const [text, setText] = useState('');
  const minChars = 40;
  const ready = text.trim().length >= minChars;

  return (
    <View style={{ gap: 12 }}>
      {module.reflection_prompt && (
        <View style={styles.reflectionBox}>
          <Feather name="edit-3" size={14} color="#B45309" />
          <Text style={styles.reflectionPrompt}>{module.reflection_prompt}</Text>
        </View>
      )}
      <TextInput
        style={styles.reflectionInput}
        value={text}
        onChangeText={setText}
        placeholder={`Write at least ${minChars} characters...`}
        placeholderTextColor={COLORS.textMuted}
        multiline
        maxLength={1500}
        editable={!isCompleted}
      />
      <View style={styles.reflectionFooter}>
        <Text style={styles.charCount}>{text.trim().length}/{minChars}+</Text>
        <TouchableOpacity
          onPress={onComplete}
          disabled={!ready || isCompleted}
          style={[styles.primaryBtn, (!ready || isCompleted) && styles.primaryBtnDisabled]}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>{isCompleted ? 'Saved' : 'Save Reflection'}</Text>
          <Feather name={isCompleted ? 'check' : 'save'} size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  typeChipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  minutesText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  xpLabel: { fontSize: 11, fontWeight: '600', color: '#7C3AED', marginTop: 2 },
  body: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  contentScroll: { maxHeight: 220 },
  content: { fontSize: 14, lineHeight: 22, color: COLORS.textSecondary },
  takeawaysBox: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: COLORS.border },
  takeawaysTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.5 },
  takeawayItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#4338CA', marginTop: 7 },
  takeawayText: { flex: 1, fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },
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
  feedbackText: { flex: 1, fontSize: 13, fontWeight: '600' },

  // Flashcards
  flashProgress: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.5, textAlign: 'center' },
  flashcard: { minHeight: 180, borderRadius: 16, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 10 },
  flashcardLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5 },
  flashcardText: { fontSize: 18, lineHeight: 26, color: '#FFF', fontWeight: '700', textAlign: 'center' },

  // Scenario
  scenarioBox: { backgroundColor: '#FAF5FF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#DDD6FE', gap: 6 },
  scenarioHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scenarioLabel: { fontSize: 11, fontWeight: '800', color: '#7C3AED', letterSpacing: 0.5 },
  scenarioText: { fontSize: 14, lineHeight: 21, color: COLORS.textPrimary },
  explanationBox: { backgroundColor: '#EEF2FF', borderRadius: 12, padding: 12, gap: 4, borderWidth: 1, borderColor: '#C7D2FE' },
  explanationLabel: { fontSize: 11, fontWeight: '800', color: '#4338CA', letterSpacing: 0.5 },
  explanationText: { fontSize: 13, lineHeight: 20, color: COLORS.textSecondary },

  // Reflection
  reflectionBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FDE68A' },
  reflectionPrompt: { flex: 1, fontSize: 14, lineHeight: 21, color: '#78350F', fontWeight: '600' },
  reflectionInput: { backgroundColor: COLORS.bg1, borderRadius: 12, padding: 14, fontSize: 14, lineHeight: 20, color: COLORS.textPrimary, minHeight: 110, borderWidth: 1, borderColor: COLORS.border, textAlignVertical: 'top' },
  reflectionFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  charCount: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },

  // Shared CTA
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4338CA', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  primaryBtnDisabled: { backgroundColor: '#A5B4FC' },
  primaryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  placeholder: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },
});
