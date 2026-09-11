import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { tokens } from '../theme/tokens';

export type ButtonVariant = 'primary' | 'correct' | 'incorrect' | 'disabled' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
}

const BG: Record<ButtonVariant, string> = {
  primary: tokens.color.accent,
  correct: tokens.color.correct,
  incorrect: tokens.color.incorrect,
  disabled: tokens.color.disabled,
  ghost: 'transparent',
};

const FG: Record<ButtonVariant, string> = {
  primary: tokens.color.textOnAccent,
  correct: tokens.color.textOnAccent,
  incorrect: tokens.color.textOnAccent,
  disabled: tokens.color.disabledText,
  ghost: tokens.color.textSecondary,
};

export function PrimaryButton({ label, onPress, variant = 'primary', style }: Props) {
  const disabled = variant === 'disabled';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: BG[variant] },
        variant === 'ghost' && styles.ghost,
        style,
      ]}
    >
      <Text style={[styles.label, { color: FG[variant] }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: tokens.size.buttonHeight,
    borderRadius: tokens.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.space.xl,
  },
  ghost: {
    borderWidth: 2,
    borderColor: tokens.color.border,
  },
  label: {
    fontSize: tokens.font.button,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
