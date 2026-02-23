import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
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

export default function FamiliarityScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<FamiliarityLevel | null>(null);
  const [showNotifOnboarding, setShowNotifOnboarding] = useState(false);

  const handleContinue = async () => {
    if (selectedLevel) {
      await storage.setFamiliarity(selectedLevel);
      await storage.setOnboardingComplete(true);
      // Write familiarity to Supabase (user_progress per-market + profiles)
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
      // Show notification onboarding before going to home
      setShowNotifOnboarding(true);
    }
  };

  const handleNotifComplete = async (_enabled: boolean) => {
    setShowNotifOnboarding(false);

    // Bridge demo XP — credit any XP earned during the pre-auth demo
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
        // Non-critical — don't block onboarding
      }
    }

    router.replace('/(tabs)/home');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>📊</Text>
          <Text style={styles.title}>Your Experience Level</Text>
          <Text style={styles.subtitle}>
            We'll adapt the content depth to match your knowledge.
          </Text>
        </View>

        {/* Level Cards */}
        <View style={styles.cardsContainer}>
          {FAMILIARITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.card,
                selectedLevel === level.id && styles.cardSelected,
              ]}
              onPress={() => setSelectedLevel(level.id as FamiliarityLevel)}
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
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 You can change this anytime in Settings
          </Text>
        </View>
      </ScrollView>

      <StickyBottomCTA
        title="Start Learning"
        onPress={handleContinue}
        disabled={!selectedLevel}
      />

      {/* Notification onboarding modal — shown after familiarity is saved */}
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
    marginBottom: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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
  infoBox: {
    marginTop: 24,
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
