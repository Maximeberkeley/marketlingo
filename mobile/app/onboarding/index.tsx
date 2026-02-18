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
import { storage } from '../../lib/storage';
import { COLORS } from '../../lib/constants';
import { markets } from '../../lib/markets';
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

        {/* Market Cards */}
        <View style={styles.cardsContainer}>
          {markets.map((market) => (
            <TouchableOpacity
              key={market.id}
              style={[
                styles.card,
                selectedIndustry === market.id && styles.cardSelected,
              ]}
              onPress={() => setSelectedIndustry(market.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardEmoji}>{market.emoji}</Text>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{market.name}</Text>
                  <Text style={styles.cardDescription}>{market.description}</Text>
                </View>
              </View>
              {selectedIndustry === market.id && (
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
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
