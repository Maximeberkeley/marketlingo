import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../../lib/constants';
import { useContentAccess } from '../../hooks/useContentAccess';

type GatedFeature =
  | 'ai_mentor'
  | 'investment_lab'
  | 'pro_trainer'
  | 'advanced_content'
  | 'full_lesson'
  | 'unlimited_games'
  | 'unlimited_drills';

interface ProGatedContentProps {
  children: React.ReactNode;
  feature: GatedFeature;
  featureLabel?: string;
  showPreview?: boolean;
  compact?: boolean;
  fallback?: React.ReactNode;
}

const featureNames: Record<GatedFeature, string> = {
  ai_mentor: 'AI Mentor',
  investment_lab: 'Investment Lab',
  pro_trainer: 'Pro Trainer',
  advanced_content: 'Advanced Content',
  full_lesson: 'Full Lesson',
  unlimited_games: 'Unlimited Games',
  unlimited_drills: 'Unlimited Drills',
};

export function ProGatedContent({
  children,
  feature,
  featureLabel,
  showPreview = false,
  compact = false,
  fallback,
}: ProGatedContentProps) {
  const { isProUser, canAccessAIMentor, canAccessInvestmentLab, canAccessProTrainer, canAccessAdvancedContent } =
    useContentAccess();

  const label = featureLabel || featureNames[feature];

  const hasAccess = (() => {
    switch (feature) {
      case 'ai_mentor': return canAccessAIMentor;
      case 'investment_lab': return canAccessInvestmentLab;
      case 'pro_trainer': return canAccessProTrainer;
      case 'advanced_content': return canAccessAdvancedContent;
      default: return isProUser;
    }
  })();

  if (hasAccess) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  const handleUnlock = () => router.push('/subscription');

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactBtn} onPress={handleUnlock} activeOpacity={0.8}>
        <Text style={{ fontSize: 14 }}></Text>
        <Text style={styles.compactText}>Unlock {label}</Text>
        <Text style={{ fontSize: 12 }}></Text>
      </TouchableOpacity>
    );
  }

  if (showPreview) {
    return (
      <View style={styles.previewContainer}>
        <View style={styles.previewBlur} pointerEvents="none">
          {children}
        </View>
        <View style={styles.previewOverlay}>
          <View style={styles.previewIconWrap}>
            <Text style={{ fontSize: 30 }}></Text>
          </View>
          <Text style={styles.previewTitle}>{label} is Pro</Text>
          <Text style={styles.previewSubtitle}>Upgrade to unlock the full learning experience</Text>
          <TouchableOpacity style={styles.previewBtn} onPress={handleUnlock} activeOpacity={0.85}>
            <Text style={styles.previewBtnText}>✨ Unlock Pro →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullGate}>
      <View style={styles.fullGateIcon}>
        <Text style={{ fontSize: 36 }}></Text>
      </View>
      <Text style={styles.fullGateTitle}>{label}</Text>
      <Text style={styles.fullGateDesc}>
        This feature is available with MarketLingo Pro. Upgrade to unlock the full learning experience.
      </Text>
      <TouchableOpacity style={styles.fullGateBtn} onPress={handleUnlock} activeOpacity={0.85}>
        <Text style={styles.fullGateBtnText}> Upgrade to Pro</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Small badge to indicate Pro-only content */
export function ProBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <View style={[styles.badge, size === 'md' && styles.badgeMd]}>
      <Text style={[styles.badgeText, size === 'md' && styles.badgeTextMd]}> PRO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  compactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  compactText: { fontSize: 13, color: '#F59E0B', fontWeight: '600', flex: 1 },
  previewContainer: { position: 'relative', borderRadius: 18, overflow: 'hidden' },
  previewBlur: { opacity: 0.25 },
  previewOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,12,30,0.85)',
    padding: 24,
    gap: 8,
  },
  previewIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(245,158,11,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  previewTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  previewSubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 8 },
  previewBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  previewBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  fullGate: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fullGateIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  fullGateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  fullGateDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 280,
  },
  fullGateBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  fullGateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  badge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeMd: { paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 10, color: '#F59E0B', fontWeight: '700' },
  badgeTextMd: { fontSize: 12 },
});
