import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';
import { ColorText } from './ColorText';
const BG = {
    idle: tokens.color.card,
    selected: tokens.color.accentSoft,
    correct: tokens.color.correctSoft,
    incorrect: tokens.color.incorrectSoft,
};
const BORDER = {
    idle: tokens.color.border,
    selected: tokens.color.accent,
    correct: tokens.color.correct,
    incorrect: tokens.color.incorrect,
};
const TEXT = {
    idle: tokens.color.text,
    selected: tokens.color.accentDark,
    correct: tokens.color.correctDark,
    incorrect: tokens.color.incorrectDark,
};
export function ChoiceCard({ label, state, onPress, disabled }) {
    return (<TouchableOpacity activeOpacity={0.85} disabled={disabled} onPress={onPress} style={[styles.card, { backgroundColor: BG[state], borderColor: BORDER[state] }]}>
      <ColorText text={label} style={[styles.label, { color: TEXT[state] }]} maxSentences={1} maxLength={80}/>
    </TouchableOpacity>);
}
const styles = StyleSheet.create({
    card: {
        minHeight: tokens.size.choiceMinHeight,
        borderRadius: tokens.radius.lg,
        borderWidth: 2,
        paddingVertical: tokens.space.md,
        paddingHorizontal: tokens.space.lg,
        justifyContent: 'center',
    },
    label: {
        fontSize: tokens.font.body,
        fontWeight: '600',
        lineHeight: 22,
    },
});
