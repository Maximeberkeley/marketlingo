/**
 * The learner's living document — Interview Brief, Idea Dossier, Thesis Sheet
 * or Market Map depending on their goal. Grows from their own lines, shows a
 * completion percentage, and can be shared as plain text.
 */
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

import { COLORS, TYPE } from '../lib/constants';
import { getMarketName } from '../lib/markets';
import { useSelectedMarket } from '../hooks/useSelectedMarket';
import { useUserProgress } from '../hooks/useUserProgress';
import { useDeliverable } from '../hooks/useDeliverable';
import { consolidationSection, isConsolidationDay } from '../lib/deliverables';
import { log } from '../lib/logger';

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

  const busy = marketLoading || deliverable.loading;

  const save = async (sectionKey: string) => {
    setSaving(true);
    const ok = await deliverable.addLine(sectionKey, draft, day);
    setSaving(false);
    if (ok) setDraft('');
  };

  const share = async () => {
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
      </View>
    );
  }

  const { template, bySection, completion, filledSections } = deliverable;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Feather name="chevron-left" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={share} style={styles.shareBtn} hitSlop={12}>
            <Feather name="share-2" size={16} color={COLORS.accent} />
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{marketName.toUpperCase()} · YOUR OWN WORDS</Text>
          <Text style={styles.title}>{template.title}</Text>
          <Text style={styles.subtitle}>{template.subtitle}</Text>

          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(3, completion)}%` }]} />
            </View>
            <Text style={styles.progressPct}>{completion}%</Text>
          </View>
          <Text style={styles.progressNote}>
            {filledSections} of {template.sections.length} sections written. {template.payoff}
          </Text>
        </View>

        {weeklyPrompt && (
          <View style={styles.weekly}>
            <Text style={styles.weeklyLabel}>CONSOLIDATION DAY</Text>
            <Text style={styles.weeklyTitle}>One line, in your words</Text>
            <Text style={styles.weeklyPrompt}>{weeklyPrompt.prompt}</Text>
          </View>
        )}

        {template.sections.map(section => {
          const own = bySection[section.key] ?? [];
          const open = openSection === section.key;
          return (
            <View key={section.key} style={styles.card}>
              <TouchableOpacity
                style={styles.cardHead}
                onPress={() => setOpenSection(open ? null : section.key)}
                activeOpacity={0.8}
              >
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{section.title}</Text>
                  <Text style={styles.cardPrompt}>{section.prompt}</Text>
                </View>
                <View style={[styles.dot, own.length ? styles.dotDone : null]}>
                  {own.length ? <Feather name="check" size={13} color="#FFFFFF" /> : null}
                </View>
              </TouchableOpacity>

              {own.map(entry => (
                <View key={entry.id} style={styles.entry}>
                  <Text style={styles.entryText}>{entry.content}</Text>
                  <View style={styles.entryFoot}>
                    {entry.dayNumber ? <Text style={styles.entryDay}>Day {entry.dayNumber}</Text> : <View />}
                    <TouchableOpacity onPress={() => deliverable.removeLine(entry.id)} hitSlop={10}>
                      <Feather name="trash-2" size={14} color={COLORS.textMuted} />
                    </TouchableOpacity>
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
                  />
                  <TouchableOpacity
                    style={[styles.saveBtn, draft.trim().length < 3 && styles.saveBtnOff]}
                    disabled={draft.trim().length < 3 || saving}
                    onPress={() => save(section.key)}
                  >
                    <Text style={styles.saveText}>{saving ? 'Saving…' : 'Add to my document'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg0 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg0 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shareText: { ...TYPE.caption, color: COLORS.accent, fontWeight: '700' },
  hero: { paddingHorizontal: 20, paddingBottom: 18 },
  eyebrow: { ...TYPE.caption, color: COLORS.textMuted, letterSpacing: 1, fontWeight: '700' },
  title: { ...TYPE.h1, color: COLORS.textPrimary, marginTop: 6 },
  subtitle: { ...TYPE.body, color: COLORS.textSecondary, marginTop: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  progressTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: COLORS.borderLight, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  progressPct: { ...TYPE.body, color: COLORS.textPrimary, fontWeight: '800' },
  progressNote: { ...TYPE.caption, color: COLORS.textSecondary, marginTop: 8, lineHeight: 18 },
  weekly: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
  },
  weeklyLabel: { ...TYPE.caption, color: COLORS.accent, fontWeight: '800', letterSpacing: 1 },
  weeklyTitle: { ...TYPE.h3, color: COLORS.textPrimary, marginTop: 4 },
  weeklyPrompt: { ...TYPE.body, color: COLORS.textSecondary, marginTop: 4 },
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardTitle: { ...TYPE.h3, color: COLORS.textPrimary },
  cardPrompt: { ...TYPE.caption, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  entry: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.bg1,
  },
  entryText: { ...TYPE.body, color: COLORS.textPrimary, lineHeight: 22 },
  entryFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  entryDay: { ...TYPE.caption, color: COLORS.textMuted },
  composer: { marginTop: 12, gap: 10 },
  input: {
    ...TYPE.body,
    color: COLORS.textPrimary,
    minHeight: 84,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg1,
    padding: 12,
    textAlignVertical: 'top',
  },
  saveBtn: {
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnOff: { backgroundColor: COLORS.border },
  saveText: { ...TYPE.body, color: '#FFFFFF', fontWeight: '800' },
});
