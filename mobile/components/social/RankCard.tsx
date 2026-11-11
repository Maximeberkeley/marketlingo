/**
 * Your place on a market's monthly standings, as a card in the shop's language: a purple gradient with soft rays,
 * your own Leo, a big rank, and a race strip to the next person up (their Leo at the far end). Every gap is XP
 * EARNED this month: XP can be spent in the Shop, so the strip says "to pass", never "costs". At #1 it shows
 * your lead over #2 with a crown glint. The bar fills on appear; reduced motion shows it filled.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { isDark } from '../../lib/theme';
import type { Look } from '../../lib/shopEconomy';
import { raceLine } from '../../lib/rankRace';
import { LeoAvatar } from '../shop/LeoAvatar';
import { Twinkle, useReduceMotion } from '../shop/Motion';
import { FloorShadow, Sparkle, Sunburst, Twinkles } from '../shop/Scene';

export interface RankPerson { name: string; xp: number; look: Look; crown?: boolean }

export function RankCard({ rank, total, market, me, next, second }: {
  rank: number | null; total: number; market: string;
  me: RankPerson | null; next: RankPerson | null; second: RankPerson | null;
}) {
  const reduce = useReduceMotion();
  const race = raceLine(rank, me, next, second);
  const bar = useRef(new Animated.Value(reduce ? race.fill : 0)).current;
  useEffect(() => {
    if (reduce) { bar.setValue(race.fill); return; }
    Animated.timing(bar, { toValue: race.fill, duration: 900, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [reduce, race.fill, bar]);
  const top = rank === 1;
  const other = top ? second : next;

  return (
    <View style={styles.wrap} accessibilityRole="summary" accessibilityLabel={`${rank ? `Rank ${rank} of ${total}` : 'Unranked'}, ${market} this month. ${race.text}`}>
      <LinearGradient colors={isDark ? ['#2E1065', '#4C1D95', '#6D28D9'] : ['#5B21B6', '#7C3AED', '#A78BFA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <Sunburst size={300} cx={62} cy={70} color="#FFFFFF" opacity={0.22} rays={16} period={40000} />
        <Twinkles w={340} h={150} color="#FDE68A" points={[[0.5, 0.16, 12], [0.92, 0.22, 10], [0.06, 0.12, 9]]} />
        <View style={styles.top}>
          <View style={styles.leo}>
            <FloorShadow width={78} cx={48} y={94} dark={0.35} />
            <LeoAvatar look={me?.look ?? {}} crown={!!me?.crown} size={96} crop={false} name="You" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.rankRow}>
              <Text maxFontSizeMultiplier={1.2} style={styles.rank}>{rank ? `#${rank}` : '–'}</Text>
              {top && (
                <View style={styles.crownGlint}>
                  <MaterialCommunityIcons name="crown" size={26} color="#FCD34D" />
                  <Twinkle style={styles.glint} period={1400}><Sparkle size={12} color="#FFFFFF" /></Twinkle>
                </View>
              )}
            </View>
            <Text maxFontSizeMultiplier={1.2} style={styles.sub} numberOfLines={1}>{rank ? `of ${total} · ${market} this month` : `${market} this month`}</Text>
          </View>
        </View>

        <View style={styles.race}>
          <Text maxFontSizeMultiplier={1.2} style={styles.raceText} numberOfLines={1}>{race.text}</Text>
          {rank ? (
            <View style={styles.raceRow}>
              <LeoAvatar look={me?.look ?? {}} size={30} ring="#FFFFFF" ringWidth={2} bg="#EDE9FE" name="You" />
              <View style={styles.track}>
                <Animated.View style={[styles.fill, { transform: [{ scaleX: bar }] }]} />
              </View>
              {other ? <LeoAvatar look={other.look} crown={!!other.crown} size={30} ring="rgba(255,255,255,0.7)" ringWidth={2} bg="#EDE9FE" name={other.name} /> : null}
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16, marginTop: 4 },
  card: { borderRadius: 24, padding: 16, paddingTop: 10, overflow: 'hidden', borderBottomWidth: 5, borderColor: isDark ? '#1E0B47' : '#4C1D95' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  leo: { width: 96, height: 96 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rank: { fontSize: 44, lineHeight: 50, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  crownGlint: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  glint: { position: 'absolute', right: -4, top: -2 },
  sub: { fontSize: 13.5, fontWeight: '800', color: '#EDE9FE' },
  race: { marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)' },
  raceText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF', marginBottom: 8 },
  raceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 12, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.22)', overflow: 'hidden' },
  fill: { height: 12, width: '100%', borderRadius: 6, backgroundColor: '#FCD34D', transformOrigin: 'left' },
});
