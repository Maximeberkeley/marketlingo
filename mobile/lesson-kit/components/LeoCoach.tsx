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
const BUBBLE_DELAY_MS = 900;

/**
 * Leo's in-lesson stage: he stays quietly present on the left.
 * Just under a second into each card his comic bubble pops in with one short line.
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

        {/* Leo — anchored, completely still, never overlapping his bubble */}
        <View style={styles.leo} pointerEvents="none">
          <LeoCharacter animation={ANIM[mood]} size="sm" still />
        </View>

        {/* Comic speech bubble — pops in shortly after the card with a springy wobble */}
        {speaking ? (
          <Animated.View
            style={[
              styles.bubbleWrap,
              { opacity: enter, transform: [{ scale: pop }, { rotate: `${wobble}deg` }] },
            ]}
          >
            <View style={[styles.bubble, { borderColor: moodTint }]}>
              <ColorText text={line} style={styles.text} maxSentences={2} maxLength={110} />
            </View>
            {/* Comic tail: two overlapping circles shrinking toward Leo, plus a dot */}
            <View style={[styles.tailCircleBig, { borderColor: moodTint }]} />
            <View style={[styles.tailCircleSmall, { borderColor: moodTint }]} />
            <View style={[styles.tailDot, { borderColor: moodTint }]} />
          </Animated.View>
        ) : (
          <View style={styles.bubbleWrap} pointerEvents="none" />
        )}
      </View>
    </View>
  );
}

const SCENE_H = 112;

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
    height: SCENE_H,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    transform: [{ scale: 0.96 }],
    zIndex: 1,
  },
  bubbleWrap: {
    flex: 1,
    alignSelf: 'center',
    marginRight: tokens.space.sm,
    marginLeft: 22,
    position: 'relative',
    // Always above Leo — even if his artwork overhangs, the words stay readable.
    zIndex: 2,
  },
  bubble: {
    backgroundColor: tokens.color.card,
    borderWidth: 2.5,
    borderRadius: 18,
    // Slightly squared top corners + fully round bottom = classic comic balloon
    borderTopLeftRadius: 16,
    borderTopRightRadius: 20,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    shadowColor: tokens.color.text,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  tailCircleBig: {
    position: 'absolute',
    left: -13,
    bottom: 20,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    backgroundColor: tokens.color.card,
  },
  tailCircleSmall: {
    position: 'absolute',
    left: -24,
    bottom: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: tokens.color.card,
  },
  tailDot: {
    position: 'absolute',
    left: -32,
    bottom: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    backgroundColor: tokens.color.card,
  },
  text: {
    fontSize: tokens.font.caption + 1,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 0.1,
    color: tokens.color.text,
  },
});
