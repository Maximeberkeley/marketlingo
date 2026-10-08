import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PrimaryButton } from '../components/PrimaryButton';
import { tokens } from '../theme/tokens';
import { playSound } from '../../lib/sounds';
import { triggerHaptic } from '../../lib/haptics';
import { useIntelHabit } from '../../hooks/useIntelHabit';
import { lessonRewards, scoreHeadline } from './lessonRewards';
import { useUserProgress } from '../../hooks/useUserProgress';
import { useDeliverable } from '../../hooks/useDeliverable';

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
  /** How many things the learner asked Leo during the lesson. */
  leoQuestions?: number;
  /** Market the lesson belongs to — used for the intel nudge. */
  marketId?: string;
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
  heartsLeft,
  timeSpentSeconds = 0,
  streakDays,
  onDone,
  doneLabel = 'Continue',
  leoQuestions = 0,
  marketId,
}: Props) {
  const intel = useIntelHabit(marketId);
  const { progress } = useUserProgress(marketId);
  const goal = (progress as { learning_goal?: string } | null)?.learning_goal ?? null;
  const dossier = useDeliverable(marketId, goal);
  const latestLine = dossier.entries[0];
  const latestSection = dossier.template.sections.find(s => s.key === latestLine?.sectionKey);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
  const praise = scoreHeadline(accuracy, total);
  const bonuses = useRef(lessonRewards(baseXp, accuracy, total, bestCombo, heartsLeft, timeSpentSeconds)).current;
  const totalXp = bonuses.reduce((sum, line) => sum + line.xp, 0);

  const [step, setStep] = useState<'rewards' | 'intel'>('rewards');
  const [shown, setShown] = useState(0);

  useEffect(() => {
    playSound('celebration').catch(() => {});
  }, []);

  useEffect(() => {
    if (shown >= bonuses.length) return;
    const t = setTimeout(() => {
      setShown(s => s + 1);
      playSound('xpEarn').catch(() => {});
    }, 350 + shown * 300);
    return () => clearTimeout(t);
  }, [shown, bonuses.length]);

  // Step 2 keeps a single clear instruction instead of crowding the reward screen.
  if (step === 'intel') {
    return (
      <View style={styles.intelWrap}>
        <Image source={require('../../assets/leo-sticker.png')} style={styles.intelHeroLeo} resizeMode="contain" />
        <Text style={styles.intelEyebrow}>ONE LAST STEP</Text>
        <Text style={styles.intelHeadline}>Now read today's intel</Text>
        <Text style={styles.intelSub}>
          {intel.done
            ? `All ${intel.target} stories read today. You're current.`
            : `${intel.remaining} ${intel.remaining === 1 ? 'story' : 'stories'} left today · ${intel.readToday}/${intel.target} · +20 XP when you finish`}
        </Text>
        <Text style={styles.intelQuote}>
          {intel.done
            ? 'Leo: "Go see what changed since this morning anyway."'
            : 'Leo: "The concept is yours. Now see it happening this week."'}
        </Text>
        <PrimaryButton
          label="Open today's intel"
          onPress={() => {
            triggerHaptic('medium');
            onDone(totalXp);
            router.push({ pathname: '/(tabs)/roadmap', params: { autoOpen: '1' } });
          }}
          style={styles.cta}
        />
        <TouchableOpacity onPress={() => onDone(totalXp)} style={styles.laterBtn} activeOpacity={0.7}>
          <Text style={styles.laterText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.wrap}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.badge}>
        <Feather name="award" size={40} color={tokens.color.accent} />
      </View>
      <Text style={styles.title}>{praise}</Text>
      {typeof streakDays === 'number' && streakDays > 0 ? (
        <Text style={styles.subtitle}>🔥 {streakDays}-day streak — come back tomorrow to keep it.</Text>
      ) : (
        <Text style={styles.subtitle}>You just started a streak. Come back tomorrow to keep it.</Text>
      )}

      <Text style={styles.xpBig}>+{totalXp} XP</Text>

      <View style={styles.bonusList}>
        {bonuses.map((b, i) => (
          <View key={i} style={styles.bonusRow}>
            <Feather name="zap" size={14} color={tokens.color.accent} />
            <Text style={styles.bonusLabel}>{b.label}</Text>
            <Text style={styles.bonusXp}>+{b.xp}</Text>
          </View>
        ))}
      </View>

      {leoQuestions > 0 && (
        <Text style={styles.leoLine}>
          You asked Leo {leoQuestions} {leoQuestions === 1 ? 'thing' : 'things'}. That's how it sticks.
        </Text>
      )}

      <View style={styles.stats}>
        <Stat label="Accuracy" value={total > 0 ? `${accuracy}%` : "—"} />
        <Stat label="Correct" value={`${correct}/${total}`} />
        <Stat label="Time" value={formatTime(timeSpentSeconds)} />
      </View>

      {/* Lessons add to the brief automatically; editing remains optional. */}
      {!dossier.loading && (
        <TouchableOpacity
          style={styles.dossierCard}
          activeOpacity={0.85}
          onPress={() => {
            triggerHaptic('medium');
            onDone(totalXp);
            router.push({ pathname: '/deliverable', params: latestSection ? { section: latestSection.key } : {} });
          }}
        >
          <View style={styles.dossierIcon}>
            <Feather name="file-text" size={18} color={tokens.color.accent} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.dossierEyebrow}>
              {dossier.template.title.toUpperCase()} · {dossier.completion}% READY
            </Text>
            <Text style={styles.dossierTitle}>{latestLine ? 'Your brief is growing' : 'Your brief starts here'}</Text>
            <Text style={styles.dossierBody}>{latestLine ? `${latestSection?.title || 'Latest insight'} · ${latestLine.content}` : 'Your lessons add insights automatically. See what you have learned.'}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={tokens.color.accent} />
        </TouchableOpacity>
      )}

      <PrimaryButton
        label={intel.loading ? doneLabel : 'Continue'}
        onPress={() => {
          triggerHaptic('light');
          if (intel.loading) onDone(totalXp);
          else setStep('intel');
        }}
        style={styles.cta}
      />
    </ScrollView>
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
  scroll: { flex: 1, backgroundColor: tokens.color.bg },
  wrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space.xl,
    paddingBottom: tokens.space.xl * 2,
    gap: tokens.space.sm,
    backgroundColor: tokens.color.bg,
  },
  intelWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space.xl,
    backgroundColor: tokens.color.bg,
  },
  intelHeroLeo: { width: 132, height: 132, marginBottom: tokens.space.lg },
  intelEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: tokens.color.accent,
  },
  intelHeadline: {
    fontSize: tokens.font.title + 2,
    fontWeight: '900',
    color: tokens.color.text,
    textAlign: 'center',
    marginTop: 8,
  },
  intelSub: {
    fontSize: tokens.font.body,
    color: tokens.color.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  intelQuote: {
    fontSize: tokens.font.caption + 1,
    color: tokens.color.textMuted,
    textAlign: 'center',
    marginTop: tokens.space.md,
    fontStyle: 'italic',
  },
  laterBtn: { marginTop: tokens.space.md, padding: tokens.space.sm },
  laterText: { fontSize: tokens.font.caption + 1, fontWeight: '700', color: tokens.color.textMuted },

  badge: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: tokens.color.accentSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: tokens.space.sm,
  },
  title: { maxWidth: '100%', textAlign: 'center', fontSize: tokens.font.title, fontWeight: '800', color: tokens.color.text },
  subtitle: { maxWidth: '100%', textAlign: 'center', fontSize: tokens.font.body, color: tokens.color.textSecondary, textAlign: 'center' },
  xpBig: {
    fontSize: 40,
    fontWeight: '900',
    color: tokens.color.accent,
    marginTop: tokens.space.md,
  },
  leoLine: {
    fontSize: tokens.font.caption,
    fontWeight: '700',
    color: tokens.color.accent,
    textAlign: 'center',
    marginBottom: tokens.space.md,
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
  bonusLabel: { flex: 1, minWidth: 0, flexShrink: 1, fontSize: tokens.font.caption + 1, fontWeight: '700', color: tokens.color.textSecondary },
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
  cta: { alignSelf: 'stretch', marginTop: tokens.space.lg },
  intelCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    marginTop: tokens.space.lg,
    padding: tokens.space.md,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderColor: tokens.color.accent,
    backgroundColor: tokens.color.accentSoft,
  },
  intelLeo: { width: 44, height: 44 },
  intelTitle: { fontSize: tokens.font.caption + 2, fontWeight: '800', color: tokens.color.text },
  intelBody: { fontSize: tokens.font.caption, color: tokens.color.textSecondary, marginTop: 2 },
  dossierCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    marginTop: tokens.space.lg,
    padding: tokens.space.md,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.color.accent,
    backgroundColor: tokens.color.card,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  dossierIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.color.accentSoft,
  },
  dossierEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
    color: tokens.color.accent,
  },
  dossierTitle: {
    fontSize: tokens.font.caption + 2,
    fontWeight: '800',
    color: tokens.color.text,
    marginTop: 3,
  },
  dossierBody: { fontSize: tokens.font.caption, color: tokens.color.textSecondary, marginTop: 2 },
});
