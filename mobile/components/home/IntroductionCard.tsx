import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { COLORS } from '../../lib/constants';

type IntroType = 'course' | 'games' | 'drills' | 'trainer' | 'daily';

interface IntroductionCardProps {
  type: IntroType;
  onStart: () => void;
  onDismiss?: () => void;
}

const introContent: Record<IntroType, {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  ctaText: string;
  gradient: readonly [string, string];
}> = {
  course: {
    icon: '📖',
    title: 'Welcome to Your Learning Path',
    subtitle: '6 Months to Industry Expertise',
    description: 'Master your market through daily micro-lessons designed for founders and investors.',
    features: [
      '5-minute daily slide stacks',
      'Real-world case studies & sources',
      'Progressive skill building',
      'Save insights to your notebook',
    ],
    ctaText: 'Start Learning',
    gradient: ['#7C3AED', '#8B5CF6'],
  },
  games: {
    icon: '🎯',
    title: 'Test Your Knowledge',
    subtitle: 'Daily Pattern Games',
    description: 'Reinforce learning with quick multiple-choice questions based on today\'s content.',
    features: [
      'MCQ format with instant feedback',
      'Track your score progression',
      'Apply concepts from lessons',
      'Compete with your best score',
    ],
    ctaText: 'Play Now',
    gradient: ['#2563EB', '#06B6D4'],
  },
  drills: {
    icon: '⚡',
    title: 'Speed Drills',
    subtitle: '15-Second Fact Checks',
    description: 'Rapid-fire true/false questions to build intuition and test your knowledge.',
    features: [
      'Timed challenges',
      'Industry fact verification',
      'Build pattern recognition',
      'Quick daily practice',
    ],
    ctaText: 'Start Drill',
    gradient: ['#D97706', '#F59E0B'],
  },
  trainer: {
    icon: '🧠',
    title: 'Pro Reasoning Trainer',
    subtitle: 'Think Like an Industry Expert',
    description: 'Complex scenarios that develop strategic thinking with pro-level feedback.',
    features: [
      'Real-world decision scenarios',
      'Expert reasoning breakdowns',
      'Common mistake analysis',
      'Mental models for founders',
    ],
    ctaText: 'Train Now',
    gradient: ['#7C3AED', '#EC4899'],
  },
  daily: {
    icon: '📈',
    title: 'Daily Patterns',
    subtitle: 'Industry Intelligence',
    description: 'Stay current with curated news and learn to spot recurring market patterns.',
    features: [
      'Fresh industry news daily',
      'Pattern recognition training',
      'Source-backed insights',
      'Strategic trend analysis',
    ],
    ctaText: 'View Today',
    gradient: ['#059669', '#0D9488'],
  },
};

const { width } = Dimensions.get('window');

export function IntroductionCard({ type, onStart, onDismiss }: IntroductionCardProps) {
  const content = introContent[type];

  return (
    <Modal visible animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Gradient Header */}
          <View style={[styles.header, { backgroundColor: content.gradient[0] }]}>
            <View style={styles.iconContainer}>
              <Text style={{ fontSize: 32 }}>{content.icon}</Text>
            </View>
            <Text style={styles.sparkle}>✨</Text>
          </View>

          {/* Content */}
          <View style={styles.body}>
            <Text style={styles.subtitle}>{content.subtitle}</Text>
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.description}>{content.description}</Text>

            {/* Features */}
            <View style={styles.featuresList}>
              {content.features.map((feature, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={[styles.featureDot, { backgroundColor: content.gradient[1] }]} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {onDismiss && (
                <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
                  <Text style={styles.dismissText}>Maybe Later</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onStart}
                style={[styles.ctaBtn, { flex: onDismiss ? 1 : undefined, backgroundColor: content.gradient[0] }]}
              >
                <Text style={styles.ctaText}>{content.ctaText} →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: 12,
    right: 16,
    fontSize: 18,
    opacity: 0.6,
  },
  body: {
    padding: 24,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
    lineHeight: 26,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  featuresList: {
    gap: 12,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  dismissBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  dismissText: { fontSize: 14, color: COLORS.textMuted },
  ctaBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
