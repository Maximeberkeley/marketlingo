import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { storage, UserTier } from '../../lib/storage';
import { COLORS, INDUSTRIES } from '../../lib/constants';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [industry, setIndustry] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [streak, setStreak] = useState(5);
  const [longestStreak, setLongestStreak] = useState(12);
  const [currentDay, setCurrentDay] = useState(12);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [ind, tier] = await Promise.all([
      storage.getIndustry(),
      storage.getUserTier(),
    ]);
    setIndustry(ind);
    setUserTier(tier);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await storage.clearAll();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const industryData = INDUSTRIES.find((i) => i.id === industry);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          {userTier === 'pro' && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>👑 PRO</Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.accent + '20' }]}>
              <Text style={styles.statEmoji}>🔥</Text>
            </View>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
              <Text style={styles.statEmoji}>🏆</Text>
            </View>
            <Text style={styles.statValue}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
              <Text style={styles.statEmoji}>🎯</Text>
            </View>
            <Text style={styles.statValue}>Day {currentDay}</Text>
            <Text style={styles.statLabel}>of 180</Text>
          </View>
        </View>

        {/* Certificate Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CERTIFICATION</Text>
          <View style={styles.certificateCard}>
            <View style={styles.certificateIcon}>
              <Text style={styles.certificateEmoji}>🔒</Text>
            </View>
            <View style={styles.certificateInfo}>
              <Text style={styles.certificateName}>Industry Mastery Certificate</Text>
              <Text style={styles.certificateSubtitle}>
                Complete all 180 days to unlock
              </Text>
              <View style={styles.certificateProgress}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(currentDay / 180) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round((currentDay / 180) * 100)}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Current Market */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CURRENT MARKET</Text>
          <TouchableOpacity style={styles.marketCard}>
            <Text style={styles.marketEmoji}>{industryData?.emoji || '🚀'}</Text>
            <View style={styles.marketInfo}>
              <Text style={styles.marketName}>{industryData?.name || 'Aerospace'}</Text>
              <Text style={styles.marketSubtitle}>Tap to change</Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Pro Upgrade */}
        {userTier === 'free' && (
          <TouchableOpacity
            style={styles.proCard}
            onPress={() => router.push('/subscription')}
          >
            <Text style={styles.proEmoji}>👑</Text>
            <View style={styles.proContent}>
              <Text style={styles.proTitle}>Upgrade to Pro</Text>
              <Text style={styles.proSubtitle}>Unlock all features</Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>🔔</Text>
            <Text style={styles.settingText}>Notifications</Text>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>📊</Text>
            <Text style={styles.settingText}>Change Difficulty</Text>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>ℹ️</Text>
            <Text style={styles.settingText}>About</Text>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, styles.signOutItem]} onPress={handleSignOut}>
            <Text style={styles.settingIcon}>🚪</Text>
            <Text style={[styles.settingText, styles.signOutText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  proBadge: {
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statEmoji: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  certificateCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  certificateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.bg1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  certificateEmoji: {
    fontSize: 24,
  },
  certificateInfo: {
    flex: 1,
  },
  certificateName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  certificateSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  certificateProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.bg1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  marketCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  marketEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  marketInfo: {
    flex: 1,
  },
  marketName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  marketSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  chevron: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  proCard: {
    backgroundColor: COLORS.accent + '15',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
    marginBottom: 24,
  },
  proEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  proContent: {
    flex: 1,
  },
  proTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
  proSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  settingItem: {
    backgroundColor: COLORS.bg2,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  signOutItem: {
    backgroundColor: '#EF444420',
    borderColor: '#EF444430',
  },
  signOutText: {
    color: '#EF4444',
  },
});
