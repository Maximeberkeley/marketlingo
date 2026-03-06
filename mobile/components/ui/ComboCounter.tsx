import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../../lib/constants';
import { ComboState, getComboMessage } from '../../lib/combo';

interface ComboCounterProps {
  combo: ComboState;
  show: boolean;
}

export function ComboCounter({ combo, show }: ComboCounterProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fireScale = useRef(new Animated.Value(1)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (show && combo.streak > 0) {
      // Pop-in animation
      scaleAnim.setValue(0.5);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [combo.streak, show]);

  // Fire pulsing at 3+ combo
  useEffect(() => {
    if (combo.isOnFire) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(fireScale, {
            toValue: 1.2,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(fireScale, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [combo.isOnFire]);

  // Combo message flash
  const message = getComboMessage(combo.streak);
  useEffect(() => {
    if (message) {
      messageOpacity.setValue(0);
      Animated.sequence([
        Animated.timing(messageOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(messageOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [message]);

  if (!show || combo.streak === 0) return null;

  const multiplierColor = combo.isOnFire ? '#F97316' : combo.multiplier > 1 ? '#FBBF24' : COLORS.textSecondary;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.comboChip, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={combo.isOnFire ? { transform: [{ scale: fireScale }] } : undefined}>
          <Text style={styles.fireEmoji}>{combo.isOnFire ? '' : '⚡'}</Text>
        </Animated.View>
        <Text style={[styles.comboCount, { color: multiplierColor }]}>{combo.streak}</Text>
        <View style={[styles.multiplierBadge, { backgroundColor: multiplierColor + '20' }]}>
          <Text style={[styles.multiplierText, { color: multiplierColor }]}>
            {combo.multiplier}x
          </Text>
        </View>
      </Animated.View>

      {/* Flash message for milestones */}
      {message && (
        <Animated.View style={[styles.messageBubble, { opacity: messageOpacity }]}>
          <Text style={styles.messageText}>{message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  comboChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 146, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fireEmoji: { fontSize: 16 },
  comboCount: {
    fontSize: 16,
    fontWeight: '800',
  },
  multiplierBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  multiplierText: {
    fontSize: 11,
    fontWeight: '700',
  },
  messageBubble: {
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.3)',
  },
  messageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FB923C',
    textAlign: 'center',
  },
});
