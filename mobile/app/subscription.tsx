import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { storage } from '../lib/storage';
import { COLORS } from '../lib/constants';
import { StickyBottomCTA } from '../components/StickyBottomCTA';

type PlanType = 'monthly' | 'annual';

const PRO_FEATURES = [
  { icon: '♾️', title: 'Unlimited Access', description: 'No daily limits on lessons, games & drills' },
  { icon: '📚', title: 'Investment Lab', description: 'Expert-level scenarios & certification' },
  { icon: '🧠', title: 'AI Mentor', description: 'Unlimited conversations with mentors' },
  { icon: '✨', title: 'Premium Content', description: 'Priority content & exclusive insights' },
  { icon: '🏆', title: 'Pro Certificates', description: 'Shareable LinkedIn-ready credentials' },
  { icon: '🛡️', title: 'Priority Support', description: 'Get help when you need it most' },
];

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      // TODO: Integrate RevenueCat purchase
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await storage.setUserTier('pro');
      router.back();
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    // TODO: Integrate RevenueCat restore
    console.log('Restore purchases');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: 160 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.crownContainer}>
            <Text style={styles.crownEmoji}>👑</Text>
          </View>
          <Text style={styles.heroTitle}>Become Investment-Ready</Text>
          <Text style={styles.heroSubtitle}>
            Master industries like a professional with advanced training
          </Text>
        </View>

        {/* Pricing Cards */}
        <View style={styles.pricingCards}>
          {/* Annual */}
          <TouchableOpacity
            style={[styles.pricingCard, selectedPlan === 'annual' && styles.pricingCardSelected]}
            onPress={() => setSelectedPlan('annual')}
          >
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>Most Popular - Save 33%</Text>
            </View>
            <View style={styles.pricingContent}>
              <View>
                <Text style={styles.planName}>Yearly</Text>
                <Text style={styles.planDetail}>$4.99/month, billed annually</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>$59.99</Text>
                <Text style={styles.pricePeriod}>/year</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Monthly */}
          <TouchableOpacity
            style={[styles.pricingCard, selectedPlan === 'monthly' && styles.pricingCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.pricingContent}>
              <View>
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planDetail}>Flexible, cancel anytime</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>$7.99</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>✨ Pro Features</Text>
          {PRO_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>{feature.icon}</Text>
              </View>
              <View style={styles.featureContent}>
                <View style={styles.featureTitleRow}>
                  <Text style={styles.featureName}>{feature.title}</Text>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Restore */}
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>

      <StickyBottomCTA
        title={isPurchasing ? 'Processing...' : 'Subscribe Now'}
        onPress={handlePurchase}
        loading={isPurchasing}
        disabled={isPurchasing}
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
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '500',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F59E0B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  crownEmoji: {
    fontSize: 40,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  pricingCards: {
    gap: 12,
    marginBottom: 24,
  },
  pricingCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  pricingCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '10',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    left: 12,
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestValueText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pricingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  planDetail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pricePeriod: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  checkmark: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
