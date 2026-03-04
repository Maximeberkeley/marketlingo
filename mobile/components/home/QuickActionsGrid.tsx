import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';
import { LeoCharacter } from '../mascot/LeoCharacter';

interface QuickAction {
  emoji?: string;
  icon?: any;
  label: string;
  onPress: () => void;
  isLeo?: boolean;
}

interface QuickActionsGridProps {
  actions: QuickAction[];
}

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
            {action.isLeo ? (
              <View style={styles.leoIcon}>
                <LeoCharacter size="sm" animation="idle" />
              </View>
            ) : action.icon ? (
              <View style={styles.iconCircle}>
                <Image source={action.icon} style={styles.iconImage} />
              </View>
            ) : (
              <View style={styles.iconCircle}>
                <Text style={styles.emoji}>{action.emoji}</Text>
              </View>
            )}
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
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 88,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  leoIcon: {
    width: 42,
    height: 42,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  label: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
});
