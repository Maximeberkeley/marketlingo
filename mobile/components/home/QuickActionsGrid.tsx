import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';

interface QuickAction {
  emoji: string;
  label: string;
  onPress: () => void;
}

interface QuickActionsGridProps {
  actions: QuickAction[];
}

/**
 * Staggered-entrance quick action grid for the home screen.
 */
export function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  const anims = useRef(actions.map(() => ({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.7),
  }))).current;

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.delay(
        i * 80,
        Animated.parallel([
          Animated.spring(anim.scale, { toValue: 1, tension: 120, friction: 10, useNativeDriver: true }),
          Animated.timing(anim.opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      )
    );
    Animated.stagger(80, animations).start();
  }, []);

  return (
    <View style={styles.grid}>
      {actions.map((action, i) => (
        <Animated.View
          key={action.label}
          style={[styles.itemWrap, { opacity: anims[i].opacity, transform: [{ scale: anims[i].scale }] }]}
        >
          <TouchableOpacity style={styles.item} onPress={action.onPress} activeOpacity={0.7}>
            <Text style={styles.emoji}>{action.emoji}</Text>
            <Text style={styles.label}>{action.label}</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  itemWrap: { flex: 1 },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emoji: { fontSize: 24, marginBottom: 6 },
  label: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
});
