import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';
import { COLORS } from '../../lib/constants';
import { type Mentor } from '../../data/mentors';

// Mentor avatar image map (local requires)
const MENTOR_IMAGES: Record<string, any> = {
  maya: require('../../assets/mentors/mentor-maya.png'),
  alex: require('../../assets/mentors/mentor-alex.png'),
  kai: require('../../assets/mentors/mentor-kai.png'),
  sophia: require('../../assets/mentors/mentor-sophia.png'),
};

interface MentorTipBubbleProps {
  mentor: Mentor;
  tip: string;
  onDismiss: () => void;
  onTap?: () => void;
  delay?: number;
}

export function MentorTipBubble({ mentor, tip, onDismiss, onTap, delay = 0 }: MentorTipBubbleProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 300, friction: 20, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.85, duration: 180, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  const mentorImage = MENTOR_IMAGES[mentor.id];
  const firstName = mentor.name.split(' ')[0];

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ scale }, { translateY }] }]}>
      <TouchableOpacity
        onPress={onTap}
        activeOpacity={onTap ? 0.8 : 1}
        style={styles.bubble}
      >
        {/* Dismiss button */}
        <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {mentorImage ? (
              <Image source={mentorImage} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={{ fontSize: 20 }}>{mentor.emoji}</Text>
              </View>
            )}
            <View style={styles.sparkle}>
              <Text style={{ fontSize: 8 }}>✨</Text>
            </View>
          </View>

          {/* Text */}
          <View style={styles.textBlock}>
            <Text style={styles.mentorName}>{firstName}</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        </View>

        {onTap && (
          <Text style={styles.tapHint}>Tap to chat</Text>
        )}
      </TouchableOpacity>

      {/* Bubble tail */}
      <View style={styles.tail} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    maxWidth: 280,
    zIndex: 40,
  },
  bubble: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dismissBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.bg1,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dismissText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  sparkle: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  mentorName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 17,
  },
  tapHint: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  tail: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.bg2,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    transform: [{ rotate: '-45deg' }],
    marginLeft: 12,
    marginTop: -6,
  },
});
