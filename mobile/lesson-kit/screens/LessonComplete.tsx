import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { tokens } from '../theme/tokens';
import { playSound } from '../../lib/sounds';

interface Props {
  correct: number;
  total: number;
  /** XP earned from correct answers, before bonuses. */
  baseXp: number;
  bestCombo?: number;
  heartsLeft?: number;
  timeSpentSeconds?: number;
  streakDays?: number;
  /** Receives the final XP total (base + bonus). */
  onDone: (xp: number) => void;
  doneLabel?: string;
}

interface Bonus {
  label: string;
  xp: number;
}

function computeBonuses(
  accuracy: number,
  bestCombo: number,
  heartsLeft: number,
  timeSpentSeconds: number,
): Bonus[] {
  const bonuses: Bonus[] = [];
  if (accuracy === 100) bonuses.push({ label: 'Flawless run', xp: 25 });
  if (heartsLeft === 3 && accuracy < 100) bonuses.push({ label: 'All hearts intact', xp: 10 });
  if (bestCombo >= 3) bonuses.push({ label: `${bestCombo} in a row`, xp: bestCombo * 3 });
  if (timeSpentSeconds > 0 && timeSpentSeconds < 180 && accuracy >= 80) {
    bonuses.push({ label: 'Sharp and quick', xp: 15 });
  }
  bonuses.push({ label: 'Daily lesson', xp: 5 + Math.floor(Math.random() * 16) });
  return bonuses;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} min ${s.toString().padStart(2, '0')}` : `${s} sec`;
}

export function LessonComplete({
  correct,
  total,
  baseXp,
  bestCombo = 0,
  heartsLeft = 3,
  timeSpentSeconds = 0,
  streakDays,
  onDone,
  doneLabel = 'Continue',
}: Props) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
  const bonuses = useRef(computeBonuses(accuracy, bestCombo, heartsLeft, timeSpentSeconds)).current;
  const bonusXp = bonuses.reduce((sum, b) => sum + b.xp, 0);
  const totalXp = baseXp + bonusXp;

  const [shown, setShown] = useState(0);
  const counter = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const id = counter.addListener(({ value }) => setDisplay(Math.round(value)));
    Animated.timing(counter, {
      toValue: totalXp,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    playSound('celebration').catch(() => {});
    return () => counter.removeListener(id);
  }, []);

  useEffect(() => {
    if (shown >= bonuses.length) return;
    const t = setTimeout(() => {
      setShown(s => s + 1);
      playSound('xpEarn').catch(() => {});
    }, 350 + shown * 300);
    return () => clearTimeout(t);
  }, [shown, bonuses.length]);

  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Feather name="award" size={40} color={tokens.color.accent} />
      </View>
      <Text style={styles.title}>Lesson complete</Text>
      {typeof streakDays === 'number' && streakDays > 0 ? (
        <Text style={styles.subtitle}>🔥 {streakDays}-day streak — come back tomorrow to keep it.</Text>
      ) : (
        <Text style={styles.subtitle}>You just started a streak. Come back tomorrow to keep it.</Text>
      )}

      <Text style={styles.xpBig}>+{display} XP</Text>

      <View style={styles.bonusList}>
        {bonuses.slice(0, shown).map((b, i) => (
          <View key={i} style={styles.bonusRow}>
            <Feather name="zap" size={14} color={tokens.color.accent} />
            <Text style={styles.bonusLabel}>{b.label}</Text>
            <Text style={styles.bonusXp}>+{b.xp}</Text>
          </View>
        ))}
      </View>

      <View style={styles.stats}>
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Correct" value={`${correct}/${total}`} />
        <Stat label="Time" value={formatTime(timeSpentSeconds)} />
      </View>

      <PrimaryButton label={doneLabel} onPress={() => onDone(totalXp)} style={styles.cta} />
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
    gap: tokens.space.sm,
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
  xpBig: {
    fontSize: 40,
    fontWeight: '900',
    color: tokens.color.accent,
    marginTop: tokens.space.md,
  },
  bonusList: { alignSelf: 'stretch', gap: 6, marginTop: tokens.space.sm },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
  },
  bonusLabel: { flex: 1, fontSize: tokens.font.caption + 1, fontWeight: '700', color: tokens.color.textSecondary },
  bonusXp: { fontSize: tokens.font.caption + 1, fontWeight: '800', color: tokens.color.accent },
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
  statValue: { fontSize: tokens.font.body, fontWeight: '800', color: tokens.color.text },
  statLabel: { fontSize: tokens.font.caption, color: tokens.color.textMuted, fontWeight: '600' },
  cta: { alignSelf: 'stretch', marginTop: tokens.space.xl },
});
