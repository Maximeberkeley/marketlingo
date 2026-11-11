import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { isDark } from '../../lib/theme';
import { SHOP_ART, SHOP_ICONS } from '../../lib/shopArt';
import { Cosmetic, RARITY_COLOR, Slot } from '../../lib/shopCatalog';
import { LeoAvatar } from './LeoAvatar';

export const SLOT_ICON: Record<Slot, keyof typeof MaterialCommunityIcons.glyphMap> = {
  hat: 'hat-fedora',
  glasses: 'glasses',
  outfit: 'tshirt-crew-outline',
  cape: 'shield-outline',
  held: 'hand-back-left-outline',
  background: 'image-outline',
  frame: 'circle-outline',
};

/** A glossy shop icon from the art pack, or nothing if it is not drawn yet. */
export function ShopIcon({ id, size }: { id: string; size: number }) {
  const src = SHOP_ICONS[id];
  return src ? <Image source={src} style={{ width: size, height: size }} resizeMode="contain" /> : null;
}

/**
 * An item on a tile: Leo wearing it when its art exists, otherwise a soft placeholder in the item's slot shape and
 * rarity colour with a small "Art soon" tag (final art comes from the ChatGPT pack).
 */
export function ItemArt({ item, size, tint, style, showTag = true }: { item: Cosmetic; size: number; tint?: string; style?: ViewStyle; showTag?: boolean }) {
  const color = RARITY_COLOR[item.rarity];
  if (item.id in SHOP_ART) {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <LeoAvatar look={{ [item.slot]: item.id }} size={size} bg={tint ?? 'transparent'} />
      </View>
    );
  }
  return (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: size * 0.22, backgroundColor: color + (isDark ? '22' : '14') }, style]}>
      <MaterialCommunityIcons name={SLOT_ICON[item.slot]} size={Math.round(size * 0.42)} color={color + (isDark ? 'AA' : '88')} />
      {showTag && size >= 64 && (
        <View style={styles.tag}><Text maxFontSizeMultiplier={1.3} style={styles.tagText}>Art soon</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  tag: { position: 'absolute', bottom: 6, paddingHorizontal: 7, height: 18, borderRadius: 9, backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  tagText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.3, color: COLORS.textMuted },
});
