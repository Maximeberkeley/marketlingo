/**
 * The top three as a podium of Leos: each person's own Leo bust stands on their block (second, first, third),
 * first in the middle, larger and higher with a soft gold glow and twinkles, wearing the monthly crown while
 * they hold it. The Leos pop in one after another; with reduced motion they are simply there.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Look } from '../../lib/shopEconomy';
import { LeoAvatar } from '../shop/LeoAvatar';
import { Pop } from '../shop/Motion';
import { FloorShadow, Sunburst, Twinkles } from '../shop/Scene';

export interface PodiumPerson { id: string; name: string; xp: number; look: Look; crown: boolean; isMe: boolean }

const MEDALS = [
  { bg: '#FEF3C7', ring: '#F59E0B', text: '#B45309' },
  { bg: '#EEF2F7', ring: '#9CA3AF', text: '#4B5563' },
  { bg: '#FFEDD5', ring: '#FB923C', text: '#C2410C' },
];
const BLOCK = [92, 74, 64];
const LEO = [108, 88, 84];
// Bust art leaves ~4.5% empty canvas under the flat chest edge; sink Leo by that so he stands on the block.
const SINK = 0.045;

export function LeoPodium({ people }: { people: PodiumPerson[] }) {
  if (people.length < 3) return null;
  return (
    <View style={styles.podium} accessibilityRole="summary" accessibilityLabel={`Top three: ${people.slice(0, 3).map((p, i) => `${i + 1}, ${p.name}, ${p.xp} XP`).join('; ')}`}>
      {[1, 0, 2].map(i => {
        const p = people[i];
        const m = MEDALS[i];
        const leo = LEO[i];
        return (
          <View key={p.id} style={styles.col}>
            <View style={{ width: leo + 24, height: leo }}>
              {i === 0 && (
                <>
                  <Sunburst size={180} cx={(leo + 24) / 2} cy={leo * 0.55} color="#FCD34D" opacity={0.4} rays={14} />
                  <Twinkles w={leo + 24} h={leo} color="#F59E0B" points={[[0.04, 0.22, 12], [0.97, 0.14, 14], [0.95, 0.72, 9]]} />
                </>
              )}
              <FloorShadow width={leo * 0.74} cx={(leo + 24) / 2} y={leo} dark={0.3} />
              <Pop delay={[220, 80, 340][i]} style={{ position: 'absolute', left: 12, bottom: -leo * SINK }}>
                <LeoAvatar look={p.look} crown={p.crown} size={leo} crop={false} name={p.name} />
              </Pop>
            </View>
            <View style={[styles.block, { height: BLOCK[i], backgroundColor: m.bg, borderColor: m.ring + '66' }]}>
              <Text maxFontSizeMultiplier={1.2} style={[styles.rank, { color: m.text }]}>{i + 1}</Text>
              <Text maxFontSizeMultiplier={1.2} style={[styles.name, { color: p.isMe ? '#6D28D9' : '#1F2937' }]} numberOfLines={1}>{p.isMe ? 'You' : p.name}</Text>
              <Text maxFontSizeMultiplier={1.2} style={[styles.xp, { color: m.text }]}>{p.xp.toLocaleString()} XP</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 14, marginTop: 6 },
  col: { flex: 1, alignItems: 'center' },
  block: { width: '100%', borderRadius: 16, borderWidth: 1.5, borderBottomWidth: 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  rank: { fontSize: 20, fontWeight: '900' },
  // Medal blocks stay pale in both themes, so their text stays dark.
  name: { fontSize: 12.5, fontWeight: '800', maxWidth: '100%' },
  xp: { fontSize: 11, fontWeight: '800', marginTop: 1 },
});
