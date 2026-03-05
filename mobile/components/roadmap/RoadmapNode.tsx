import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Animated, Image } from 'react-native';
import { COLORS } from '../../lib/constants';
import { APP_ICONS } from '../../lib/icons';

export type NodeStatus = 'locked' | 'current' | 'completed' | 'available';

interface RoadmapNodeProps {
  weekNumber: number;
  status: NodeStatus;
  onClick: () => void;
}

export function RoadmapNode({ weekNumber, status, onClick }: RoadmapNodeProps) {
  const isInteractive = status !== 'locked';
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (status === 'current') {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1.35, duration: 1000, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    }
    return () => { pulseAnim.stopAnimation(); pulseOpacity.stopAnimation(); };
  }, [status]);

  const nodeStyle = [
    styles.node,
    status === 'current' && styles.nodeCurrent,
    status === 'completed' && styles.nodeCompleted,
    status === 'locked' && styles.nodeLocked,
    status === 'available' && styles.nodeAvailable,
  ];

  return (
    <TouchableOpacity
      onPress={isInteractive ? onClick : undefined}
      disabled={!isInteractive}
      style={styles.container}
      activeOpacity={isInteractive ? 0.7 : 1}
    >
      {status === 'current' && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: pulseOpacity,
            },
          ]}
        />
      )}

      <View style={nodeStyle}>
        {status === 'locked' && (
          <View style={styles.lockIconWrap}>
            <View style={styles.lockBar} />
            <View style={styles.lockBody} />
          </View>
        )}
        {status === 'completed' && <Text style={styles.checkIcon}>✓</Text>}
        {(status === 'current' || status === 'available') && (
          <Text style={styles.weekNumber}>{weekNumber}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const NODE_SIZE = 48;

const styles = StyleSheet.create({
  container: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg2,
  },
  nodeCurrent: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  nodeCompleted: {
    backgroundColor: COLORS.success || '#22C55E',
    borderColor: COLORS.success || '#22C55E',
  },
  nodeLocked: {
    backgroundColor: COLORS.bg1,
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  nodeAvailable: {
    backgroundColor: COLORS.bg2,
    borderColor: COLORS.textMuted,
  },
  pulseRing: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  lockIconWrap: { alignItems: 'center' },
  lockBar: { width: 10, height: 8, borderRadius: 5, borderWidth: 1.5, borderColor: COLORS.textMuted, borderBottomWidth: 0, marginBottom: -1 },
  lockBody: { width: 14, height: 10, borderRadius: 2, backgroundColor: COLORS.textMuted },
  checkIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },
  weekNumber: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
});
