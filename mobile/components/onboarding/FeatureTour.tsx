import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { getMarketName } from '../../lib/markets';
import { LeoAnimated } from '../mascot/LeoAnimated';
import type { LeoClip } from '../mascot/leoClips';
import type { LearningGoal } from '../../app/onboarding/goal';

interface Props {
  visible: boolean;
  marketId?: string | null;
  goal?: LearningGoal | null;
  onComplete: () => void;
}

const PROMISES: Record<LearningGoal, { title: string; body: string }> = {
  join_industry: { title: 'Become interview-ready', body: 'You’ll learn the players, language, economics, and decisions insiders expect you to know.' },
  invest: { title: 'Build an investor’s lens', body: 'You’ll learn valuation, market signals, risk, and how to defend an industry thesis.' },
  build_startup: { title: 'Find the opening', body: 'You’ll learn customer pain, business models, moats, regulation, and where new companies can win.' },
  curiosity: { title: 'See the whole industry', body: 'You’ll learn the breakthroughs, people, numbers, and forces shaping what happens next.' },
};

const TOUR = [
  { icon: 'home' as const, title: 'Home is today’s mission', body: 'One focused lesson keeps your streak alive and moves your market journey forward.' },
  { icon: 'map' as const, title: 'Courses build the map', body: 'Follow 180 days in order, or revisit any unlocked topic when you need it.' },
  { icon: 'zap' as const, title: 'Practice builds instinct', body: 'Arena tests speed. Deep cases, Interview Lab, and Investment Lab test judgment.' },
  { icon: 'edit-3' as const, title: 'Notes keep your edge', body: 'Save any insight mid-lesson and turn scattered facts into your own playbook.' },
  { icon: 'user' as const, title: 'Your profile shows your progress', body: 'Track XP, streaks, achievements, and every industry card you collect.' },
];

export function FeatureTour({ visible, marketId, goal = 'curiosity', onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const [index, setIndex] = useState(0);
  const [clip, setClip] = useState<LeoClip>('leo-greet');
  const playTreatShown = useRef(false);
  const promise = PROMISES[goal || 'curiosity'];
  const pages = useMemo(() => [
    { icon: 'target' as const, title: promise.title, body: `${promise.body} Your track is built around ${getMarketName(marketId || 'aerospace')}.` },
    ...TOUR,
  ], [marketId, promise]);
  const page = pages[index];
  const last = index === pages.length - 1;

  useEffect(() => {
    if (visible) {
      playTreatShown.current = false;
      setClip('leo-greet');
    }
  }, [visible]);
  useEffect(() => {
    if (visible && last) setClip('leo-ready');
  }, [visible, last]);
  useEffect(() => {
    if (visible && page.icon === 'zap' && !playTreatShown.current) {
      playTreatShown.current = true;
      setClip('leo-play');
    }
  }, [visible, page.icon]);
  const settleLeo = useCallback(() => {
    if (visible) setClip('leo-idle-loop');
  }, [visible]);

  const finish = () => {
    setIndex(0);
    onComplete();
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={finish}>
      <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.topRow}>
          <Text style={styles.counter}>{index + 1} / {pages.length}</Text>
          <TouchableOpacity onPress={finish} style={styles.skip}><Text style={styles.skipText}>Skip</Text></TouchableOpacity>
        </View>

        <View style={styles.middleContent}>
          <View style={[styles.visual, compact && styles.visualCompact]}>
            <View style={styles.leoStage}>
              <LeoAnimated clip={clip} size={200} fallback="idle" paused={!visible} onEnd={settleLeo} />
              <View style={styles.iconBadge}><Feather name={page.icon} size={24} color={COLORS.accent} /></View>
            </View>
          </View>
          <Text style={styles.eyebrow}>{index === 0 ? 'YOUR LEARNING PROMISE' : 'MARKETLINGO IN 3 MINUTES'}</Text>
          <Text style={[styles.title, compact && styles.titleCompact]}>{page.title}</Text>
          <Text style={[styles.body, compact && styles.bodyCompact]}>{page.body}</Text>
        </View>

        <View style={styles.dots}>
          {pages.map((_, dot) => <View key={dot} style={[styles.dot, dot === index && styles.dotActive]} />)}
        </View>
        <TouchableOpacity style={styles.button} onPress={() => last ? finish() : setIndex(value => value + 1)}>
          <Text style={styles.buttonText}>{last ? 'Start learning' : 'Next'}</Text>
          <Feather name={last ? 'check' : 'arrow-right'} size={18} color={COLORS.bg0} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 24 },
  middleContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { color: COLORS.textMuted, fontWeight: '800', fontSize: 12 },
  skip: { paddingHorizontal: 8, paddingVertical: 8 },
  skipText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
  visual: { height: 300, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  visualCompact: { height: 268 },
  leoStage: { width: 200, height: 200 },
  iconBadge: { position: 'absolute', width: 52, height: 52, borderRadius: 26, right: -12, top: 0, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.1, fontWeight: '900', textAlign: 'center' },
  title: { width: '100%', maxWidth: 400, color: COLORS.textPrimary, fontSize: 29, lineHeight: 34, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  titleCompact: { fontSize: 26, lineHeight: 31, marginTop: 8 },
  body: { width: '100%', maxWidth: 400, color: COLORS.textSecondary, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 12 },
  bodyCompact: { lineHeight: 22, marginTop: 10 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 6, paddingBottom: 22 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { width: 22, backgroundColor: COLORS.accent },
  button: { height: 56, borderRadius: 16, backgroundColor: COLORS.accent, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 },
  buttonText: { color: COLORS.bg0, fontSize: 17, fontWeight: '900' },
});