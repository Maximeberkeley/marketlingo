import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import * as ExpoNotifications from 'expo-notifications';
import { COLORS } from '../../lib/constants';

interface NotificationOnboardingProps {
  visible: boolean;
  onComplete: (enabled: boolean) => void;
}

const benefits = [
  { icon: '🕐', title: 'Daily Reminders', description: 'Never miss a lesson with smart reminders at your preferred time', color: '#8B5CF6' },
  { icon: '🔥', title: 'Streak Protection', description: 'Get warned before your learning streak expires', color: '#F97316' },
  { icon: '📰', title: 'Breaking News', description: 'Stay ahead with real-time industry updates', color: '#3B82F6' },
];

export function NotificationOnboarding({ visible, onComplete }: NotificationOnboardingProps) {
  const [step, setStep] = useState(0);
  const [isEnabling, setIsEnabling] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const goToStep2 = () => {
    Animated.timing(slideAnim, { toValue: -300, duration: 220, useNativeDriver: true }).start(() => {
      setStep(1);
      slideAnim.setValue(300);
      Animated.spring(slideAnim, { toValue: 0, damping: 22, useNativeDriver: true }).start();
    });
  };

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const { status } = await ExpoNotifications.requestPermissionsAsync();
      onComplete(status === 'granted');
    } catch {
      onComplete(false);
    }
    setIsEnabling(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => onComplete(false)}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
            {step === 0 ? (
              <>
                {/* Hero */}
                <View style={styles.heroWrap}>
                  <View style={styles.heroIcon}>
                    <Text style={{ fontSize: 40 }}>🔔</Text>
                  </View>
                  <Text style={styles.heroTitle}>Stay on Track</Text>
                  <Text style={styles.heroSub}>
                    Enable notifications to get the most out of your learning journey
                  </Text>
                </View>

                {/* Benefits */}
                <View style={styles.benefitsList}>
                  {benefits.map((b) => (
                    <View key={b.title} style={styles.benefitRow}>
                      <View style={[styles.benefitIcon, { backgroundColor: b.color + '25' }]}>
                        <Text style={{ fontSize: 20 }}>{b.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.benefitTitle}>{b.title}</Text>
                        <Text style={styles.benefitDesc}>{b.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* CTA */}
                <TouchableOpacity style={styles.primaryBtn} onPress={goToStep2} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnText}>Continue →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipBtn} onPress={() => onComplete(false)}>
                  <Text style={styles.skipBtnText}>Maybe later</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Step 2: permission request */}
                <View style={styles.heroWrap}>
                  <View style={styles.heroIconRound}>
                    <Text style={{ fontSize: 34 }}>🔔</Text>
                  </View>
                  <Text style={styles.heroTitle}>Allow Notifications</Text>
                  <Text style={styles.heroSub}>
                    Tap "Allow" on the next prompt to receive personalized reminders and updates
                  </Text>
                </View>

                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>You'll receive:</Text>
                  {[
                    { dot: '#8B5CF6', text: 'Daily lesson reminders at your chosen time' },
                    { dot: '#F97316', text: 'Streak expiration warnings' },
                    { dot: '#3B82F6', text: 'Breaking industry news (optional)' },
                  ].map((item, i) => (
                    <View key={i} style={styles.summaryRow}>
                      <View style={[styles.dot, { backgroundColor: item.dot }]} />
                      <Text style={styles.summaryText}>{item.text}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleEnable}
                  disabled={isEnabling}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>
                    {isEnabling ? 'Enabling...' : 'Enable Notifications'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipBtn} onPress={() => onComplete(false)}>
                  <Text style={styles.skipBtnText}>Skip for now</Text>
                </TouchableOpacity>
                <Text style={styles.privacyNote}>
                  You can change your preferences anytime in Settings
                </Text>
              </>
            )}
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  card: {
    backgroundColor: COLORS.bg1, borderRadius: 24, padding: 24,
    width: '100%', maxWidth: 400,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  heroWrap: { alignItems: 'center', marginBottom: 24 },
  heroIcon: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heroIconRound: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' },
  heroSub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  benefitsList: { gap: 10, marginBottom: 24 },
  benefitRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 12, borderRadius: 12,
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border,
  },
  benefitIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  benefitTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  benefitDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17, marginTop: 2 },
  primaryBtn: {
    backgroundColor: COLORS.accent, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginBottom: 10,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipBtnText: { fontSize: 13, color: COLORS.textMuted },
  summaryBox: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 24, gap: 8,
  },
  summaryLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  summaryText: { fontSize: 13, color: COLORS.textPrimary },
  privacyNote: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginTop: 12 },
});
