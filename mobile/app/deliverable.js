/**
 * The learner's dossier — Interview Brief, Idea Dossier, Thesis Sheet or
 * Market Map depending on their goal.
 *
 * It reads like the document itself: a cover line, six numbered sections in
 * order, and the learner's own lines as body text. Lesson suggestions are shown
 * faded as a starting point and never count as written.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, InputAccessoryView, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useAuth } from '../hooks/useAuth';
import { COLORS, TYPE } from '../lib/constants';
import { getMarketName } from '../lib/markets';
import { useSelectedMarket } from '../hooks/useSelectedMarket';
import { useUserProgress } from '../hooks/useUserProgress';
import { useDeliverable } from '../hooks/useDeliverable';
import { consolidationSection, isConsolidationDay, sameDossierText } from '../lib/deliverables';
import { triggerHaptic } from '../lib/haptics';
import { playSound } from '../lib/sounds';
import { log } from '../lib/logger';
const ACCESSORY_ID = 'dossier-writing';
const MIN_INPUT_HEIGHT = 80;
const MAX_INPUT_HEIGHT = 180;
function ProgressSegment({ filled }) {
    const amount = useRef(new Animated.Value(filled ? 1 : 0)).current;
    useEffect(() => {
        const animation = Animated.timing(amount, { toValue: filled ? 1 : 0, duration: 320, useNativeDriver: false });
        animation.start();
        return () => animation.stop();
    }, [filled, amount]);
    return <View style={styles.segment}><Animated.View style={[styles.segmentFill, { width: amount.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}/></View>;
}
export default function DeliverableScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const { marketId, loading: marketLoading } = useSelectedMarket();
    const { progress, availableDay } = useUserProgress(marketId);
    const goal = progress?.learning_goal ?? null;
    const deliverable = useDeliverable(marketId, goal);
    const marketName = getMarketName(marketId);
    const day = availableDay || 1;
    const weeklyPrompt = useMemo(() => (isConsolidationDay(day) ? consolidationSection(deliverable.template, day) : null), [day, deliverable.template]);
    const [snapshot, setSnapshot] = useState({ drafts: {}, startedFrom: {}, editing: {}, composing: null });
    const snapshotRef = useRef(snapshot);
    const { drafts, startedFrom, editing, composing } = snapshot;
    const [draftsReady, setDraftsReady] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [savingKey, setSavingKey] = useState(null);
    const savingRef = useRef(false);
    const leavingRef = useRef(false);
    const [justFilled, setJustFilled] = useState(null);
    const [inputHeights, setInputHeights] = useState({});
    const scrollRef = useRef(null);
    const scrollY = useRef(0);
    const keyboardTop = useRef(null);
    const inputRefs = useRef({});
    const openedParam = useRef(null);
    const writeQueue = useRef(Promise.resolve());
    const storageKey = user?.id && marketId ? `dossier-draft:${user.id}:${marketId}:${deliverable.template.goal}` : null;
    const { template, bySection, filledSections } = deliverable;
    const busy = marketLoading || deliverable.loading || !draftsReady;
    const total = template.sections.length;
    const persist = (next) => {
        if (!storageKey)
            return;
        const key = storageKey;
        writeQueue.current = writeQueue.current.then(() => AsyncStorage.setItem(key, JSON.stringify(next)))
            .catch(error => { log.warn('[Dossier] Draft storage failed:', error); });
    };
    const changeSnapshot = (change) => {
        const next = change(snapshotRef.current);
        snapshotRef.current = next;
        setSnapshot(next);
        persist(next);
    };
    useEffect(() => {
        let active = true;
        setDraftsReady(false);
        const restore = async () => {
            await writeQueue.current;
            try {
                const raw = storageKey ? await AsyncStorage.getItem(storageKey) : null;
                const saved = raw ? JSON.parse(raw) : null;
                const next = {
                    drafts: saved?.drafts ?? {}, startedFrom: saved?.startedFrom ?? {},
                    editing: saved?.editing ?? {}, composing: saved?.composing ?? null,
                };
                if (active) {
                    snapshotRef.current = next;
                    setSnapshot(next);
                }
            }
            catch (error) {
                log.warn('[Dossier] Draft restore failed:', error);
            }
            if (active)
                setDraftsReady(true);
        };
        void restore();
        return () => { active = false; };
    }, [storageKey]);
    // Measure the actual editor after the keyboard and the growing field settle.
    const revealEditor = () => {
        const key = snapshotRef.current.composing;
        if (!key || keyboardTop.current === null)
            return;
        inputRefs.current[key]?.measureInWindow((_x, y, _width, height) => {
            const bottom = (keyboardTop.current ?? 0) - (Platform.OS === 'ios' ? 56 : 0) - 16;
            const overflow = y + height - bottom;
            if (overflow > 0)
                scrollRef.current?.scrollTo({ y: Math.max(0, scrollY.current + overflow), animated: true });
        });
    };
    useEffect(() => {
        const shown = Keyboard.addListener('keyboardDidShow', event => {
            keyboardTop.current = event.endCoordinates.screenY;
            setTimeout(revealEditor, 100);
        });
        const changed = Keyboard.addListener('keyboardDidChangeFrame', event => {
            keyboardTop.current = event.endCoordinates.screenY;
            setTimeout(revealEditor, 100);
        });
        const hidden = Keyboard.addListener('keyboardDidHide', () => { keyboardTop.current = null; });
        return () => { shown.remove(); changed.remove(); hidden.remove(); };
    }, []);
    useEffect(() => {
        if (busy || !params.section || openedParam.current === params.section)
            return;
        if (!template.sections.some(section => section.key === params.section))
            return;
        openedParam.current = params.section;
        changeSnapshot(prev => ({ ...prev, composing: params.section ?? null }));
    }, [busy, params.section, template.sections]);
    useEffect(() => {
        if (!composing || busy)
            return;
        const timer = setTimeout(() => { inputRefs.current[composing]?.focus(); revealEditor(); }, 350);
        return () => clearTimeout(timer);
    }, [composing, busy]);
    const learnerLineCount = deliverable.learnerEntries.length;
    const close = async () => {
        if (savingRef.current)
            return;
        leavingRef.current = true;
        persist(snapshotRef.current);
        await writeQueue.current;
        router.back();
    };
    const setDraft = (key, value) => changeSnapshot(prev => ({ ...prev, drafts: { ...prev.drafts, [key]: value } }));
    const focusSection = (key) => changeSnapshot(prev => ({ ...prev, composing: key }));
    const editLine = (key, id, content) => {
        triggerHaptic('light');
        changeSnapshot(prev => ({ ...prev, composing: key,
            drafts: { ...prev.drafts, [key]: prev.editing[key] === id ? prev.drafts[key] : content },
            editing: { ...prev.editing, [key]: id }, startedFrom: { ...prev.startedFrom, [key]: '' },
        }));
    };
    const save = async (key) => {
        const current = snapshotRef.current;
        const text = (current.drafts[key] ?? '').trim();
        const suggestionId = current.startedFrom[key];
        const original = deliverable.entries.find(entry => entry.id === suggestionId);
        if (text.length < 3 || savingRef.current || (original && sameDossierText(text, original.content))) {
            if (!leavingRef.current)
                inputRefs.current[key]?.focus();
            return;
        }
        savingRef.current = true;
        setSavingKey(key);
        const wasEmpty = (bySection[key]?.length ?? 0) === 0;
        const ok = current.editing[key]
            ? await deliverable.updateLine(current.editing[key], text)
            : suggestionId ? await deliverable.replaceSuggestion(suggestionId, key, text, day)
                : await deliverable.addLine(key, text, day);
        savingRef.current = false;
        setSavingKey(null);
        if (!ok) {
            Alert.alert('Line not saved', 'Your draft is safe. Please try saving again.');
            inputRefs.current[key]?.focus();
            return;
        }
        changeSnapshot(prev => ({ ...prev, composing: prev.composing === key ? null : prev.composing,
            drafts: { ...prev.drafts, [key]: '' }, startedFrom: { ...prev.startedFrom, [key]: '' }, editing: { ...prev.editing, [key]: '' },
        }));
        if (!snapshotRef.current.composing)
            Keyboard.dismiss();
        setJustFilled(key);
        setTimeout(() => setJustFilled(null), 2200);
        triggerHaptic(wasEmpty ? 'success' : 'light');
        playSound(wasEmpty ? 'unlock' : 'xpEarn').catch(() => { });
    };
    const deleteLine = async (id, key) => {
        const ok = await deliverable.removeLine(id);
        if (!ok) {
            Alert.alert('Line not deleted', 'Please try again.');
            return;
        }
        triggerHaptic('light');
        if (snapshotRef.current.editing[key] === id)
            changeSnapshot(prev => ({ ...prev,
                editing: { ...prev.editing, [key]: '' }, drafts: { ...prev.drafts, [key]: '' },
            }));
    };
    const activeSection = template.sections.find(section => section.key === composing);
    const activeOriginal = deliverable.entries.find(entry => entry.id === startedFrom[composing ?? '']);
    const activeDraft = drafts[composing ?? ''] ?? '';
    const saveDisabled = activeDraft.trim().length < 3 || savingKey !== null || !!(activeOriginal && sameDossierText(activeDraft, activeOriginal.content));
    const saveBar = <View style={styles.accessoryBar}>
    <Text style={styles.accessoryTitle} numberOfLines={1}>{activeSection?.title ?? ''}</Text>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Save dossier line" style={[styles.accessorySave, saveDisabled && styles.saveBtnOff]} disabled={saveDisabled} onPress={() => { if (composing)
        void save(composing); }}>
      <Text style={styles.saveText}>{savingKey ? 'Saving…' : 'Save'}</Text>
    </TouchableOpacity>
  </View>;
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
      <ScrollView ref={scrollRef} style={styles.fill} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + (composing ? 240 : 40) }} keyboardShouldPersistTaps="always" keyboardDismissMode="none" onScroll={event => { scrollY.current = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={16} onLayout={revealEditor} showsVerticalScrollIndicator={false}>
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
            {template.sections.map(section => (<ProgressSegment key={section.key} filled={(bySection[section.key]?.length ?? 0) > 0}/>))}
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
            const flashing = justFilled === section.key;
            const renderEditor = () => (<View style={styles.composer} onLayout={() => setTimeout(revealEditor, 60)}>
              <TextInput ref={ref => { inputRefs.current[section.key] = ref; }} style={[styles.input, { height: inputHeights[section.key] ?? MIN_INPUT_HEIGHT }]} value={draft} onChangeText={value => { if (!savingRef.current)
                setDraft(section.key, value); }} editable={savingKey === null} placeholder="One sentence is enough…" placeholderTextColor={COLORS.textMuted} multiline autoCapitalize="sentences" returnKeyType="done" submitBehavior="submit" blurOnSubmit={false} inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined} scrollEnabled={(inputHeights[section.key] ?? MIN_INPUT_HEIGHT) >= MAX_INPUT_HEIGHT} onContentSizeChange={event => {
                    const height = Math.min(MAX_INPUT_HEIGHT, Math.max(MIN_INPUT_HEIGHT, Math.ceil(event.nativeEvent.contentSize.height)));
                    setInputHeights(prev => prev[section.key] === height ? prev : { ...prev, [section.key]: height });
                    setTimeout(revealEditor, 60);
                }} onFocus={() => setTimeout(revealEditor, 80)} onSubmitEditing={() => void save(section.key)} onBlur={() => {
                    setTimeout(() => {
                        if (!leavingRef.current && snapshotRef.current.composing === section.key && !savingRef.current)
                            void save(section.key);
                    }, 0);
                }}/>
              {unchangedSuggestion ? <Text style={styles.rewriteHint}>Put it in your own words first.</Text> : null}
            </View>);
            return (<View key={section.key} style={[styles.section, index > 0 && styles.divider, flashing && styles.sectionFlash]}>
              <Text style={styles.sectionHead}>
                <Text style={[styles.sectionNum, !empty && styles.sectionNumWritten]}>{`${String(index + 1).padStart(2, '0')}  `}</Text>
                {section.title}
              </Text>

              {empty ? <Text style={styles.prompt}>{section.prompt}</Text> : null}

              {own.map(entry => (<Swipeable key={entry.id} overshootRight={false} rightThreshold={40} renderRightActions={() => <TouchableOpacity style={styles.deleteAction} accessibilityLabel="Delete line" onPress={() => void deleteLine(entry.id, section.key)}><Feather name="trash-2" size={20} color={COLORS.textOnAccent}/></TouchableOpacity>}>
                  <View style={styles.line}>
                    {showField && editing[section.key] === entry.id ? renderEditor() : (<TouchableOpacity style={styles.fill} activeOpacity={0.8} accessibilityLabel="Edit dossier line" onPress={() => editLine(section.key, entry.id, entry.content)} onLongPress={() => setEditMode(true)}>
                        <Text style={styles.lineText}>{entry.content}</Text>
                        {entry.dayNumber ? <Text style={styles.lineDay}>{`Day ${entry.dayNumber}`}</Text> : null}
                      </TouchableOpacity>)}
                    {editMode ? <TouchableOpacity hitSlop={10} accessibilityLabel="Delete line" onPress={() => void deleteLine(entry.id, section.key)}><Feather name="trash-2" size={15} color={COLORS.textMuted}/></TouchableOpacity> : null}
                  </View>
                </Swipeable>))}

              {empty && suggestion ? (<View style={styles.suggestion}>
                  <Text style={styles.suggestionText}>
                    {suggestion.dayNumber ? `From Day ${suggestion.dayNumber}: ` : 'From a lesson: '}
                    {suggestion.content}
                  </Text>
                  <TouchableOpacity hitSlop={8} onPress={() => {
                        triggerHaptic('light');
                        changeSnapshot(prev => ({ ...prev, composing: section.key,
                            drafts: { ...prev.drafts, [section.key]: suggestion.content },
                            startedFrom: { ...prev.startedFrom, [section.key]: suggestion.id },
                            editing: { ...prev.editing, [section.key]: '' },
                        }));
                    }}>
                    <Text style={styles.link}>Start from this</Text>
                  </TouchableOpacity>
                </View>) : null}

              {showField ? (editing[section.key] ? null : renderEditor()) : (<TouchableOpacity hitSlop={8} onPress={() => focusSection(section.key)}>
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
      {Platform.OS === 'ios' ? <InputAccessoryView nativeID={ACCESSORY_ID} backgroundColor={COLORS.bg0}>{saveBar}</InputAccessoryView>
            : composing ? saveBar : null}
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
    segment: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: COLORS.border },
    segmentFill: { height: '100%', backgroundColor: COLORS.accent },
    weekly: { marginHorizontal: 24, marginBottom: 8, paddingVertical: 14, gap: 4 },
    weeklyLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1, color: COLORS.accent },
    weeklyPrompt: { ...TYPE.body, color: COLORS.textPrimary, lineHeight: 21 },
    section: { marginHorizontal: 24, paddingVertical: 20 },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
    sectionFlash: { backgroundColor: COLORS.accentSoft, paddingHorizontal: 12, marginHorizontal: 12 },
    sectionHead: { ...TYPE.h3, color: COLORS.textPrimary },
    sectionNum: { color: COLORS.textMuted, fontWeight: '800' },
    sectionNumWritten: { color: COLORS.accent },
    prompt: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 6, lineHeight: 21 },
    line: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 18, marginBottom: 8 },
    lineText: { ...TYPE.body, fontSize: 18, color: COLORS.textPrimary, lineHeight: 27 },
    lineDay: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: 3 },
    suggestion: { marginTop: 10, opacity: 0.75, gap: 4 },
    suggestionText: { ...TYPE.caption, color: COLORS.textMuted, lineHeight: 19, fontStyle: 'italic' },
    link: { ...TYPE.caption, color: COLORS.accent, fontWeight: '800' },
    addMore: { ...TYPE.caption, color: COLORS.accent, fontWeight: '800', marginTop: 12 },
    composer: { flex: 1, marginTop: 12, gap: 8 },
    rewriteHint: { ...TYPE.caption, color: COLORS.textMuted },
    input: {
        ...TYPE.body,
        color: COLORS.textPrimary,
        fontSize: 17,
        lineHeight: 25,
        minHeight: MIN_INPUT_HEIGHT,
        maxHeight: MAX_INPUT_HEIGHT,
        paddingHorizontal: 16,
        paddingVertical: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        textAlignVertical: 'top',
    },
    accessoryBar: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, backgroundColor: COLORS.bg0 },
    accessoryTitle: { ...TYPE.caption, flex: 1, color: COLORS.textSecondary },
    accessorySave: { height: 36, minWidth: 72, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 6, backgroundColor: COLORS.accent },
    deleteAction: { width: 64, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.error },
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
