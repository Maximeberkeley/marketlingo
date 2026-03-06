import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../lib/constants';
import { mentors } from '../../data/mentors';

const MENTOR_IMAGES: Record<string, any> = {
  maya: require('../../assets/mentors/mentor-maya.png'),
  alex: require('../../assets/mentors/mentor-alex.png'),
  kai: require('../../assets/mentors/mentor-kai.png'),
  sophia: require('../../assets/mentors/mentor-sophia.png'),
};
const LEO_STICKER = require('../../assets/mascot/leo-reference.png');

export type MascotBreakType = 'intro' | 'midpoint' | 'complete' | 'encourage' | 'tip';

export interface MascotCharacter {
  id: string;
  name: string;
  isLeo?: boolean;
}

const getAllCharacters = (): MascotCharacter[] => [
  { id: 'leo', name: 'Leo', isLeo: true },
  ...mentors.map((m) => ({ id: m.id, name: m.name.split(' ')[0], isLeo: false })),
];

export const getRandomCharacter = (marketId?: string): MascotCharacter => {
  const characters = getAllCharacters();
  const weighted = [...characters, characters[0], characters[0]];
  if (marketId === 'neuroscience') {
    const sophia = characters.find((c) => c.id === 'sophia');
    if (sophia) weighted.push(sophia, sophia);
  }
  return weighted[Math.floor(Math.random() * weighted.length)];
};

const getDefaultMessage = (type: MascotBreakType, charName: string, slideIndex?: number, totalSlides?: number): string => {
  const isLeo = charName === 'Leo';
  switch (type) {
    case 'intro': return isLeo ? "Let's dive in together! " : "I'll guide you through this one. Ready?";
    case 'midpoint': {
      const progress = slideIndex && totalSlides ? `${Math.round((slideIndex / totalSlides) * 100)}%` : 'halfway';
      return isLeo ? `You're ${progress} there! Keep it up! ` : `Great progress! ${progress} complete.`;
    }
    case 'complete': return isLeo ? 'You crushed it! ' : 'Amazing work! You should be proud.';
    case 'encourage': return isLeo ? "You've got this! Don't give up!" : "Keep pushing—you're learning!";
    case 'tip': return isLeo ? 'Pro tip incoming! ' : "Here's something to remember...";
    default: return 'Hey there! ';
  }
};

const BG_TINTS: Record<MascotBreakType, string> = {
  intro: COLORS.accentSoft,
  midpoint: COLORS.warningSoft,
  complete: COLORS.successSoft,
  encourage: COLORS.infoSoft,
  tip: 'rgba(168,85,247,0.08)',
};

interface MascotBreakProps {
  type: MascotBreakType;
  message?: string;
  characterId?: string;
  marketId?: string;
  slideIndex?: number;
  totalSlides?: number;
  onDismiss?: () => void;
  autoDismissMs?: number;
}

export function MascotBreak({ type, message, characterId, marketId, slideIndex, totalSlides, onDismiss, autoDismissMs }: MascotBreakProps) {
  const [dismissed, setDismissed] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const bobY = useRef(new Animated.Value(0)).current;

  const character = useMemo(() => {
    if (characterId) {
      const found = getAllCharacters().find((c) => c.id === characterId);
      if (found) return found;
    }
    return getRandomCharacter(marketId);
  }, [characterId, marketId]);

  const displayMessage = message || getDefaultMessage(type, character.name, slideIndex, totalSlides);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 300, friction: 20, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobY, { toValue: -6, duration: 1400, useNativeDriver: true }),
        Animated.timing(bobY, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (autoDismissMs) {
      const t = setTimeout(() => { setDismissed(true); onDismiss?.(); }, autoDismissMs);
      return () => clearTimeout(t);
    }
  }, [autoDismissMs]);

  if (dismissed) return null;

  const isLeo = character.isLeo;
  const avatarSource = isLeo ? LEO_STICKER : MENTOR_IMAGES[character.id];

  return (
    <Animated.View style={[styles.container, { backgroundColor: BG_TINTS[type], opacity, transform: [{ scale }] }]}>
      <TouchableOpacity activeOpacity={onDismiss ? 0.8 : 1} onPress={onDismiss ? () => { setDismissed(true); onDismiss(); } : undefined}>
        <Animated.View style={{ transform: [{ translateY: bobY }] }}>
          <Image source={avatarSource} style={[styles.avatar, isLeo ? styles.leoAvatar : styles.mentorAvatar]} />
        </Animated.View>
        <Text style={styles.charName}>{character.name}</Text>
        <View style={styles.bubbleContainer}>
          <View style={styles.bubblePointer} />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{displayMessage}</Text>
          </View>
        </View>
        {onDismiss && <Text style={styles.tapHint}>Tap to continue</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function shouldShowMascotBreak(slideIndex: number, totalSlides: number, isIntro: boolean): MascotBreakType | null {
  if (isIntro) return 'intro';
  const midpoint = Math.floor(totalSlides / 2);
  if (slideIndex === midpoint && totalSlides > 3) return 'midpoint';
  if (slideIndex === totalSlides - 1) return 'complete';
  return null;
}

interface InlineMascotProps {
  characterId?: string;
  marketId?: string;
  message?: string;
  position?: 'left' | 'right';
  size?: 'sm' | 'md';
}

export function InlineMascot({ characterId, marketId, message, position = 'left', size = 'sm' }: InlineMascotProps) {
  const character = useMemo(() => {
    if (characterId) {
      const found = getAllCharacters().find((c) => c.id === characterId);
      if (found) return found;
    }
    return getRandomCharacter(marketId);
  }, [characterId, marketId]);

  const dim = size === 'sm' ? 40 : 52;
  const avatarSource = character.isLeo ? LEO_STICKER : MENTOR_IMAGES[character.id];

  return (
    <View style={[styles.inlineRow, position === 'right' && styles.inlineRowReverse]}>
      <Image source={avatarSource} style={[styles.inlineAvatar, { width: dim, height: dim, borderRadius: character.isLeo ? 0 : dim / 2 }]} />
      {message && (
        <View style={[styles.inlineBubble, position === 'right' ? styles.inlineBubbleRight : styles.inlineBubbleLeft]}>
          <Text style={styles.inlineBubbleText}>{message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28, paddingHorizontal: 20, borderRadius: 20 },
  avatar: { alignSelf: 'center' },
  leoAvatar: { width: 100, height: 100 },
  mentorAvatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: COLORS.border },
  charName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center', marginTop: 8 },
  bubbleContainer: { alignItems: 'center', marginTop: 12 },
  bubblePointer: {
    width: 14, height: 14, backgroundColor: COLORS.bg2,
    borderTopWidth: 1, borderLeftWidth: 1, borderColor: COLORS.border,
    transform: [{ rotate: '45deg' }], marginBottom: -7, zIndex: 1,
  },
  bubble: {
    backgroundColor: COLORS.bg2, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 18, paddingVertical: 12, maxWidth: 260,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 4,
  },
  bubbleText: { fontSize: 14, color: COLORS.textPrimary, textAlign: 'center', lineHeight: 20 },
  tapHint: { marginTop: 12, fontSize: 12, color: COLORS.textMuted, textAlign: 'center', opacity: 0.7 },
  inlineRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  inlineRowReverse: { flexDirection: 'row-reverse' },
  inlineAvatar: { resizeMode: 'contain' },
  inlineBubble: {
    backgroundColor: COLORS.bg2, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.border, maxWidth: 160,
  },
  inlineBubbleLeft: { borderBottomLeftRadius: 2 },
  inlineBubbleRight: { borderBottomRightRadius: 2 },
  inlineBubbleText: { fontSize: 12, color: COLORS.textPrimary },
});

export default MascotBreak;
