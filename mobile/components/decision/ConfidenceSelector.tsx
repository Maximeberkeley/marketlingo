/**
 * ConfidenceSelector — Guessing · Fairly sure · Certain.
 * Shown only on high-signal surfaces (predictions, final lesson question,
 * Interview Lab answers, previously-wrong questions).
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../lib/constants';
import { CONFIDENCE_OPTIONS, Confidence } from '../../lib/decisionEngine';

interface Props {
  value: Confidence | null;
  onChange: (value: Confidence) => void;
  disabled?: boolean;
  label?: string;
}

export function ConfidenceSelector({ value, onChange, disabled, label }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label || 'How sure are you?'}</Text>
      <View style={styles.row}>
        {CONFIDENCE_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, active && styles.chipActive, disabled && { opacity: 0.5 }]}
              disabled={disabled}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(opt.value);
              }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg1,
    alignItems: 'center',
  },
  chipActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.accent },
});
