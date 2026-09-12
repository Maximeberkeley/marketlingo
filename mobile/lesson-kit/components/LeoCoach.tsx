import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
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

interface Props {
  line: string;
  mood?: LeoMood;
}

/**
 * Leo, present in the lesson itself: a small speech strip that coaches the
 * learner through each beat and reacts when they answer.
 */
export function LeoCoach({ line, mood = 'idle' }: Props) {
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

  const translateX = enter.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] });
  const tint =
    mood === 'correct' ? tokens.color.correct : mood === 'incorrect' ? tokens.color.incorrect : tokens.color.accent;

  return (
    <Animated.View style={[styles.wrap, { opacity: enter, transform: [{ translateX }] }]}>
      <LeoCharacter animation={ANIM[mood]} size="sm" />
      <View style={[styles.bubble, { borderColor: tint + '55', backgroundColor: tint + '10' }]}>
        <ColorText text={line} style={styles.text} maxSentences={2} maxLength={120} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.lg,
    marginBottom: tokens.space.md,
  },
  bubble: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
  },
  text: {
    fontSize: tokens.font.caption + 1,
    lineHeight: 19,
    fontWeight: '600',
    color: tokens.color.text,
  },
});
