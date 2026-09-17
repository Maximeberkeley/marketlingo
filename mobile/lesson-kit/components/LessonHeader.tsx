import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ProgressBar } from './ProgressBar';
import { tokens } from '../theme/tokens';

const LEO_IMAGE = require('../../assets/mascot/leo-reference.png');

interface Props {
  progress: number;
  onExit: () => void;
  onBack?: () => void;
  lives?: number;
  label?: string;
  accentColor?: string;
  /** Opens the Ask Leo chat overlay. */
  onAskLeo?: () => void;
  /** One-time hint pointing at the Ask Leo button. */
  showLeoHint?: boolean;
  onDismissLeoHint?: () => void;
}

export function LessonHeader({
  progress,
  onExit,
  onBack,
  lives,
  label,
  accentColor,
  onAskLeo,
  showLeoHint,
  onDismissLeoHint,
}: Props) {
  const accent = accentColor || tokens.color.accent;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="chevron-left" size={24} color={tokens.color.textMuted} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={onExit} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Feather name="x" size={24} color={tokens.color.textMuted} />
        </TouchableOpacity>

        <ProgressBar progress={progress} accentColor={accentColor} />

        {typeof lives === 'number' ? (
          <View style={styles.lives}>
            <Feather name="heart" size={18} color={tokens.color.heart} />
            <Text style={styles.livesText}>{lives}</Text>
          </View>
        ) : (
          <View style={styles.spacer} />
        )}

        {onAskLeo ? (
          <TouchableOpacity
            onPress={onAskLeo}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Ask Leo a question"
            style={[styles.askLeoPill, { borderColor: accent + '55' }]}
          >
            <Image source={LEO_IMAGE} style={styles.askLeoImage} />
            <Text style={[styles.askLeoText, { color: accent }]}>Ask</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {showLeoHint && onAskLeo ? (
        <TouchableOpacity
          style={[styles.hint, { borderColor: accent + '44', backgroundColor: accent + '12' }]}
          onPress={onDismissLeoHint}
          activeOpacity={0.9}
        >
          <View style={[styles.hintTail, { borderBottomColor: accent + '12' }]} />
          <Text style={[styles.hintText, { color: accent }]}>
            Stuck? Tap me and I'll explain it your way.
          </Text>
        </TouchableOpacity>
      ) : null}

      {!!label && <Text style={styles.label} numberOfLines={1}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: tokens.space.lg,
    paddingTop: tokens.space.sm,
    paddingBottom: tokens.space.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md },
  lives: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 34 },
  askLeoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 3,
    paddingRight: 10,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    backgroundColor: tokens.color.surface,
  },
  askLeoImage: { width: 26, height: 26, borderRadius: 13 },
  askLeoText: { fontSize: tokens.font.caption, fontWeight: '800' },
  hint: {
    alignSelf: 'flex-end',
    marginTop: tokens.space.sm,
    maxWidth: '80%',
    borderWidth: 1.5,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
  },
  hintTail: {
    position: 'absolute',
    top: -7,
    right: 16,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  hintText: { fontSize: tokens.font.caption, fontWeight: '700' },
  livesText: { color: tokens.color.heart, fontWeight: '700', fontSize: tokens.font.caption },
  spacer: { width: 8 },
  label: {
    marginTop: tokens.space.sm,
    fontSize: tokens.font.caption,
    color: tokens.color.textMuted,
    fontWeight: '600',
  },
});
