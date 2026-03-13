import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { useSubscription, TRIAL_DURATION_DAYS } from '../../hooks/useSubscription';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type PromoTrigger = 'lesson_complete' | 'feature_gate' | 'random' | 'low_engagement' | 'manual';

interface ProUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: PromoTrigger | null;
  featureName?: string;
}

const triggerContent: Record<PromoTrigger, { headline: string; subheadline: string; emoji: string }> = {
  lesson_complete: {
    headline: "You're crushing it! ",
    subheadline: "Keep the momentum going with unlimited Pro access",
    emoji: "",
  },
  feature_gate: {
    headline: "Unlock This Pro Feature",
    subheadline: "Get access to advanced tools that accelerate your learning",
    emoji: "",
  },
  random: {
    headline: "Ready to Level Up?",
    subheadline: "Join serious learners mastering deep-tech markets",
    emoji: "⚡",
  },
  low_engagement: {
    headline: "We Saved Your Spot!",
    subheadline: "Come back stronger with full Pro access",
    emoji: "",
  },
  manual: {
    headline: "Go Pro Today",
    subheadline: "Unlock the complete MarketLingo experience",
    emoji: "",
  },
};

const benefits = [
  { icon: '∞', text: 'Unlimited lessons & games' },
  { icon: '', text: 'Investment Lab access' },
  { icon: '', text: 'AI mentors on-demand' },
  { icon: '', text: 'Pro Trainer scenarios' },
];

export function ProUpsellModal({ isOpen, onClose, trigger = 'manual', featureName }: ProUpsellModalProps) {
  const { canStartTrial, startFreeTrial, getPackage } = useSubscription();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;

  const content = trigger ? triggerContent[trigger] : triggerContent.manual;
  const monthlyPrice = getPackage('monthly')?.product?.priceString || '$9.99/mo';

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 25, stiffness: 300, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1, delay: 150, damping: 15, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
      ]).start();
      iconScale.setValue(0);
    }
  }, [isOpen]);

  const handleStartTrial = async () => {
    const success = await startFreeTrial();
    if (success) onClose();
  };

  const handleViewPlans = () => {
    onClose();
    router.push('/subscription');
  };

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header gradient bar */}
          <View style={styles.header}>
            <View style={styles.floatingParticle1}><Text style={{ fontSize: 14 }}>✨</Text></View>
            <View style={styles.floatingParticle2}><Text style={{ fontSize: 12 }}>⚡</Text></View>
            <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }] }]}>
              <Text style={{ fontSize: 40 }}>{canStartTrial ? '' : ''}</Text>
            </Animated.View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Headline */}
            <Text style={styles.headline}>{content.headline}</Text>
            <Text style={styles.subheadline}>{content.subheadline}</Text>
            {featureName && trigger === 'feature_gate' && (
              <Text style={styles.featureLabel}>"{featureName}" requires Pro</Text>
            )}

            {/* Benefits grid */}
            <View style={styles.benefitsGrid}>
              {benefits.map((b, i) => (
                <View key={i} style={styles.benefitItem}>
                  <Text style={{ fontSize: 20 }}>{b.icon}</Text>
                  <Text style={styles.benefitText}>{b.text}</Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            {canStartTrial ? (
              <>
                <TouchableOpacity style={styles.ctaPrimary} onPress={handleStartTrial} activeOpacity={0.85}>
                  <Text style={styles.ctaText}> Try {TRIAL_DURATION_DAYS} Days Free</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ctaSecondary} onPress={handleViewPlans}>
                  <Text style={styles.ctaSecondaryText}>View pricing plans</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.ctaUpgrade} onPress={handleViewPlans} activeOpacity={0.85}>
                  <Text style={styles.ctaText}> Upgrade to Pro</Text>
                </TouchableOpacity>
                <Text style={styles.priceLabel}>Starting at {monthlyPrice} • Cancel anytime</Text>
              </>
            )}

            <TouchableOpacity style={styles.maybeLater} onPress={onClose}>
              <Text style={styles.maybeLaterText}>Maybe later</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bg1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    overflow: 'hidden',
  },
  header: {
    height: 130,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingParticle1: { position: 'absolute', top: 20, left: 30, opacity: 0.5 },
  floatingParticle2: { position: 'absolute', bottom: 24, right: 36, opacity: 0.4 },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  scrollArea: { flex: 1 },
  content: { padding: 24, paddingBottom: 36 },
  headline: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subheadline: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  featureLabel: {
    fontSize: 13,
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 16,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 20,
  },
  benefitItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.bg2,
  },
  benefitText: { fontSize: 12, color: COLORS.textMuted, flex: 1 },
  ctaPrimary: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  ctaUpgrade: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ctaSecondary: { alignItems: 'center', paddingVertical: 10 },
  ctaSecondaryText: { fontSize: 13, color: COLORS.textMuted },
  priceLabel: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  maybeLater: { alignItems: 'center', paddingVertical: 8, marginTop: 4 },
  maybeLaterText: { fontSize: 13, color: COLORS.textMuted },
});
