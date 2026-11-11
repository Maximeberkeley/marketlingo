import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { markResultsSeen } from '../hooks/useWeeklyCase';
import { useAuth } from '../hooks/useAuth';
import { useEquippedLooks } from '../hooks/useEquippedLooks';
import { LeoAvatar } from '../components/shop/LeoAvatar';
import { COLORS, TYPE } from '../lib/constants';
import { log } from '../lib/logger';
import { triggerHaptic } from '../lib/haptics';
import {
  scoreHeadline, shareText, weekNumber, WeeklyAnswers, WeeklyBoardRow, WeeklyCase, WeeklyResult, WeeklyReveal,
} from '../lib/weeklyCase';
import { loadBoard, loadCaseById, loadMySubmissions, loadResult, loadReveal, requestRelease } from '../lib/weeklyCaseApi';

const scoreColor = (score: number) => (score >= 70 ? COLORS.success : score >= 50 ? COLORS.warning : COLORS.error);

function Bar({ score }: { score: number }) {
  return (
    <View style={styles.pips} accessibilityRole="image" accessibilityLabel={`${score} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => <View key={i} style={[styles.pip, i <= score && { backgroundColor: scoreColor(score * 20) }]} />)}
    </View>
  );
}

export default function WeeklyCaseResultsRoute() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [weekly, setWeekly] = useState<WeeklyCase | null>(null);
  const [result, setResult] = useState<WeeklyResult | null>(null);
  const [board, setBoard] = useState<WeeklyBoardRow[]>([]);
  // Leo for each person on the standings, when the shop knows their look (letters otherwise).
  const looks = useEquippedLooks(board.map(r => r.user_id));
  const [answers, setAnswers] = useState<WeeklyAnswers | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reveal, setReveal] = useState<WeeklyReveal | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showModel, setShowModel] = useState(false);

  const load = useCallback(async () => {
    if (!id || !user?.id) return;
    setFailed(false);
    try {
      const c = await loadCaseById(id);
      setWeekly(c);
      let r = await loadResult(id);
      // Closed and waiting? Ask the server to release the finished week now, once, instead of waiting for its hourly run.
      if (r.state === 'waiting' && c && Date.now() >= c.closesAt) {
        await requestRelease();
        r = await loadResult(id);
      }
      setResult(r);
      if (r.state === 'ready') {
        void markResultsSeen(user.id, id);
        const [b, subs, rv] = await Promise.all([loadBoard(id), loadMySubmissions(user.id, [id]), loadReveal(id).catch(() => null)]);
        setBoard(b);
        setReveal(rv);
        setAnswers(subs[0]?.answers ?? null);
      }
    } catch (error) {
      log.warn('[WeeklyCase] results failed to load', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => { void load(); }, [load]);

  const close = () => router.back();
  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <TouchableOpacity onPress={close} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
        <Feather name="x" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Your results</Text>
      <View style={styles.close} />
    </View>
  );

  if (loading) return <View style={[styles.root, styles.center]}><ActivityIndicator size="large" color={COLORS.accent} /></View>;

  if (failed || !weekly || !result || result.state !== 'ready') {
    const text = failed ? 'Results could not load. Check your connection.'
      : result?.state === 'none' ? 'You did not submit an answer to this case.'
      : result?.state === 'waiting' ? 'Your results are being finalised. Check back in a little while.'
      : 'This case could not be found.';
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{failed || result?.state === 'waiting' ? 'Not ready yet' : 'No results'}</Text>
          <Text style={styles.muted}>{text}</Text>
          {(failed || result?.state === 'waiting') ? (
            <TouchableOpacity onPress={() => { setLoading(true); void load(); }} style={styles.primary} accessibilityRole="button">
              <Text style={styles.primaryText}>Try again</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  const score = Math.round(result.score ?? 0);
  const myRank = board.find(r => r.is_me)?.rank ?? null;
  const share = async () => {
    triggerHaptic('light');
    try { await Share.share({ message: shareText(weekly.title, score, myRank, board.length) }); } catch { /* cancelled */ }
  };

  return (
    <View style={styles.root}>
      {header}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>{`WEEKLY CASE · WEEK ${weekNumber(weekly.weekStart)}`}</Text>
          <Text style={styles.heroTitle}>{weekly.title}</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.score, { color: scoreColor(score) }]} accessibilityLabel={`Score ${score} out of 100`}>{score}</Text>
            <Text style={styles.outOf}>/ 100</Text>
          </View>
          <Text style={styles.headline}>{scoreHeadline(score)}</Text>
          {result.beat_pct != null ? <Text style={styles.beat}>{`Better than ${result.beat_pct}% of ${result.participants} players`}</Text> : null}
          {result.expert_flag ? (
            <View style={styles.flag}><Feather name="award" size={14} color={COLORS.accent} /><Text style={styles.flagText}>Picked for expert feedback</Text></View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>HOW IT WAS SCORED</Text>
          {(result.breakdown ?? []).map(row => (
            <View key={row.id} style={styles.crit}>
              <View style={styles.critHead}>
                <Text style={styles.critLabel}>{row.name}</Text>
                <Bar score={row.score} />
              </View>
              <Text style={styles.critComment}>{row.comment}</Text>
            </View>
          ))}
        </View>

        {result.strongest_move ? (
          <View style={[styles.note, { backgroundColor: COLORS.successSoft }]}>
            <Feather name="check-circle" size={18} color={COLORS.success} />
            <View style={{ flex: 1 }}><Text style={styles.noteTitle}>Your strongest move</Text><Text style={styles.noteBody}>{result.strongest_move}</Text></View>
          </View>
        ) : null}
        {result.sharpen ? (
          <View style={[styles.note, { backgroundColor: COLORS.warningSoft }]}>
            <Feather name="target" size={18} color={COLORS.warning} />
            <View style={{ flex: 1 }}><Text style={styles.noteTitle}>What to sharpen</Text><Text style={styles.noteBody}>{result.sharpen}</Text></View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>AMONG YOUR FRIENDS</Text>
          {board.length <= 1
            ? <Text style={styles.muted}>No friends played this week. Add friends to compete next time.</Text>
            : board.map(r => (
              <View key={r.user_id} style={[styles.rankRow, r.is_me && styles.rankMe]}>
                <Text style={styles.rank}>{r.rank ?? '–'}</Text>
                <LeoAvatar look={looks[r.user_id]?.look} crown={looks[r.user_id]?.wearsCrown} size={30} name={r.is_me ? 'You' : r.display_name || '?'} />
                <Text style={styles.rankName} numberOfLines={1}>{r.is_me ? 'You' : r.display_name}</Text>
                {r.friend_code && !r.is_me ? <Text style={styles.friendCode}>{r.friend_code}</Text> : null}
                <Text style={styles.rankScore}>{r.score ?? '–'}</Text>
              </View>
            ))}
        </View>

        <TouchableOpacity onPress={share} style={styles.primary} accessibilityRole="button">
          <Feather name="share" size={17} color={COLORS.textOnAccent} />
          <Text style={styles.primaryText}>Share my score</Text>
        </TouchableOpacity>

        {answers ? (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setShowAnswer(s => !s)} accessibilityRole="button" style={styles.answerToggle}>
              <Text style={styles.sectionLabel}>YOUR ANSWER</Text>
              <Feather name={showAnswer ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
            {showAnswer ? weekly.parts.map(p => (
              <View key={p.id} style={{ gap: 3 }}>
                <Text style={styles.critLabel}>{p.label}</Text>
                <Text style={styles.critComment}>{answers[p.id]}</Text>
              </View>
            )) : null}
          </View>
        ) : null}

        {reveal ? (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setShowModel(s => !s)} accessibilityRole="button" style={styles.answerToggle}>
              <Text style={styles.sectionLabel}>ONE STRONG ANSWER</Text>
              <Feather name={showModel ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
            {showModel ? (
              <View style={{ gap: 12 }}>
                <Text style={styles.noteBody}>{reveal.model_answer.summary}</Text>
                {reveal.model_answer.parts.map(mp => (
                  <View key={mp.part_id} style={{ gap: 3 }}>
                    <Text style={styles.critLabel}>{weekly.parts.find(p => p.id === mp.part_id)?.label ?? mp.part_id}</Text>
                    <Text style={styles.critComment}>{mp.text}</Text>
                  </View>
                ))}
                {(reveal.model_answer.alternatives ?? []).length > 0 ? (
                  <View style={{ gap: 6 }}>
                    <Text style={styles.sectionLabel}>OTHER DEFENSIBLE ANSWERS</Text>
                    {(reveal.model_answer.alternatives ?? []).map(a => (
                      <Text key={a.option} style={styles.critComment}><Text style={styles.critLabel}>{a.option}. </Text>{`Better when ${a.better_when.charAt(0).toLowerCase()}${a.better_when.slice(1)}`}</Text>
                    ))}
                  </View>
                ) : null}
                {(reveal.common_traps ?? []).length > 0 ? (
                  <View style={{ gap: 6 }}>
                    <Text style={styles.sectionLabel}>COMMON TRAPS</Text>
                    {(reveal.common_traps ?? []).map(t => (
                      <Text key={t.trap} style={styles.critComment}><Text style={styles.critLabel}>{t.trap}. </Text>{t.why}</Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPE.h3, flex: 1, textAlign: 'center', color: COLORS.textPrimary },
  emptyTitle: { ...TYPE.h2, color: COLORS.textPrimary, textAlign: 'center' },
  muted: { ...TYPE.body, fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  hero: { alignItems: 'center', gap: 6, padding: 22, borderRadius: 22, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  heroLabel: { ...TYPE.overline, color: COLORS.accent },
  heroTitle: { ...TYPE.h3, textAlign: 'center', color: COLORS.textPrimary },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 6 },
  score: { fontSize: 72, lineHeight: 78, fontWeight: '900', letterSpacing: -2, fontVariant: ['tabular-nums'] },
  outOf: { fontSize: 20, fontWeight: '700', color: COLORS.textSecondary, paddingBottom: 12 },
  headline: { ...TYPE.bodyBold, color: COLORS.textPrimary, textAlign: 'center' },
  beat: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  flag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: COLORS.accentSoft },
  flagText: { fontSize: 12, fontWeight: '800', color: COLORS.accent },
  card: { gap: 12, padding: 16, borderRadius: 18, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  sectionLabel: { ...TYPE.overline, color: COLORS.textSecondary },
  crit: { gap: 4 },
  critHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  critLabel: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  critComment: { fontSize: 14, lineHeight: 20, color: COLORS.textSecondary },
  pips: { flexDirection: 'row', gap: 3 },
  pip: { width: 18, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  note: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 16, alignItems: 'flex-start' },
  noteTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  noteBody: { fontSize: 14, lineHeight: 20, color: COLORS.textPrimary },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 12 },
  rankMe: { backgroundColor: COLORS.accentSoft },
  rank: { width: 22, fontSize: 15, fontWeight: '800', color: COLORS.textSecondary, textAlign: 'center' },
  rankName: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  friendCode: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 },
  rankScore: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, fontVariant: ['tabular-nums'] },
  primary: { minHeight: 52, borderRadius: 14, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, backgroundColor: COLORS.accent },
  primaryText: { fontSize: 16, fontWeight: '800', color: COLORS.textOnAccent },
  answerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
