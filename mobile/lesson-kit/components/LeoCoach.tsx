import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Image, ImageSourcePropType } from 'react-native';
import { tokens } from '../theme/tokens';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';
import { LeoAnimated } from '../../components/mascot/LeoAnimated';
import { leoCoachClip } from '../../components/mascot/leoAnimationRules';
import { ColorText } from './ColorText';
import { SpeechBubble } from '../../components/ui/SpeechBubble';

export type LeoMood = 'idle' | 'thinking' | 'celebrate' | 'correct' | 'incorrect';

const ANIM: Record<LeoMood, 'idle' | 'thinking' | 'success' | 'failure' | 'celebrating'> = {
  idle: 'idle',
  thinking: 'thinking',
  celebrate: 'celebrating',
  correct: 'success',
  incorrect: 'idle',
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
  intro?: boolean;
  /** World/accent color so the scene matches the current market. */
  accent?: string;
  /** A shorter stage for practice screens, where the question matters more than the mascot. */
  compact?: boolean;
}

/** Leo speaks up a beat after the card lands — it feels like him, not a caption. */
const BUBBLE_DELAY_MS = 900;

/**
 * Leo's in-lesson stage: he stays quietly present on the left.
 * Just under a second into each card his comic bubble pops in with one short line.
 */
export function LeoCoach({ line, mood = 'idle', intro = false, accent = tokens.color.accent, compact = false }: Props) {
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
  const clip = leoCoachClip(mood, intro);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {/* A clean, quiet stage: no tint, no aura — Leo and his bubble only. */}
      <View style={[styles.scene, compact && styles.sceneCompact]}>
        {scene ? (
          <Image source={scene} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}

        {/* Leo stays anchored; motion never changes the bubble timing. */}
        <View style={[styles.leo, compact && styles.leoCompact]} pointerEvents="none">
          {clip ? (
            <LeoAnimated key={JSON.stringify([line, mood, intro])} clip={clip} size={compact ? 60 : 80} fallback={ANIM[mood]} />
          ) : <LeoCharacter animation={ANIM[mood]} size="sm" still />}
        </View>

        {/* Clean illustrated speech balloon — one shape and one integrated tail. */}
        <View style={styles.bubbleSlot}>
          <Animated.View
            pointerEvents={speaking ? 'auto' : 'none'}
            accessibilityElementsHidden={!speaking}
            importantForAccessibility={speaking ? 'auto' : 'no-hide-descendants'}
            style={[
              styles.bubbleWrap,
              { opacity: enter, transform: [{ scale: pop }, { translateY: rise }] },
            ]}
          >
            <SpeechBubble tail="left" showLabel={!compact} style={styles.bubble}>
              <ColorText text={line} style={styles.text} maxSentences={2} maxLength={110} />
            </SpeechBubble>
          </Animated.View>
        </View>
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
    minHeight: SCENE_H,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  leo: {
    width: 94,
    height: SCENE_H,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'visible',
    zIndex: 1,
  },
  bubbleSlot: {
    flex: 1,
    alignSelf: 'center',
    marginRight: tokens.space.sm,
    marginLeft: 14,
    position: 'relative',
    // Always above Leo — even if his artwork overhangs, the words stay readable.
    zIndex: 2,
  },
  wrapCompact: { marginBottom: 0 },
  sceneCompact: { minHeight: 76 },
  leoCompact: { width: 72, height: 76 },
  bubbleWrap: { width: '100%' },
  bubble: { width: '100%' },
  text: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: tokens.color.text,
  },
});
