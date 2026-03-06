import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  Image,
} from 'react-native';
import { Company } from '../../data/keyPlayersData';
import { COLORS } from '../../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CompanyDetailModalProps {
  company: Company | null;
  onClose: () => void;
}

const segmentColors: Record<string, { bg: string; text: string }> = {
  commercial: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
  defense: { bg: 'rgba(239,68,68,0.2)', text: '#F87171' },
  space: { bg: 'rgba(139,92,246,0.2)', text: '#A78BFA' },
  propulsion: { bg: 'rgba(249,115,22,0.2)', text: '#FB923C' },
  suppliers: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  services: { bg: 'rgba(6,182,212,0.2)', text: '#22D3EE' },
  devices: { bg: 'rgba(167,139,250,0.2)', text: '#C4B5FD' },
  therapeutics: { bg: 'rgba(236,72,153,0.2)', text: '#F472B6' },
  pharma: { bg: 'rgba(99,102,241,0.2)', text: '#818CF8' },
  models: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  hardware: { bg: 'rgba(6,182,212,0.2)', text: '#22D3EE' },
  enterprise: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
  payments: { bg: 'rgba(249,115,22,0.2)', text: '#FB923C' },
  investing: { bg: 'rgba(139,92,246,0.2)', text: '#A78BFA' },
  infrastructure: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  lending: { bg: 'rgba(251,191,36,0.2)', text: '#FCD34D' },
  neobank: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
  charging: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  battery: { bg: 'rgba(99,102,241,0.2)', text: '#818CF8' },
};

export function CompanyDetailModal({ company, onClose }: CompanyDetailModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) setCurrentSlide(s => Math.min(s + 1, (company?.slides.length ?? 0)));
        else if (gestureState.dx > 50) setCurrentSlide(s => Math.max(s - 1, 0));
      },
    })
  ).current;

  if (!company) return null;

  const totalSlides = company.slides.length + 1;
  const segStyle = segmentColors[company.segment] || { bg: 'rgba(139,92,246,0.2)', text: '#A78BFA' };

  const goToSlide = (index: number) => {
    if (index < 0 || index >= totalSlides) return;
    const direction = index > currentSlide ? -1 : 1;
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: direction * 30, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    setCurrentSlide(index);
  };

  const slideData = currentSlide > 0 ? company.slides[currentSlide - 1] : null;
  const slideTypeColor = slideData?.type === 'competitive' ? '#FCD34D'
    : slideData?.type === 'investment' ? '#34D399' : COLORS.accent;

  return (
    <Modal visible={!!company} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              {company.logoUrl ? (
                <Image
                  source={{ uri: company.logoUrl }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.logoInitial}>{company.name.charAt(0)}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>{company.name}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                {company.ticker && (
                  <View style={styles.tickerBadge}>
                    <Text style={styles.tickerText}>${company.ticker}</Text>
                  </View>
                )}
                <View style={[styles.segmentBadge, { backgroundColor: segStyle.bg }]}>
                  <Text style={[styles.segmentText, { color: segStyle.text }]}>
                    {company.segment.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Slide Progress Dots */}
          <View style={styles.progressRow}>
            {Array.from({ length: totalSlides }).map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => goToSlide(i)}
                style={[styles.progressDot, i === currentSlide && styles.progressDotActive]}
              />
            ))}
          </View>

          {/* Slide Content */}
          <Animated.View
            style={{ flex: 1, transform: [{ translateX: slideAnim }] }}
            {...panResponder.panHandlers}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.slideContent}
              showsVerticalScrollIndicator={false}
            >
              {currentSlide === 0 ? (
                // Overview
                <View style={{ gap: 14 }}>
                  <Text style={styles.description}>{company.description}</Text>

                  {/* Industry Role */}
                  <View style={styles.industryRoleCard}>
                    <Text style={styles.industryRoleLabel}>INDUSTRY ROLE</Text>
                    <Text style={styles.industryRoleText}>{company.industryRole}</Text>
                  </View>

                  {/* Stats Grid */}
                  <View style={styles.statsGrid}>
                    {[
                      { label: 'CEO', value: company.ceo, icon: 'C' },
                      { label: 'Founded', value: company.founded, icon: 'F' },
                      { label: 'HQ', value: company.headquarters.split(',')[0], icon: 'H' },
                      { label: 'Employees', value: company.employees, icon: 'E' },
                    ].map((stat) => (
                      <View key={stat.label} style={styles.statCard}>
                        <Text style={styles.statIcon}>{stat.icon}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                        <Text style={styles.statValue}>{stat.value}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Market Cap */}
                  {company.marketCap && (
                    <View style={styles.marketCapCard}>
                      <Text style={styles.marketCapLabel}>MARKET CAP</Text>
                      <Text style={styles.marketCapValue}>{company.marketCap}</Text>
                    </View>
                  )}

                  {/* Key Stats */}
                  {company.keyStats && company.keyStats.length > 0 && (
                    <View>
                      <Text style={styles.sectionLabel}>KEY STATS</Text>
                      <View style={styles.keyStatsRow}>
                        {company.keyStats.map((stat) => (
                          <View key={stat.label} style={styles.keyStatCard}>
                            <Text style={styles.keyStatValue}>{stat.value}</Text>
                            <Text style={styles.keyStatLabel}>{stat.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Key Products */}
                  {company.keyProducts.length > 0 && (
                    <View>
                      <Text style={styles.sectionLabel}>KEY PRODUCTS</Text>
                      <View style={styles.productsRow}>
                        {company.keyProducts.map((p) => (
                          <View key={p} style={styles.productChip}>
                            <Text style={styles.productChipText}>{p}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                // Insight Slide
                <View style={styles.insightSlide}>
                  <View style={styles.insightTypeRow}>
                    <Text style={[styles.insightType, { color: slideTypeColor }]}>
                      {slideData?.type === 'competitive' ? 'COMPETITIVE ANALYSIS'
                        : slideData?.type === 'investment' ? 'INVESTMENT THESIS'
                        : `INSIGHT ${currentSlide} OF ${company.slides.length}`}
                    </Text>
                  </View>
                  <Text style={styles.insightTitle}>{slideData?.title}</Text>
                  <Text style={styles.insightContent}>{slideData?.content}</Text>
                  {slideData?.highlight && (
                    <View style={[styles.highlightBadge, { borderColor: slideTypeColor + '50', backgroundColor: slideTypeColor + '20' }]}>
                      <Text style={[styles.highlightText, { color: slideTypeColor }]}>
                        {slideData.highlight}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </Animated.View>

          {/* Navigation Arrows */}
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => goToSlide(currentSlide - 1)}
              style={[styles.navBtn, currentSlide === 0 && styles.navBtnDisabled]}
              disabled={currentSlide === 0}
            >
              <Text style={styles.navBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.slideCounter}>{currentSlide + 1} / {totalSlides}</Text>
            <TouchableOpacity
              onPress={() => goToSlide(currentSlide + 1)}
              style={[styles.navBtn, currentSlide === totalSlides - 1 && styles.navBtnDisabled]}
              disabled={currentSlide === totalSlides - 1}
            >
              <Text style={styles.navBtnText}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '88%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomWidth: 0,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoImage: { width: 40, height: 40 },
  logoInitial: { fontSize: 28, fontWeight: '700', color: '#9CA3AF' },
  companyName: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  tickerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderRadius: 20,
  },
  tickerText: { fontSize: 11, color: COLORS.accent, fontWeight: '600' },
  segmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  segmentText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: COLORS.textMuted, fontSize: 14 },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  progressDot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.accent,
  },
  slideContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  industryRoleCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    gap: 6,
  },
  industryRoleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  industryRoleText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    width: '48%',
    padding: 12,
    backgroundColor: COLORS.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 2,
  },
  statIcon: { fontSize: 14 },
  statLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
  marketCapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: COLORS.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  marketCapLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  marketCapValue: { fontSize: 20, fontWeight: '700', color: COLORS.accent },
  sectionLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  keyStatsRow: { flexDirection: 'row', gap: 8 },
  keyStatCard: {
    flex: 1,
    padding: 12,
    backgroundColor: COLORS.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  keyStatValue: { fontSize: 16, fontWeight: '700', color: COLORS.accent },
  keyStatLabel: { fontSize: 9, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 },
  productsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  productChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.bg1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productChipText: { fontSize: 12, color: COLORS.textSecondary },
  insightSlide: {
    flex: 1,
    gap: 20,
    paddingTop: 8,
  },
  insightTypeRow: {},
  insightType: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  insightTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 30 },
  insightContent: { fontSize: 16, color: COLORS.textSecondary, lineHeight: 26 },
  highlightBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  highlightText: { fontSize: 14, fontWeight: '700' },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bg1,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { fontSize: 18, color: COLORS.textPrimary },
  slideCounter: { fontSize: 13, color: COLORS.textMuted },
});
