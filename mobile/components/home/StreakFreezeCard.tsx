import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Alert,
} from 'react-native';
import { COLORS } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptics';

interface StreakFreezeCardProps {
  streak: number;
  canFreeze: boolean;
  freezesUsed: number;
  maxFreezes: number;
  isProUser: boolean;
  onUseFreeze: () => Promise<boolean>;
  onDismiss: () => void;
}

export function StreakFreezeCard({
  streak, canFreeze, freezesUsed, maxFreezes, isProUser, onUseFreeze, onDismiss,
}: StreakFreezeCardProps) {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const iceScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0, friction: 8, tension: 65, useNativeDriver: true,
    }).start();

    // Ice pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(iceScale, { toValue: 1.15, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(iceScale, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const handleFreeze = async () => {
    triggerHaptic('success');
    const success = await onUseFreeze();
    if (success) {
      Alert.alert('Streak Frozen! ', `Your ${streak}-day streak is safe for 24 more hours.`);
      onDismiss();
    } else {
      Alert.alert('Cannot Freeze', "You've already used your freeze this week.");
    }
  };

  const remaining = isProUser ? '∞' : `${maxFreezes - freezesUsed}`;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Animated.View style={[styles.iceCircle, { transform: [{ scale: iceScale }] }]}>
          <Text style={{ fontSize: 28 }}></Text>
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Streak Freeze Available</Text>
          <Text style={styles.subtitle}>
            {canFreeze
              ? `Protect your ${streak}-day streak • ${remaining} freeze${isProUser ? 's' : ''} left`
              : 'No freezes left this week'}
          </Text>
        </View>
      </View>

      {canFreeze && (
        <TouchableOpacity style={styles.freezeBtn} onPress={handleFreeze} activeOpacity={0.8}>
          <Text style={styles.freezeBtnText}> Use Streak Freeze</Text>
        </TouchableOpacity>
      )}

      {!isProUser && (
        <Text style={styles.proHint}> Pro users get unlimited freezes</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  dismissBtn: { position: 'absolute', top: 8, right: 10, zIndex: 10 },
  dismissText: { fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },
  content: {
    flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 10, gap: 12,
  },
  iceCircle: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  title: { fontSize: 15, fontWeight: '700', color: '#7DD3FC', marginBottom: 2 },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 16 },
  freezeBtn: {
    marginHorizontal: 14, marginBottom: 10, paddingVertical: 12, borderRadius: 12,
    alignItems: 'center', backgroundColor: '#0EA5E9',
  },
  freezeBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  proHint: {
    fontSize: 10, color: COLORS.textMuted, textAlign: 'center', paddingBottom: 10,
  },
});
