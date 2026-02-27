/**
 * Skeleton loading component for the Home screen.
 * Shows animated placeholder cards instead of a plain spinner.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';

function PulsingBlock({ width, height, style }: { width: string | number; height: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: 8,
          backgroundColor: 'rgba(255,255,255,0.06)',
          opacity,
        },
        style,
      ]}
    />
  );
}

export function HomeSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Header skeleton */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <PulsingBlock width={36} height={36} style={{ borderRadius: 12 }} />
          <View style={{ gap: 4 }}>
            <PulsingBlock width={120} height={16} />
            <PulsingBlock width={80} height={10} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PulsingBlock width={60} height={28} style={{ borderRadius: 14 }} />
          <PulsingBlock width={50} height={28} style={{ borderRadius: 14 }} />
        </View>
      </View>

      {/* Leo section */}
      <View style={styles.leoSection}>
        <PulsingBlock width={80} height={80} style={{ borderRadius: 40 }} />
        <PulsingBlock width={200} height={14} style={{ marginTop: 12 }} />
      </View>

      {/* Progress card */}
      <PulsingBlock width="100%" height={60} style={{ borderRadius: 16, marginBottom: 20 }} />

      {/* Mission card */}
      <PulsingBlock width="100%" height={140} style={{ borderRadius: 16, marginBottom: 20 }} />

      {/* Quick bites */}
      <View style={styles.bitesRow}>
        <PulsingBlock width="30%" height={70} style={{ borderRadius: 12 }} />
        <PulsingBlock width="30%" height={70} style={{ borderRadius: 12 }} />
        <PulsingBlock width="30%" height={70} style={{ borderRadius: 12 }} />
      </View>

      {/* Quests */}
      <PulsingBlock width="100%" height={100} style={{ borderRadius: 16, marginBottom: 16 }} />

      {/* News */}
      <PulsingBlock width="100%" height={80} style={{ borderRadius: 14, marginBottom: 8 }} />
      <PulsingBlock width="100%" height={80} style={{ borderRadius: 14 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg0,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bitesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});
