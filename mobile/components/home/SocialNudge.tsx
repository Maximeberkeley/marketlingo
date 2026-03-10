import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';

interface SocialNudgeProps {
  rivalName: string;
  rivalXP: number;
  userXP: number;
  marketName: string;
  onViewLeaderboard: () => void;
  onDismiss: () => void;
}

export function SocialNudge({
  rivalName,
  rivalXP,
  userXP,
  marketName,
  onViewLeaderboard,
  onDismiss,
}: SocialNudgeProps) {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const xpGap = rivalXP - userXP;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Feather name="x" size={14} color="rgba(255,255,255,0.3)" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.avatarStack}>
          <View style={[styles.avatar, styles.rivalAvatar]}>
            <Feather name="user" size={18} color="#EF4444" />
          </View>
          <View style={[styles.avatar, styles.vsAvatar]}>
            <Text style={styles.vsText}>VS</Text>
          </View>
        </View>

        <View style={styles.messageColumn}>
          <Text style={styles.headline}>
            {rivalName} is{' '}
            <Text style={styles.xpHighlight}>{xpGap} XP</Text> ahead of you
          </Text>
          <Text style={styles.subtext}>
            in {marketName} · One lesson closes the gap
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.ctaBtn} onPress={onViewLeaderboard} activeOpacity={0.8}>
        <Feather name="bar-chart-2" size={14} color={COLORS.accent} style={{ marginRight: 6 }} />
        <Text style={styles.ctaBtnText}>View Leaderboard</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  dismissBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 10,
    gap: 12,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg2,
  },
  rivalAvatar: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    zIndex: 1,
  },
  vsAvatar: {
    backgroundColor: COLORS.accent,
    marginLeft: -12,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  vsText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFF',
  },
  messageColumn: {
    flex: 1,
    paddingRight: 20,
  },
  headline: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  xpHighlight: {
    color: '#EF4444',
    fontWeight: '800',
  },
  subtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  ctaBtn: {
    marginHorizontal: 14,
    marginBottom: 14,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  ctaBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
