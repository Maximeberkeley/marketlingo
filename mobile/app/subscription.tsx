import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { StickyBottomCTA } from '../components/StickyBottomCTA';
import { useSubscription, TRIAL_DURATION_DAYS } from '../hooks/useSubscription';
import { LeoCharacter } from '../components/mascot/LeoCharacter';
import { trackEvent } from '../lib/analytics';
import { Feather } from '@expo/vector-icons';

type PlanType = 'monthly' | 'annual';

const PRO_FEATURES = [
  { featherIcon: 'book-open' as const, title: 'Unlimited Learning', description: 'No daily caps on lessons, games & drills', highlight: 'Most Popular' },
  { featherIcon: 'layers' as const, title: 'Investment Lab', description: 'Expert scenarios, portfolio simulations, and real valuation models', highlight: 'Pro Exclusive' },
  { featherIcon: 'target' as const, title: 'AI Mentors On-Demand', description: 'Unlimited conversations with industry-specific AI mentors', highlight: null },
  { featherIcon: 'zap' as const, title: 'Advanced Trainer', description: 'Pro Reasoning, Mental Models & Common Mistakes analysis', highlight: null },
  { featherIcon: 'award' as const, title: 'LinkedIn Certificates', description: 'Shareable credentials that prove your industry expertise', highlight: null },
  { featherIcon: 'file-text' as const, title: 'Priority Content', description: 'First access to new industries and premium insights', highlight: null },
];

const TESTIMONIALS = [
  { quote: 'Finally understood aerospace supply chains after years of confusion. Worth every penny.', author: 'Sarah K., VC Associate', initials: 'SK', color: '#8B5CF6' },
  { quote: 'The Investment Lab scenarios are exactly what I needed before my LP meetings.', author: 'Marcus T., Fund Manager', initials: 'MT', color: '#3B82F6' },
  { quote: 'Went from zero to pitching aerospace founders confidently in 3 months.', author: 'Diana L., Angel Investor', initials: 'DL', color: '#EC4899' },
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

  const heroAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;
  const featuresAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('subscription_view');
    Animated.stagger(150, [
      Animated.spring(heroAnim, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }),
      Animated.spring(cardsAnim, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }),
      Animated.spring(featuresAnim, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const animStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  });

  const handleStartTrial = async () => {
    const success = await startFreeTrial();
    if (success) {
      Alert.alert('Trial Started!', `Your ${TRIAL_DURATION_DAYS}-day Pro trial is active. Explore all Pro features!`);
      router.back();
    } else {
      Alert.alert('Error', 'Trial not available');
    }
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      const result = await purchasePackage(selectedPlan);
      if (result.success) {
        trackEvent('subscription_purchase', { plan: selectedPlan });
        Alert.alert('Welcome to MarketLingo Pro!', 'You now have full access to all features.');
        router.back();
      } else if (!result.cancelled) {
        Alert.alert('Purchase Issue', result.error || 'Purchase could not be completed. Please try again.');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
    setIsPurchasing(false);
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: 160 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Already Pro */}
        {isProUser && (
          <Animated.View style={[animStyle(heroAnim)]}>
            <View style={[styles.proCard, planType === 'trial' ? styles.proCardTrial : styles.proCardActive]}>
              <View style={styles.proCardHeader}>
                <LeoCharacter size="sm" animation="celebrating" />
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
                  <Text style={styles.trialUpgradeBtnText}>Subscribe - {getPriceDisplay('annual')}/year</Text>
                </TouchableOpacity>
              )}
              {planType !== 'trial' && (
                <Text style={styles.proThankYou}>Thank you for supporting MarketLingo! Full access to all Pro features.</Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* Not Pro */}
        {!isProUser && (
          <>
            <Animated.View style={[styles.hero, animStyle(heroAnim)]}>
              <LeoCharacter size="lg" animation="waving" />
              <Text style={styles.heroTitle}>Become Investment-Ready</Text>
              <Text style={styles.heroSubtitle}>Master industries like a VC in 6 months</Text>
            </Animated.View>

            {canStartTrial && (
              <Animated.View style={[animStyle(cardsAnim)]}>
                <View style={styles.trialCard}>
                  <View style={styles.trialHeaderRow}>
                    <Feather name="flag" size={18} color={COLORS.accent} />
                    <Text style={styles.trialLabel}>Limited Time</Text>
                  </View>
                  <Text style={styles.trialTitle}>Try Pro Free for {TRIAL_DURATION_DAYS} Days</Text>
                  <Text style={styles.trialDesc}>Full access to all Pro features. No credit card required.</Text>
                  <TouchableOpacity style={styles.trialBtn} onPress={handleStartTrial}>
                    <Text style={styles.trialBtnText}>Start Free Trial</Text>
                  </TouchableOpacity>
                  <Text style={styles.trialAfter}>Then {getPriceDisplay('annual')}/year or {getPriceDisplay('monthly')}/month</Text>
                </View>
              </Animated.View>
            )}

            {canStartTrial && (
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or subscribe now</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            <Animated.View style={[styles.pricingCards, animStyle(cardsAnim)]}>
              <TouchableOpacity
                style={[styles.pricingCard, selectedPlan === 'annual' && styles.pricingCardSelected]}
                onPress={() => setSelectedPlan('annual')}
                activeOpacity={0.7}
              >
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>Save 33% — Best Value</Text>
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
                {selectedPlan === 'annual' && <View style={styles.selectedDot} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pricingCard, selectedPlan === 'monthly' && styles.pricingCardSelected]}
                onPress={() => setSelectedPlan('monthly')}
                activeOpacity={0.7}
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
                {selectedPlan === 'monthly' && <View style={styles.selectedDot} />}
              </TouchableOpacity>
            </Animated.View>
          </>
        )}

        {/* Features List — icons instead of emojis */}
        <Animated.View style={[styles.featuresSection, animStyle(featuresAnim)]}>
          <Text style={styles.featuresTitle}>What's Included in Pro</Text>
          {PRO_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name={feature.featherIcon} size={20} color={COLORS.accent} />
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
              <View style={styles.checkCircle}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Testimonials */}
        <TouchableOpacity style={styles.testimonialToggle} onPress={() => setShowTestimonials(!showTestimonials)}>
          <Text style={styles.testimonialToggleText}>What Pro members say {showTestimonials ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {showTestimonials && (
          <View style={{ gap: 8, marginTop: 8, marginBottom: 16 }}>
            {TESTIMONIALS.map((t, i) => (
              <View key={i} style={styles.testimonialCard}>
                <Text style={styles.testimonialQuote}>"{t.quote}"</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <View style={[styles.testimonialInitials, { backgroundColor: t.color + '20' }]}>
                    <Text style={[styles.testimonialInitialsText, { color: t.color }]}>{t.initials}</Text>
                  </View>
                  <Text style={styles.testimonialAuthor}>{t.author}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={isRestoring}>
          <Text style={styles.restoreText}>{isRestoring ? 'Restoring...' : 'Restore Purchases'}</Text>
        </TouchableOpacity>

        {/* Dev toggle for testing */}
        {__DEV__ && (
          <TouchableOpacity
            style={[styles.restoreButton, { marginTop: 4, backgroundColor: 'rgba(139,92,246,0.08)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 }]}
            onPress={async () => {
              await toggleProForTesting();
              Alert.alert(isProUser ? 'Pro deactivated' : 'Pro activated for testing');
            }}
          >
            <Text style={[styles.restoreText, { color: COLORS.accent }]}>
              {isProUser ? '🧪 Deactivate Pro (Dev)' : '🧪 Activate Pro (Dev)'}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.legalText}>
          Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in your Apple ID settings.
        </Text>
      </ScrollView>

      {!isProUser && (
        <StickyBottomCTA
          title={isPurchasing ? 'Processing...' : `Subscribe — ${getPriceDisplay(selectedPlan)}${selectedPlan === 'monthly' ? '/mo' : '/yr'}`}
          onPress={handlePurchase}
          loading={isPurchasing}
          disabled={isPurchasing}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  scrollContent: { paddingHorizontal: 16 },
  backButton: { marginBottom: 16 },
  backButtonText: { fontSize: 16, color: COLORS.accent, fontWeight: '500' },
  hero: { alignItems: 'center', marginBottom: 24 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center', marginTop: 12 },
  heroSubtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  pricingCards: { gap: 12, marginBottom: 24 },
  pricingCard: {
    backgroundColor: COLORS.bg2, borderRadius: 18, padding: 18, borderWidth: 2,
    borderColor: COLORS.border, position: 'relative', overflow: 'hidden',
  },
  pricingCardSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.accent + '08' },
  selectedDot: { position: 'absolute', top: 18, right: 18, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  bestValueBadge: {
    position: 'absolute', top: -1, left: -1, backgroundColor: COLORS.success,
    paddingHorizontal: 12, paddingVertical: 5, borderTopLeftRadius: 16, borderBottomRightRadius: 10,
  },
  bestValueText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  pricingContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  planName: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  planDetail: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  priceContainer: { alignItems: 'flex-end' },
  price: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  pricePeriod: { fontSize: 12, color: COLORS.textMuted },
  featuresSection: { marginBottom: 24 },
  featuresTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  featureItem: {
    flexDirection: 'row', backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  featureIcon: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.accentSoft || 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  featureContent: { flex: 1 },
  featureTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featureName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  checkmark: { fontSize: 12, color: COLORS.success || '#22C55E', fontWeight: '700' },
  featureDescription: { fontSize: 13, color: COLORS.textMuted, marginTop: 2, lineHeight: 18 },
  highlightBadge: { backgroundColor: 'rgba(139,92,246,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  highlightText: { fontSize: 9, fontWeight: '700', color: COLORS.accent, letterSpacing: 0.3 },
  restoreButton: { alignItems: 'center', paddingVertical: 12 },
  restoreText: { fontSize: 14, color: COLORS.textMuted },
  proCard: { borderRadius: 18, padding: 18, marginBottom: 24, borderWidth: 1 },
  proCardTrial: { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.3)' },
  proCardActive: { backgroundColor: 'rgba(139, 92, 246, 0.08)', borderColor: 'rgba(139, 92, 246, 0.3)' },
  proCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  proCardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  proCardSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  proThankYou: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  trialUpgradeBtn: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  trialUpgradeBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  trialCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)', borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)', borderRadius: 18, padding: 18, alignItems: 'center',
  },
  trialHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  trialLabel: { fontSize: 11, fontWeight: '700', color: '#F59E0B', letterSpacing: 0.5 },
  trialTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 6 },
  trialDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  trialBtn: { backgroundColor: '#F59E0B', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginBottom: 10 },
  trialBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  trialAfter: { fontSize: 12, color: COLORS.textMuted },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 12, color: COLORS.textMuted },
  testimonialToggle: { alignItems: 'center', paddingVertical: 8 },
  testimonialToggleText: { fontSize: 14, color: COLORS.accent, fontWeight: '600' },
  testimonialCard: { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  testimonialQuote: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 19 },
  testimonialInitials: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  testimonialInitialsText: { fontSize: 12, fontWeight: '700' },
  testimonialAuthor: { fontSize: 12, color: COLORS.textMuted },
  legalText: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', lineHeight: 15, marginTop: 8, marginBottom: 20 },
});
