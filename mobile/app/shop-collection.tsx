import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../lib/constants';
import { COLLECTIONS, COSMETICS, RARITY_COLOR, RARITY_LABEL, priceOf } from '../lib/shopCatalog';
import { hasArt, useShop } from '../hooks/useShop';
import { LeoAvatar } from '../components/shop/LeoAvatar';
import { ItemArt } from '../components/shop/ItemArt';
import { Flask } from '../components/shop/ShopKit';

const fmt = (n: number) => n.toLocaleString('en-US');

/** One Leo collection: the look on Leo, then every piece with its price. */
export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const shop = useShop();
  const collection = COLLECTIONS.find(c => c.id === id) ?? COLLECTIONS[0];
  const items = COSMETICS.filter(c => c.collection === collection.id && !c.hidden).sort((a, b) => Number(hasArt(b.id)) - Number(hasArt(a.id)));
  const look = Object.fromEntries(items.filter(c => hasArt(c.id)).map(c => [c.slot, c.id]));
  const tile = Math.floor((width - 40 - 12) / 2);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={collection.tint} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
            <Feather name="x" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <LeoAvatar look={look} size={190} bg="rgba(255,255,255,0.22)" />
          <Text maxFontSizeMultiplier={1.3} style={styles.name}>{collection.name}</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.hook}>{collection.hook}</Text>
        </LinearGradient>
        <View style={styles.grid}>
          {items.map(c => {
            const owned = shop.owns(c.id);
            const price = priceOf(c);
            return (
              <TouchableOpacity key={c.id} onPress={() => router.push(`/shop-item?id=${c.id}` as any)} style={[styles.tile, { width: tile }]} accessibilityRole="button">
                <View style={[styles.art, { backgroundColor: RARITY_COLOR[c.rarity] + '14' }]}><ItemArt item={c} size={tile - 40} tint="transparent" /></View>
                <Text maxFontSizeMultiplier={1.3} style={styles.itemName} numberOfLines={1}>{c.name}</Text>
                <Text maxFontSizeMultiplier={1.3} style={[styles.rarity, { color: RARITY_COLOR[c.rarity] }]}>{RARITY_LABEL[c.rarity].toUpperCase()}</Text>
                <View style={styles.priceRow}>
                  {owned ? <Text maxFontSizeMultiplier={1.3} style={[styles.priceText, { color: COLORS.success }]}>Owned</Text>
                    : price !== null ? <><Flask size={13} /><Text maxFontSizeMultiplier={1.3} style={styles.priceText}>{fmt(price)}</Text></>
                    : <Text maxFontSizeMultiplier={1.3} style={styles.priceText}>Earn it</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  hero: { alignItems: 'center', paddingBottom: 22 },
  close: { alignSelf: 'flex-start', marginLeft: 16, marginBottom: 6, width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.16)', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginTop: 12 },
  hook: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 20 },
  tile: { padding: 10, borderRadius: 18, backgroundColor: COLORS.bg2, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border },
  art: { borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  itemName: { fontSize: 14.5, fontWeight: '800', color: COLORS.textPrimary, marginTop: 8 },
  rarity: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginTop: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  priceText: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary },
});
