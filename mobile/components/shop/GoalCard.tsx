import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { cosmetic, priceOf, RARITY_TILE } from '../../lib/shopCatalog';
import { useShop } from '../../hooks/useShop';
import { triggerHaptic } from '../../lib/haptics';
import { LeoAvatar } from './LeoAvatar';

const fmt = (n: number) => n.toLocaleString('en-US');

/**
 * The item the learner is saving for, under today's lesson on Home: Leo already wearing it, how far along they
 * are, and what today's lesson adds. Shown only once a goal is pinned on an item page.
 */
export function GoalCard() {
  const shop = useShop();
  const item = shop.goal ? cosmetic(shop.goal) : undefined;
  const price = item ? priceOf(item) : null;
  if (!shop.ready || !item || price === null || shop.owns(item.id)) return null;
  const have = shop.balance.balance;
  const ready = have >= price;
  const pct = Math.max(4, Math.min(100, (have / Math.max(1, price)) * 100));
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => { triggerHaptic('light'); router.push(`/shop-item?id=${item.id}` as any); }}
      accessibilityRole="button"
      accessibilityLabel={ready ? `Your goal, ${item.name}: you have enough XP. Open it` : `Your goal, ${item.name}: ${fmt(price - have)} XP to go`}
    >
      <View style={[styles.art, { backgroundColor: RARITY_TILE[item.rarity] }]}>
        <LeoAvatar look={{ ...shop.look, [item.slot]: item.id }} size={56} bg="transparent" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.row}>
          <Feather name="target" size={13} color={COLORS.accent} />
          <Text maxFontSizeMultiplier={1.3} style={styles.label}>Your goal</Text>
        </View>
        <Text maxFontSizeMultiplier={1.3} style={styles.name} numberOfLines={1}>{item.name}</Text>
        <View style={styles.track}><View style={[styles.fill, { width: `${pct}%` }, ready && { backgroundColor: COLORS.success }]} /></View>
        <Text maxFontSizeMultiplier={1.3} style={[styles.sub, ready && { color: COLORS.success }]} numberOfLines={1}>
          {ready ? 'You have enough. Get it now' : `${fmt(price - have)} XP to go · ${fmt(have)} / ${fmt(price)}`}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, padding: 12, borderRadius: 20, backgroundColor: COLORS.bg2, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border },
  art: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: { fontSize: 12, fontWeight: '800', color: COLORS.accent },
  name: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary, marginTop: 1 },
  track: { height: 8, borderRadius: 4, backgroundColor: COLORS.bg1, overflow: 'hidden', marginTop: 6 },
  fill: { height: 8, borderRadius: 4, backgroundColor: COLORS.accentFill },
  sub: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginTop: 4 },
});
