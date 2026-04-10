import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
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

const PRO_BENEFITS: { icon: keyof typeof Feather.glyphMap; title: string; desc: string }[] = [
  { icon: 'book-open', title: 'Unlimited Learning', desc: 'No daily caps on lessons, games & drills' },
  { icon: 'mic', title: 'Interview Lab', desc: 'AI mock interviews with Sophia Hernández' },
  { icon: 'layers', title: 'Investment Lab', desc: 'Portfolio simulations & valuation models' },
  { icon: 'smile', title: 'Industry Mascots', desc: 'Unlock themed Leo mascots — toggle in Settings!' },
  { icon: 'target', title: 'AI Mentors On-Demand', desc: 'Unlimited industry-specific mentor chats' },
  { icon: 'award', title: 'LinkedIn Certificates', desc: 'Shareable credentials for your expertise' },
];

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
  const benefitsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    triggerHaptic('success');

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
        Animated.timing(benefitsOpacity, { toValue: 1, duration: 800, delay: 1000, useNativeDriver: true }),
      ]),
    ]).start();

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
    : 'Welcome to the inner circle.\nAll features unlocked!';

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">{confettiPieces}</View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <TouchableOpacity activeOpacity={1}>
            <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
              <View style={{ height: 80 }}>
                <LeoCharacter size="md" animation="celebrating" />
              </View>

              <Animated.View style={[styles.proBadgeBig, { transform: [{ scale: badgeScale }] }]}>
                <Text style={styles.proBadgeText}>⚡ PRO</Text>
              </Animated.View>

              <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </Animated.View>

              {/* Benefits List */}
              <Animated.View style={[styles.benefitsContainer, { opacity: benefitsOpacity }]}>
                <Text style={styles.benefitsTitle}>Here's what you unlocked:</Text>
                {PRO_BENEFITS.map((b, i) => (
                  <View key={i} style={styles.benefitRow}>
                    <View style={[styles.benefitIcon, b.icon === 'smile' && styles.benefitIconHighlight]}>
                      <Feather name={b.icon} size={16} color={b.icon === 'smile' ? '#FDE68A' : '#C4B5FD'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.benefitTitle}>{b.title}</Text>
                      <Text style={styles.benefitDesc}>{b.desc}</Text>
                    </View>
                    <Feather name="check" size={14} color="#10B981" />
                  </View>
                ))}
              </Animated.View>

              <TouchableOpacity style={styles.continueBtn} onPress={onDismiss} activeOpacity={0.85}>
                <Text style={styles.continueBtnText}>Let's Go! 🚀</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </ScrollView>
      </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
    alignSelf: 'center',
    top: '50%',
    left: '50%',
    marginLeft: -150,
    marginTop: -150,
    pointerEvents: 'none',
  },
  content: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
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
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 4,
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  benefitsTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIconHighlight: {
    backgroundColor: 'rgba(245,158,11,0.2)',
  },
  benefitTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  benefitDesc: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    marginTop: 1,
  },
  continueBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 16,
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