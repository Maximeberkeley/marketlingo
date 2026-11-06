import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

/** Remembered once seen, so the hint shows on a learner's first quiz only. */
export const LEO_HINT_KEY = '@marketlingo/leo_quiz_hint_seen';

/** The hint belongs on an unanswered, graded question. */
export function shouldShowLeoHint(seen: boolean, passive: boolean, phase: 'answering' | 'feedback', leoOpen: boolean): boolean {
  return !seen && !passive && phase === 'answering' && !leoOpen;
}

/** A one-time bubble under the lesson header pointing at the Leo button. */
export function LeoHintBubble({ top, onPress }: { top: number; onPress: () => void }) {
  return (
    <View pointerEvents="box-none" style={[styles.anchor, { top }]}>
      <View style={styles.tail} />
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ask Leo for a simpler explanation" onPress={onPress} style={styles.bubble} activeOpacity={0.9}>
        <Text style={styles.text}>Stuck? Tap me for a simpler explanation.</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', right: 10, alignItems: 'flex-end', zIndex: 20 },
  tail: {
    width: 14,
    height: 14,
    marginRight: 16,
    marginBottom: -7,
    transform: [{ rotate: '45deg' }],
    backgroundColor: tokens.color.accent,
  },
  bubble: {
    maxWidth: 240,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: tokens.color.accent,
    shadowColor: '#0F111A',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: { fontSize: 14, fontWeight: '700', lineHeight: 19, color: tokens.color.textOnAccent },
});
