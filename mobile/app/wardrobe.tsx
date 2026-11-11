import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../lib/constants';
import { isDark } from '../lib/theme';
import { triggerHaptic } from '../lib/haptics';
import { COSMETICS, Cosmetic, DEFAULT_HAT, MAX_FREEZES_HELD, SLOT_LABEL, STREAK_FREEZE_ID, Slot, WARDROBE_SLOTS, priceOf } from '../lib/shopCatalog';
import { hasArt, useShop } from '../hooks/useShop';
import { LeoAvatar } from '../components/shop/LeoAvatar';
import { ItemArt, SLOT_ICON, ShopIcon } from '../components/shop/ItemArt';
import { Flask } from '../components/shop/ShopKit';

const fmt = (n: number) => n.toLocaleString('en-US');

/**
 * Dress Leo: a calm page with Leo up top, one row of six slot icons, and a grid of what fits that slot.
 * Tapping something you own wears it at once (saved live); tapping something for sale opens its try-on.
 */
export default function WardrobeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const shop = useShop();
  const [slot, setSlot] = useState<Slot>('hat');
  const tile = Math.floor((width - 40 - 20) / 3);
  const freezes = shop.owned[STREAK_FREEZE_ID]?.qty ?? 0;

  // Capes are worn behind Leo and are chosen from the outfit tab.
  const inSlot = (c: Cosmetic) => (slot === 'outfit' ? c.slot === 'outfit' || c.slot === 'cape' : c.slot === slot) && !c.hidden;
  const items = COSMETICS.filter(inSlot);
  const mine = items.filter(c => shop.owns(c.id) || (c.id === 'monthly-crown-keepsake' && shop.owns(c.id)));
  // Only drawn pieces here: the wardrobe stays calm, and the Shop shows what's coming.
  const forSale = items.filter(c => !shop.owns(c.id) && priceOf(c) !== null && hasArt(c.id));
  const wornId = (s: Slot) => {
    const v = shop.look[s];
    return v === undefined ? (s === 'hat' ? DEFAULT_HAT : '') : v;
  };
  const isWorn = (c: Cosmetic) => wornId(c.slot) === c.id;
  const emptyWorn = slot === 'outfit' ? !wornId('outfit') && !wornId('cape') : !wornId(slot);

  const wear = (c: Cosmetic) => {
    triggerHaptic('selection');
    void shop.equip(c.slot, isWorn(c) ? null : c.id);
  };
  const clear = () => {
    triggerHaptic('selection');
    if (slot === 'outfit') { void shop.equip('outfit', null); void shop.equip('cape', null); }
    else void shop.equip(slot, null);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text maxFontSizeMultiplier={1.3} style={styles.title}>Dress Leo</Text>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Text maxFontSizeMultiplier={1.3} style={styles.done}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        <View style={styles.stage}>
          <View style={styles.shadow}>
            <LeoAvatar look={shop.look} crown={shop.wearsCrown} size={208} bg={isDark ? COLORS.bg1 : '#F4F2FB'} />
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push('/shop-freeze' as any)} style={styles.freezeRow} accessibilityRole="button" accessibilityLabel={`Streak Freezes: ${freezes} of ${MAX_FREEZES_HELD}`}>
          <ShopIcon id="streak-freeze" size={30} />
          <Text maxFontSizeMultiplier={1.3} style={styles.freezeText}>Streak Freeze <Text maxFontSizeMultiplier={1.3} style={styles.freezeCount}>×{freezes}</Text></Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.freezeSub}>Hold up to {MAX_FREEZES_HELD}</Text>
          <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.tabs} accessibilityRole="tablist">
          {WARDROBE_SLOTS.map(s => {
            const on = s === slot;
            return (
              <TouchableOpacity key={s} onPress={() => setSlot(s)} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={SLOT_LABEL[s]}>
                <MaterialCommunityIcons name={SLOT_ICON[s]} size={24} color={on ? COLORS.accent : COLORS.textMuted} />
                <View style={[styles.tabDot, { backgroundColor: on ? COLORS.accent : 'transparent' }]} />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text maxFontSizeMultiplier={1.3} style={styles.gridTitle}>{SLOT_LABEL[slot]} · {mine.length} owned</Text>
        <View style={styles.grid}>
          <TouchableOpacity onPress={clear} style={[styles.tile, { width: tile, height: tile }, emptyWorn && styles.worn]} accessibilityRole="button" accessibilityLabel={`No ${SLOT_LABEL[slot].toLowerCase()}`}>
            <Feather name="slash" size={26} color={COLORS.textMuted} />
          </TouchableOpacity>
          {mine.map(c => (
            <TouchableOpacity key={c.id} onPress={() => (hasArt(c.id) ? wear(c) : router.push(`/shop-item?id=${c.id}` as any))} style={[styles.tile, { width: tile, height: tile }, isWorn(c) && styles.worn]} accessibilityRole="button" accessibilityLabel={`${c.name}${isWorn(c) ? ', wearing' : ''}`}>
              <ItemArt item={c} size={tile - 14} showTag={false} tint="transparent" />
            </TouchableOpacity>
          ))}
          {forSale.map(c => (
            <TouchableOpacity key={c.id} onPress={() => router.push(`/shop-item?id=${c.id}` as any)} style={[styles.tile, { width: tile, height: tile }]} accessibilityRole="button" accessibilityLabel={`${c.name}, ${fmt(priceOf(c)!)} XP`}>
              <ItemArt item={c} size={tile - 30} showTag={false} tint="transparent" />
              <View style={styles.price}>
                <Flask size={11} /><Text maxFontSizeMultiplier={1.3} style={styles.priceText}>{fmt(priceOf(c)!)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => router.push('/(tabs)/shop' as any)} style={styles.more} accessibilityRole="button">
          <Text maxFontSizeMultiplier={1.3} style={styles.moreText}>Get more in the Shop</Text>
          <Feather name="chevron-right" size={16} color={COLORS.accent} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 44, gap: 10 },
  title: { flex: 1, fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
  done: { fontSize: 16, fontWeight: '800', color: COLORS.accent },
  stage: { alignItems: 'center', paddingVertical: 18 },
  shadow: { borderRadius: 104, shadowColor: '#4C1D95', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  freezeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 10, paddingHorizontal: 12, height: 48, borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border, backgroundColor: COLORS.bg2 },
  freezeText: { flex: 1, fontSize: 14.5, fontWeight: '800', color: COLORS.textPrimary },
  freezeCount: { color: isDark ? '#7DD3FC' : '#0284C7' },
  freezeSub: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  tab: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, minWidth: 44 },
  tabDot: { width: 5, height: 5, borderRadius: 3, marginTop: 6 },
  gridTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary, paddingHorizontal: 20, marginTop: 16, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  tile: { borderRadius: 18, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  worn: { borderColor: COLORS.accent },
  price: { position: 'absolute', bottom: 6, flexDirection: 'row', alignItems: 'center', gap: 3 },
  priceText: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 20 },
  moreText: { fontSize: 14, fontWeight: '800', color: COLORS.accent },
});
