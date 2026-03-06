import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useInvestmentLab } from '../hooks/useInvestmentLab';
import { getMarketName } from '../lib/markets';
import { Feather } from '@expo/vector-icons';

export default function InvestmentCertificateScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_market, username')
        .eq('id', user.id)
        .single();
      if (profile?.selected_market) setSelectedMarket(profile.selected_market);
      setUserName(profile?.username || user.email?.split('@')[0] || 'Investor');
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const { progress, loading: labLoading } = useInvestmentLab(selectedMarket || undefined);

  const handleShare = async () => {
    const marketName = getMarketName(selectedMarket || '');
    try {
      await Share.share({
        message: `I've earned my Investment Certification in ${marketName} from MarketLingo! Certified investment-ready after comprehensive training in valuation, due diligence, risk assessment, and portfolio construction. #InvestmentCertification #MarketLingo`,
      });
    } catch {}
  };

  if (loading || labLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!progress?.investment_certified) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.lockedIcon}>
          <Feather name="award" size={36} color={COLORS.textMuted} />
        </View>
        <Text style={styles.lockedTitle}>Not Yet Certified</Text>
        <Text style={styles.lockedSubtitle}>
          Complete all investment modules with 80%+ score to earn your certification
        </Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.back()}>
          <Text style={styles.ctaText}>Continue Training</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const completionDate = progress.certified_at
    ? new Date(progress.certified_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const marketName = getMarketName(selectedMarket || '');

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Investment Certificate</Text>
            <Text style={styles.headerSub}>Share your achievement</Text>
          </View>
        </View>

        {/* Certificate Card */}
        <View style={styles.certCard}>
          <View style={styles.certBorder}>
            <View style={styles.certInner}>
              <Image source={APP_ICONS.achievements} style={{ width: 40, height: 40, resizeMode: 'contain', marginBottom: 8 }} />
              <Text style={styles.certLabel}>CERTIFICATE OF COMPLETION</Text>
              <Text style={styles.certName}>{userName}</Text>
              <Text style={styles.certBody}>
                Has successfully completed the Investment Certification program in{' '}
                <Text style={{ fontWeight: '700' }}>{marketName}</Text>
              </Text>
              <View style={styles.certDivider} />

              <View style={styles.scoreGrid}>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreValue}>{progress.valuation_score}%</Text>
                  <Text style={styles.scoreLabel}>Valuation</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreValue}>{progress.due_diligence_score}%</Text>
                  <Text style={styles.scoreLabel}>Due Diligence</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreValue}>{progress.risk_assessment_score}%</Text>
                  <Text style={styles.scoreLabel}>Risk</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreValue}>{progress.portfolio_construction_score}%</Text>
                  <Text style={styles.scoreLabel}>Portfolio</Text>
                </View>
              </View>

              <View style={styles.certDivider} />
              <Text style={styles.certDate}>{completionDate}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Image source={APP_ICONS.progress} style={{ width: 14, height: 14, resizeMode: 'contain' }} />
                <Text style={styles.certXP}>{progress.investment_xp} Investment XP</Text>
              </View>
              <Text style={styles.certIssuer}>MarketLingo</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkedinButton}
            onPress={() => Alert.alert('LinkedIn', 'Open LinkedIn to share your certificate.')}
          >
            <Text style={styles.linkedinText}>LinkedIn</Text>
          </TouchableOpacity>
        </View>

        {/* Share Message Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Share Message</Text>
          <Text style={styles.previewText}>
            I've earned my Investment Certification in {marketName} from MarketLingo!
            Certified investment-ready after comprehensive training in valuation, due diligence,
            risk assessment, and portfolio construction.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  scrollContent: { paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backText: { fontSize: 15, color: COLORS.textSecondary },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 11, color: COLORS.textMuted },
  lockedIcon: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  lockedTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  lockedSubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 20, maxWidth: 280 },
  ctaButton: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center' },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  certCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  certBorder: { padding: 3, borderRadius: 20, backgroundColor: 'rgba(139,92,246,0.3)' },
  certInner: { backgroundColor: COLORS.bg1, borderRadius: 18, padding: 24, alignItems: 'center' },
  certLabel: { fontSize: 10, fontWeight: '600', color: COLORS.accent, letterSpacing: 2, marginBottom: 16 },
  certName: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  certBody: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  certDivider: { width: '80%', height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  scoreGrid: { flexDirection: 'row', gap: 16 },
  scoreItem: { alignItems: 'center' },
  scoreValue: { fontSize: 18, fontWeight: '700', color: COLORS.accent },
  scoreLabel: { fontSize: 9, color: COLORS.textMuted, marginTop: 2 },
  certDate: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  certXP: { fontSize: 13, fontWeight: '600', color: '#EAB308', marginBottom: 8 },
  certIssuer: { fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic' },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  shareButton: { flex: 1, backgroundColor: COLORS.bg2, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  shareText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  linkedinButton: { flex: 1, backgroundColor: '#0A66C2', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  linkedinText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  previewCard: { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  previewLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  previewText: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
});
