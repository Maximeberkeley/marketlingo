import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../lib/constants';

/** A learner's initial in a circle. Other learners are only ever shown by display name. */
export function SocialAvatar({ name, size = 44, ring, ringWidth = 2.5, dim = false, dashed = false, tint }: {
  name: string; size?: number; ring?: string; ringWidth?: number; dim?: boolean; dashed?: boolean; tint?: string;
}) {
  return (
    <View style={[styles.avatar, {
      width: size, height: size, borderRadius: size / 2, borderWidth: ringWidth,
      borderColor: ring ?? COLORS.border, borderStyle: dashed ? 'dashed' : 'solid',
      backgroundColor: tint ?? COLORS.bg1, opacity: dim ? 0.55 : 1,
    }]}>
      <Text style={[styles.initial, { fontSize: Math.round(size * 0.38) }]}>{(name.trim().charAt(0) || '?').toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontWeight: '800', color: COLORS.textPrimary },
});
