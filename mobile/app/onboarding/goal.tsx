import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { MascotAvatar } from '../../components/mascot/MascotAvatar';
import { getMarketName, getMarketEmoji } from '../../lib/markets';
import { StickyBottomCTA } from '../../components/StickyBottomCTA';

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
    emoji: '🚀',
    title: 'Join the industry',
    subtitle: 'Career Move',
    description: 'Prepare for interviews, understand org structures, and learn what hiring managers look for',
    emphasis: ['Job roles & skills', 'Interview prep', 'Org structures'],
  },
  {
    id: 'invest',
    emoji: '💰',
    title: 'Invest & evaluate',
    subtitle: 'Investor Lens',
    description: 'Master unit economics, valuations, market sizing, and due diligence frameworks',
    emphasis: ['Valuations', 'Market sizing', 'Due diligence'],
  },
  {
    id: 'build_startup',
    emoji: '🏗️',
    title: 'Build a startup',
    subtitle: 'Founder Path',
    description: 'Learn GTM strategies, fundraising, competitive moats, and regulatory pathways',
    emphasis: ['GTM strategy', 'Fundraising', 'Regulatory paths'],
  },
  {
    id: 'curiosity',
    emoji: '🧠',
    title: 'Pure curiosity',
    subtitle: 'Explorer Mode',
    description: 'Discover big-picture trends, fascinating history, and "wow factor" insights',
    emphasis: ['Trend analysis', 'Industry history', 'Key innovations'],
  },
];

export default function GoalScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedGoal, setSelectedGoal] = useState<LearningGoal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

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

  const handleContinue = async () => {
    if (!selectedGoal || !user || !selectedMarket) return;

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <MascotAvatar emoji="🦁" size="lg" />
          {selectedMarket && (
            <View style={styles.marketBadge}>
              <Text style={{ fontSize: 16 }}>{getMarketEmoji(selectedMarket)}</Text>
              <Text style={styles.marketBadgeText}>{getMarketName(selectedMarket)}</Text>
            </View>
          )}
          <Text style={styles.hint}>This shapes your entire learning journey! 🎯</Text>
          <Text style={styles.title}>Why are you learning?</Text>
          <Text style={styles.subtitle}>We'll prioritize content that matches your goal</Text>
        </View>

        {/* Goal Cards */}
        <View style={styles.cardsContainer}>
          {goalOptions.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.card,
                selectedGoal === goal.id && styles.cardSelected,
              ]}
              onPress={() => setSelectedGoal(goal.id)}
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
          ))}
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 You can change this anytime in Settings. Your goal shapes content priority, not access.
          </Text>
        </View>
      </ScrollView>

      <StickyBottomCTA
        title={isSubmitting ? 'Saving...' : 'Continue'}
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
    marginBottom: 20,
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
  hint: {
    fontSize: 13,
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
  cardsContainer: {
    gap: 12,
    marginTop: 16,
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
