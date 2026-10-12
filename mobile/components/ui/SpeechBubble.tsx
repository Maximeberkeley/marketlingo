import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { COLORS } from '../../lib/constants';
import { isDark } from '../../lib/theme';

type TailSide = 'left' | 'right' | 'top-left' | 'top-center' | 'bottom-center';
type BubbleTone = 'neutral' | 'purple' | 'warm' | 'success';

interface SpeechBubbleProps {
  children?: React.ReactNode;
  text?: string;
  /** Which side Leo is on — the small 6px "pointer" corner faces him. */
  tail?: TailSide;
  /** @deprecated kept for call-site compatibility; one style is used everywhere. */
  tone?: BubbleTone;
  /** @deprecated kept for call-site compatibility. */
  compact?: boolean;
  /** Show a small "Leo" label above the bubble. */
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const BUBBLE_BG = isDark ? '#2A2440' : '#F3EEFE';

/** Corner radii: 22 everywhere except the 6px pointer corner nearest Leo. */
function pointerRadius(tail: TailSide): ViewStyle {
  switch (tail) {
    case 'left':
      return { borderTopLeftRadius: 6 };
    case 'right':
      return { borderTopRightRadius: 6 };
    case 'top-left':
      return { borderTopLeftRadius: 6 };
    case 'top-center':
      return { borderTopLeftRadius: 6 };
    case 'bottom-center':
    default:
      return { borderBottomLeftRadius: 6 };
  }
}

export function SpeechBubble({
  children,
  text,
  tail = 'left',
  showLabel = false,
  style,
  textStyle,
}: SpeechBubbleProps) {
  return (
    <View style={[styles.wrap, style]}>
      {showLabel && <Text style={styles.label}>Leo</Text>}
      <View style={[styles.balloon, pointerRadius(tail)]}>
        {children ?? (
          <Text style={[styles.text, textStyle]}>{text}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', maxWidth: 260 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 4,
    marginLeft: 4,
  },
  balloon: {
    backgroundColor: BUBBLE_BG,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignSelf: 'flex-start',
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
});
