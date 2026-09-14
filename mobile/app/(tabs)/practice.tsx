import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { triggerHaptic } from '../../lib/haptics';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { getMarketName } from '../../lib/markets';
import { useSelectedMarket } from '../../hooks/useSelectedMarket';
import { usePracticeRewards } from '../../hooks/usePracticeRewards';
import { getMarketWorld } from '../../data/marketWorlds';
import { ARENA_RANKS, rankForScore } from '../../lesson-kit/arena/buildArena';

const SECONDARY_LINKS: {
  label: string;
  sub: string;
  icon: keyof typeof Feather.glyphMap;
  path: string;
}[] = [
  { label: 'Insider Collection', sub: 'Cards you have earned', icon: 'layers', path: '/collection' },
  { label: 'Summaries', sub: 'Weekly and monthly recaps', icon: 'file-text', path: '/summaries' },
  { label: 'Passport', sub: 'Your industry credentials', icon: 'globe', path: '/passport' },
  { label: 'Regulatory Hub', sub: 'Rules shaping your market', icon: 'shield', path: '/regulatory-hub' },
];

function useEntrance(delay: number) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 480,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);
  return {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  };
}

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { marketId } = useSelectedMarket();
  const world = getMarketWorld(marketId);
  const { rewards, playedArenaToday, playedCaseToday, refresh } = usePracticeRewards();

  // Rewards are written on the run screens — refresh whenever we come back.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const rank = rankForScore(rewards.arenaBestScore);
  const nextRank = [...ARENA_RANKS].reverse().find(r => r.min > rewards.arenaBestScore);
  const toNext = nextRank ? Math.max(0, nextRank.min - rewards.arenaBestScore) : 0;
  const lastGrade = rewards.caseGrades[0];

  const heroAnim = useEntrance(0);
  const arenaAnim = useEntrance(90);
  const caseAnim = useEntrance(180);
  const extrasAnim = useEntrance(270);

  const go = (path: string) => {
    triggerHaptic('light');
    router.push(path as any);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header + reward ledger */}
      <Animated.View style={[styles.headerWrap, heroAnim]}>
        <Text style={styles.title}>Practice</Text>
        <Text style={styles.subtitle}>
          Two ways to train {getMarketName(marketId)} — one fast, one deep.
        </Text>

        <View style={styles.ledger}>
          <LedgerStat icon="award" label={rank.label} value={`${rewards.arenaBestScore}`} tint={rank.color} />
          <View style={styles.ledgerDivider} />
          <LedgerStat
            icon="activity"
            label="Practice streak"
            value={`${rewards.practiceStreak}d`}
            tint={COLORS.streak}
          />
          <View style={styles.ledgerDivider} />
          <LedgerStat
            icon="briefcase"
            label="Cases closed"
            value={`${rewards.caseRuns}`}
            tint={COLORS.accent}
          />
        </View>
        {!!nextRank && (
          <Text style={styles.ledgerHint}>
            {toNext} more arena points to reach {nextRank.label}.
          </Text>
        )}
      </Animated.View>

      {/* ── Daily Arena ── */}
      <Animated.View style={arenaAnim}>
        <TouchableOpacity activeOpacity={0.92} onPress={() => go('/arena')} style={styles.modeCard}>
          <LinearGradient
            colors={[world.colors[0], world.colors[1], world.colors[2]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modeGradient}
          >
            <Image source={world.illustration} style={styles.modeArt} resizeMode="contain" />
            <View style={styles.modeTop}>
              <View style={styles.modeTag}>
                <Feather name="zap" size={11} color="#FFFFFF" />
                <Text style={styles.modeTagText}>DAILY ARENA</Text>
              </View>
              {playedArenaToday ? (
                <View style={styles.donePill}>
                  <Feather name="check" size={10} color="#FFFFFF" />
                  <Text style={styles.donePillText}>PLAYED TODAY</Text>
                </View>
              ) : (
                <View style={styles.livePill}>
                  <Text style={styles.livePillText}>OPEN NOW</Text>
                </View>
              )}
            </View>

            <Text style={styles.modeTitle}>Three waves. One clock.</Text>
            <Text style={styles.modeBody}>
              Fast calls on real {getMarketName(marketId)} numbers. Combos multiply, shields absorb
              misses, sudden death ends it.
            </Text>

            <View style={styles.chipRow}>
              <Chip icon="clock" text="~4 min" />
              <Chip icon="shield" text="2 shields" />
              <Chip icon="star" text="Up to x3 points" />
            </View>

            <View style={styles.modeCta}>
              <Text style={styles.modeCtaText}>
                {playedArenaToday ? 'Beat your best run' : 'Enter the arena'}
              </Text>
              <Feather name="arrow-right" size={17} color={world.colors[0]} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Deep Case ── */}
      <Animated.View style={caseAnim}>
        <TouchableOpacity activeOpacity={0.92} onPress={() => go('/deep-case')} style={styles.modeCard}>
          <LinearGradient
            colors={['#111827', '#1F2937', '#312E81']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modeGradient}
          >
            <View style={styles.modeTop}>
              <View style={styles.modeTag}>
                <Feather name="briefcase" size={11} color="#FFFFFF" />
                <Text style={styles.modeTagText}>DEEP CASE</Text>
              </View>
              {lastGrade ? (
                <View style={styles.gradePill}>
                  <Text style={styles.gradePillText}>LAST GRADE {lastGrade}</Text>
                </View>
              ) : (
                <View style={styles.livePill}>
                  <Text style={styles.livePillText}>NEW</Text>
                </View>
              )}
            </View>

            <Text style={styles.modeTitle}>Four stages. One verdict.</Text>
            <Text style={styles.modeBody}>
              Brief, evidence, numbers, then the call — with a conviction level. Leo grades your
              reasoning, not just your answer.
            </Text>

            <View style={styles.chipRow}>
              <Chip icon="layers" text="4 stages" />
              <Chip icon="target" text="Graded A–D" />
              <Chip icon="compass" text="Mental models" />
            </View>

            <View style={styles.modeCta}>
              <Text style={[styles.modeCtaText, { color: '#111827' }]}>
                {playedCaseToday ? 'Take another case' : 'Open today’s case'}
              </Text>
              <Feather name="arrow-right" size={17} color="#111827" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Secondary shelves ── */}
      <Animated.View style={[styles.extras, extrasAnim]}>
        <Text style={styles.extrasLabel}>YOUR RECORD</Text>
        {SECONDARY_LINKS.map(link => (
          <TouchableOpacity
            key={link.path}
            style={styles.linkRow}
            activeOpacity={0.85}
            onPress={() => go(link.path)}
          >
            <View style={styles.linkIcon}>
              <Feather name={link.icon} size={16} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Text style={styles.linkSub}>{link.sub}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </Animated.View>
    </ScrollView>
  );
}

function Chip({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.chip}>
      <Feather name={icon} size={11} color="#FFFFFF" />
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

function LedgerStat({
  icon,
  label,
  value,
  tint,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <View style={styles.ledgerStat}>
      <Feather name={icon} size={14} color={tint} />
      <Text style={styles.ledgerValue}>{value}</Text>
      <Text style={styles.ledgerLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },

  headerWrap: { paddingHorizontal: 20, marginBottom: 18 },
  title: { ...TYPE.hero, color: COLORS.textPrimary },
  subtitle: { ...TYPE.body, color: COLORS.textMuted, marginTop: 2 },

  ledger: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: COLORS.bg1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ledgerStat: { flex: 1, alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  ledgerDivider: { width: 1, height: 34, backgroundColor: COLORS.border },
  ledgerValue: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  ledgerLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.4 },
  ledgerHint: { fontSize: 11, color: COLORS.textMuted, marginTop: 8, textAlign: 'center' },

  modeCard: { marginHorizontal: 20, marginBottom: 18, borderRadius: 28, overflow: 'hidden', ...SHADOWS.lg },
  modeGradient: { padding: 22, gap: 10, overflow: 'hidden' },
  modeArt: {
    position: 'absolute',
    right: -22,
    bottom: -18,
    width: 170,
    height: 170,
    opacity: 0.22,
  },
  modeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  modeTagText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1.1 },
  livePill: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  livePillText: { fontSize: 9, fontWeight: '900', color: '#111827', letterSpacing: 0.8 },
  donePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.85)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  donePillText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.6 },
  gradePill: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  gradePillText: { fontSize: 9, fontWeight: '900', color: '#111827', letterSpacing: 0.8 },

  modeTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginTop: 6 },
  modeBody: { fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.88)', maxWidth: '92%' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  chipText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  modeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 15,
  },
  modeCtaText: { fontSize: 15, fontWeight: '800', color: '#111827' },

  extras: { paddingHorizontal: 20, marginTop: 4 },
  extrasLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  linkIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentSoft,
  },
  linkLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  linkSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
});
