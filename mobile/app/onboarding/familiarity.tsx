import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage, FamiliarityLevel } from '../../lib/storage';
import { FAMILIARITY_LEVELS, COLORS } from '../../lib/constants';
import { StickyBottomCTA } from '../../components/StickyBottomCTA';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { NotificationOnboarding } from '../../components/onboarding/NotificationOnboarding';
import { applyDemoXP } from '../../lib/demoXPBridge';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { MascotAvatar } from '../../components/mascot/MascotAvatar';
import { triggerHaptic } from '../../lib/haptics';

const STEP_LABELS = ['Industry', 'Goal', 'Level'];

const LEO_LEVEL_REACTIONS: Record<string, string> = {
  beginner: "Perfect — we'll start from scratch! No jargon, I promise 🤝",
  intermediate: "Nice! I'll skip the basics and go straight to the good stuff 🎯",
  advanced: "Respect! Expert-mode unlocked. Let's get deep 🧠",
};

export default function FamiliarityScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<FamiliarityLevel | null>(null);
  const [showNotifOnboarding, setShowNotifOnboarding] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const reactionOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (selectedLevel) {
      reactionOpacity.setValue(0);
      Animated.timing(reactionOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [selectedLevel]);

  const handleSelect = (level: FamiliarityLevel) => {
    triggerHaptic('light');
    setSelectedLevel(level);
  };

  const handleContinue = async () => {
    if (!selectedLevel) return;
    triggerHaptic('success');

    await storage.setFamiliarity(selectedLevel);
    await storage.setOnboardingComplete(true);

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_market')
        .eq('id', user.id)
        .single();

      await supabase
        .from('profiles')
        .update({ familiarity_level: selectedLevel })
        .eq('id', user.id);

      if (profile?.selected_market) {
        await supabase
          .from('user_progress')
          .upsert(
            {
              user_id: user.id,
              market_id: profile.selected_market,
              familiarity_level: selectedLevel,
            },
            { onConflict: 'user_id,market_id' }
          );
      }
    }
    setShowNotifOnboarding(true);
  };

  const handleNotifComplete = async (_enabled: boolean) => {
    setShowNotifOnboarding(false);

    if (user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('selected_market')
          .eq('id', user.id)
          .single();

        if (profile?.selected_market) {
          const demoXP = await applyDemoXP(user.id, profile.selected_market);
          if (demoXP > 0) {
            Alert.alert(
              'Welcome bonus! 🎉',
              `Your ${demoXP} XP from the demo lesson has been credited to your account. Keep that momentum going!`,
            );
          }
        }
      } catch (e) {
        // Non-critical
      }
    }

    router.replace('/(tabs)/home');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress */}
      <OnboardingProgress currentStep={2} totalSteps={3} labels={STEP_LABELS} />

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <MascotAvatar emoji="🦁" size="lg" />
          <Text style={styles.title}>Your Experience Level</Text>
          <Text style={styles.subtitle}>
            I'll adapt the content depth to match your knowledge
          </Text>
        </View>

        {/* Leo reaction bubble */}
        {selectedLevel && (
          <Animated.View style={[styles.reactionBubble, { opacity: reactionOpacity }]}>
            <Text style={styles.reactionEmoji}>🦁</Text>
            <Text style={styles.reactionText}>{LEO_LEVEL_REACTIONS[selectedLevel]}</Text>
          </Animated.View>
        )}

        {/* Level Cards */}
        <View style={styles.cardsContainer}>
          {FAMILIARITY_LEVELS.map((level, index) => (
            <Animated.View
              key={level.id}
              style={{
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20 + index * 8, 0],
                  }),
                }],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.card,
                  selectedLevel === level.id && styles.cardSelected,
                ]}
                onPress={() => handleSelect(level.id as FamiliarityLevel)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardEmoji}>{level.icon}</Text>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{level.name}</Text>
                    <Text style={styles.cardDescription}>{level.description}</Text>
                  </View>
                </View>
                {selectedLevel === level.id && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Almost done indicator */}
        <View style={styles.almostDone}>
          <Text style={styles.almostDoneEmoji}>🎉</Text>
          <Text style={styles.almostDoneText}>
            Almost done! One more tap and you're in.
          </Text>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 You can change this anytime in Settings
          </Text>
        </View>
      </Animated.ScrollView>

      <StickyBottomCTA
        title="Start Learning 🚀"
        onPress={handleContinue}
        disabled={!selectedLevel}
      />

      <NotificationOnboarding
        visible={showNotifOnboarding}
        onComplete={handleNotifComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.accent + '15',
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  reactionEmoji: { fontSize: 24 },
  reactionText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}15`,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  almostDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    padding: 14,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
  },
  almostDoneEmoji: { fontSize: 20 },
  almostDoneText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '500',
  },
  infoBox: {
    marginTop: 12,
    padding: 16,
    backgroundColor: COLORS.bg1,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
