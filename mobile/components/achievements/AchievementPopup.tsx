import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { COLORS } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const LEO_CELEBRATING = require('../../assets/mascot/leo-celebrating.png');
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TIER_STYLES: Record<string, { color: string; bg: string; border: string; label: string }> = {
  platinum: { color: '#E5E7EB', bg: 'rgba(229,231,235,0.12)', border: 'rgba(229,231,235,0.3)', label: 'PLATINUM' },
  gold: { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', label: 'GOLD' },
  silver: { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', label: 'SILVER' },
  bronze: { color: '#D97706', bg: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.3)', label: 'BRONZE' },
};

interface AchievementPopupProps {
  visible: boolean;
  achievement: {
    name: string;
    description: string;
    xpReward: number;
    tier: string;
    icon: string;
  } | null;
  onDismiss: () => void;
}

export function AchievementPopup({ visible, achievement, onDismiss }: AchievementPopupProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const leoAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && achievement) {
      triggerHaptic('success');
      scaleAnim.setValue(0);
      leoAnim.setValue(0);
      confettiAnim.setValue(0);
      glowAnim.setValue(0);

      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.parallel([
          Animated.spring(leoAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
          Animated.timing(confettiAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
              Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
            ])
          ),
        ]),
      ]).start();
    }
  }, [visible, achievement]);

  if (!achievement) return null;

  const tier = TIER_STYLES[achievement.tier] || TIER_STYLES.bronze;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
              borderColor: tier.border,
            },
          ]}
        >
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                borderColor: tier.color,
                opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] }),
                transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
              },
            ]}
          />

          {/* Leo celebrating */}
          <Animated.View
            style={[
              styles.leoContainer,
              {
                transform: [
                  { scale: leoAnim },
                  { translateY: leoAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [40, -10, 0] }) },
                  { rotate: leoAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '-5deg', '0deg'] }) },
                ],
              },
            ]}
          >
            <Image source={LEO_CELEBRATING} style={styles.leoImage} resizeMode="contain" />
          </Animated.View>

          {/* Content */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Tier badge */}
            <View style={[styles.tierBadge, { backgroundColor: tier.bg, borderColor: tier.border }]}>
              <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
            </View>

            <Text style={styles.title}>Achievement Unlocked!</Text>
            <Text style={styles.achievementName}>{achievement.name}</Text>
            <Text style={styles.description}>{achievement.description}</Text>

            {/* XP reward */}
            <View style={styles.xpBadge}>
              <MaterialCommunityIcons name="flask" size={16} color={COLORS.xpBadgeIcon} />
              <Text style={styles.xpText}>+{achievement.xpReward} XP</Text>
            </View>
          </ScrollView>

          {/* Dismiss button */}
          <TouchableOpacity style={[styles.dismissBtn, { backgroundColor: tier.color }]} onPress={onDismiss}>
            <Text style={styles.dismissText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: SCREEN_WIDTH - 48,
    maxHeight: '88%',
    backgroundColor: COLORS.bg1,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'visible',
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 10,
    position: 'relative',
  },
  contentScroll: {
    alignSelf: 'stretch',
    flexGrow: 0,
    flexShrink: 1,
  },
  glowRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    borderWidth: 3,
  },
  leoContainer: {
    marginTop: -20,
    marginBottom: -10,
    zIndex: 10,
  },
  leoImage: {
    width: 140,
    height: 140,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  tierBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  achievementName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(167,139,250,0.12)',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
    marginTop: 14,
  },
  xpText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.xpBadgeIcon,
  },
  dismissBtn: {
    marginTop: 16,
    marginHorizontal: 24,
    width: SCREEN_WIDTH - 96,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});
