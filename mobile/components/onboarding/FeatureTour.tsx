import React, { useMemo, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { getMarketName } from '../../lib/markets';
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
  { icon: 'user' as const, title: 'You shows the receipts', body: 'Track XP, streaks, achievements, and every industry card you collect.' },
];

export function FeatureTour({ visible, marketId, goal = 'curiosity', onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const promise = PROMISES[goal || 'curiosity'];
  const pages = useMemo(() => [
    { icon: 'target' as const, title: promise.title, body: `${promise.body} Your track is built around ${getMarketName(marketId || 'aerospace')}.` },
    ...TOUR,
  ], [marketId, promise]);
  const page = pages[index];
  const last = index === pages.length - 1;

  const finish = () => {
    setIndex(0);
    onComplete();
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={finish}>
      <View style={styles.root}>
        <View style={styles.topRow}>
          <Text style={styles.counter}>{index + 1} / {pages.length}</Text>
          <TouchableOpacity onPress={finish} style={styles.skip}><Text style={styles.skipText}>Skip</Text></TouchableOpacity>
        </View>

        <View style={styles.visual}>
          <View style={styles.iconWrap}><Feather name={page.icon} size={42} color={COLORS.accent} /></View>
          <Image source={require('../../assets/mascot/leo-reference.png')} style={styles.leo} />
        </View>
        <Text style={styles.eyebrow}>{index === 0 ? 'YOUR LEARNING PROMISE' : 'MARKETLINGO IN 3 MINUTES'}</Text>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.body}>{page.body}</Text>

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
  root: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 34 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { color: COLORS.textMuted, fontWeight: '800', fontSize: 12 },
  skip: { paddingHorizontal: 8, paddingVertical: 8 },
  skipText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
  visual: { height: 270, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 106, height: 106, borderRadius: 28, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  leo: { position: 'absolute', width: 88, height: 88, resizeMode: 'contain', right: 20, bottom: 28 },
  eyebrow: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.1, fontWeight: '900', textAlign: 'center' },
  title: { color: COLORS.textPrimary, fontSize: 29, lineHeight: 34, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  body: { color: COLORS.textSecondary, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 12 },
  dots: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 6, paddingBottom: 22 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { width: 22, backgroundColor: COLORS.accent },
  button: { height: 56, borderRadius: 16, backgroundColor: COLORS.accent, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 },
  buttonText: { color: COLORS.bg0, fontSize: 17, fontWeight: '900' },
});