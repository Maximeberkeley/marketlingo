import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Modal, Animated, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { storage } from '../../lib/storage';
import { COLORS } from '../../lib/constants';
import { getMarketName } from '../../lib/markets';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useUserProgress } from '../../hooks/useUserProgress';
import { useUserXP, STARTUP_STAGES } from '../../hooks/useUserXP';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Feather } from '@expo/vector-icons';

// Market illustrations for profile
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, loading: authLoading } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [isProUser, setIsProUser] = useState(false);
  const [showChangeWarning, setShowChangeWarning] = useState(false);
  const [loading, setLoading] = useState(true);

  const { progress, availableDay } = useUserProgress(selectedMarket || undefined);
  const { xpData, getCurrentStage, getProgressToNextStage } = useUserXP(selectedMarket || undefined);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_market, is_pro_user')
        .eq('id', user.id)
        .single();
      if (profile) {
        setSelectedMarket(profile.selected_market);
        setIsProUser(profile.is_pro_user || false);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const currentStage = getCurrentStage();
  const stageProgress = getProgressToNextStage();
  const certProgress = availableDay;
  const certPercentage = Math.round((certProgress / 180) * 100);
  const isCertEligible = certProgress >= 180;

  const handleChangeMarket = async () => {
    if (!user || !selectedMarket) return;
    await supabase
      .from('user_progress')
      .update({ current_streak: 0, current_day: 1, completed_stacks: [] })
      .eq('user_id', user.id)
      .eq('market_id', selectedMarket);
    setShowChangeWarning(false);
    router.replace('/onboarding' as any);
  };

  const handleExportNotebook = async () => {
    if (!user) return;
    const { data: notes } = await supabase
      .from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!notes || notes.length === 0) {
      Alert.alert('No Notes', 'No notes to export yet.');
      return;
    }
    Alert.alert('Export', `${notes.length} notes ready. Share feature coming soon!`);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await signOut();
          await storage.clearAll();
          router.replace('/');
        },
      },
    ]);
  };

  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.stagger(120, [
        Animated.spring(headerAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.spring(statsAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.spring(bodyAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const animStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  });

  if (loading || authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header — clean, no mascot */}
        <Animated.View style={[styles.header, animStyle(headerAnim)]}>
          <View>
            <Text style={styles.title}>Profile</Text>
            {user && <Text style={styles.email}>{user.email}</Text>}
          </View>
          <View style={styles.headerRight}>
            {isProUser && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Stats Grid */}
        {progress && (
          <Animated.View style={[styles.statsGrid, animStyle(statsAnim)]}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Image source={APP_ICONS.streak} style={styles.statIconImg} />
              </View>
              <Text style={styles.statValue}>{progress.current_streak || 0}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <Image source={APP_ICONS.achievements} style={styles.statIconImg} />
              </View>
              <Text style={styles.statValue}>{progress.longest_streak || 0}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Image source={APP_ICONS.quests} style={styles.statIconImg} />
              </View>
              <Text style={styles.statValue}>Day {availableDay}</Text>
              <Text style={styles.statLabel}>of 180</Text>
            </View>
          </Animated.View>
        )}

        {/* XP & Stage */}
        <Animated.View style={animStyle(bodyAnim)}>
        {xpData && (
          <View style={styles.stageCard}>
            <View style={styles.stageHeader}>
              <Image source={APP_ICONS.progress} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stageTitle}>Stage {currentStage.stage}: {currentStage.name}</Text>
                <Text style={styles.stageDesc}>{currentStage.description}</Text>
              </View>
              <Text style={styles.xpText}>{xpData.total_xp.toLocaleString()} XP</Text>
            </View>
            <ProgressBar progress={stageProgress} />
          </View>
        )}

        {/* Certificate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CERTIFICATION</Text>
          <View style={styles.certCard}>
            <View style={styles.certRow}>
              <View style={[styles.certIcon, isCertEligible && { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Image source={APP_ICONS.achievements} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.certTitle}>
                  {isCertEligible ? 'Certificate Unlocked!' : 'Industry Mastery Certificate'}
                </Text>
                <Text style={styles.certSubtitle}>
                  {isCertEligible ? 'Download and share your achievement' : 'Complete all 180 days to unlock'}
                </Text>
              </View>
            </View>
            {!isCertEligible && (
              <View style={{ marginTop: 12 }}>
                <View style={styles.certProgressRow}>
                  <Text style={styles.certProgressLabel}>Progress</Text>
                  <Text style={styles.certProgressLabel}>{certProgress} / 180 days</Text>
                </View>
                <ProgressBar progress={certPercentage} height={6} />
              </View>
            )}
            <TouchableOpacity
              style={[styles.certButton, !isCertEligible && { opacity: 0.5 }]}
              disabled={!isCertEligible}
            >
              <Text style={styles.certButtonText}>
                {isCertEligible ? 'View Certificate' : `${certPercentage}% Complete`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Market — illustration instead of emoji */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CURRENT MARKET</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowChangeWarning(true)}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
              {MARKET_ILLUSTRATIONS[selectedMarket || 'aerospace'] ? (
                <Image source={MARKET_ILLUSTRATIONS[selectedMarket || 'aerospace']} style={styles.menuIconImg} />
              ) : (
                <Image source={APP_ICONS.progress} style={styles.menuIconImg} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>{getMarketName(selectedMarket || 'aerospace')}</Text>
              <Text style={styles.menuSubtitle}>6-month journey</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleExportNotebook}>
            <View style={[styles.menuIcon, { backgroundColor: COLORS.bg1 }]}>
              <Image source={APP_ICONS.notebook} style={styles.menuIconImg} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Export Notebook</Text>
              <Text style={styles.menuSubtitle}>Download as Markdown</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/passport' as any)}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
              <Image source={APP_ICONS.passport} style={styles.menuIconImg} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Industry Passport</Text>
              <Text style={styles.menuSubtitle}>Your learning journey stamps</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings' as any)}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Image source={APP_ICONS.concept} style={styles.menuIconImg} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Settings</Text>
              <Text style={styles.menuSubtitle}>Notifications & preferences</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/achievements' as any)}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
              <Image source={APP_ICONS.achievements} style={styles.menuIconImg} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Achievements</Text>
              <Text style={styles.menuSubtitle}>Badges & milestones</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}
            onPress={handleSignOut}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <Image source={APP_ICONS.profile} style={styles.menuIconImg} />
            </View>
            <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Log out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>MarketLingo v1.0.0</Text>
        </Animated.View>
      </ScrollView>

      {/* Change Market Warning */}
      <Modal visible={showChangeWarning} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Image source={APP_ICONS.concept} style={{ width: 32, height: 32, resizeMode: 'contain', alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Change Market?</Text>
            <Text style={styles.modalSubtitle}>
              Changing your market will reset your path and streak. This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowChangeWarning(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDestructive} onPress={handleChangeMarket}>
                <Text style={styles.modalDestructiveText}>Change Market</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary },
  email: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  proBadge: { backgroundColor: 'rgba(139, 92, 246, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  proBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.accent },
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: COLORS.bg2, borderRadius: 16, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statIconImg: { width: 24, height: 24, resizeMode: 'contain' as const },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  stageCard: {
    backgroundColor: COLORS.bg2, borderRadius: 16, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  stageHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  stageTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  stageDesc: { fontSize: 11, color: COLORS.textMuted },
  xpText: { fontSize: 12, fontWeight: '700', color: '#EAB308' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 10 },
  certCard: { backgroundColor: COLORS.bg2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  certIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  certTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  certSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  certProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  certProgressLabel: { fontSize: 11, color: COLORS.textMuted },
  certButton: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  certButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  menuItem: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, gap: 12,
  },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuIconImg: { width: 24, height: 24, resizeMode: 'contain' as const },
  menuTitle: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
  menuSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  chevron: { fontSize: 22, color: COLORS.textMuted },
  versionText: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginTop: 20, marginBottom: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 16, 32, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: COLORS.bg2, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border, width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.bg1, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  modalDestructive: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' },
  modalDestructiveText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
