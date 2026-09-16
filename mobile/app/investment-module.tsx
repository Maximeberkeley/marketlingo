import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../lib/constants';
import { useSelectedMarket } from '../hooks/useSelectedMarket';
import { InvestmentScenario, useInvestmentLab } from '../hooks/useInvestmentLab';
import { useUserXP } from '../hooks/useUserXP';
import { usePracticeRewards } from '../hooks/usePracticeRewards';
import { useCollectibles } from '../hooks/useCollectibles';
import { getMarketName } from '../lib/markets';
import { getMarketWorld } from '../data/marketWorlds';
import { triggerHaptic } from '../lib/haptics';
import { log } from '../lib/logger';

const SOPHIA = require('../assets/mentors/mentor-sophia.png');
type Phase = 'brief' | 'evidence' | 'conviction' | 'verdict';
type ModuleKey = 'valuation' | 'due_diligence' | 'risk_assessment' | 'portfolio_construction';
const CONFIG: Record<string, { title: string; type: InvestmentScenario['scenario_type']; scoreKey: ModuleKey; icon: keyof typeof Feather.glyphMap; prompt: string }> = {
  valuation: { title: 'Valuation', type: 'valuation', scoreKey: 'valuation', icon: 'bar-chart-2', prompt: 'What is the story worth?' },
  due_diligence: { title: 'Due Diligence', type: 'due_diligence', scoreKey: 'due_diligence', icon: 'search', prompt: 'What claim breaks first?' },
  risk_assessment: { title: 'Risk', type: 'risk', scoreKey: 'risk_assessment', icon: 'shield', prompt: 'Where can this thesis fail?' },
  portfolio: { title: 'Portfolio', type: 'portfolio', scoreKey: 'portfolio_construction', icon: 'pie-chart', prompt: 'How much deserves a seat?' },
};
const compact = (value?: string, max = 175) => {
  const clean = (value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 80))}…`;
};

export default function InvestmentModuleScreen() {
  const insets = useSafeAreaInsets();
  const { moduleId = 'valuation' } = useLocalSearchParams<{ moduleId: string }>();
  const config = CONFIG[moduleId] || CONFIG.valuation;
  const { marketId, loading: marketLoading } = useSelectedMarket();
  const world = getMarketWorld(marketId);
  const marketName = getMarketName(marketId);
  const lab = useInvestmentLab(marketId);
  const { addXP } = useUserXP(marketId);
  const { recordCaseRun } = usePracticeRewards();
  const { evaluateRewards } = useCollectibles(marketId);
  const scenarios = useMemo(() => lab.scenarios.filter(item => item.scenario_type === config.type), [lab.scenarios, config.type]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('brief');
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [saving, setSaving] = useState(false);
  const scenario = scenarios[index];
  const correct = selected === scenario?.correct_option_index;
  const completed = scenarios.filter(item => lab.completedScenarioIds.includes(item.id)).length;
  const score = scenarios.length ? Math.round((completed / scenarios.length) * 100) : 0;

  useEffect(() => {
    if (!lab.loading && scenarios.length) setIndex(lab.getResumeIndex(scenarios));
  }, [lab.loading, scenarios.length]);

  const choose = (choice: number) => { setSelected(choice); triggerHaptic('light'); };
  const commit = async () => {
    if (!scenario || selected === null || saving) return;
    setSaving(true);
    try {
      await lab.recordAttempt(scenario.id, selected, correct);
      const nextScore = Math.round(((completed + (correct ? 1 : 0)) / scenarios.length) * 100);
      await Promise.all([
        lab.updateModuleScore(config.scoreKey, nextScore),
        lab.saveModuleProgress(moduleId, { scenarioIndex: index, score: nextScore }),
      ]);
      if (correct) await lab.addLearnedConcept(scenario.tags[0] || config.title);
      triggerHaptic(correct ? 'success' : 'error');
      setPhase('verdict');
    } catch (error) { log.warn('[Investment] Could not save decision:', error); }
    finally { setSaving(false); }
  };
  const finish = async () => {
    if (!scenario) return router.back();
    const calibrated = correct && confidence === 'high';
    const grade = correct ? (calibrated ? 'A' : 'B') : confidence === 'high' ? 'D' : 'C';
    const xp = correct ? (calibrated ? 80 : 60) : 25;
    try {
      await Promise.all([
        addXP(xp, 'investment_lab', scenario.id, `${config.title} decision graded ${grade}`),
        recordCaseRun(grade),
        evaluateRewards('investment_lab', `investment:${scenario.id}`, correct ? 1 : 0),
      ]);
    } catch (error) { log.warn('[Investment] Rewards failed:', error); }
    if (index < scenarios.length - 1) { setIndex(index + 1); setSelected(null); setConfidence('medium'); setPhase('brief'); }
    else router.back();
  };

  if (marketLoading || lab.loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.accent} /></View>;
  if (!scenario) return <View style={styles.center}><Feather name={config.icon} size={38} color={world.colors[0]} /><Text style={styles.emptyTitle}>No case ready</Text><Text style={styles.emptyText}>Your next {marketName} case is still being prepared.</Text><TouchableOpacity onPress={() => router.back()}><Text style={[styles.backLink, { color: world.colors[0] }]}>Back to lab</Text></TouchableOpacity></View>;

  const phaseIndex = ['brief', 'evidence', 'conviction', 'verdict'].indexOf(phase);
  return <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
    <View style={styles.header}><TouchableOpacity onPress={() => router.back()} style={styles.iconButton}><Feather name="x" size={22} color={COLORS.textPrimary} /></TouchableOpacity><View style={{ flex: 1 }}><Text style={styles.headerTitle}>{config.title} Room</Text><Text style={styles.headerSub}>Case {index + 1}/{scenarios.length} · {score}% mastery</Text></View><Image source={SOPHIA} style={styles.sophiaSmall} /></View>
    <View style={styles.progress}>{[0,1,2,3].map(item => <View key={item} style={[styles.progressPart, { backgroundColor: item <= phaseIndex ? world.colors[0] : COLORS.border }]} />)}</View>
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.eyebrow, { color: world.colors[0] }]}>{phase.toUpperCase()} · {phaseIndex + 1}/4</Text>
      {phase === 'brief' && <>
        <Text style={styles.title}>{scenario.title}</Text><Text style={styles.subtitle}>{config.prompt}</Text>
        <LinearGradient colors={[world.colors[0], world.colors[1]]} style={styles.brief}><Text style={styles.briefTag}>{scenario.difficulty.toUpperCase()} CASE</Text><Text style={styles.briefText}>{compact(scenario.scenario, 210)}</Text>{scenario.valuation_model && <Text style={styles.model}>{scenario.valuation_model}</Text>}</LinearGradient>
        <Coach text="Do not fall in love with the pitch. Find the assumption carrying the weight." />
        <Action label="Reveal the evidence" color={world.colors[0]} onPress={() => setPhase('evidence')} />
      </>}
      {phase === 'evidence' && <>
        <Text style={styles.title}>What does the evidence say?</Text><Text style={styles.question}>{compact(scenario.question, 190)}</Text>
        <View style={styles.options}>{scenario.options.map((option, choice) => <TouchableOpacity key={choice} onPress={() => choose(choice)} style={[styles.option, selected === choice && { borderColor: world.colors[0], backgroundColor: `${world.colors[0]}10` }]}><Text style={[styles.optionLetter, { color: world.colors[0] }]}>{String.fromCharCode(65 + choice)}</Text><Text style={styles.optionText}>{compact(option.text, 110)}</Text>{selected === choice && <Feather name="check-circle" size={19} color={world.colors[0]} />}</TouchableOpacity>)}</View>
        <Action label="Set conviction" color={world.colors[0]} disabled={selected === null} onPress={() => setPhase('conviction')} />
      </>}
      {phase === 'conviction' && <>
        <Text style={styles.title}>How hard would you defend it?</Text><Text style={styles.subtitle}>Confidence changes the grade. Bluffing is expensive.</Text>
        <View style={styles.convictions}>{(['low','medium','high'] as const).map((value, i) => <TouchableOpacity key={value} onPress={() => setConfidence(value)} style={[styles.conviction, confidence === value && { borderColor: world.colors[0], backgroundColor: `${world.colors[0]}10` }]}><View style={styles.signal}>{[0,1,2].map(bar => <View key={bar} style={[styles.signalBar, { height: 9 + bar * 7, backgroundColor: bar <= i ? world.colors[0] : COLORS.border }]} />)}</View><Text style={styles.convictionTitle}>{value[0].toUpperCase() + value.slice(1)}</Text></TouchableOpacity>)}</View>
        <View style={styles.lockedChoice}><Text style={styles.lockedLabel}>YOUR CALL</Text><Text style={styles.lockedText}>{compact(scenario.options[selected || 0]?.text, 120)}</Text></View>
        <Action label={saving ? 'Banking decision…' : 'Commit capital'} color={world.colors[0]} disabled={saving} onPress={commit} />
      </>}
      {phase === 'verdict' && <>
        <LinearGradient colors={correct ? [COLORS.success, world.colors[1]] : [COLORS.error, world.colors[1]]} style={styles.verdict}><Feather name={correct ? 'trending-up' : 'activity'} size={32} color={COLORS.bg0} /><Text style={styles.verdictTitle}>{correct ? 'Thesis survived.' : 'Thesis cracked.'}</Text><Text style={styles.verdictSub}>{correct ? `+${confidence === 'high' ? 80 : 60} XP pending` : '25 XP for the rep'}</Text></LinearGradient>
        <Coach text={correct ? 'Good call. Now explain it without hiding behind jargon.' : 'Cheap mistakes belong here, not in a portfolio. Read the post-mortem.'} />
        <Debrief label="WHY" body={compact(scenario.explanation, 175)} color={world.colors[0]} />
        {scenario.real_world_example && <Debrief label="REAL WORLD" body={compact(scenario.real_world_example, 175)} color={COLORS.info} />}
        <View style={styles.calibration}><Text style={styles.calibrationLabel}>CALIBRATION</Text><Text style={styles.calibrationText}>{correct && confidence === 'high' ? 'Right and bold. Senior-investor signal.' : !correct && confidence === 'high' ? 'Wrong and overconfident. That is the expensive combination.' : correct ? 'Right call. Build conviction with stronger evidence.' : 'Wrong call, controlled conviction. Recoverable.'}</Text></View>
        <Action label={index < scenarios.length - 1 ? 'Bank result · next case' : 'Complete module'} color={world.colors[0]} onPress={finish} />
      </>}
    </ScrollView>
  </View>;
}

function Coach({ text }: { text: string }) { return <View style={styles.coach}><Image source={SOPHIA} style={styles.coachImage} /><Text style={styles.coachText}>{text}</Text></View>; }
function Action({ label, color, onPress, disabled }: { label: string; color: string; onPress: () => void; disabled?: boolean }) { return <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.action, { backgroundColor: color }, disabled && styles.disabled]}><Text style={styles.actionText}>{label}</Text><Feather name="arrow-right" size={18} color={COLORS.bg0} /></TouchableOpacity>; }
function Debrief({ label, body, color }: { label: string; body: string; color: string }) { return <View style={[styles.debrief, { borderLeftColor: color }]}><Text style={[styles.debriefLabel, { color }]}>{label}</Text><Text style={styles.debriefText}>{body}</Text></View>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 }, center: { flex: 1, backgroundColor: COLORS.bg0, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 }, emptyTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary }, emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' }, backLink: { fontSize: 15, fontWeight: '800', marginTop: 8 },
  header: { height: 58, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }, iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, headerTitle: { fontSize: 15, fontWeight: '900', color: COLORS.textPrimary }, headerSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 }, sophiaSmall: { width: 38, height: 38, borderRadius: 19, marginRight: 6 }, progress: { flexDirection: 'row', gap: 4, paddingHorizontal: 16 }, progressPart: { flex: 1, height: 5, borderRadius: 3 },
  scroll: { padding: 20, gap: 14 }, eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1 }, title: { fontSize: 28, lineHeight: 33, fontWeight: '900', color: COLORS.textPrimary }, subtitle: { fontSize: 15, lineHeight: 21, color: COLORS.textSecondary }, brief: { minHeight: 235, borderRadius: 20, padding: 22, justifyContent: 'flex-end' }, briefTag: { color: COLORS.bg0, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, briefText: { color: COLORS.bg0, fontSize: 22, lineHeight: 29, fontWeight: '900', marginTop: 8 }, model: { alignSelf: 'flex-start', color: COLORS.bg0, fontSize: 11, fontWeight: '800', borderWidth: 1, borderColor: COLORS.bg0, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, marginTop: 12 },
  coach: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 15, backgroundColor: COLORS.accentSoft }, coachImage: { width: 42, height: 42, borderRadius: 21 }, coachText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600', color: COLORS.textPrimary }, action: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, actionText: { color: COLORS.bg0, fontSize: 16, fontWeight: '900' }, disabled: { opacity: 0.38 },
  question: { fontSize: 19, lineHeight: 26, color: COLORS.textPrimary, fontWeight: '700', padding: 18, borderRadius: 16, backgroundColor: COLORS.bg1 }, options: { gap: 9 }, option: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 15, borderWidth: 2, borderColor: COLORS.border }, optionLetter: { width: 26, fontSize: 15, fontWeight: '900' }, optionText: { flex: 1, fontSize: 14, lineHeight: 19, color: COLORS.textPrimary, fontWeight: '600' },
  convictions: { flexDirection: 'row', gap: 8 }, conviction: { flex: 1, minHeight: 110, borderRadius: 15, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', gap: 10 }, signal: { height: 26, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }, signalBar: { width: 6, borderRadius: 3 }, convictionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary }, lockedChoice: { padding: 16, borderRadius: 15, backgroundColor: COLORS.bg1 }, lockedLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '900', letterSpacing: 1 }, lockedText: { fontSize: 15, lineHeight: 20, color: COLORS.textPrimary, fontWeight: '700', marginTop: 5 },
  verdict: { minHeight: 215, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 8 }, verdictTitle: { color: COLORS.bg0, fontSize: 29, fontWeight: '900' }, verdictSub: { color: COLORS.bg0, opacity: 0.85, fontSize: 14, fontWeight: '700' }, debrief: { borderLeftWidth: 4, borderRadius: 4, padding: 15, backgroundColor: COLORS.bg1 }, debriefLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 }, debriefText: { fontSize: 14, lineHeight: 20, color: COLORS.textPrimary, marginTop: 5 }, calibration: { padding: 16, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border }, calibrationLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1 }, calibrationText: { fontSize: 15, lineHeight: 21, color: COLORS.textPrimary, fontWeight: '700', marginTop: 5 },
});
