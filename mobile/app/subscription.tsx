import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { StickyBottomCTA } from '../components/StickyBottomCTA';
import { useSubscription, TRIAL_DURATION_DAYS } from '../hooks/useSubscription';

type PlanType = 'monthly' | 'annual';

const PRO_FEATURES = [
  { icon: '♾️', title: 'Unlimited Learning', description: 'No daily caps on lessons, games & drills', highlight: 'Most Popular' },
  { icon: '�', title: 'Investment Lab', description: 'Expert scenarios, portfolio simulations, and real valuation models', highlight: 'Pro Exclusive' },
  { icon: '🧠', title: 'AI Mentors On-Demand', description: 'Unlimited conversations with industry-specific AI mentors', highlight: null },
  { icon: '🎯', title: 'Advanced Trainer', description: 'Pro Reasoning, Mental Models & Common Mistakes analysis', highlight: null },
  { icon: '🏆', title: 'LinkedIn Certificates', description: 'Shareable credentials that prove your industry expertise', highlight: null },
  { icon: '�', title: 'Priority Content', description: 'First access to new industries and premium insights', highlight: null },
];

const TESTIMONIALS = [
  { quote: 'Finally understood aerospace supply chains after years of confusion. Worth every penny.', author: 'Sarah K., VC Associate', avatar: '👩‍💼' },
  { quote: 'The Investment Lab scenarios are exactly what I needed before my LP meetings.', author: 'Marcus T., Fund Manager', avatar: '👨‍💼' },
  { quote: 'Went from zero to pitching aerospace founders confidently in 3 months.', author: 'Diana L., Angel Investor', avatar: '👩‍🚀' },
];

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const {
    isProUser, isLoading, purchasePackage, getPackage, restorePurchases,
    getExpirationDate, willRenew, toggleProForTesting, isNative,
    trialStatus, canStartTrial, startFreeTrial, planType,
  } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showTestimonials, setShowTestimonials] = useState(false);

  const handleStartTrial = async () => {
    const success = await startFreeTrial();
    if (success) {
      Alert.alert('🎉 Trial Started!', `Your ${TRIAL_DURATION_DAYS}-day Pro trial is active. Explore all Pro features!`);
      router.back();
    } else {
      Alert.alert('Error', 'Trial not available');
    }
  };

  const handlePurchase = async () => {
    const pkg = getPackage(selectedPlan);
    if (!pkg) {
      toggleProForTesting();
      Alert.alert('Pro activated for testing!');
      return;
    }
    setIsPurchasing(true);
    const result = await purchasePackage(pkg);
    setIsPurchasing(false);
    if (result.success) {
      Alert.alert('Welcome to MarketLingo Pro! 🎉');
      router.back();
    } else if (!result.cancelled) {
      Alert.alert('Error', result.error || 'Purchase failed. Please try again.');
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    const result = await restorePurchases();
    setIsRestoring(false);
    if (result.success) {
      if (result.restored) Alert.alert('Success', 'Subscription restored!');
      else Alert.alert('Info', 'No active subscription found');
    } else {
      Alert.alert('Error', result.error || 'Restore failed');
    }
  };

  const getPriceDisplay = (type: PlanType) => {
    const pkg = getPackage(type);
    return pkg?.product?.priceString || (type === 'monthly' ? '$9.99' : '$79.99');
  };

  const expirationDate = getExpirationDate();

  if (isLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

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

        {/* Already Pro */}
        {isProUser && (
          <View style={[styles.proCard, planType === 'trial' ? styles.proCardTrial : styles.proCardActive]}>
            <View style={styles.proCardHeader}>
              <Text style={{ fontSize: 28 }}>{planType === 'trial' ? '🎁' : '👑'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.proCardTitle}>
                  {planType === 'trial' ? `Trial: ${trialStatus.daysRemaining} days left` : "You're a Pro!"}
                </Text>
                <Text style={styles.proCardSub}>
                  {expirationDate
                    ? `${planType === 'trial' ? 'Ends' : (willRenew() ? 'Renews' : 'Expires')} ${expirationDate.toLocaleDateString()}`
                    : 'Full access activated'}
                </Text>
              </View>
            </View>
            {planType === 'trial' && (
              <TouchableOpacity style={styles.trialUpgradeBtn} onPress={handlePurchase}>
                <Text style={styles.trialUpgradeBtnText}>👑 Subscribe - {getPriceDisplay('annual')}/year</Text>
              </TouchableOpacity>
            )}
            {planType !== 'trial' && (
              <Text style={styles.proThankYou}>Thank you for supporting MarketLingo! Full access to all Pro features.</Text>
            )}
          </View>
        )}

        {/* Not Pro - Show Upgrade */}
        {!isProUser && (
          <>
            {/* Hero */}
            <View style={styles.hero}>
              <View style={styles.crownContainer}>
                <Text style={styles.crownEmoji}>👑</Text>
              </View>
              <Text style={styles.heroTitle}>Become Investment-Ready</Text>
              <Text style={styles.heroSubtitle}>Master industries like a VC in 6 months</Text>
            </View>

            {/* Trial CTA */}
            {canStartTrial && (
              <View style={styles.trialCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Text style={{ fontSize: 16 }}>🎁</Text>
                  <Text style={styles.trialLabel}>Limited Time</Text>
                </View>
                <Text style={styles.trialTitle}>Try Pro Free for {TRIAL_DURATION_DAYS} Days</Text>
                <Text style={styles.trialDesc}>Full access to all Pro features. No credit card required.</Text>
                <TouchableOpacity style={styles.trialBtn} onPress={handleStartTrial}>
                  <Text style={styles.trialBtnText}>✨ Start Free Trial</Text>
                </TouchableOpacity>
                <Text style={styles.trialAfter}>Then {getPriceDisplay('annual')}/year or {getPriceDisplay('monthly')}/month</Text>
              </View>
            )}

            {canStartTrial && (
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or subscribe now</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            {/* Pricing Cards */}
            <View style={styles.pricingCards}>
              <TouchableOpacity
                style={[styles.pricingCard, selectedPlan === 'annual' && styles.pricingCardSelected]}
                onPress={() => setSelectedPlan('annual')}
              >
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>Save 33% - Best Value</Text>
                </View>
                <View style={styles.pricingContent}>
                  <View>
                    <Text style={styles.planName}>Yearly</Text>
                    <Text style={styles.planDetail}>$6.67/month, billed annually</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>{getPriceDisplay('annual')}</Text>
                    <Text style={styles.pricePeriod}>/year</Text>
                  </View>
                </View>
              </TouchableOpacity>

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
                    <Text style={styles.price}>{getPriceDisplay('monthly')}</Text>
                    <Text style={styles.pricePeriod}>/month</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>✨ What's Included in Pro</Text>
          {PRO_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>{feature.icon}</Text>
              </View>
              <View style={styles.featureContent}>
                <View style={styles.featureTitleRow}>
                  <Text style={styles.featureName}>{feature.title}</Text>
                  {feature.highlight && (
                    <View style={styles.highlightBadge}>
                      <Text style={styles.highlightText}>{feature.highlight}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          ))}
        </View>

        {/* Testimonials */}
        <TouchableOpacity style={styles.testimonialToggle} onPress={() => setShowTestimonials(!showTestimonials)}>
          <Text style={styles.testimonialToggleText}>⭐ What Pro members say {showTestimonials ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {showTestimonials && (
          <View style={{ gap: 8, marginTop: 8, marginBottom: 16 }}>
            {TESTIMONIALS.map((t, i) => (
              <View key={i} style={styles.testimonialCard}>
                <Text style={styles.testimonialQuote}>"{t.quote}"</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <Text>{t.avatar}</Text>
                  <Text style={styles.testimonialAuthor}>{t.author}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Restore */}
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={isRestoring}>
          <Text style={styles.restoreText}>{isRestoring ? 'Restoring...' : 'Restore Purchases'}</Text>
        </TouchableOpacity>

        {/* Legal */}
        <Text style={styles.legalText}>
          Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in your Apple ID settings.
        </Text>
      </ScrollView>

      {!isProUser && (
        <StickyBottomCTA
          title={isPurchasing ? 'Processing...' : `Subscribe - ${getPriceDisplay(selectedPlan)}${selectedPlan === 'monthly' ? '/mo' : '/yr'}`}
          onPress={handlePurchase}
          loading={isPurchasing}
          disabled={isPurchasing}
        />
      )}
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
  proCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  proCardTrial: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  proCardActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  proCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  proCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  proCardSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  proThankYou: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  trialUpgradeBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  trialUpgradeBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  trialCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  trialLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  trialTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  trialDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 14,
  },
  trialBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 8,
  },
  trialBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  trialAfter: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  highlightBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  highlightText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.accent,
  },
  testimonialToggle: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 4,
  },
  testimonialToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  testimonialCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testimonialQuote: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  legalText: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
});
