/**
 * The learner's living dossier — Interview Brief, Idea Dossier, Thesis Sheet
 * or Market Map depending on their goal.
 *
 * It is not a form. It is a document that visibly assembles itself: every
 * section is a slot, every line the learner writes lights one of them, and the
 * rank at the top is earned purely by how much of the document exists in their
 * own words. Filling a slot is a moment — ring advance, glow, sound, haptic.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

import { COLORS, TYPE, SHADOWS } from '../lib/constants';
import { isDark } from '../lib/theme';
import { getMarketName } from '../lib/markets';
import { useSelectedMarket } from '../hooks/useSelectedMarket';
import { useUserProgress } from '../hooks/useUserProgress';
import { useDeliverable } from '../hooks/useDeliverable';
import {
  consolidationSection,
  dossierRank,
  isConsolidationDay,
  slotStatus,
} from '../lib/deliverables';
import { triggerHaptic } from '../lib/haptics';
import { playSound } from '../lib/sounds';
import { log } from '../lib/logger';

const RING_SIZE = 108;
const RING_STROKE = 9;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function DeliverableScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ section?: string }>();
  const { marketId, loading: marketLoading } = useSelectedMarket();
  const { progress, availableDay } = useUserProgress(marketId);
  const goal = (progress as { learning_goal?: string } | null)?.learning_goal ?? null;
  const deliverable = useDeliverable(marketId, goal);
  const marketName = getMarketName(marketId);

  const day = availableDay || 1;

  const weeklyPrompt = useMemo(
    () => (isConsolidationDay(day) ? consolidationSection(deliverable.template, day) : null),
    [day, deliverable.template],
  );

  const [openSection, setOpenSection] = useState<string | null>(
    params.section || weeklyPrompt?.key || null,
  );
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  /** Slot that just received a line — drives the reveal flash. */
  const [justFilled, setJustFilled] = useState<string | null>(null);

  const busy = marketLoading || deliverable.loading;

  const { template, bySection, completion, filledSections } = deliverable;
  const rank = useMemo(() => dossierRank(completion), [completion]);

  // The ring animates to the new completion whenever the document grows.
  const ringAnim = useRef(new Animated.Value(0)).current;
  const [ringPct, setRingPct] = useState(0);

  useEffect(() => {
    const id = ringAnim.addListener(({ value }) => setRingPct(value));
    Animated.timing(ringAnim, {
      toValue: completion,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => ringAnim.removeListener(id);
  }, [completion, ringAnim]);

  const save = async (sectionKey: string) => {
    setSaving(true);
    const wasEmpty = (bySection[sectionKey]?.length ?? 0) === 0;
    const ok = await deliverable.addLine(sectionKey, draft, day);
    setSaving(false);
    if (!ok) return;
    setDraft('');
    if (wasEmpty) {
      setJustFilled(sectionKey);
      triggerHaptic('success');
      playSound('unlock').catch(() => {});
      setTimeout(() => setJustFilled(null), 2200);
    } else {
      triggerHaptic('light');
      playSound('xpEarn').catch(() => {});
    }
  };

  const share = async () => {
    triggerHaptic('light');
    try {
      await Share.share({ message: deliverable.exportText(marketName) });
    } catch (error) {
      log.warn('[Deliverable] Share cancelled:', error);
    }
  };

  if (busy) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Opening your dossier…</Text>
      </View>
    );
  }

  const dashOffset = RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, ringPct)) / 100);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 56 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={14} style={styles.backBtn}>
            <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={share} style={styles.shareBtn} activeOpacity={0.85} hitSlop={10}>
            <Feather name="share-2" size={14} color={COLORS.accent} />
            <Text style={styles.shareText}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Hero: the document's own cover. */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={
              isDark
                ? ['#2A2340', '#1E2230', '#191C22']
                : ['#F1EBFF', '#F6F4FF', '#FFFFFF']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>{marketName.toUpperCase()} DOSSIER</Text>
                <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
                  {template.title}
                </Text>
                <View style={styles.rankPill}>
                  <Feather name="shield" size={11} color={COLORS.accent} />
                  <Text style={styles.rankPillText}>{rank.title.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.ringWrap}>
                <Svg width={RING_SIZE} height={RING_SIZE}>
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={isDark ? 'rgba(255,255,255,0.10)' : 'rgba(26,31,54,0.08)'}
                    strokeWidth={RING_STROKE}
                    fill="none"
                  />
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={COLORS.accent}
                    strokeWidth={RING_STROKE}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                    strokeDashoffset={dashOffset}
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                  />
                </Svg>
                <View style={styles.ringCentre}>
                  <Text style={styles.ringPct}>{Math.round(ringPct)}%</Text>
                  <Text style={styles.ringLabel}>written</Text>
                </View>
              </View>
            </View>

            <Text style={styles.rankBlurb}>{rank.blurb}</Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.metaChip}>
                <Feather name="check-circle" size={12} color={COLORS.success} />
                <Text style={styles.metaChipText}>
                  {filledSections}/{template.sections.length} sections
                </Text>
              </View>
              {rank.nextTitle ? (
                <View style={styles.metaChip}>
                  <Feather name="trending-up" size={12} color={COLORS.accent} />
                  <Text style={styles.metaChipText}>
                    {rank.nextAt}% unlocks {rank.nextTitle}
                  </Text>
                </View>
              ) : (
                <View style={styles.metaChip}>
                  <Feather name="award" size={12} color={COLORS.gold} />
                  <Text style={styles.metaChipText}>Top rank held</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {weeklyPrompt && (
          <View style={styles.weekly}>
            <View style={styles.weeklyHead}>
              <Feather name="edit-3" size={13} color={COLORS.accent} />
              <Text style={styles.weeklyLabel}>CONSOLIDATION DAY</Text>
            </View>
            <Text style={styles.weeklyTitle}>One line, in your words</Text>
            <Text style={styles.weeklyPrompt}>{weeklyPrompt.prompt}</Text>
            <TouchableOpacity
              style={styles.weeklyCta}
              activeOpacity={0.85}
              onPress={() => {
                triggerHaptic('light');
                setOpenSection(weeklyPrompt.key);
              }}
            >
              <Text style={styles.weeklyCtaText}>Write today's line</Text>
              <Feather name="arrow-right" size={14} color={COLORS.textOnAccent} />
            </TouchableOpacity>
          </View>
        )}

        {/* Plain explanation: what this document is, and why writing in it pays. */}
        <View style={styles.explain}>
          <View style={styles.explainRow}>
            <Feather name="edit-3" size={14} color={COLORS.accent} />
            <Text style={styles.explainText}>
              One sentence after a lesson. That is the whole job.
            </Text>
          </View>
          <View style={styles.explainRow}>
            <Feather name="layers" size={14} color={COLORS.accent} />
            <Text style={styles.explainText}>
              Each sentence fills a section below and moves your rank up.
            </Text>
          </View>
          <View style={styles.explainRow}>
            <Feather name="send" size={14} color={COLORS.accent} />
            <Text style={styles.explainText}>
              By the end you can export it as a real {marketName} brief.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>
          {nextOpen ? `NEXT UP · ${nextOpen.title.toUpperCase()}` : 'ALL SECTIONS WRITTEN'}
        </Text>


        {template.sections.map((section, index) => {
          const own = bySection[section.key] ?? [];
          const status = slotStatus(own.length);
          const open = openSection === section.key;
          const flashing = justFilled === section.key;

          return (
            <View
              key={section.key}
              style={[
                styles.card,
                status !== 'empty' && styles.cardFilled,
                flashing && styles.cardFlash,
              ]}
            >
              <TouchableOpacity
                style={styles.cardHead}
                onPress={() => {
                  triggerHaptic('light');
                  setDraft('');
                  setOpenSection(open ? null : section.key);
                }}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.slotIndex,
                    status !== 'empty' && styles.slotIndexFilled,
                  ]}
                >
                  {status === 'empty' ? (
                    <Text style={styles.slotIndexText}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                  ) : (
                    <Feather name="check" size={14} color={COLORS.textOnAccent} />
                  )}
                </View>

                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{section.title}</Text>
                  <Text style={styles.cardPrompt}>{section.prompt}</Text>
                  <View style={styles.statusRow}>
                    {status === 'empty' ? (
                      <View style={styles.statusEmpty}>
                        <Feather name="circle" size={9} color={COLORS.textMuted} />
                        <Text style={styles.statusEmptyText}>Awaiting your line</Text>
                      </View>
                    ) : (
                      <View style={styles.statusDone}>
                        <Feather name="zap" size={9} color={COLORS.success} />
                        <Text style={styles.statusDoneText}>
                          {status === 'strong' ? 'Well evidenced' : 'Locked in'}
                          {own.length > 1 ? ` · ${own.length} lines` : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <Feather
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>

              {own.map(entry => (
                <View key={entry.id} style={styles.entry}>
                  <View style={styles.entryBar} />
                  <View style={styles.flex}>
                    <Text style={styles.entryText}>{entry.content}</Text>
                    <View style={styles.entryFoot}>
                      {entry.dayNumber ? (
                        <Text style={styles.entryDay}>Written on day {entry.dayNumber}</Text>
                      ) : (
                        <View />
                      )}
                      <TouchableOpacity
                        onPress={() => {
                          triggerHaptic('light');
                          deliverable.removeLine(entry.id);
                        }}
                        hitSlop={10}
                      >
                        <Feather name="trash-2" size={13} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              {open && (
                <View style={styles.composer}>
                  <TextInput
                    style={styles.input}
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Write it the way you would say it out loud…"
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[styles.saveBtn, draft.trim().length < 3 && styles.saveBtnOff]}
                    disabled={draft.trim().length < 3 || saving}
                    onPress={() => save(section.key)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.saveText}>
                      {saving ? 'Saving…' : status === 'empty' ? 'Fill this slot' : 'Add another line'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.footNote}>
          <Feather name="lock" size={12} color={COLORS.textMuted} />
          <Text style={styles.footNoteText}>
            Private to you. Export sends a clean copy you can paste anywhere.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg0 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: COLORS.bg0,
  },
  loadingText: { ...TYPE.caption, color: COLORS.textSecondary },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSubtle,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
  },
  shareText: { ...TYPE.caption, color: COLORS.accent, fontWeight: '800' },

  heroWrap: { paddingHorizontal: 18, marginBottom: 20 },
  hero: {
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
    ...SHADOWS.lg,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroCopy: { flex: 1 },
  eyebrow: { ...TYPE.overline, color: COLORS.accent },
  title: { ...TYPE.h1, color: COLORS.textPrimary, marginTop: 6 },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
  },
  rankPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: COLORS.accent },
  ringWrap: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringCentre: { position: 'absolute', alignItems: 'center' },
  ringPct: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
  ringLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5 },
  rankBlurb: { ...TYPE.body, color: COLORS.textSecondary, marginTop: 16, lineHeight: 21 },
  heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaChipText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },

  weekly: {
    marginHorizontal: 18,
    marginBottom: 20,
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
  },
  weeklyHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weeklyLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1, color: COLORS.accent },
  weeklyTitle: { ...TYPE.h3, color: COLORS.textPrimary, marginTop: 6 },
  weeklyPrompt: { ...TYPE.body, color: COLORS.textSecondary, marginTop: 4, lineHeight: 21 },
  weeklyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
  },
  weeklyCtaText: { ...TYPE.bodyBold, color: COLORS.textOnAccent, fontWeight: '800' },

  sectionHeading: {
    ...TYPE.overline,
    color: COLORS.textMuted,
    marginLeft: 22,
    marginBottom: 10,
  },

  card: {
    marginHorizontal: 18,
    marginBottom: 12,
    borderRadius: 22,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    ...SHADOWS.sm,
  },
  cardFilled: {
    borderColor: COLORS.accentMedium,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: isDark ? 0.5 : 0.22,
    shadowRadius: 18,
    elevation: 5,
  },
  cardFlash: {
    borderColor: COLORS.success,
    shadowColor: '#22C55E',
    shadowOpacity: isDark ? 0.65 : 0.3,
    shadowRadius: 24,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  slotIndex: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotIndexFilled: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  slotIndexText: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted },
  cardTitle: { ...TYPE.h3, color: COLORS.textPrimary },
  cardPrompt: { ...TYPE.caption, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18, fontWeight: '500' },
  statusRow: { marginTop: 8 },
  statusEmpty: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusEmptyText: { fontSize: 10.5, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.2 },
  statusDone: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDoneText: { fontSize: 10.5, fontWeight: '800', color: COLORS.success, letterSpacing: 0.2 },

  entry: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.bg1,
  },
  entryBar: { width: 3, borderRadius: 2, backgroundColor: COLORS.accent },
  entryText: { ...TYPE.body, color: COLORS.textPrimary, lineHeight: 22 },
  entryFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  entryDay: { fontSize: 10.5, fontWeight: '700', color: COLORS.textMuted },

  composer: { marginTop: 12, gap: 10 },
  input: {
    ...TYPE.body,
    color: COLORS.textPrimary,
    minHeight: 88,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
    backgroundColor: COLORS.bg1,
    padding: 13,
    textAlignVertical: 'top',
  },
  saveBtn: {
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOWS.accent,
  },
  saveBtnOff: { backgroundColor: COLORS.border, shadowOpacity: 0 },
  saveText: { ...TYPE.bodyBold, color: COLORS.textOnAccent, fontWeight: '800' },

  footNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 10,
    paddingHorizontal: 30,
  },
  footNoteText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },
});
