import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { tokens } from '../theme/tokens';

interface Props {
  correct: number;
  total: number;
  xp: number;
  onDone: () => void;
  doneLabel?: string;
}

export function LessonComplete({ correct, total, xp, onDone, doneLabel = 'Continue' }: Props) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Feather name="award" size={40} color={tokens.color.accent} />
      </View>
      <Text style={styles.title}>Lesson complete</Text>
      <Text style={styles.subtitle}>Nice work — keep the streak alive.</Text>

      <View style={styles.stats}>
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Correct" value={`${correct}/${total}`} />
        <Stat label="XP" value={`+${xp}`} />
      </View>

      <PrimaryButton label={doneLabel} onPress={onDone} style={styles.cta} />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space.xl,
    gap: tokens.space.md,
    backgroundColor: tokens.color.bg,
  },
  badge: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: tokens.color.accentSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: tokens.space.sm,
  },
  title: { fontSize: tokens.font.title, fontWeight: '800', color: tokens.color.text },
  subtitle: { fontSize: tokens.font.body, color: tokens.color.textSecondary, textAlign: 'center' },
  stats: {
    flexDirection: 'row',
    gap: tokens.space.md,
    marginTop: tokens.space.lg,
    width: '100%',
  },
  stat: {
    flex: 1,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderColor: tokens.color.border,
    paddingVertical: tokens.space.lg,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: tokens.font.prompt, fontWeight: '800', color: tokens.color.text },
  statLabel: { fontSize: tokens.font.caption, color: tokens.color.textMuted, fontWeight: '600' },
  cta: { alignSelf: 'stretch', marginTop: tokens.space.xl },
});
