/**
 * A small podium medal (gold, silver or bronze) cut from its held-slot art, with a twinkle, that taps through to
 * the medal's quest in the Shop. The art is a full 1024 Leo canvas with the medal on the chest, so this shows only
 * the medal's box.
 */
import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { SHOP_ART } from '../../lib/shopArt';
import { triggerHaptic } from '../../lib/haptics';
import { Twinkle } from './Motion';
import { Sparkle } from './Scene';

// Where the medal sits on the 1024 canvas (measured from the three PNGs).
const BOX = { x: 288, y: 672, w: 184, h: 268 };
export const PODIUM_MEDALS = ['medal-gold', 'medal-silver', 'medal-bronze'] as const;
const NAMES = ['Gold', 'Silver', 'Bronze'];

/** `interactive` false draws the medal only (inside a card that is already tappable, like an Earn these tile). */
export function MedalGlint({ place, height = 46, interactive = true }: { place: 1 | 2 | 3; height?: number; interactive?: boolean }) {
  const id = PODIUM_MEDALS[place - 1];
  const art = SHOP_ART[id];
  if (!art) return null;
  const k = height / BOX.h;
  const medal = (
    <View style={{ width: BOX.w * k, height, overflow: 'hidden' }}>
      <Image source={art} style={{ position: 'absolute', left: -BOX.x * k, top: -BOX.y * k, width: 1024 * k, height: 1024 * k }} resizeMode="contain" />
    </View>
  );
  if (!interactive) return medal;
  return (
    <Pressable
      onPress={() => { triggerHaptic('light'); router.push(`/shop-item?id=${id}` as any); }}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={`${NAMES[place - 1]} medal quest`}
    >
      {medal}
      <Twinkle phase={place * 450} period={1600} style={{ position: 'absolute', right: -6, top: -4 }}>
        <Sparkle size={10} color="#FFFFFF" />
      </Twinkle>
    </Pressable>
  );
}
