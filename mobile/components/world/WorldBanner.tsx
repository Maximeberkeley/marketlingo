import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getMarketWorld } from '../../data/marketWorlds';

export function WorldBanner({ marketId, day = 1, compact = false }: { marketId?: string | null; day?: number; compact?: boolean }) {
  const world = getMarketWorld(marketId);
  return (
    <LinearGradient colors={[world.colors[0], world.colors[1]]} style={[styles.wrap, compact && styles.compact]}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{world.progressTitle.toUpperCase()} · DAY {day}</Text>
        <Text style={styles.title}>{world.worldName}</Text>
        <Text style={styles.subtitle}>Leo · {world.leoRole}</Text>
      </View>
      <Image source={world.illustration} style={styles.image} resizeMode="contain" />
      <View style={[styles.signal, { backgroundColor: world.colors[2] }]} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { minHeight: 148, borderRadius: 16, overflow: 'hidden', padding: 18, flexDirection: 'row', alignItems: 'center' },
  compact: { minHeight: 112 }, copy: { flex: 1, zIndex: 2 },
  eyebrow: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.72)' },
  title: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginTop: 4 },
  subtitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.82)', marginTop: 5 },
  image: { width: 118, height: 108 },
  signal: { position: 'absolute', width: 110, height: 5, bottom: 0, left: 18, borderRadius: 4 },
});
