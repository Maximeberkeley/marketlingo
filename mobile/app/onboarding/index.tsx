import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage } from '../../lib/storage';
import { INDUSTRIES, COLORS } from '../../lib/constants';
import { StickyBottomCTA } from '../../components/StickyBottomCTA';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  const handleContinue = async () => {
    if (selectedIndustry) {
      await storage.setIndustry(selectedIndustry);
      // Write to Supabase profiles
      if (user) {
        await supabase
          .from('profiles')
          .upsert({ id: user.id, selected_market: selectedIndustry }, { onConflict: 'id' });
      }
      router.push('/onboarding/familiarity');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🚀</Text>
          <Text style={styles.title}>Choose Your Industry</Text>
          <Text style={styles.subtitle}>
            Master one industry at a time. You can always switch later.
          </Text>
        </View>

        {/* Industry Cards */}
        <View style={styles.cardsContainer}>
          {INDUSTRIES.map((industry) => (
            <TouchableOpacity
              key={industry.id}
              style={[
                styles.card,
                selectedIndustry === industry.id && styles.cardSelected,
                industry.comingSoon && styles.cardDisabled,
              ]}
              onPress={() => !industry.comingSoon && setSelectedIndustry(industry.id)}
              activeOpacity={industry.comingSoon ? 1 : 0.7}
              disabled={industry.comingSoon}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardEmoji}>{industry.emoji}</Text>
                <View style={styles.cardText}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{industry.name}</Text>
                    {industry.comingSoon && (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>Soon</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDescription}>{industry.description}</Text>
                </View>
              </View>
              {selectedIndustry === industry.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <StickyBottomCTA
        title="Continue"
        onPress={handleContinue}
        disabled={!selectedIndustry}
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
  header: {
    alignItems: 'center',
    marginTop: 40,
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
  cardDisabled: {
    opacity: 0.5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  comingSoonBadge: {
    backgroundColor: COLORS.bg1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
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
});
