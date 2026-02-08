import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MascotAvatar } from './MascotAvatar';
import { LEO, getRandomMessage, MascotState } from '../../lib/mascots';
import { COLORS } from '../../lib/constants';

interface MascotReactionProps {
  state: MascotState;
  showMessage?: boolean;
  position?: 'top-right' | 'bottom-right' | 'bottom-left';
  size?: 'sm' | 'md' | 'lg';
}

export function MascotReaction({
  state,
  showMessage = true,
  position = 'bottom-right',
  size = 'md',
}: MascotReactionProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'idle') {
      Animated.timing(opacityAnim, {
        toValue: 0.6,
        duration: 300,
        useNativeDriver: true,
      }).start();
      return;
    }

    // Show mascot
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (state === 'correct' || state === 'celebrate') {
      // Bounce animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (state === 'incorrect') {
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (state === 'thinking') {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [state, scaleAnim, shakeAnim, opacityAnim]);

  const getMessage = () => {
    switch (state) {
      case 'correct':
        return getRandomMessage('correct');
      case 'incorrect':
        return getRandomMessage('incorrect');
      case 'celebrate':
        return getRandomMessage('celebrate');
      case 'thinking':
        return getRandomMessage('thinking');
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (state) {
      case 'correct':
      case 'celebrate':
        return COLORS.success;
      case 'incorrect':
        return '#EF4444';
      case 'thinking':
        return COLORS.accent;
      default:
        return LEO.color;
    }
  };

  const positionStyles = {
    'top-right': { top: 16, right: 16 },
    'bottom-right': { bottom: 100, right: 16 },
    'bottom-left': { bottom: 100, left: 16 },
  };

  const message = getMessage();

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyles[position],
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateX: shakeAnim },
          ],
        },
      ]}
    >
      <MascotAvatar emoji={LEO.emoji} size={size} color={getColor()} animated={state === 'idle'} />
      {showMessage && message && (
        <View style={[styles.messageBubble, { backgroundColor: getColor() + '20', borderColor: getColor() + '40' }]}>
          <Text style={[styles.messageText, { color: getColor() }]}>{message}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 50,
  },
  messageBubble: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 160,
  },
  messageText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
