/**
 * The learner's dossier — Interview Brief, Idea Dossier, Thesis Sheet or
 * Market Map depending on their goal.
 *
 * It reads like the document itself: a cover line, six numbered sections in
 * order, and the learner's own lines as body text. Lesson suggestions are shown
 * faded as a starting point and never count as written.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPE } from '../lib/constants';
import { getMarketName } from '../lib/markets';
import { useSelectedMarket } from '../hooks/useSelectedMarket';
import { useUserProgress } from '../hooks/useUserProgress';
import { useDeliverable } from '../hooks/useDeliverable';
import { consolidationSection, isConsolidationDay, sameDossierText } from '../lib/deliverables';
import { triggerHaptic } from '../lib/haptics';
import { playSound } from '../lib/sounds';
import { log } from '../lib/logger';
export default function DeliverableScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const { marketId, loading: marketLoading } = useSelectedMarket();
    const { progress, availableDay } = useUserProgress(marketId);
    const goal = progress?.learning_goal ?? null;
    const deliverable = useDeliverable(marketId, goal);
    const marketName = getMarketName(marketId);
    const day = availableDay || 1;
    const weeklyPrompt = useMemo(() => (isConsolidationDay(day) ? consolidationSection(deliverable.template, day) : null), [day, deliverable.template]);
    /** Draft text per section. */
    const [drafts, setDrafts] = useState({});
    /** Suggestion id the draft was started from, per section (replaced on save). */
    const [startedFrom, setStartedFrom] = useState({});
    /** Only the section the learner opened has a text field. */
    const [composing, setComposing] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [savingKey, setSavingKey] = useState(null);
    /** Section that just received a line — drives the brief highlight. */
    const [justFilled, setJustFilled] = useState(null);
    const scrollRef = useRef(null);
    const sectionY = useRef({});
    const inputRefs = useRef({});
    const openedParam = useRef(null);
    const busy = marketLoading || deliverable.loading;
    const { template, bySection, filledSections } = deliverable;
    const total = template.sections.length;
    useEffect(() => {
        if (busy || !params.section || openedParam.current === params.section)
            return;
        if (!template.sections.some(section => section.key === params.section))
            return;
        openedParam.current = params.section;
        setComposing(params.section);
    }, [busy, params.section, template.sections]);
    useEffect(() => {
        if (!composing || busy)
            return;
        const timer = setTimeout(() => {
            const y = sectionY.current[composing];
            if (typeof y === 'number')
                scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
            inputRefs.current[composing]?.focus();
        }, 350);
        return () => clearTimeout(timer);
    }, [composing, busy]);
    const learnerLineCount = deliverable.learnerEntries.length;
    const close = () => { Keyboard.dismiss(); router.back(); };
    const setDraft = (key, value) => setDrafts(prev => ({ ...prev, [key]: value }));
    const focusSection = (key) => {
        setComposing(key);
        const y = sectionY.current[key];
        if (typeof y === 'number')
            scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
        setTimeout(() => inputRefs.current[key]?.focus(), 350);
    };
    const save = async (key) => {
        const text = (drafts[key] ?? '').trim();
        const suggestionId = startedFrom[key];
        const original = deliverable.entries.find(entry => entry.id === suggestionId);
        if (text.length < 3 || savingKey || (original && sameDossierText(text, original.content)))
            return;
        setSavingKey(key);
        const wasEmpty = (bySection[key]?.length ?? 0) === 0;
        const ok = suggestionId
            ? await deliverable.replaceSuggestion(suggestionId, key, text, day)
            : await deliverable.addLine(key, text, day);
        setSavingKey(null);
        if (!ok)
            return;
        setDraft(key, '');
        setStartedFrom(prev => { const next = { ...prev }; delete next[key]; return next; });
        setComposing(null);
        Keyboard.dismiss();
        setJustFilled(key);
        setTimeout(() => setJustFilled(null), 2200);
        if (wasEmpty) {
            triggerHaptic('success');
            playSound('unlock').catch(() => { });
        }
        else {
            triggerHaptic('light');
            playSound('xpEarn').catch(() => { });
        }
    };
    const share = async () => {
        triggerHaptic('light');
        try {
            await Share.share({ message: deliverable.exportText(marketName) });
        }
        catch (error) {
            log.warn('[Deliverable] Share cancelled:', error);
        }
    };
    if (busy) {
        return (<View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.accent}/>
        <Text style={styles.loadingText}>Opening your dossier…</Text>
      </View>);
    }
    const firstEmpty = template.sections.find(section => (bySection[section.key]?.length ?? 0) === 0) ?? null;
    return (<KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} style={styles.fill} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={close} hitSlop={14} style={styles.backBtn} accessibilityLabel="Back">
            <Feather name="chevron-left" size={24} color={COLORS.textPrimary}/>
          </TouchableOpacity>
          {learnerLineCount > 0 ? (<TouchableOpacity onPress={() => { triggerHaptic('light'); setEditMode(v => !v); }} hitSlop={10}>
              <Text style={styles.editToggle}>{editMode ? 'Done' : 'Edit'}</Text>
            </TouchableOpacity>) : null}
        </View>

        {/* Cover */}
        <View style={styles.cover}>
          <Text style={styles.eyebrow}>{`${marketName.toUpperCase()} · ${template.title.toUpperCase()}`}</Text>
          <Text style={styles.title}>{template.title}</Text>
          <Text style={styles.count}>{`${filledSections} of ${total} sections written by you`}</Text>
          <View style={styles.segments}>
            {template.sections.map(section => (<View key={section.key} style={[styles.segment, (bySection[section.key]?.length ?? 0) > 0 && styles.segmentOn]}/>))}
          </View>
        </View>

        {weeklyPrompt && (<TouchableOpacity style={styles.weekly} activeOpacity={0.85} onPress={() => { triggerHaptic('light'); focusSection(weeklyPrompt.key); }}>
            <Text style={styles.weeklyLabel}>CONSOLIDATION DAY</Text>
            <Text style={styles.weeklyPrompt}>{weeklyPrompt.prompt}</Text>
            <Text style={styles.link}>Write today's line</Text>
          </TouchableOpacity>)}

        {/* Sections, in order */}
        {template.sections.map((section, index) => {
            const own = bySection[section.key] ?? [];
            const suggestion = (deliverable.suggestionsBySection[section.key] ?? [])[0];
            const empty = own.length === 0;
            const draft = drafts[section.key] ?? '';
            const showField = composing === section.key;
            const original = deliverable.entries.find(entry => entry.id === startedFrom[section.key]);
            const unchangedSuggestion = !!original && sameDossierText(draft, original.content);
            const saveDisabled = draft.trim().length < 3 || unchangedSuggestion || savingKey !== null;
            const flashing = justFilled === section.key;
            return (<View key={section.key} onLayout={e => { sectionY.current[section.key] = e.nativeEvent.layout.y; }} style={[styles.section, index > 0 && styles.divider, flashing && styles.sectionFlash]}>
              <Text style={styles.sectionHead}>
                <Text style={styles.sectionNum}>{`${String(index + 1).padStart(2, '0')}  `}</Text>
                {section.title}
              </Text>

              {empty ? <Text style={styles.prompt}>{section.prompt}</Text> : null}

              {own.map(entry => (<TouchableOpacity key={entry.id} activeOpacity={1} delayLongPress={350} onLongPress={() => { triggerHaptic('light'); setEditMode(true); }} style={styles.line}>
                  <View style={styles.fill}>
                    <Text style={styles.lineText}>{entry.content}</Text>
                    {entry.dayNumber ? <Text style={styles.lineDay}>{`Day ${entry.dayNumber}`}</Text> : null}
                  </View>
                  {editMode ? (<TouchableOpacity onPress={() => { triggerHaptic('light'); deliverable.removeLine(entry.id); }} hitSlop={10} accessibilityLabel="Delete line">
                      <Feather name="trash-2" size={15} color={COLORS.textMuted}/>
                    </TouchableOpacity>) : null}
                </TouchableOpacity>))}

              {empty && suggestion ? (<View style={styles.suggestion}>
                  <Text style={styles.suggestionText}>
                    {suggestion.dayNumber ? `From Day ${suggestion.dayNumber}: ` : 'From a lesson: '}
                    {suggestion.content}
                  </Text>
                  <TouchableOpacity hitSlop={8} onPress={() => {
                        triggerHaptic('light');
                        setDraft(section.key, suggestion.content);
                        setStartedFrom(prev => ({ ...prev, [section.key]: suggestion.id }));
                        focusSection(section.key);
                    }}>
                    <Text style={styles.link}>Start from this</Text>
                  </TouchableOpacity>
                </View>) : null}

              {showField ? (<View style={styles.composer}>
                  <TextInput ref={ref => { inputRefs.current[section.key] = ref; }} style={styles.input} value={draft} onChangeText={value => setDraft(section.key, value)} placeholder="Write a line…" placeholderTextColor={COLORS.textMuted} multiline blurOnSubmit/>
                  {unchangedSuggestion ? <Text style={styles.rewriteHint}>Put it in your own words first.</Text> : null}
                  {draft.trim().length > 0 ? (<TouchableOpacity style={[styles.saveBtn, saveDisabled && styles.saveBtnOff]} disabled={saveDisabled} onPress={() => save(section.key)} activeOpacity={0.9}>
                      <Text style={styles.saveText}>{savingKey === section.key ? 'Saving…' : 'Save'}</Text>
                    </TouchableOpacity>) : null}
                </View>) : (<TouchableOpacity hitSlop={8} onPress={() => focusSection(section.key)}>
                  <Text style={styles.addMore}>{empty ? 'Write' : '+ Add a line'}</Text>
                </TouchableOpacity>)}
            </View>);
        })}

        {/* Bottom actions */}
        <View style={styles.actions}>
          {learnerLineCount === 0 ? (<TouchableOpacity style={styles.primary} activeOpacity={0.9} onPress={() => { triggerHaptic('light'); if (firstEmpty)
            focusSection(firstEmpty.key); }}>
              <Text style={styles.primaryText}>Write your first line</Text>
            </TouchableOpacity>) : (<>
              <TouchableOpacity style={styles.primary} activeOpacity={0.9} onPress={share}>
                <Feather name="share-2" size={15} color={COLORS.textOnAccent}/>
                <Text style={styles.primaryText}>Export brief</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondary} onPress={close}>
                <Text style={styles.secondaryText}>Back to course</Text>
              </TouchableOpacity>
            </>)}
          <Text style={styles.footNote}>Private to you.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>);
}
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg0 },
    fill: { flex: 1 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: COLORS.bg0 },
    loadingText: { ...TYPE.caption, color: COLORS.textSecondary },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 8,
        minHeight: 40,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    editToggle: { ...TYPE.caption, color: COLORS.accent, fontWeight: '800' },
    cover: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20 },
    eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: COLORS.textMuted },
    title: { ...TYPE.h1, color: COLORS.textPrimary, marginTop: 8 },
    count: { ...TYPE.body, color: COLORS.textSecondary, marginTop: 10 },
    segments: { flexDirection: 'row', gap: 4, marginTop: 12 },
    segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: COLORS.border },
    segmentOn: { backgroundColor: COLORS.accent },
    weekly: { marginHorizontal: 24, marginBottom: 8, paddingVertical: 14, gap: 4 },
    weeklyLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1, color: COLORS.accent },
    weeklyPrompt: { ...TYPE.body, color: COLORS.textPrimary, lineHeight: 21 },
    section: { marginHorizontal: 24, paddingVertical: 20 },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
    sectionFlash: { backgroundColor: COLORS.accentSoft, paddingHorizontal: 12, marginHorizontal: 12 },
    sectionHead: { ...TYPE.h3, color: COLORS.textPrimary },
    sectionNum: { color: COLORS.textMuted, fontWeight: '800' },
    prompt: { ...TYPE.body, color: COLORS.textMuted, marginTop: 6, lineHeight: 21 },
    line: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 10 },
    lineText: { ...TYPE.body, color: COLORS.textPrimary, lineHeight: 23 },
    lineDay: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: 3 },
    suggestion: { marginTop: 10, opacity: 0.75, gap: 4 },
    suggestionText: { ...TYPE.caption, color: COLORS.textMuted, lineHeight: 19, fontStyle: 'italic' },
    link: { ...TYPE.caption, color: COLORS.accent, fontWeight: '800' },
    addMore: { ...TYPE.caption, color: COLORS.accent, fontWeight: '800', marginTop: 12 },
    composer: { marginTop: 12, gap: 8 },
    rewriteHint: { ...TYPE.caption, color: COLORS.textMuted },
    input: {
        ...TYPE.body,
        color: COLORS.textPrimary,
        minHeight: 44,
        maxHeight: 152, // ~6 lines at lineHeight 22 — grows with content, then scrolls
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        textAlignVertical: 'top',
    },
    saveBtn: { alignSelf: 'flex-end', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, backgroundColor: COLORS.accent },
    saveBtnOff: { backgroundColor: COLORS.border },
    saveText: { ...TYPE.caption, color: COLORS.textOnAccent, fontWeight: '800' },
    actions: { paddingHorizontal: 24, paddingTop: 24, gap: 10 },
    primary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 52,
        borderRadius: 999,
        backgroundColor: COLORS.accent,
    },
    primaryText: { ...TYPE.bodyBold, color: COLORS.textOnAccent, fontWeight: '800' },
    secondary: { alignItems: 'center', paddingVertical: 10 },
    secondaryText: { ...TYPE.bodyBold, color: COLORS.textSecondary },
    footNote: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center', marginTop: 4 },
});
