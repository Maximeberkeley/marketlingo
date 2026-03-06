import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { MascotAvatar } from '../../components/mascot/MascotAvatar';
import { getMarketName, getMarketEmoji } from '../../lib/markets';
import { StickyBottomCTA } from '../../components/StickyBottomCTA';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { triggerHaptic } from '../../lib/haptics';

export type LearningGoal = 'join_industry' | 'invest' | 'build_startup' | 'curiosity';

interface GoalOption {
  id: LearningGoal;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  emphasis: string[];
}

const goalOptions: GoalOption[] = [
  {
    id: 'join_industry',
    emoji: '',
    title: 'Join the industry',
    subtitle: 'Career Move',
    description: 'Prepare for interviews, understand org structures, and learn what hiring managers look for',
    emphasis: ['Job roles & skills', 'Interview prep', 'Org structures'],
  },
  {
    id: 'invest',
    emoji: '',
    title: 'Invest & evaluate',
    subtitle: 'Investor Lens',
    description: 'Master unit economics, valuations, market sizing, and due diligence frameworks',
    emphasis: ['Valuations', 'Market sizing', 'Due diligence'],
  },
  {
    id: 'build_startup',
    emoji: '',
    title: 'Build a startup',
    subtitle: 'Founder Path',
    description: 'Learn GTM strategies, fundraising, competitive moats, and regulatory pathways',
    emphasis: ['GTM strategy', 'Fundraising', 'Regulatory paths'],
  },
  {
    id: 'curiosity',
    emoji: '',
    title: 'Pure curiosity',
    subtitle: 'Explorer Mode',
    description: 'Discover big-picture trends, fascinating history, and "wow factor" insights',
    emphasis: ['Trend analysis', 'Industry history', 'Key innovations'],
  },
];

const LEO_REACTIONS: Record<LearningGoal, string> = {
  join_industry: "Great choice! I'll prep you like a recruiter's dream candidate.",
  invest: "Love it! Let's sharpen your investment thesis.",
  build_startup: "Founder mode activated! Let's build something big.",
  curiosity: "Curiosity is a superpower — let's explore together!",
};

const STEP_LABELS = ['Industry', 'Goal', 'Level'];

export default function GoalScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedGoal, setSelectedGoal] = useState<LearningGoal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

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
    if (selectedGoal) {
      reactionOpacity.setValue(0);
      Animated.timing(reactionOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [selectedGoal]);

  useEffect(() => {
    const fetchMarket = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_market')
        .eq('id', user.id)
        .single();

      if (profile?.selected_market) {
        setSelectedMarket(profile.selected_market);
      }
    };
    fetchMarket();
  }, [user]);

  const handleSelect = (id: LearningGoal) => {
    triggerHaptic('light');
    setSelectedGoal(id);
  };

  const handleContinue = async () => {
    if (!selectedGoal || !user || !selectedMarket) return;
    triggerHaptic('medium');

    setIsSubmitting(true);
    try {
      await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: user.id,
            market_id: selectedMarket,
            learning_goal: selectedGoal,
          },
          { onConflict: 'user_id,market_id' }
        );

      router.push('/onboarding/familiarity');
    } catch (err) {
      console.error('Error saving learning goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress */}
      <OnboardingProgress currentStep={1} totalSteps={3} labels={STEP_LABELS} />

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Back */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <MascotAvatar size="lg" />
          {selectedMarket && (
            <View style={styles.marketBadge}>
              <Text style={{ fontSize: 16 }}>{getMarketEmoji(selectedMarket)}</Text>
              <Text style={styles.marketBadgeText}>{getMarketName(selectedMarket)}</Text>
            </View>
          )}
          <Text style={styles.title}>Why are you learning?</Text>
          <Text style={styles.subtitle}>I'll prioritize content that matches your goal</Text>
        </View>

        {/* Leo reaction bubble */}
        {selectedGoal && (
          <Animated.View style={[styles.reactionBubble, { opacity: reactionOpacity }]}>
            <Image source={require('../../assets/mascot/leo-reference.png')} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
            <Text style={styles.reactionText}>{LEO_REACTIONS[selectedGoal]}</Text>
          </Animated.View>
        )}

        {/* Goal Cards */}
        <View style={styles.cardsContainer}>
          {goalOptions.map((goal, index) => (
            <Animated.View
              key={goal.id}
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
                  selectedGoal === goal.id && styles.cardSelected,
                ]}
                onPress={() => handleSelect(goal.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardRow}>
                  <View
                    style={[
                      styles.iconBox,
                      selectedGoal === goal.id && styles.iconBoxSelected,
                    ]}
                  >
                    <Text style={{ fontSize: 24 }}>{goal.emoji}</Text>
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.cardTitleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{goal.title}</Text>
                        <Text style={styles.cardSubtitle}>{goal.subtitle}</Text>
                      </View>
                      {selectedGoal === goal.id && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardDescription}>{goal.description}</Text>
                    <View style={styles.chipRow}>
                      {goal.emphasis.map((item) => (
                        <View key={item} style={styles.chip}>
                          <Text style={styles.chipText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            You can change this anytime in Settings. Your goal shapes content priority, not access.
          </Text>
        </View>
      </Animated.ScrollView>

      <StickyBottomCTA
        title={isSubmitting ? 'Saving...' : 'Continue →'}
        onPress={handleContinue}
        disabled={!selectedGoal || isSubmitting}
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
    marginBottom: 16,
  },
  marketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  marketBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}15`,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.bg1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: COLORS.accent,
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.accent,
    marginTop: 1,
  },
  cardDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    backgroundColor: COLORS.bg1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  infoBox: {
    marginTop: 20,
    padding: 14,
    backgroundColor: COLORS.bg1,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
