import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { milestoneProgress } from '../../lib/shopEconomy';
import { useShop } from '../../hooks/useShop';
import { ChunkyButton } from '../social/ChunkyButton';
import { Flask } from './ShopKit';

const fmt = (n: number) => n.toLocaleString('en-US');
const short = (n: number) => (n >= 1000 ? `${n / 1000}K` : String(n));

/**
 * What the Home XP pill opens: XP to spend, XP earned ever (which spending never lowers, so friend races and
 * milestones are safe), the next milestone, and the way into the Shop.
 */
export function XPSheet({ visible, onClose, inShop = false }: { visible: boolean; onClose: () => void; inShop?: boolean }) {
  const insets = useSafeAreaInsets();
  const { balance } = useShop();
  const m = milestoneProgress(balance.earned);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.grip} />
        <Text style={styles.kicker}>XP TO SPEND</Text>
        <View style={styles.big}>
          <Flask size={30} />
          <Text style={styles.bigText}>{fmt(balance.balance)}</Text>
        </View>
        <Text style={styles.note}>Spending never lowers your friend ranking.</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>XP earned ever</Text>
            <Text style={styles.value}>{fmt(balance.earned)}</Text>
          </View>
          {m.next !== null ? (
            <>
              <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(3, m.progress * 100)}%` }]} /></View>
              <Text style={styles.toGo}>{fmt(m.toGo)} to {fmt(m.next)}</Text>
            </>
          ) : (
            <Text style={styles.toGo}>Every milestone reached.</Text>
          )}
          {m.reached.length > 0 && (
            <View style={styles.reached}>
              {m.reached.map(r => (
                <View key={r} style={styles.badge}>
                  <Feather name="check" size={12} color={COLORS.success} />
                  <Text style={styles.badgeText}>{short(r)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <ChunkyButton
          label={inShop ? 'Got it' : 'Open the Shop'}
          onPress={() => { onClose(); if (!inShop) router.push('/(tabs)/shop' as any); }}
          height={50}
          style={{ marginTop: 18 }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(10, 10, 20, 0.45)' },
  sheet: { backgroundColor: COLORS.bg0, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10 },
  grip: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.border, marginBottom: 16 },
  kicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1, color: COLORS.textMuted, textAlign: 'center' },
  big: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 },
  bigText: { fontSize: 40, fontWeight: '900', color: COLORS.xpBadgeText, letterSpacing: -0.5 },
  note: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },
  card: { marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  value: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary },
  track: { height: 10, borderRadius: 5, backgroundColor: COLORS.border, marginTop: 14, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  toGo: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginTop: 8 },
  reached: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, height: 26, borderRadius: 13, backgroundColor: COLORS.successSoft },
  badgeText: { fontSize: 12, fontWeight: '800', color: COLORS.textPrimary },
});
