/**
 * The streak, framed as identity rather than a counter.
 *
 * It says who the learner is becoming in this market, shows the streak as proof
 * of that, counts down to LOCAL midnight while today is unfinished, and leaves
 * open loops: the document filling up, a concept waiting for review, and the
 * name of what lands tomorrow. Leo's mood escalates as the day runs out.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORS, TYPE } from '../../lib/constants';
import { LeoCharacter, LeoAnim } from '../mascot/LeoCharacter';
import { triggerHaptic } from '../../lib/haptics';

interface Props {
  marketName: string;
  streak: number;
  longestStreak?: number;
  lessonCompletedToday: boolean;
  /** Learner's focus, if they picked one — used in Leo's line. */
  focus?: string | null;
  deliverableTitle: string;
  deliverableCompletion: number;
  reviewDueCount: number;
  tomorrowTitle?: string | null;
  rescueAvailable?: boolean;
  accent?: string;
  onStartLesson: () => void;
  onOpenDeliverable: () => void;
  onOpenReview: () => void;
  onRescue?: () => void;
}

/** Minutes until local midnight. */
function minutesLeftToday(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.round((midnight.getTime() - now.getTime()) / 60000));
}

function identityLabel(streak: number): string {
  if (streak >= 90) return 'Insider';
  if (streak >= 30) return 'Regular in the room';
  if (streak >= 14) return 'Getting fluent';
  if (streak >= 7) return 'Speaking the language';
  if (streak >= 3) return 'Showing up';
  return 'Just committed';
}

export function InsiderIdentityCard({
  marketName,
  streak,
  longestStreak = 0,
  lessonCompletedToday,
  focus,
  deliverableTitle,
  deliverableCompletion,
  reviewDueCount,
  tomorrowTitle,
  rescueAvailable,
  accent = COLORS.accent,
  onStartLesson,
  onOpenDeliverable,
  onOpenReview,
  onRescue,
}: Props) {
  const [minutes, setMinutes] = useState(minutesLeftToday());

  useEffect(() => {
    if (lessonCompletedToday) return;
    const tick = setInterval(() => setMinutes(minutesLeftToday()), 30000);
    return () => clearInterval(tick);
  }, [lessonCompletedToday]);

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  const mood: LeoAnim = useMemo(() => {
    if (lessonCompletedToday) return streak >= 7 ? 'trophy' : 'success';
    if (minutes <= 90) return 'urgent';
    if (minutes <= 240) return 'sassy';
    return 'reading';
  }, [lessonCompletedToday, minutes, streak]);

  const line = useMemo(() => {
    const topic = focus ? `${focus} in ${marketName}` : marketName;
    if (lessonCompletedToday) {
      return streak >= 7
        ? `${streak} days of ${topic}. People pay for this kind of consistency.`
        : `Today is banked. That is ${streak} day${streak === 1 ? '' : 's'} of ${topic} you own.`;
    }
    if (minutes <= 90) return `${hours}h ${mins}m left. You built ${streak} days — do not hand them back tonight.`;
    if (minutes <= 240) return `Still unfinished. Your ${streak}-day run on ${topic} is watching you.`;
    return `You committed to becoming fluent in ${topic}. Today's proof is still waiting.`;
  }, [focus, marketName, lessonCompletedToday, streak, minutes, hours, mins]);

  return (
    <View style={[styles.card, { borderColor: accent + '2E' }]}>
      <View style={styles.top}>
        <View style={styles.leo}>
          <LeoCharacter size="md" animation={mood} still />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.identity, { color: accent }]}>{identityLabel(streak).toUpperCase()}</Text>
          <Text style={styles.streakLine}>
            {streak} day{streak === 1 ? '' : 's'} becoming fluent in {marketName}
          </Text>
          {longestStreak > streak ? (
            <Text style={styles.best}>Your best run: {longestStreak} days</Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.leoLine}>{line}</Text>

      {!lessonCompletedToday && (
        <>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: accent }]}
            onPress={() => { triggerHaptic('medium'); onStartLesson(); }}
            activeOpacity={0.9}
          >
            <Feather name="play" size={15} color="#FFFFFF" />
            <Text style={styles.ctaText}>
              Keep it alive · {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`} left today
            </Text>
          </TouchableOpacity>
          {rescueAvailable && onRescue ? (
            <TouchableOpacity style={styles.rescue} onPress={onRescue} activeOpacity={0.8}>
              <Feather name="shield" size={13} color={COLORS.streak} />
              <Text style={styles.rescueText}>One rescue round left this week</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}

      <View style={styles.loops}>
        <TouchableOpacity style={styles.loop} onPress={onOpenDeliverable} activeOpacity={0.8}>
          <Feather name="file-text" size={15} color={accent} />
          <View style={styles.flex}>
            <Text style={styles.loopTitle}>{deliverableTitle}</Text>
            <Text style={styles.loopNote}>{deliverableCompletion}% written in your own words</Text>
          </View>
          <Feather name="chevron-right" size={15} color={COLORS.textMuted} />
        </TouchableOpacity>

        {reviewDueCount > 0 && (
          <TouchableOpacity style={styles.loop} onPress={onOpenReview} activeOpacity={0.8}>
            <Feather name="rotate-ccw" size={15} color={COLORS.warning} />
            <View style={styles.flex}>
              <Text style={styles.loopTitle}>
                {reviewDueCount} concept{reviewDueCount === 1 ? '' : 's'} awaiting your review
              </Text>
              <Text style={styles.loopNote}>Leo remembers the ones you missed</Text>
            </View>
            <Feather name="chevron-right" size={15} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}

        {tomorrowTitle ? (
          <View style={styles.loop}>
            <Feather name="sunrise" size={15} color={COLORS.textSecondary} />
            <View style={styles.flex}>
              <Text style={styles.loopTitle}>Tomorrow</Text>
              <Text style={styles.loopNote} numberOfLines={1}>{tomorrowTitle}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    marginTop: 12,
    borderRadius: 22,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    padding: 18,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  leo: { width: 58, alignItems: 'center' },
  identity: { ...TYPE.caption, fontWeight: '800', letterSpacing: 1 },
  streakLine: { ...TYPE.h3, color: COLORS.textPrimary, marginTop: 3 },
  best: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 3 },
  leoLine: { ...TYPE.body, color: COLORS.textSecondary, marginTop: 12, lineHeight: 22 },
  cta: {
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { ...TYPE.bodyBold, color: '#FFFFFF' },
  rescue: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  rescueText: { ...TYPE.caption, color: COLORS.streak, fontWeight: '700' },
  loops: { marginTop: 14, gap: 8 },
  loop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.bg1,
  },
  loopTitle: { ...TYPE.bodyBold, color: COLORS.textPrimary },
  loopNote: { ...TYPE.caption, color: COLORS.textSecondary, marginTop: 2 },
});
