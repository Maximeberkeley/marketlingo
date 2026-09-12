/**
 * LeagueCeremonyModal — the Sunday promotion ceremony.
 *
 * Shown once per finished week: the badge rises, the result lands, and the
 * learner is told exactly what happens next week.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../lib/constants';
import { triggerCelebration, triggerHaptic } from '../../lib/haptics';
import { playSound } from '../../lib/sounds';
import { LeagueResult, LeagueTier, LEAGUE_TIERS, TIER_META } from '../../hooks/useLeague';

interface Props {
  visible: boolean;
  tier: LeagueTier;
  result: LeagueResult;
  finalRank: number | null;
  onClose: () => void;
  onViewLeague: () => void;
}

function nextTier(tier: LeagueTier, direction: number): LeagueTier {
  const i = LEAGUE_TIERS.indexOf(tier);
  const j = Math.max(0, Math.min(LEAGUE_TIERS.length - 1, i + direction));
  return LEAGUE_TIERS[j];
}

export function LeagueCeremonyModal({ visible, tier, result, finalRank, onClose, onViewLeague }: Props) {
  const rise = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const destination =
    result === 'promoted' ? nextTier(tier, 1) : result === 'demoted' ? nextTier(tier, -1) : tier;
  const meta = TIER_META[destination];

  useEffect(() => {
    if (!visible) {
      rise.setValue(0);
      return;
    }
    Animated.sequence([
      Animated.timing(rise, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();

    if (result === 'promoted') {
      triggerCelebration();
      playSound('levelUp');
    } else if (result === 'demoted') {
      triggerHaptic('medium');
    } else {
      triggerHaptic('light');
      playSound('unlock');
    }
  }, [visible, result]);

  const headline =
    result === 'promoted' ? 'Promoted' : result === 'demoted' ? 'Relegated' : 'Position held';
  const subline =
    result === 'promoted'
      ? `You finished ${finalRank ? `#${finalRank}` : 'in the top group'} and move up to ${meta.label}.`
      : result === 'demoted'
      ? `A quiet week drops you to ${meta.label}. One good week takes it straight back.`
      : `You finished ${finalRank ? `#${finalRank}` : 'mid-table'} and stay in ${meta.label}.`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>WEEK CLOSED</Text>

          <Animated.View
            style={[
              styles.badgeWrap,
              {
                backgroundColor: meta.color + '18',
                borderColor: meta.color + '55',
                opacity: rise,
                transform: [
                  { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                  { scale: rise.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
                ],
              },
            ]}
          >
            <Animated.View style={{ opacity: glow }}>
              <Feather
                name={result === 'demoted' ? 'arrow-down-circle' : result === 'promoted' ? 'award' : 'shield'}
                size={56}
                color={meta.color}
              />
            </Animated.View>
            <Text style={[styles.tierLabel, { color: meta.color }]}>{meta.label.toUpperCase()}</Text>
          </Animated.View>

          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.subline}>{subline}</Text>
          <Text style={styles.blurb}>{meta.blurb}</Text>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: meta.color }]}
            onPress={() => {
              triggerHaptic('medium');
              onViewLeague();
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>See this week's table</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
            <Text style={styles.secondaryBtnText}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: COLORS.bg2, borderRadius: 24, padding: 24, alignItems: 'center', ...SHADOWS.md },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: COLORS.textMuted, marginBottom: 16 },
  badgeWrap: { width: 150, height: 150, borderRadius: 75, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 6 },
  tierLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },
  headline: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  subline: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 6 },
  blurb: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginBottom: 22 },
  primaryBtn: { alignSelf: 'stretch', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { paddingVertical: 12 },
  secondaryBtnText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
});
