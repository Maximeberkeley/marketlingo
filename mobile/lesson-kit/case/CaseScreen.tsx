import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { tokens } from '../theme/tokens';
import { PrimaryButton } from '../components/PrimaryButton';
import { FeedbackFooter } from '../components/FeedbackFooter';
import { LeoCoach } from '../components/LeoCoach';
import { renderExerciseByKind, isPassiveKind } from '../components/ExerciseRenderer';
import { ExerciseState } from '../exercises/types';
import { DeepCase, CaseGrade, gradeCase } from './buildCase';
import { playSound } from '../../lib/sounds';
import { getMarketWorld } from '../../data/marketWorlds';
import { BriefingReader } from '../components/BriefingReader';

type Confidence = 'low' | 'medium' | 'high';

const CONFIDENCE: { key: Confidence; label: string; note: string }[] = [
  { key: 'low', label: 'Hedge it', note: 'Half position, revisit next week' },
  { key: 'medium', label: 'Stand by it', note: 'Normal conviction' },
  { key: 'high', label: 'Bet the desk', note: 'High conviction, size up' },
];

const GRADE_COLOR: Record<CaseGrade, string> = {
  A: '#22C55E',
  B: '#0EA5E9',
  C: '#F59E0B',
  D: '#EF4444',
};

export interface CaseResult {
  grade: CaseGrade;
  correct: number;
  total: number;
  callCorrect: boolean;
  confidence: Confidence;
  xp: number;
}

interface Props {
  deepCase: DeepCase;
  marketId?: string;
  marketName: string;
  onExit: () => void;
  onFinish: (result: CaseResult) => void;
}

/**
 * Deep Case — a slow, four-stage case study. No clock, no shields: the reward
 * is a graded verdict and the reasoning behind it.
 */
export function CaseScreen({ deepCase, marketId, marketName, onExit, onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const world = getMarketWorld(marketId);

  const [stageIndex, setStageIndex] = useState(0);
  const [phase, setPhase] = useState<'answering' | 'feedback'>('answering');
  const [state, setState] = useState<ExerciseState>({ canCheck: false, isCorrect: false });
  const [correct, setCorrect] = useState(0);
  const [graded, setGraded] = useState(0);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [askConfidence, setAskConfidence] = useState(false);
  const [callCorrect, setCallCorrect] = useState(false);
  const [debrief, setDebrief] = useState(false);
  const [showExit, setShowExit] = useState(false);

  const stage = deepCase.stages[stageIndex];
  const passive = isPassiveKind(stage?.exercise.kind);
  const isCall = stage?.key === 'call';

  const advance = useCallback(() => {
    if (stageIndex < deepCase.stages.length - 1) {
      setStageIndex(i => i + 1);
      setPhase('answering');
      setState({ canCheck: false, isCorrect: false });
      return;
    }
    playSound('lessonComplete').catch(() => {});
    setDebrief(true);
  }, [deepCase.stages.length, stageIndex]);

  const check = useCallback(() => {
    setGraded(g => g + 1);
    if (state.isCorrect) {
      setCorrect(c => c + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      playSound('correct').catch(() => {});
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      playSound('wrong').catch(() => {});
    }
    if (isCall) setCallCorrect(state.isCorrect);
    setPhase('feedback');
  }, [isCall, state.isCorrect]);

  const onAction = useCallback(() => {
    if (passive) {
      advance();
      return;
    }
    if (phase === 'answering') {
      if (!state.canCheck) return;
      // The final call needs a stated conviction before it is locked in.
      if (isCall && !confidence) {
        setAskConfidence(true);
        return;
      }
      check();
      return;
    }
    advance();
  }, [advance, check, confidence, isCall, passive, phase, state.canCheck]);

  const correctAnswerText = useMemo(() => {
    const ex = stage?.exercise;
    if (!ex) return undefined;
    if (ex.kind === 'multipleChoice') return ex.options[ex.correctIndex];
    if (ex.kind === 'theCall') return ex.options[ex.correctIndex];
    if (ex.kind === 'spotFake') return ex.statements[ex.fakeIndex];
    if (ex.kind === 'mapMarket') return ex.nodes[ex.correctIndex]?.label;
    if (ex.kind === 'faceOff') return ex.correctIndex === 0 ? ex.left.name : ex.right.name;
    return undefined;
  }, [stage]);

  // ── Debrief ───────────────────────────────────────────────────
  if (debrief) {
    const result = gradeCase(correct, graded, callCorrect, confidence || 'medium');
    const xp = { A: 90, B: 70, C: 45, D: 25 }[result.grade];
    return (
      <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
        <ScrollView contentContainerStyle={styles.debriefScroll} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[GRADE_COLOR[result.grade], world.colors[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradeHero}
          >
            <Text style={styles.gradeKicker}>CASE VERDICT</Text>
            <Text style={styles.gradeLetter}>{result.grade}</Text>
            <Text style={styles.gradeNote}>{result.note}</Text>
          </LinearGradient>

          <View style={styles.debriefRow}>
            <DebriefStat icon="check-circle" label="Stages right" value={`${correct}/${graded}`} />
            <DebriefStat icon="flag" label="Final call" value={callCorrect ? 'Correct' : 'Missed'} />
            <DebriefStat
              icon="activity"
              label="Conviction"
              value={CONFIDENCE.find(c => c.key === confidence)?.label || 'Standard'}
            />
          </View>

          {!!deepCase.proReasoning && (
            <DebriefBlock icon="award" title="How a pro reads it" body={deepCase.proReasoning} tint={tokens.color.accent} />
          )}
          {!!deepCase.commonMistake && (
            <DebriefBlock icon="alert-triangle" title="Where most people slip" body={deepCase.commonMistake} tint={tokens.color.signalEnergy} />
          )}
          {!!deepCase.mentalModel && (
            <DebriefBlock icon="compass" title="Keep this model" body={deepCase.mentalModel} tint={tokens.color.signalData} />
          )}

          <LeoCoach
            line={`That is one more ${marketName} case in the bank. Cases like this are what interviews are made of.`}
            mood={result.grade === 'A' || result.grade === 'B' ? 'celebrate' : 'thinking'}
          />

          <PrimaryButton
            label={`Bank +${xp} XP`}
            onPress={() =>
              onFinish({
                grade: result.grade,
                correct,
                total: graded,
                callCorrect,
                confidence: confidence || 'medium',
                xp,
              })
            }
          />
          <TouchableOpacity style={styles.ghostBtn} onPress={onExit} activeOpacity={0.8}>
            <Text style={styles.ghostText}>Back to practice</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (!stage) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.emptyTitle}>No case ready</Text>
        <Text style={styles.emptyBody}>We need more {marketName} case material. Try a lesson first.</Text>
        <PrimaryButton label="Back to practice" onPress={onExit} />
      </View>
    );
  }

  const buttonVariant =
    phase === 'feedback'
      ? state.isCorrect
        ? 'correct'
        : 'incorrect'
      : passive || state.canCheck
        ? 'primary'
        : 'disabled';
  const buttonLabel = passive
    ? 'Open the case'
    : phase === 'feedback'
      ? stageIndex === deepCase.stages.length - 1
        ? 'See the verdict'
        : 'Next stage'
      : isCall
        ? 'Make the call'
        : 'Check my read';

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* Stage rail */}
      <View style={styles.railRow}>
        <TouchableOpacity onPress={() => setShowExit(true)} hitSlop={10} style={{ width: 34 }}>
          <Feather name="x" size={20} color={tokens.color.textMuted} />
        </TouchableOpacity>
        <View style={styles.rail}>
          {deepCase.stages.map((s, i) => {
            const done = i < stageIndex;
            const active = i === stageIndex;
            return (
              <View key={s.key} style={styles.railItem}>
                <View
                  style={[
                    styles.railDot,
                    done && { backgroundColor: tokens.color.correct, borderColor: tokens.color.correct },
                    active && { borderColor: tokens.color.accent, backgroundColor: tokens.color.accentSoft },
                  ]}
                >
                  {done ? (
                    <Feather name="check" size={11} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.railNum, active && { color: tokens.color.accent }]}>{i + 1}</Text>
                  )}
                </View>
                <Text style={[styles.railLabel, active && { color: tokens.color.text, fontWeight: '800' }]}>
                  {s.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.stageHint}>{stage.hint}</Text>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {!!stage.exercise.leo?.line && (
          <LeoCoach line={stage.exercise.leo.line} mood={stage.exercise.leo.mood} />
        )}
        {renderExerciseByKind(stage.exercise, phase, setState)}
        {isCall && confidence && phase === 'answering' && (
          <View style={styles.convictionChip}>
            <Feather name="activity" size={12} color={tokens.color.accent} />
            <Text style={styles.convictionChipText}>
              Conviction: {CONFIDENCE.find(c => c.key === confidence)?.label}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {phase === 'feedback' && !passive && (
          <FeedbackFooter
            isCorrect={state.isCorrect}
            explanation={(stage.exercise as any).explanation}
            correctAnswer={correctAnswerText}
          />
        )}
        <PrimaryButton label={buttonLabel} onPress={onAction} variant={buttonVariant} />
      </View>

      {/* Conviction sheet before the final call */}
      <Modal visible={askConfidence} transparent animationType="slide">
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>How much conviction?</Text>
            <Text style={styles.sheetBody}>
              Calibration counts. Being loudly wrong costs more than being quietly right.
            </Text>
            {CONFIDENCE.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={styles.convictionOption}
                activeOpacity={0.86}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setConfidence(opt.key);
                  setAskConfidence(false);
                  check();
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.convictionLabel}>{opt.label}</Text>
                  <Text style={styles.convictionNote}>{opt.note}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={tokens.color.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={showExit} transparent animationType="fade">
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Leave the case?</Text>
            <Text style={styles.sheetBody}>You will lose your progress on this case.</Text>
            <PrimaryButton label="Stay on the case" onPress={() => setShowExit(false)} />
            <TouchableOpacity style={styles.ghostBtn} onPress={onExit} activeOpacity={0.8}>
              <Text style={styles.ghostText}>Leave</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DebriefStat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.debriefStat}>
      <Feather name={icon} size={14} color={tokens.color.accent} />
      <Text style={styles.debriefValue}>{value}</Text>
      <Text style={styles.debriefLabel}>{label}</Text>
    </View>
  );
}

function DebriefBlock({
  icon,
  title,
  body,
  tint,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  body: string;
  tint: string;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const long = body.length > 180;
  return (
    <>
      <View style={styles.debriefBlock}>
        <View style={styles.debriefHead}>
          <Feather name={icon} size={14} color={tint} />
          <Text style={[styles.debriefTitle, { color: tint }]}>{title}</Text>
        </View>
        <Text style={styles.debriefBody} numberOfLines={long ? 3 : undefined}>{body}</Text>
        {long && (
          <TouchableOpacity accessibilityRole="button" style={styles.debriefMore} onPress={() => setShowDetail(true)}>
            <Text style={[styles.debriefMoreText, { color: tint }]}>Read full reasoning</Text>
            <Feather name="arrow-up-right" size={14} color={tint} />
          </TouchableOpacity>
        )}
      </View>
      <BriefingReader visible={showDetail} eyebrow="CASE DEBRIEF" title={title} text={body} onClose={() => setShowDetail(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: tokens.color.text },
  emptyBody: { fontSize: 14, lineHeight: 21, color: tokens.color.textSecondary, textAlign: 'center' },

  railRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 6 },
  rail: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  railItem: { alignItems: 'center', gap: 4, flex: 1 },
  railDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: tokens.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.color.surface,
  },
  railNum: { fontSize: 11, fontWeight: '800', color: tokens.color.textMuted },
  railLabel: { fontSize: 10, fontWeight: '600', color: tokens.color.textMuted },
  stageHint: {
    fontSize: 12,
    color: tokens.color.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 24,
  },

  body: { padding: 16, paddingBottom: 28, gap: 14 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    backgroundColor: tokens.color.bg,
  },

  convictionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: tokens.color.accentSoft,
  },
  convictionChipText: { fontSize: 11, fontWeight: '700', color: tokens.color.accent },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(10,12,20,0.62)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: tokens.color.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 34,
    gap: 10,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: tokens.color.text },
  sheetBody: { fontSize: 13, lineHeight: 20, color: tokens.color.textSecondary, marginBottom: 4 },
  convictionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  convictionLabel: { fontSize: 15, fontWeight: '800', color: tokens.color.text },
  convictionNote: { fontSize: 11, color: tokens.color.textMuted, marginTop: 2 },

  ghostBtn: { alignItems: 'center', paddingVertical: 14 },
  ghostText: { fontSize: 15, fontWeight: '700', color: tokens.color.textMuted },

  debriefScroll: { padding: 20, gap: 14 },
  gradeHero: { borderRadius: 26, padding: 24, alignItems: 'center', gap: 4 },
  gradeKicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, color: 'rgba(255,255,255,0.85)' },
  gradeLetter: { fontSize: 62, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2 },
  gradeNote: { fontSize: 13, lineHeight: 20, color: '#FFFFFF', textAlign: 'center' },
  debriefRow: { flexDirection: 'row', gap: 10 },
  debriefStat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  debriefValue: { fontSize: 15, fontWeight: '800', color: tokens.color.text },
  debriefLabel: { fontSize: 9, fontWeight: '700', color: tokens.color.textMuted, letterSpacing: 0.4 },
  debriefBlock: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    gap: 6,
  },
  debriefHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  debriefTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  debriefBody: { fontSize: 14, lineHeight: 21, color: tokens.color.textSecondary },
  debriefMore: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  debriefMoreText: { fontSize: 13, fontWeight: '800' },
});
