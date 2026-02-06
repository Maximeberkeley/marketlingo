import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage, FamiliarityLevel } from '../../lib/storage';
import { FAMILIARITY_LEVELS, COLORS } from '../../lib/constants';
import { StickyBottomCTA } from '../../components/StickyBottomCTA';

export default function FamiliarityScreen() {
  const insets = useSafeAreaInsets();
  const [selectedLevel, setSelectedLevel] = useState<FamiliarityLevel | null>(null);

  const handleContinue = async () => {
    if (selectedLevel) {
      await storage.setFamiliarity(selectedLevel);
      await storage.setOnboardingComplete(true);
      router.replace('/(tabs)/home');
    }
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
