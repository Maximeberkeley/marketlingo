import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Image, ImageSourcePropType } from 'react-native';
import { tokens } from '../theme/tokens';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';
import { ColorText } from './ColorText';
import { SpeechBubble } from '../../components/ui/SpeechBubble';

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
      Animated.spring(enter, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }).start();
    }, BUBBLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [line, mood, enter]);

  const pop = enter.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] });
  const rise = enter.interpolate({ inputRange: [0, 1], outputRange: [6, 0] });

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

        {/* Clean illustrated speech balloon — one shape and one integrated tail. */}
        {speaking ? (
          <Animated.View
            style={[
              styles.bubbleWrap,
              { opacity: enter, transform: [{ scale: pop }, { translateY: rise }] },
            ]}
          >
            <SpeechBubble tail="left" tone="neutral" style={styles.bubble}>
              <ColorText text={line} style={styles.text} maxSentences={2} maxLength={110} />
            </SpeechBubble>
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
    width: 94,
    height: SCENE_H,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 1,
  },
  bubbleWrap: {
    flex: 1,
    alignSelf: 'center',
    marginRight: tokens.space.sm,
    marginLeft: 14,
    position: 'relative',
    // Always above Leo — even if his artwork overhangs, the words stay readable.
    zIndex: 2,
  },
  bubble: { width: '100%' },
  text: {
    fontSize: tokens.font.caption,
    lineHeight: 18,
    fontWeight: '800',
    color: tokens.color.text,
  },
});
