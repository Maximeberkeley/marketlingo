/**
 * One optional tap on Home: choose (or see) the corner of the market the
 * learner is leaning into. Hidden entirely during the foundations week.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { COLORS, TYPE } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptics';

interface Props {
  marketName: string;
  focusLabel: string | null;
  unlocked: boolean;
}

export function FocusTopicCard({ marketName, focusLabel, unlocked }: Props) {
  if (!unlocked) return null;

  const open = () => {
    triggerHaptic('light');
    router.push('/focus');
  };

  return (
    <TouchableOpacity style={styles.card} onPress={open} activeOpacity={0.85}>
      <View style={styles.iconWrap}>
        <Feather name="crosshair" size={18} color={COLORS.accent} />
      </View>
      <View style={styles.body}>
        <Text style={styles.overline}>Your focus</Text>
        <Text style={styles.label}>
          {focusLabel ?? `Pick the corner of ${marketName} you want to own`}
        </Text>
        <Text style={styles.hint}>
          {focusLabel
            ? 'Examples and practice lean this way. Tap to change.'
            : 'Optional — one tap, and your examples start leaning your way.'}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentSoft,
    marginRight: 12,
  },
  body: { flex: 1, paddingRight: 8 },
  overline: { ...TYPE.overline, color: COLORS.textMuted, marginBottom: 4 },
  label: { ...TYPE.h3, color: COLORS.textPrimary, marginBottom: 4 },
  hint: { ...TYPE.caption, color: COLORS.textSecondary, fontWeight: '400' },
});
