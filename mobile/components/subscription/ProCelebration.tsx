import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { COLORS } from '../../lib/constants';
import { LeoCharacter } from '../mascot/LeoCharacter';
import { triggerHaptic } from '../../lib/haptics';

const { width, height } = Dimensions.get('window');

const CONFETTI_COLORS = ['#8B5CF6', '#F59E0B', '#3B82F6', '#EC4899', '#10B981', '#FFD700'];

function ConfettiPiece({ delay, startX }: { delay: number; startX: number }) {
  const fall = useRef(new Animated.Value(-50)).current;
  const wobble = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const size = 6 + Math.random() * 8;
  const isRound = Math.random() > 0.5;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fall, {
        toValue: height + 50,
        duration: 2500 + Math.random() * 1500,
        delay,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(wobble, { toValue: 30, duration: 300 + Math.random() * 200, useNativeDriver: true }),
          Animated.timing(wobble, { toValue: -30, duration: 300 + Math.random() * 200, useNativeDriver: true }),
        ])
      ),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 3500,
        delay: delay + 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: 0,
        width: size,
        height: isRound ? size : size * 2.5,
        borderRadius: isRound ? size / 2 : 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: fall }, { translateX: wobble }, { rotate: `${Math.random() * 360}deg` }],
      }}
    />
  );
}

interface ProCelebrationProps {
  visible: boolean;
  onDismiss: () => void;
  planType: 'trial' | 'monthly' | 'annual';
}

export function ProCelebration({ visible, onDismiss, planType }: ProCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    triggerHaptic('success');

    // Sequence: glow → badge burst → text fade
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 6, useNativeDriver: true }),
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
          ])
        ),
        Animated.spring(badgeScale, { toValue: 1, tension: 100, friction: 5, delay: 300, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 600, delay: 600, useNativeDriver: true }),
      ]),
    ]).start();

    // Extra haptics for the "epic" feel
    setTimeout(() => triggerHaptic('success'), 400);
    setTimeout(() => triggerHaptic('medium'), 800);
  }, [visible]);

  if (!visible) return null;

  const confettiPieces = Array.from({ length: 40 }, (_, i) => (
    <ConfettiPiece key={i} delay={i * 60} startX={Math.random() * width} />
  ));

  const title = planType === 'trial' ? 'Pro Trial Activated!' : "You're Pro Now!";
  const subtitle = planType === 'trial'
    ? '7 days of unlimited access.\nMake the most of it!'
    : 'Welcome to the inner circle.\nAll features unlocked forever.';

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        {/* Confetti layer */}
        <View style={StyleSheet.absoluteFill}>{confettiPieces}</View>

        {/* Glow ring */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              opacity: glowAnim,
              transform: [
                { scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.3] }) },
              ],
            },
          ]}
        />

        {/* Center content */}
        <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
          <LeoCharacter size="lg" animation="celebrating" />

          {/* PRO badge burst */}
          <Animated.View style={[styles.proBadgeBig, { transform: [{ scale: badgeScale }] }]}>
            <Text style={styles.proBadgeText}>⚡ PRO</Text>
          </Animated.View>

          <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </Animated.View>

          <Animated.View style={{ opacity: textOpacity }}>
            <TouchableOpacity style={styles.continueBtn} onPress={onDismiss} activeOpacity={0.85}>
              <Text style={styles.continueBtnText}>Let's Go! 🚀</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },
  content: {
    alignItems: 'center',
    gap: 20,
  },
  proBadgeBig: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  proBadgeText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
  },
  title: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  continueBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  continueBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
