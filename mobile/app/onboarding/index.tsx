import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage } from '../../lib/storage';
import { COLORS } from '../../lib/constants';
import { markets } from '../../lib/markets';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';
import { getDemoXP } from '../../lib/demoXPBridge';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { triggerHaptic } from '../../lib/haptics';
import { Feather } from '@expo/vector-icons';

const STEP_LABELS = ['Industry', 'Goal', 'Level'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Market illustrations for the grid
const MARKET_ILLUSTRATIONS: Record<string, any> = {
  aerospace: require('../../assets/illustrations/aerospace.png'),
  ai: require('../../assets/illustrations/ai.png'),
  biotech: require('../../assets/illustrations/biotech.png'),
  cleanenergy: require('../../assets/illustrations/cleanenergy.png'),
  fintech: require('../../assets/illustrations/fintech.png'),
  ev: require('../../assets/illustrations/ev.png'),
  cybersecurity: require('../../assets/illustrations/cybersecurity.png'),
  robotics: require('../../assets/illustrations/robotics.png'),
  spacetech: require('../../assets/illustrations/spacetech.png'),
  healthtech: require('../../assets/illustrations/healthtech.png'),
  web3: require('../../assets/illustrations/web3.png'),
  agtech: require('../../assets/illustrations/agtech.png'),
  logistics: require('../../assets/illustrations/logistics.png'),
  climatetech: require('../../assets/illustrations/climatetech.png'),
  neuroscience: require('../../assets/illustrations/neuroscience.png'),
};

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoMarket, setDemoMarket] = useState<string | null>(null);
  const [demoXP, setDemoXP] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    (async () => {
      const { xp, market } = await getDemoXP();
      if (market && xp > 0) {
        setDemoMarket(market);
        setDemoXP(xp);
        setSelectedIndustry(market);
      }
    })();
  }, []);

  const filteredMarkets = markets.filter(
    (market) =>
      market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMarketData = markets.find((m) => m.id === selectedIndustry);

  const handleSelect = (id: string) => {
    triggerHaptic('light');
    setSelectedIndustry(id);
  };

  const handleContinue = async () => {
    if (!selectedIndustry || isSubmitting) return;
    triggerHaptic('medium');

    setIsSubmitting(true);
    try {
      await storage.setIndustry(selectedIndustry);
      if (user) {
        await supabase
          .from('profiles')
          .update({ selected_market: selectedIndustry })
          .eq('id', user.id);

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
      router.push('/onboarding/goal' as any);
    } catch (error) {
      console.error('Error saving market selection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress */}
      <OnboardingProgress currentStep={0} totalSteps={3} labels={STEP_LABELS} />

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Header — clean, no speech bubble */}
        <View style={styles.header}>
          <LeoCharacter size="lg" animation="waving" />
          <Text style={styles.title}>Choose your industry</Text>
          <Text style={styles.subtitle}>
            Your 6-month mastery journey starts here
          </Text>
        </View>

        {/* Demo bridge banner */}
        {demoMarket && demoXP > 0 && (
          <View style={styles.demoBanner}>
            <Feather name="activity" size={24} color={COLORS.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.demoBannerTitle}>Continue where you left off</Text>
              <Text style={styles.demoBannerSub}>
                Your {demoXP} XP from the demo lesson is waiting!
              </Text>
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Image source={APP_ICONS.lens} style={{ width: 18, height: 18, resizeMode: 'contain', marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search industries..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Text style={styles.countText}>
          {filteredMarkets.length} industries available
        </Text>

        {/* 2-Column Market Grid — with illustrations instead of emojis */}
        <View style={styles.gridContainer}>
          {filteredMarkets.map((market, index) => {
            const illustration = MARKET_ILLUSTRATIONS[market.id];
            return (
              <Animated.View
                key={market.id}
                style={{
                  width: (SCREEN_WIDTH - 42) / 2,
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20 + index * 5, 0],
                    }),
                  }],
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.gridCard,
                    selectedIndustry === market.id && styles.gridCardSelected,
                    selectedIndustry === market.id && { borderColor: market.color },
                  ]}
                  onPress={() => handleSelect(market.id)}
                  activeOpacity={0.7}
                >
                  {illustration ? (
                    <Image source={illustration} style={styles.gridIllustration} resizeMode="contain" />
                  ) : (
                    <View style={[styles.gridIconFallback, { backgroundColor: market.color + '20' }]}>
                      <Text style={{ fontSize: 28 }}>{market.emoji}</Text>
                    </View>
                  )}
                  <Text style={styles.gridName}>{market.name}</Text>
                  {selectedIndustry === market.id && (
                    <View style={[styles.gridCheck, { backgroundColor: market.color }]}>
                      <Text style={styles.gridCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </Animated.ScrollView>

      {/* Footer CTA */}
      <Animated.View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 20, opacity: fadeAnim },
        ]}
      >
        {selectedMarketData && (
          <View style={styles.selectedPreview}>
            <View style={styles.selectedPreviewRow}>
              {MARKET_ILLUSTRATIONS[selectedMarketData.id] && (
                <Image source={MARKET_ILLUSTRATIONS[selectedMarketData.id]} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
              )}
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
              {selectedIndustry ? 'Continue' : 'Select an industry'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
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
    paddingBottom: 220,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
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
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  gridCardSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  gridIllustration: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  gridIconFallback: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  demoBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
    marginBottom: 2,
  },
  demoBannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
