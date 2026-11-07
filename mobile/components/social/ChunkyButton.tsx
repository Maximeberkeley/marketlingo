import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS } from '../../lib/constants';

export type ChunkyTone = 'accent' | 'streak' | 'success' | 'plain';

const TONES: Record<ChunkyTone, { face: string; lip: string; text: string; border?: string }> = {
  accent: { face: COLORS.accent, lip: COLORS.courseCoinLip, text: '#FFFFFF' },
  streak: { face: COLORS.streak, lip: '#C2410C', text: '#FFFFFF' },
  success: { face: COLORS.success, lip: '#15803D', text: '#FFFFFF' },
  plain: { face: COLORS.bg2, lip: COLORS.courseMutedLip, text: COLORS.textPrimary, border: COLORS.border },
};

const LIP = 4;

/**
 * A button with a thick darker lip under it that presses down when tapped,
 * the chunky feel of Duolingo's buttons.
 */
export function ChunkyButton({ label, onPress, tone = 'accent', icon, busy = false, disabled = false, style, height = 52, accessibilityLabel }: {
  label: string;
  onPress: () => void;
  tone?: ChunkyTone;
  icon?: React.ReactNode;
  busy?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  height?: number;
  accessibilityLabel?: string;
}) {
  const press = useRef(new Animated.Value(0)).current;
  const t = TONES[tone];
  const off = disabled || busy;
  const to = (v: number) => Animated.timing(press, { toValue: v, duration: 70, useNativeDriver: true }).start();
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => !off && to(1)}
      onPressOut={() => to(0)}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: off, busy }}
      style={[{ height: height + LIP, opacity: disabled ? 0.45 : 1 }, style]}
    >
      <View style={[styles.lip, { height, top: LIP, backgroundColor: t.lip }]} />
      <Animated.View style={[styles.face, {
        height, backgroundColor: t.face,
        borderWidth: t.border ? 2 : 0, borderColor: t.border,
        transform: [{ translateY: press.interpolate({ inputRange: [0, 1], outputRange: [0, LIP] }) }],
      }]}>
        {busy ? <ActivityIndicator color={t.text} /> : (
          <>
            {icon}
            <Text style={[styles.label, { color: t.text }]} numberOfLines={1}>{label}</Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lip: { position: 'absolute', left: 0, right: 0, borderRadius: 16 },
  face: { borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  label: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
});
