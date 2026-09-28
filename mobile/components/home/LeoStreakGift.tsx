import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Animated, Easing, Image } from 'react-native';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptics';
import { supabase } from '../../lib/supabase';
import { localDateString } from '../../lib/dayMath';

const SAD_LEO = require('../../assets/mascot/leo-rain.png');
const HAPPY_LEO = require('../../assets/mascot/leo-celebrating.png');

interface Props {
  marketId?: string | null;
  userId?: string | null;
  blocked?: boolean;
  onRestored?: (streak: number) => void;
}

/**
 * Once a week, when a learner misses a single day, Leo "finds" the lost
 * streak and hands it back. Backed by the leo_streak_gift RPC (one per week).
 */
export function LeoStreakGift({ marketId, userId, blocked, onRestored }: Props) {
  const [lost, setLost] = useState(0);
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<'found' | 'returned'>('found');
  const [restored, setRestored] = useState(0);
  const [busy, setBusy] = useState(false);
  const bob = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!marketId || !userId) return;
    let alive = true;
    (supabase.rpc as any)('leo_streak_gift', { p_market_id: marketId, p_today: localDateString(), p_claim: false })
      .then(({ data }: any) => {
        if (!alive || !data?.eligible) return;
        setLost(data.lost_streak || 1);
        setVisible(true);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [marketId, userId]);

  useEffect(() => {
    if (!visible) return;
    Animated.spring(pop, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [visible, phase]);

  const claim = useCallback(async () => {
    if (!marketId || busy) return;
    setBusy(true);
    try {
      const { data } = await (supabase.rpc as any)('leo_streak_gift', { p_market_id: marketId, p_today: localDateString(), p_claim: true });
      if (data?.claimed) {
        triggerHaptic('success');
        setRestored(data.streak || lost + 1);
        pop.setValue(0.85);
        setPhase('returned');
        onRestored?.(data.streak || lost);
      } else {
        setVisible(false);
      }
    } finally {
      setBusy(false);
    }
  }, [marketId, busy, lost, onRestored]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const found = phase === 'found';

  return (
    <Modal visible={visible && !blocked} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale: pop }] }]}>
          <Text style={styles.eyebrow}>{found ? 'LEO FOUND SOMETHING' : 'STREAK RETURNED'}</Text>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Image source={found ? SAD_LEO : HAPPY_LEO} style={styles.leo} resizeMode="contain" />
          </Animated.View>
          {found ? (
            <>
              <Text style={styles.title}>Your {lost}-day streak was out in the rain</Text>
              <Text style={styles.body}>
                I found it sitting alone by the door yesterday. Lonely. A little soggy. It clearly missed you.
                I kept it warm for you — want it back?
              </Text>
              <TouchableOpacity style={styles.cta} onPress={claim} disabled={busy} accessibilityRole="button">
                <Text style={styles.ctaText}>{busy ? 'One moment…' : 'Take my streak back'}</Text>
              </TouchableOpacity>
              <Text style={styles.note}>Leo can do this once a week.</Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>{restored} days. Safe and sound.</Text>
              <Text style={styles.body}>
                There. Good as new. Now do me a favour — finish today's lesson so it never has to wait outside again.
              </Text>
              <TouchableOpacity style={styles.cta} onPress={() => setVisible(false)} accessibilityRole="button">
                <Text style={styles.ctaText}>Deal, Leo</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 360, borderRadius: 28, padding: 24, alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, ...(SHADOWS as any).lg,
  },
  eyebrow: { ...(TYPE as any).caption, color: COLORS.accent, fontWeight: '800', letterSpacing: 1.4, fontSize: 12 },
  leo: { width: 176, height: 176, marginVertical: 8 },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  body: { color: COLORS.textSecondary, fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 20 },
  cta: { alignSelf: 'stretch', backgroundColor: COLORS.accent, borderRadius: 18, paddingVertical: 15, alignItems: 'center', ...(SHADOWS as any).md },
  ctaText: { color: COLORS.textOnAccent, fontSize: 17, fontWeight: '800' },
  note: { color: COLORS.textMuted, fontSize: 13, marginTop: 12 },
});
