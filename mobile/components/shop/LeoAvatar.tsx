import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS } from '../../lib/constants';
import { LEO_BASE, SHOP_ART } from '../../lib/shopArt';
import { Look, avatarLayers } from '../../lib/shopEconomy';
import { SocialAvatar } from '../social/SocialAvatar';

const hasArt = (id: string) => id in SHOP_ART;

/**
 * Leo as a profile picture: the base bust with the learner's layers stacked in slot order, cropped to a circle.
 * `look` undefined means we do not know this person's look (not a friend, or the shop is not live): with a
 * `name`, the letter avatar shows instead. The crown holder wears the crown over their hat while they hold it.
 */
export function LeoAvatar({ look, size = 44, crown = false, ring, ringWidth = 0, bg, name, dim = false, style, crop = true }: {
  look: Look | null | undefined;
  size?: number;
  crown?: boolean;
  ring?: string;
  ringWidth?: number;
  bg?: string;
  name?: string;
  dim?: boolean;
  style?: ViewStyle;
  /** false: Leo standing free (no circle), for shop scenes where he breaks out of the card. */
  crop?: boolean;
}) {
  if (look === undefined && name !== undefined) {
    return <SocialAvatar name={name} size={size} ring={ring} ringWidth={ringWidth || 2.5} dim={dim} />;
  }
  const layers = avatarLayers(look ?? {}, { crown, hasArt });
  if (!crop) {
    return (
      <View style={[{ width: size, height: size, opacity: dim ? 0.55 : 1 }, style]} accessibilityRole="image" accessibilityLabel={name ? `${name}'s Leo` : 'Leo'}>
        {layers.map(key => (
          <Image key={key} source={key === 'base' ? LEO_BASE : SHOP_ART[key]} style={{ position: 'absolute', width: size, height: size }} resizeMode="contain" />
        ))}
      </View>
    );
  }
  const inner = size - ringWidth * 2;
  return (
    <View
      style={[{ width: size, height: size, borderRadius: size / 2, borderWidth: ringWidth, borderColor: ring ?? 'transparent', opacity: dim ? 0.55 : 1 }, style]}
      accessibilityRole="image"
      accessibilityLabel={name ? `${name}'s Leo` : 'Leo'}
    >
      <View style={[styles.disc, { width: inner, height: inner, borderRadius: inner / 2, backgroundColor: bg ?? COLORS.xpBadgeSurface }]}>
        {layers.map(key => (
          <Image key={key} source={key === 'base' ? LEO_BASE : SHOP_ART[key]} style={{ position: 'absolute', width: inner, height: inner }} resizeMode="contain" />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { overflow: 'hidden' },
});
