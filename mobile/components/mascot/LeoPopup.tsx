/**
 * LeoPopup — Duolingo-style mascot pop-up messages.
 * Shows Leo with contextual messages for social, game, and learning triggers.
 * Auto-dismisses after a timeout or on tap.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../lib/constants';
import { pickBubbleLine } from '../../lib/leoLines';

// Mood-matched Leo artwork — the notification shows the Leo that fits its category.
const LEO_MOOD_IMAGES: Record<string, number> = {
  waving: require('../../assets/mascot/leo-waving.png'),
  celebrating: require('../../assets/mascot/leo-celebrating.png'),
  thinking: require('../../assets/mascot/leo-thinking.png'),
  idle: require('../../assets/mascot/leo-idle.png'),
};
const LEO_IMAGE = LEO_MOOD_IMAGES.idle;

// ── Message Categories ──
export type LeoPopupCategory = 'social' | 'game' | 'learning' | 'streak' | 'achievement' | 'tip';

export interface LeoPopupMessage {
  id: string;
  category: LeoPopupCategory;
  title: string;
  body: string;
  /** Optional CTA label */
  actionLabel?: string;
  onAction?: () => void;
  /** Auto-dismiss delay in ms (default 5000) */
  duration?: number;
}

interface LeoPopupProps {
  message: LeoPopupMessage | null;
  onDismiss: () => void;
}

const CATEGORY_CONFIG: Record<LeoPopupCategory, { icon: string; color: string; leoMood: string }> = {
  social: { icon: 'users', color: '#8B5CF6', leoMood: 'waving' },
  game: { icon: 'zap', color: '#F59E0B', leoMood: 'celebrating' },
  learning: { icon: 'book-open', color: '#22C55E', leoMood: 'thinking' },
  streak: { icon: 'trending-up', color: '#F97316', leoMood: 'celebrating' },
  achievement: { icon: 'award', color: '#EC4899', leoMood: 'celebrating' },
  tip: { icon: 'info', color: '#3B82F6', leoMood: 'idle' },
};

export function LeoPopup({ message, onDismiss }: LeoPopupProps) {
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateIn = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, tension: 120, friction: 12, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -200, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss());
  }, [onDismiss]);

  useEffect(() => {
    if (!message) return;

    // Reset
    translateY.setValue(-200);
    opacity.setValue(0);

    animateIn();

    // Auto-dismiss
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => {
      animateOut();
    }, message.duration || 5000);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [message?.id]);

  if (!message) return null;

  const config = CATEGORY_CONFIG[message.category];

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => {
          if (dismissTimer.current) clearTimeout(dismissTimer.current);
          if (message.onAction) message.onAction();
          else animateOut();
        }}
        style={styles.touchable}
      >

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.categoryBadge, { backgroundColor: config.color + '18' }]}>
              <Feather name={config.icon as any} size={11} color={config.color} />
              <Text style={[styles.categoryText, { color: config.color }]}>{message.category}</Text>
            </View>
            <TouchableOpacity onPress={animateOut} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
              <Feather name="x" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title} numberOfLines={2}>{pickBubbleLine([message.body, message.title], message.title)}</Text>

          {message.actionLabel && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: config.color }]}
              onPress={() => {
                if (dismissTimer.current) clearTimeout(dismissTimer.current);
                message.onAction?.();
                animateOut();
              }}
            >
              <Text style={styles.actionText}>{message.actionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.bubbleTail} />
        {/* Leo avatar */}
        <View style={styles.leoWrap}>
          <Image source={LEO_MOOD_IMAGES[config.leoMood] ?? LEO_IMAGE} style={styles.leoImage} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  touchable: {
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  leoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  leoImage: {
    width: 82,
    height: 82,
    resizeMode: 'contain',
  },
  content: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...SHADOWS.lg,
  },
  bubbleTail: {
    width: 14,
    height: 14,
    marginTop: -8,
    backgroundColor: COLORS.bg2,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    transform: [{ rotate: '45deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
    lineHeight: 20,
  },
  body: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    marginTop: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textOnAccent,
  },
});
