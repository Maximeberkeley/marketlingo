import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Image, ImageSourcePropType } from 'react-native';
import { tokens } from '../theme/tokens';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';
import { ColorText } from './ColorText';

export type LeoMood = 'idle' | 'thinking' | 'celebrate' | 'correct' | 'incorrect';

const ANIM: Record<LeoMood, 'idle' | 'thinking' | 'success' | 'failure' | 'celebrating'> = {
  idle: 'idle',
  thinking: 'thinking',
  celebrate: 'celebrating',
  correct: 'success',
  incorrect: 'failure',
};

/**
 * Optional painted scene backdrops. Drop PNGs into mobile/assets/scenes/
 * (wide, ~1200x420, soft flat illustration) and they light up per mood.
 * Missing files fall back to the clean white stage, so the banner always renders.
 */
const SCENES: Partial<Record<LeoMood, ImageSourcePropType>> = {
  // idle: require('../../../assets/scenes/leo-scene-idle.png'),
  // thinking: require('../../../assets/scenes/leo-scene-thinking.png'),
  // celebrate: require('../../../assets/scenes/leo-scene-celebrate.png'),
  // correct: require('../../../assets/scenes/leo-scene-correct.png'),
  // incorrect: require('../../../assets/scenes/leo-scene-incorrect.png'),
};

interface Props {
  line: string;
  mood?: LeoMood;
  /** World/accent color so the scene matches the current market. */
  accent?: string;
}

/** Leo speaks up a beat after the card lands — it feels like him, not a caption. */
const BUBBLE_DELAY_MS = 2000;

/**
 * Leo's in-lesson stage: he stands large on the left, still and present.
 * Two seconds into each card his comic bubble pops in with one short line.
 */
export function LeoCoach({ line, mood = 'idle', accent = tokens.color.accent }: Props) {
  const enter = useRef(new Animated.Value(0)).current;
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSpeaking(false);
    enter.setValue(0);
    const timer = setTimeout(() => {
      setSpeaking(true);
      Animated.timing(enter, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.back(1.9)),
        useNativeDriver: true,
      }).start();
    }, BUBBLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [line, mood, enter]);

  const pop = enter.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const wobble = enter.interpolate({ inputRange: [0, 1], outputRange: [-4, -1.5] });

  const moodTint =
    mood === 'correct' || mood === 'celebrate'
      ? tokens.color.correct
      : mood === 'incorrect'
        ? tokens.color.incorrect
        : accent;

  const scene = SCENES[mood];

  return (
    <View style={styles.wrap}>
      {/* A clean, quiet stage: no tint, no aura — Leo and his bubble only. */}
      <View style={styles.scene}>
        {scene ? (
          <Image source={scene} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}

        {/* Leo — large, anchored, completely still */}
        <View style={styles.leo} pointerEvents="none">
          <LeoCharacter animation={ANIM[mood]} size="lg" still />
        </View>

        {/* Speech bubble with a comic tail — pops in ~2s after the card */}
        {speaking ? (
          <Animated.View
            style={[
              styles.bubbleWrap,
              { opacity: enter, transform: [{ scale: pop }, { translateY: lift }] },
            ]}
          >
            <View style={[styles.bubble, { borderColor: moodTint + '66' }]}>
              <ColorText text={line} style={styles.text} maxSentences={2} maxLength={110} />
            </View>
            <View style={[styles.tail, { borderRightColor: moodTint + '66' }]} />
            <View style={styles.tailFill} />
          </Animated.View>
        ) : (
          <View style={styles.bubbleWrap} pointerEvents="none" />
        )}
      </View>
    </View>
  );
}

const SCENE_H = 118;

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: tokens.space.lg,
    marginBottom: tokens.space.sm,
  },
  scene: {
    height: SCENE_H,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  leo: {
    width: 100,
    marginLeft: -4,
    marginBottom: -10,
    zIndex: 2,
  },
  bubbleWrap: {
    flex: 1,
    alignSelf: 'center',
    marginRight: tokens.space.sm,
    marginLeft: 2,
    position: 'relative',
  },
  bubble: {
    backgroundColor: tokens.color.card,
    borderWidth: 1.5,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.space.sm + 4,
    paddingVertical: tokens.space.sm,
  },
  tail: {
    position: 'absolute',
    left: -9,
    bottom: 14,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderRightWidth: 9,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  tailFill: {
    position: 'absolute',
    left: -6,
    bottom: 16,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderRightWidth: 7,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: tokens.color.card,
  },
  text: {
    fontSize: tokens.font.caption + 1,
    lineHeight: 18,
    fontWeight: '600',
    color: tokens.color.text,
  },
});
