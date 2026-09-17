import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image, ImageSourcePropType } from 'react-native';
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
 * Missing files fall back to the built-in layered-color scene, so the
 * banner always renders.
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

/**
 * Leo's in-lesson home: a light top scene banner. A slim illustrated strip
 * with Leo standing in it and a comic speech bubble tailing toward him.
 * He reacts, he never crowds — one short line, then quiet.
 */
export function LeoCoach({ line, mood = 'idle', accent = tokens.color.accent }: Props) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [line, mood, enter]);

  const pop = enter.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

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

        {/* Leo, anchored in place — no bobbing */}
        <View style={styles.leo}>
          <LeoCharacter animation={ANIM[mood]} size="sm" />
        </View>

        {/* Speech bubble with a comic tail pointing at Leo */}
        <Animated.View
          style={[
            styles.bubbleWrap,
            { opacity: enter, transform: [{ scale: pop }] },
          ]}
        >
          <View style={[styles.bubble, { borderColor: moodTint + '66' }]}>
            <ColorText text={line} style={styles.text} maxSentences={2} maxLength={120} />
          </View>
          <View style={[styles.tail, { borderRightColor: moodTint + '66' }]} />
          <View style={styles.tailFill} />
        </Animated.View>
      </View>
    </View>
  );
}

const SCENE_H = 138;

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: tokens.space.lg,
    marginBottom: tokens.space.md,
  },
  scene: {
    minHeight: SCENE_H,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  leo: {
    marginRight: tokens.space.sm,
    marginBottom: -8,
    zIndex: 2,
  },
  bubbleWrap: {
    flex: 1,
    alignSelf: 'center',
    marginRight: tokens.space.md,
    marginRight: tokens.space.sm,
    position: 'relative',
  },
  bubble: {
    backgroundColor: tokens.color.card,
    borderWidth: 2,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
  },
  tail: {
    position: 'absolute',
    left: -13,
    bottom: 20,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderRightWidth: 13,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  tailFill: {
    position: 'absolute',
    left: -9,
    bottom: 23,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: tokens.color.card,
  },
  text: {
    fontSize: tokens.font.body + 2,
    lineHeight: 24,
    fontWeight: '600',
    color: tokens.color.text,
  },
});
