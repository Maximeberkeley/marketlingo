import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  Animated, Dimensions, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPE, SHADOWS } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CLOSE_DELAY_SECONDS = 15;
const COUNTER_KEY = 'ml_pro_interstitial_counter';

// Track how many activities completed to show every 2
let _sessionActivityCount = 0;

/**
 * Call this after each activity completion (game, drill, trainer scenario).
 * Returns true if interstitial should be shown.
 */
export function shouldShowInterstitial(): boolean {
  _sessionActivityCount++;
  return _sessionActivityCount % 2 === 0;
}

/** Reset counter (e.g. on app restart) */
export function resetInterstitialCounter() {
  _sessionActivityCount = 0;
}

/** Always show after lesson completion */
export function shouldShowAfterLesson(): boolean {
  return true;
}

interface ProInterstitialAdProps {
  visible: boolean;
  onClose: () => void;
  trigger?: 'lesson' | 'game' | 'drill' | 'trainer';
}

const FEATURES = [
  { icon: 'zap' as const, text: 'Unlimited lessons & drills' },
  { icon: 'trending-up' as const, text: 'Investment Lab access' },
  { icon: 'cpu' as const, text: 'AI mentor discussions' },
  { icon: 'award' as const, text: 'Industry certifications' },
];

export function ProInterstitialAd({ visible, onClose, trigger = 'lesson' }: ProInterstitialAdProps) {
  const [countdown, setCountdown] = useState(CLOSE_DELAY_SECONDS);
  const [canClose, setCanClose] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setCountdown(CLOSE_DELAY_SECONDS);
      setCanClose(false);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      progressAnim.setValue(0);
      return;
    }

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 12, useNativeDriver: true }),
    ]).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: CLOSE_DELAY_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    // Countdown
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanClose(true);
          triggerHaptic('light');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  const handleClose = useCallback(() => {
    if (!canClose) return;
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      onClose();
    });
  }, [canClose, onClose]);

  const handleUpgrade = useCallback(() => {
    onClose();
    router.push('/subscription' as any);
  }, [onClose]);

  if (!visible) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>

          {/* Close button */}
          <TouchableOpacity
            style={[styles.closeBtn, canClose && styles.closeBtnActive]}
            onPress={handleClose}
            disabled={!canClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {canClose ? (
              <Feather name="x" size={18} color={COLORS.textPrimary} />
            ) : (
              <Text style={styles.countdownText}>{countdown}</Text>
            )}
          </TouchableOpacity>

          {/* Timer progress bar */}
          <View style={styles.timerBar}>
            <Animated.View style={[styles.timerFill, { width: progressWidth }]} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Crown icon */}
            <View style={styles.crownWrap}>
              <Feather name="star" size={32} color="#F59E0B" />
            </View>

            <Text style={styles.title}>Unlock Full Access</Text>
            <Text style={styles.subtitle}>
              {trigger === 'lesson'
                ? 'Great lesson! Go Pro for unlimited learning.'
                : 'You\'re on a roll! Upgrade to keep going.'}
            </Text>

            {/* Features */}
            <View style={styles.features}>
              {FEATURES.map((f, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <Feather name={f.icon} size={16} color={COLORS.accent} />
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity style={styles.ctaBtn} onPress={handleUpgrade} activeOpacity={0.8}>
              <Text style={styles.ctaText}>Start 7-Day Free Trial</Text>
            </TouchableOpacity>

            <Text style={styles.priceText}>Then $9.99/month · Cancel anytime</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.bg0,
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    opacity: 0.5,
  },
  closeBtnActive: {
    opacity: 1,
    backgroundColor: COLORS.bg2,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  timerBar: {
    height: 3,
    backgroundColor: COLORS.border,
  },
  timerFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 28,
  },
  crownWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    ...TYPE.hero,
    fontSize: 24,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  features: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.accent + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
  },
  ctaBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOWS.accent,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  priceText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
