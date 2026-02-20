import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage } from '../../lib/storage';
import { COLORS } from '../../lib/constants';
import { markets } from '../../lib/markets';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { MascotAvatar } from '../../components/mascot/MascotAvatar';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredMarkets = markets.filter(
    (market) =>
      market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMarketData = markets.find((m) => m.id === selectedIndustry);

  const handleContinue = async () => {
    if (!selectedIndustry || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await storage.setIndustry(selectedIndustry);
      if (user) {
        // Update profile with selected market
        await supabase
          .from('profiles')
          .update({ selected_market: selectedIndustry })
          .eq('id', user.id);

        // Create initial progress
        await supabase
          .from('user_progress')
          .upsert(
            {
              user_id: user.id,
              market_id: selectedIndustry,
              current_day: 1,
              current_streak: 0,
              longest_streak: 0,
              completed_stacks: [],
            },
            { onConflict: 'user_id,market_id' }
          );
      }
      router.push('/onboarding/familiarity');
    } catch (error) {
      console.error('Error saving market selection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Mascot */}
        <View style={styles.header}>
          <MascotAvatar emoji="🦁" size="lg" />
          <Text style={styles.mascotCaption}>Pick one, master it! �️</Text>
          <Text style={styles.title}>Choose your industry</Text>
          <Text style={styles.subtitle}>
            Pick one. We'll guide you for 6 months.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search industries…"
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Count */}
        <Text style={styles.countText}>
          {filteredMarkets.length} industries available
        </Text>

        {/* 2-Column Market Grid */}
        <View style={styles.gridContainer}>
          {filteredMarkets.map((market) => (
            <TouchableOpacity
              key={market.id}
              style={[
                styles.gridCard,
                selectedIndustry === market.id && styles.gridCardSelected,
                selectedIndustry === market.id && { borderColor: market.color },
              ]}
              onPress={() => setSelectedIndustry(market.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.gridEmoji}>{market.emoji}</Text>
              <Text style={styles.gridName}>{market.name}</Text>
              {selectedIndustry === market.id && (
                <View style={[styles.gridCheck, { backgroundColor: market.color }]}>
                  <Text style={styles.gridCheckText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {selectedMarketData && (
          <View style={styles.selectedPreview}>
            <View style={styles.selectedPreviewRow}>
              <Text style={{ fontSize: 18 }}>{selectedMarketData.emoji}</Text>
              <Text style={styles.selectedPreviewName}>{selectedMarketData.name}</Text>
            </View>
            <Text style={styles.selectedPreviewDesc}>{selectedMarketData.description}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.ctaButton,
            (!selectedIndustry || isSubmitting) && styles.ctaButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedIndustry || isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaButtonText}>
              {selectedIndustry ? 'Start my 6-month journey' : 'Select an industry'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 200,
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  mascotCaption: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  countText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48%',
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  gridCardSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  gridEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  gridCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCheckText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: COLORS.bg0,
  },
  selectedPreview: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  selectedPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  selectedPreviewName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  selectedPreviewDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  ctaButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.4,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
