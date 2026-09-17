import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { COLORS, SHADOWS } from '../../lib/constants';

type TailSide = 'left' | 'right' | 'top-left' | 'top-center';
type BubbleTone = 'neutral' | 'purple' | 'warm' | 'success';

interface SpeechBubbleProps {
  children?: React.ReactNode;
  text?: string;
  tail?: TailSide;
  tone?: BubbleTone;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const tones: Record<BubbleTone, { background: string; border: string }> = {
  neutral: { background: COLORS.bg2, border: COLORS.border },
  purple: { background: COLORS.bg2, border: COLORS.accentMedium },
  warm: { background: COLORS.bg2, border: COLORS.warningSoft },
  success: { background: COLORS.bg2, border: COLORS.successSoft },
};

export function SpeechBubble({
  children,
  text,
  tail = 'left',
  tone = 'neutral',
  compact = false,
  style,
  textStyle,
}: SpeechBubbleProps) {
  const palette = tones[tone];
  return (
    <View style={[styles.wrap, style]}>
      <View
        style={[
          styles.tail,
          styles[`tail_${tail}`],
          { backgroundColor: palette.background, borderColor: palette.border },
        ]}
      />
      <View
        style={[
          styles.balloon,
          compact && styles.balloonCompact,
          { backgroundColor: palette.background, borderColor: palette.border },
        ]}
      >
        {children ?? <Text style={[styles.text, compact && styles.textCompact, textStyle]}>{text}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  balloon: {
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  balloonCompact: { borderRadius: 19, paddingHorizontal: 14, paddingVertical: 10, minHeight: 40 },
  text: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  textCompact: { fontSize: 13, lineHeight: 18 },
  tail: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderWidth: 1.5,
    transform: [{ rotate: '45deg' }],
    zIndex: 0,
  },
  tail_left: { left: -7, top: '50%', marginTop: -9, borderTopWidth: 0, borderRightWidth: 0 },
  tail_right: { right: -7, top: '50%', marginTop: -9, borderBottomWidth: 0, borderLeftWidth: 0 },
  'tail_top-left': { left: 28, top: -7, borderRightWidth: 0, borderBottomWidth: 0 },
  'tail_top-center': { left: '50%', top: -7, marginLeft: -9, borderRightWidth: 0, borderBottomWidth: 0 },
});
