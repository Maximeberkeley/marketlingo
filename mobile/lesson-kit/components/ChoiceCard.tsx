import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { tokens } from '../theme/tokens';
import { ColorText } from './ColorText';
import { AnswerMark, AnswerTag } from './AnswerMark';
import { ChoiceState, choiceA11yState } from './answerState';

export type { ChoiceState } from './answerState';

interface Props {
  label: string;
  state: ChoiceState;
  onPress: () => void;
  disabled?: boolean;
  /** "Your answer" / "Right answer" once graded. */
  tag?: string | null;
  /** True once the answer is graded: rows not involved step back. */
  revealed?: boolean;
}

const BG: Record<ChoiceState, string> = {
  idle: tokens.color.card,
  selected: tokens.color.accentSoft,
  correct: tokens.color.correctSoft,
  incorrect: tokens.color.incorrectSoft,
};

const BORDER: Record<ChoiceState, string> = {
  idle: tokens.color.border,
  selected: tokens.color.accent,
  correct: tokens.color.correct,
  incorrect: tokens.color.incorrect,
};

const TEXT: Record<ChoiceState, string> = {
  idle: tokens.color.text,
  selected: tokens.color.accentDark,
  correct: tokens.color.correctDark,
  incorrect: tokens.color.incorrectDark,
};

export function ChoiceCard({ label, state, onPress, disabled, tag = null, revealed = false }: Props) {
  const a11y = [choiceA11yState(state), tag?.toLowerCase()].filter(Boolean).join(', ');
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: state === 'selected', disabled }}
      accessibilityLabel={a11y ? `${label}, ${a11y}` : label}
      style={[styles.card, { backgroundColor: BG[state], borderColor: BORDER[state] }, revealed && state === 'idle' && styles.stepBack]}
    >
      <View style={styles.copy}>
        <ColorText text={label} style={[styles.label, { color: TEXT[state] }]} maxSentences={10000} maxLength={1000000} />
        <AnswerTag text={tag} state={state} />
      </View>
      <AnswerMark state={state} revealed={revealed} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    alignSelf: 'stretch',
    minHeight: tokens.size.choiceMinHeight,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    paddingVertical: tokens.space.md,
    paddingHorizontal: tokens.space.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBack: { opacity: 0.55 },
  copy: { flex: 1, minWidth: 0 },
  label: {
    minWidth: 0,
    flexShrink: 1,
    fontSize: tokens.font.body,
    fontWeight: '600',
    lineHeight: 22,
  },
});
