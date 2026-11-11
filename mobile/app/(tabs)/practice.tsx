import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ImageSourcePropType } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { triggerHaptic } from '../../lib/haptics';
import { playSound } from '../../lib/sounds';
import { useStudiedLessons } from '../../hooks/useStudiedLessons';
import { useUserXP } from '../../hooks/useUserXP';
import { useWeeklyCase } from '../../hooks/useWeeklyCase';
import { weeklyCardInfo } from '../../lib/weeklyCase';
import { COLORS, TYPE } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { getMarketName } from '../../lib/markets';
import { INTERVIEW_ARTWORK } from '../../lib/interviewArtwork';
import { localDateString } from '../../lib/dayMath';
import { practiceCards, PracticeCardId, PracticeCardState, UNLOCK_LINE } from '../../lib/practiceCards';
import { dueEntries, dueMeta, loadLedger, nextDue, REVIEW_XP, REVIEW_ROUND_LIMIT, ReviewEntry, STAGES } from '../../lib/reviewLedger';

const ART: Record<Exclude<PracticeCardId, 'weekly-case'>, ImageSourcePropType> = {
  interview: INTERVIEW_ARTWORK.practice,
  investment: INTERVIEW_ARTWORK.investment,
  'deep-case': INTERVIEW_ARTWORK.case,
  arena: INTERVIEW_ARTWORK.quiz,
};

/** White text sits on this amber; the theme's brighter amber is too light for it. */
const AMBER = '#B45309';

function PracticeCard({ card, first }: { card: PracticeCardState; first: boolean }) {
  const open = () => {
    if (card.locked || !card.button) return;
    triggerHaptic('light');
    playSound('tap').catch(() => {});
    router.push(card.path as any);
  };
  const quiet = card.done;
  return (
    <View style={[styles.card, first && !card.locked && !card.done && styles.cardFirst]}>
      {card.tile ? (
        <View style={[styles.thumb, styles.tile, card.done && styles.tileDone]} accessible={false}>
          <Feather name={card.tile.icon as any} size={30} color={card.done ? COLORS.success : COLORS.accent} />
          <Text style={[styles.tileLabel, card.done && { color: COLORS.success }]}>{card.tile.label}</Text>
        </View>
      ) : (
        <Image source={ART[card.id as Exclude<PracticeCardId, 'weekly-case'>]} style={[styles.thumb, card.locked && styles.thumbLocked]} resizeMode="cover" />
      )}
      <View style={styles.cardBody}>
        <Text style={[styles.eyebrow, card.locked && { color: COLORS.textMuted }]}>{card.eyebrow}</Text>
        {card.byline ? <Text style={styles.byline} numberOfLines={1}>{card.byline}</Text> : null}
        <Text style={styles.cardTitle} numberOfLines={2}>{card.title}</Text>
        {card.done ? (
          <View style={styles.doneRow}>
            <Feather name="check" size={15} color={COLORS.success} />
            <Text style={styles.doneText}>{card.state.before}</Text>
          </View>
        ) : (
          <Text style={styles.stateLine}>
            {card.state.before}
            {card.state.bold ? <Text style={styles.stateBold}>{card.state.bold}</Text> : null}
            {card.state.after}
          </Text>
        )}
        {card.locked ? (
          <View style={styles.lockRow}>
            <Feather name="lock" size={14} color={COLORS.textMuted} />
            <Text style={styles.lockText}>{UNLOCK_LINE}</Text>
          </View>
        ) : card.button ? (
          <TouchableOpacity
            onPress={open}
            activeOpacity={0.88}
            accessibilityRole="button"
            style={[styles.button, quiet && styles.buttonQuiet]}
          >
            <Text style={[styles.buttonText, quiet && styles.buttonQuietText]}>{card.button}</Text>
          </TouchableOpacity>
        ) : null}
        {card.extra ? (
          <TouchableOpacity onPress={() => router.push(card.extra!.path as any)} accessibilityRole="link" style={styles.extra} hitSlop={{ top: 8, bottom: 8 }}>
            <Text style={styles.extraText}>{card.extra.label}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function WorthAnotherLook({ entries, today, later }: { entries: ReviewEntry[]; today: string; later: string | null }) {
  const due = dueEntries(entries, today);
  if (entries.length === 0) return null;
  if (due.length === 0) {
    return (
      <View style={styles.look}>
        <View style={styles.lookStripe} />
        <View style={styles.lookHead}>
          <View style={styles.lookIcon}><Feather name="check" size={20} color={COLORS.success} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lookTitle}>Worth another look</Text>
            <Text style={styles.stateLine}>{later ? 'All caught up. More are due soon.' : 'All caught up.'}</Text>
          </View>
        </View>
      </View>
    );
  }
  const round = Math.min(due.length, REVIEW_ROUND_LIMIT);
  return (
    <View style={styles.look}>
      <View style={styles.lookStripe} />
      <View style={styles.lookHead}>
        <View style={styles.lookIcon}><Feather name="rotate-ccw" size={20} color={AMBER} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.lookTitle}>Worth another look</Text>
          <Text style={styles.stateLine}>Due for review today</Text>
        </View>
        <View style={styles.count} accessibilityLabel={`${due.length} due`}><Text style={styles.countText}>{due.length}</Text></View>
      </View>
      <View style={{ marginTop: 12 }}>
        {due.slice(0, 3).map(entry => (
          <View key={entry.key} style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={1}>{entry.title}</Text>
              <Text style={styles.itemMeta}>{dueMeta(entry, today)}</Text>
            </View>
            <View style={styles.pips} accessibilityRole="image" accessibilityLabel={`Review stage ${entry.stage + 1} of ${STAGES}`}>
              {Array.from({ length: STAGES }, (_, i) => <View key={i} style={[styles.pip, i <= entry.stage && styles.pipOn]} />)}
            </View>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={styles.lookButton}
        activeOpacity={0.88}
        accessibilityRole="button"
        onPress={() => { triggerHaptic('light'); playSound('tap').catch(() => {}); router.push('/review' as any); }}
      >
        <Text style={styles.buttonText}>{`Review ${round} now · +${REVIEW_XP} XP`}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<string | null>(null);
  const [mocks, setMocks] = useState<{ score: number | null }[]>([]);
  const [ledger, setLedger] = useState<ReviewEntry[]>([]);
  const studied = useStudiedLessons(selectedMarket || undefined);
  const { dailyCompletion } = useUserXP(selectedMarket || undefined);
  const weekly = useWeeklyCase();
  const refreshWeekly = weekly.refresh;

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('selected_market')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.selected_market) {
          setSelectedMarket(data.selected_market);
          supabase.from('user_progress').select('learning_goal').eq('user_id', user.id).eq('market_id', data.selected_market).maybeSingle()
            .then(({ data: prog }) => setGoal((prog as any)?.learning_goal || null));
        }
        setLoading(false);
      });
  }, [user]);

  // Mocks and the review list change after every session, so reload on focus.
  useFocusEffect(useCallback(() => {
    void refreshWeekly();
    if (!user?.id || !selectedMarket) return;
    let active = true;
    void loadLedger(user.id, selectedMarket).then(rows => { if (active) setLedger(rows); });
    void Promise.resolve(supabase.from('interview_lab_attempts').select('score')
      .eq('user_id', user.id).eq('market_id', selectedMarket).eq('attempt_type', 'mock')
      .order('created_at', { ascending: false }).limit(200))
      .then(({ data }: any) => { if (active) setMocks(Array.isArray(data) ? data : []); })
      .catch(() => {});
    return () => { active = false; };
  }, [user?.id, selectedMarket, refreshWeekly]));

  if (loading || studied.isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const today = localDateString();
  const cards = practiceCards({
    goal,
    lessonsStudied: studied.lessons.length,
    gamesCompleted: dailyCompletion?.games_completed,
    drillsCompleted: dailyCompletion?.drills_completed,
    mocks,
    weekly: weekly.loading ? null : weeklyCardInfo({
      now: Date.now(),
      current: weekly.current,
      submitted: weekly.submitted,
      score: weekly.score,
      previous: weekly.previous && weekly.previousScore !== null ? { case: weekly.previous, score: weekly.previousScore } : null,
    }),
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100, paddingHorizontal: 20, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={styles.headerTitle}>Practice</Text>
          {selectedMarket && (
            <View style={styles.marketBadge}>
              <View style={styles.marketDot} />
              <Text style={styles.marketBadgeText}>{getMarketName(selectedMarket)}</Text>
            </View>
          )}
        </View>
        {cards.map((card, i) => <PracticeCard key={card.id} card={card} first={i === 0} />)}
        <WorthAnotherLook entries={ledger} today={today} later={nextDue(ledger, today)} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPE.hero, fontSize: 32, color: COLORS.textPrimary, letterSpacing: -0.8 },
  marketBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: COLORS.accentSoft, borderRadius: 20, alignSelf: 'flex-start' },
  marketDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  marketBadgeText: { ...TYPE.caption, color: COLORS.accent, fontSize: 11 },

  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 20, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  cardFirst: { borderColor: COLORS.accent, borderWidth: 2 },
  thumb: { width: 84, height: 84, borderRadius: 14, backgroundColor: COLORS.accentSoft },
  thumbLocked: { opacity: 0.45 },
  tile: { alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.accentSoft },
  tileDone: { backgroundColor: COLORS.successSoft },
  tileLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: COLORS.accent },
  byline: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  extra: { marginTop: 8, alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  extraText: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  cardBody: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: COLORS.accent },
  cardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  stateLine: { fontSize: 13, lineHeight: 18, color: COLORS.textSecondary },
  stateBold: { fontWeight: '700', color: COLORS.textPrimary },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneText: { fontSize: 13, fontWeight: '700', color: COLORS.success },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  lockText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  button: { marginTop: 8, alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accent },
  buttonQuiet: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.accent },
  buttonText: { fontSize: 14, fontWeight: '700', color: COLORS.textOnAccent },
  buttonQuietText: { color: COLORS.accent },

  look: { padding: 16, paddingTop: 18, borderRadius: 20, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  lookStripe: { position: 'absolute', left: 0, right: 0, top: 0, height: 4, backgroundColor: COLORS.warning },
  lookHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lookIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.warningSoft, alignItems: 'center', justifyContent: 'center' },
  lookTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  count: { minWidth: 44, height: 44, borderRadius: 14, backgroundColor: AMBER, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  itemMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  pips: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  pip: { width: 7, height: 16, borderRadius: 3, backgroundColor: COLORS.border },
  pipOn: { backgroundColor: COLORS.warning },
  lookButton: { marginTop: 6, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: AMBER },
});
