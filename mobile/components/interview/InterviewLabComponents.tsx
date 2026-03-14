import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPE } from '../../lib/constants';
import { LeoCharacter } from '../mascot/LeoCharacter';
import { triggerHaptic } from '../../lib/haptics';
import { InterviewStage } from '../../lib/interviewLabData';

// ─── Progress Tracker ───
export function StageTracker({ current, onTap }: { current: InterviewStage; onTap: (s: InterviewStage) => void }) {
  const stages: { stage: InterviewStage; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { stage: 1, label: 'Framework', icon: 'layers' },
    { stage: 2, label: 'Expect', icon: 'eye' },
    { stage: 3, label: 'Practice', icon: 'check-circle' },
    { stage: 4, label: 'Mock Lab', icon: 'mic' },
  ];

  return (
    <View style={styles.trackerRow}>
      {stages.map((s, i) => {
        const done = current > s.stage;
        const active = current === s.stage;
        return (
          <React.Fragment key={s.stage}>
            {i > 0 && <View style={[styles.trackerLine, (done || active) && styles.trackerLineActive]} />}
            <TouchableOpacity onPress={() => onTap(s.stage)} style={[styles.trackerDot, active && styles.trackerDotActive, done && styles.trackerDotDone]}>
              <Feather name={done ? 'check' : s.icon} size={14} color={active || done ? '#FFF' : COLORS.textMuted} />
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─── Vibe Check Meter ───
export function VibeMeter({ text }: { text: string }) {
  const len = text.trim().length;
  const level = len < 30 ? 0 : len < 100 ? 1 : len < 250 ? 2 : 3;
  const labels = ['Too Short', 'Getting There', 'Good Length', 'Perfect! 🔥'];
  const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];
  const widths = [15, 40, 70, 100];

  return (
    <View style={styles.vibeMeter}>
      <View style={styles.vibeTrack}>
        <Animated.View style={[styles.vibeFill, { width: `${widths[level]}%`, backgroundColor: colors[level] }]} />
      </View>
      <Text style={[styles.vibeLabel, { color: colors[level] }]}>{labels[level]}</Text>
    </View>
  );
}

// ─── LEO Celebration ───
export function LeoCelebration({ visible, score, onDismiss }: { visible: boolean; score: number; onDismiss?: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.celebrationOverlay, { opacity: opacityAnim }]}>
      <Animated.View style={[styles.celebrationContent, { transform: [{ scale: scaleAnim }] }]}>
        <LeoCharacter size="xl" animation="celebrating" />
        <Text style={styles.celebrationScore}>{score}%</Text>
        <Text style={styles.celebrationTitle}>
          {score === 100 ? '💯 PERFECT!' : score >= 90 ? '🌟 Outstanding!' : '🔥 Great Job!'}
        </Text>
        <Text style={styles.celebrationSub}>Sophia is impressed!</Text>
        <TouchableOpacity style={styles.celebrationBtn} onPress={() => { triggerHaptic('light'); onDismiss?.(); }}>
          <Text style={styles.celebrationBtnText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Score Bar ───
export function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.scoreBarWrap}>
      <Text style={styles.scoreBarLabel}>{label}</Text>
      <View style={styles.scoreBarTrack}>
        <View style={[styles.scoreBarFill, { width: `${Math.min(100, value)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.scoreBarVal}>{value}</Text>
    </View>
  );
}

// ─── Mental Math Drill ───
export function MathDrill({ question: q }: { question: { question: string; options: string[]; correctIndex: number; explanation: string } }) {
  const [selected, setSelected] = React.useState<number | null>(null);
  const revealed = selected !== null;

  return (
    <View style={styles.card}>
      <Text style={[styles.cardBody, { fontWeight: '600', marginBottom: 10 }]}>{q.question}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {q.options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            disabled={revealed}
            onPress={() => { setSelected(i); triggerHaptic(i === q.correctIndex ? 'success' : 'error'); }}
            style={[
              styles.mathOption,
              revealed && i === q.correctIndex && styles.mcqOptionCorrect,
              selected === i && i !== q.correctIndex && styles.mcqOptionWrong,
            ]}
          >
            <Text style={styles.mathOptionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {revealed && <Text style={styles.explanationText}>{q.explanation}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  // Stage Tracker
  trackerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, marginBottom: 20, gap: 0 },
  trackerDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bg2, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  trackerDotActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  trackerDotDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  trackerLine: { flex: 1, height: 2, backgroundColor: COLORS.border },
  trackerLineActive: { backgroundColor: '#7C3AED' },

  // Vibe meter
  vibeMeter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vibeTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.bg1, overflow: 'hidden' },
  vibeFill: { height: '100%', borderRadius: 3 },
  vibeLabel: { ...TYPE.caption, fontSize: 10, fontWeight: '700', width: 80, textAlign: 'right' },

  // Leo celebration
  celebrationOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  celebrationContent: { alignItems: 'center', padding: 32 },
  celebrationScore: { fontSize: 56, fontWeight: '900', color: '#FDE68A', marginTop: 16 },
  celebrationTitle: { ...TYPE.h1, color: '#FFF', fontSize: 24, marginTop: 8 },
  celebrationSub: { ...TYPE.body, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  celebrationBtn: { marginTop: 24, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14, backgroundColor: '#7C3AED' },
  celebrationBtnText: { ...TYPE.bodyBold, color: '#FFF' },

  // Score Bar
  scoreBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreBarLabel: { ...TYPE.caption, color: COLORS.textMuted, width: 60, fontSize: 10 },
  scoreBarTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.bg1, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 3 },
  scoreBarVal: { ...TYPE.caption, color: COLORS.textMuted, width: 24, textAlign: 'right', fontSize: 10 },

  // Card (shared)
  card: { backgroundColor: COLORS.bg2, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardBody: { ...TYPE.body, color: COLORS.textSecondary, lineHeight: 22 },

  // Math
  mathOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, minWidth: '40%' },
  mathOptionText: { ...TYPE.bodyBold, color: COLORS.textPrimary, textAlign: 'center' },
  mcqOptionCorrect: { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.06)' },
  mcqOptionWrong: { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.06)' },
  explanationText: { ...TYPE.body, color: COLORS.textSecondary, fontSize: 13, marginTop: 8 },
});
