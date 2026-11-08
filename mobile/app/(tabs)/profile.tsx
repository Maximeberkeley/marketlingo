import { InterviewTargetForm } from '../../components/interview/InterviewTargetForm';
import { useInterviewReadiness } from '../../hooks/useInterviewReadiness';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Share,
  ActivityIndicator, Modal, Animated, Image, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { storage } from '../../lib/storage';
import { COLORS, FAMILIARITY_LEVELS } from '../../lib/constants';
import { getMarketName } from '../../lib/markets';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useUserProgress } from '../../hooks/useUserProgress';
import { useUserXP, STARTUP_STAGES } from '../../hooks/useUserXP';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { SwitchIndustryModal } from '../../components/ui/SwitchIndustryModal';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { triggerHaptic } from '../../lib/haptics';
import { useCollectibles } from '../../hooks/useCollectibles';
import { getMarketWorld } from '../../data/marketWorlds';
import { useDeliverable } from '../../hooks/useDeliverable';
import { dossierRank } from '../../lib/deliverables';
import { useFriends } from '../../hooks/useFriends';
import { useFriendSocial } from '../../hooks/useFriendSocial';
import { myFriendRaceXP } from '../../lib/socialStandings';
import { crownStatus } from '../../lib/crown';
import { homeSocialLine, raceIsOver, streakToday } from '../../lib/friendSocial';
import { inviteShareContent } from '../../lib/inviteLinks';
import { redeemFriendCode } from '../../lib/invites';
import { ProfileFriendsCard } from '../../components/profile/ProfileFriendsCard';
import { MyCodeSheet } from '../../components/social/MyCodeSheet';
import { SocialAvatar } from '../../components/social/SocialAvatar';
import { CrownBadge } from '../../components/social/CrownBadge';


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

type LearningGoal = 'join_industry' | 'invest' | 'build_startup' | 'curiosity';

const GOAL_OPTIONS: { id: LearningGoal; icon: keyof typeof Feather.glyphMap; title: string; color: string }[] = [
  { id: 'join_industry', icon: 'briefcase', title: 'Join the industry', color: '#3B82F6' },
  { id: 'invest', icon: 'trending-up', title: 'Invest & evaluate', color: '#8B5CF6' },
  { id: 'build_startup', icon: 'layers', title: 'Build a startup', color: '#22C55E' },
  { id: 'curiosity', icon: 'compass', title: 'Pure curiosity', color: '#F59E0B' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, loading: authLoading } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [showChangeWarning, setShowChangeWarning] = useState(false);
  const [loading, setLoading] = useState(true);

  // Learning preferences state
  const [currentGoal, setCurrentGoal] = useState<LearningGoal | null>(null);
  const [currentLevel, setCurrentLevel] = useState<string | null>(null);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [monthXP, setMonthXP] = useState(0);
  const [codeOpen, setCodeOpen] = useState(false);
  const [focused, setFocused] = useState(true);

  // Friends, friend streaks and races, and this month's XP: refreshed whenever Profile regains focus.
  const friendsData = useFriends(selectedMarket || undefined);
  const social = useFriendSocial(user?.id, focused);
  const firstFocus = useRef(true);
  useFocusEffect(React.useCallback(() => {
    setFocused(true);
    if (user) {
      // useFriends loads on mount; refresh on later visits only.
      if (!firstFocus.current) void friendsData.refetch();
      firstFocus.current = false;
      myFriendRaceXP(user.id).then(setMonthXP, () => {});
    }
    return () => setFocused(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]));

  const { progress, availableDay } = useUserProgress(selectedMarket || undefined);
  const { xpData, getCurrentStage, getProgressToNextStage } = useUserXP(selectedMarket || undefined);
  const { cards, featuredId } = useCollectibles(selectedMarket || undefined);
  const featuredCard = cards.find(card => card.id === featuredId);
  // The living dossier is the learner's own document: it deserves a permanent door.
  const dossier = useDeliverable(selectedMarket || undefined, currentGoal);
  const dossierRankInfo = dossierRank(dossier.completion);
  const interviewPrep = useInterviewReadiness(selectedMarket);


  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_market, familiarity_level, display_name')
        .eq('id', user.id)
        .single();
      if (profile) {
        setSelectedMarket(profile.selected_market);
        setCurrentLevel(profile.familiarity_level || null);
        setDisplayName(profile.display_name?.trim() || '');
      }

      // Fetch learning goal from user_progress
      if (profile?.selected_market) {
        const { data: prog } = await supabase
          .from('user_progress')
          .select('learning_goal, familiarity_level')
          .eq('user_id', user.id)
          .eq('market_id', profile.selected_market)
          .maybeSingle();
        if (prog) {
          setCurrentGoal((prog.learning_goal as LearningGoal) || null);
          // Market-specific level takes priority
          if (prog.familiarity_level) setCurrentLevel(prog.familiarity_level);
        }
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

  const handleChangeGoal = async (goal: LearningGoal) => {
    if (!user || !selectedMarket) return;
    triggerHaptic('medium');
    setSavingPreference(true);
    try {
      const { error } = await supabase.from('user_progress').upsert(
        { user_id: user.id, market_id: selectedMarket, learning_goal: goal },
        { onConflict: 'user_id,market_id' }
      );
      if (error) throw error;
      setCurrentGoal(goal);
      setShowGoalPicker(false);
      Alert.alert('Goal Updated', 'Your lessons will now be tailored to this goal. Go back to Home to see updated content.');
    } catch (err) {
      Alert.alert('Error', 'Failed to update goal.');
    } finally {
      setSavingPreference(false);
    }
  };

  const handleChangeLevel = async (level: string) => {
    if (!user || !selectedMarket) return;
    triggerHaptic('medium');
    setSavingPreference(true);
    try {
      const results = await Promise.all([
        supabase.from('profiles').update({ familiarity_level: level }).eq('id', user.id),
        supabase.from('user_progress').upsert(
          { user_id: user.id, market_id: selectedMarket, familiarity_level: level },
          { onConflict: 'user_id,market_id' }
        ),
      ]);
      if (results.some(result => result.error)) throw new Error('Preference update failed');
      setCurrentLevel(level);
      setShowLevelPicker(false);
      Alert.alert('Level Updated', 'Content difficulty will adjust to your new experience level.');
    } catch (err) {
      Alert.alert('Error', 'Failed to update level.');
    } finally {
      setSavingPreference(false);
    }
  };

  // The Friends page in miniature: crown, friends, streaks, races and what needs you.
  const board = [
    { name: 'You', xp: monthXP, isMe: true },
    ...friendsData.friends.map(f => ({ name: f.username, xp: f.totalXP, isMe: false })),
  ].sort((a, b) => b.xp - a.xp);
  const myFriendRank = board.findIndex(r => r.isMe) + 1;
  const activeStreaks = social.social?.streaks.filter(s => s.status === 'active') ?? [];
  const friendsInfo = {
    friendNames: board.filter(r => !r.isMe).map(r => r.name),
    crown: friendsData.friends.length > 0 ? crownStatus(board) : null,
    myRank: myFriendRank,
    boardSize: board.length,
    streaks: social.available ? { lit: activeStreaks.filter(s => streakToday(s) === 'both_done').length, active: activeStreaks.length } : null,
    races: social.available ? (social.social?.races.filter(r => r.status === 'active' && !raceIsOver(r)).length ?? 0) : null,
    urgent: social.available ? homeSocialLine(social.social) : null,
    pending: friendsData.pendingRequests.length,
  };
  const iWearCrown = friendsInfo.crown?.kind === 'mine';

  const shareInvite = async () => {
    triggerHaptic('light');
    const code = friendsData.myFriendCode;
    try {
      await Share.share(code
        ? inviteShareContent(getMarketName(selectedMarket || 'aerospace'), code, Platform.OS)
        : { message: `I'm learning ${getMarketName(selectedMarket || 'aerospace')} on MarketLingo, 5 minutes a day. Join me: https://market-verse.com` });
    } catch { /* cancelled */ }
  };

  // A friend's code scanned from the code sheet: add them and refresh the Friends card.
  const redeemScanned = async (raw: string) => {
    const result = await redeemFriendCode(raw);
    if (result.ok) void friendsData.refetch();
    return result;
  };

  const handleExportNotebook = async () => {
    if (!user) return;
    const { data: notes } = await supabase
      .from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!notes || notes.length === 0) {
      Alert.alert('No Notes', 'No notes to export yet.');
      return;
    }
    await Share.share({
      title: 'My MarketLingo notes',
      message: notes.map((note, index) => `${index + 1}. ${note.content}`).join('\n\n'),
    });
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

  const openCode = () => { triggerHaptic('light'); setCodeOpen(true); };
  const openSettings = () => { triggerHaptic('light'); router.push('/settings' as any); };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: you in one card. Your friend code is behind the QR button. */}
        <Animated.View style={[styles.header, animStyle(headerAnim)]}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity style={styles.gear} onPress={openSettings} accessibilityLabel="Settings">
              <Feather name="settings" size={19} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.idCard}>
            <View>
              <SocialAvatar name={displayName || user?.email || 'You'} size={60} ring={COLORS.accent} ringWidth={3} />
              {iWearCrown && <View style={styles.avatarCrown} pointerEvents="none"><CrownBadge size={28} /></View>}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              {displayName ? (
                <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
              ) : (
                <TouchableOpacity onPress={() => router.push('/friends' as any)} accessibilityRole="button">
                  <Text style={[styles.name, { color: COLORS.accent }]} numberOfLines={1}>Add your name</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.industry} numberOfLines={1}>{getMarketName(selectedMarket || 'aerospace')}</Text>
            </View>
            {!!friendsData.myFriendCode && (
              <TouchableOpacity style={styles.qrBtn} onPress={openCode} accessibilityRole="button" accessibilityLabel={`Your friend code ${friendsData.myFriendCode}. Show QR code`}>
                <MaterialCommunityIcons name="qrcode" size={24} color={COLORS.accent} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        <Animated.View style={animStyle(statsAnim)}>
        <ProfileFriendsCard
          info={friendsInfo}
          onOpen={() => { triggerHaptic('light'); router.push('/friends' as any); }}
          onAdd={() => { void shareInvite(); }}
        />
        </Animated.View>

        <Animated.View style={animStyle(bodyAnim)}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTERVIEW</Text>
          <InterviewTargetForm target={interviewPrep.target} onSave={interviewPrep.saveTarget} />
          <View style={[styles.group, { marginTop: 10 }]}>
            <MenuRow icon="file-text" title="Interview Brief" subtitle={`${Math.round(dossier.completion)}% written`} onPress={() => { triggerHaptic('light'); router.push('/deliverable' as any); }} highlight />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR LEARNING</Text>
          <View style={styles.group}>
            <MenuRow icon={GOAL_OPTIONS.find(g => g.id === currentGoal)?.icon || 'target'} title="Goal" subtitle={GOAL_OPTIONS.find(g => g.id === currentGoal)?.title || 'Not set'} onPress={() => setShowGoalPicker(true)} />
            <MenuRow icon="sliders" title="Level" subtitle={FAMILIARITY_LEVELS.find(l => l.id === currentLevel)?.name || 'Not set'} onPress={() => setShowLevelPicker(true)} />
            <MenuRow icon="globe" title="Industry" subtitle={getMarketName(selectedMarket || 'aerospace')} onPress={() => setShowChangeWarning(true)} />
            <MenuRow icon="award" title="Achievements" subtitle="Badges you've earned" onPress={() => router.push('/achievements' as any)} />
            <MenuRow icon="settings" title="Settings" subtitle="Notifications and account" onPress={() => router.push('/settings' as any)} last />
          </View>
          <TouchableOpacity style={styles.logoutLink} onPress={handleSignOut} accessibilityRole="button">
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>MarketLingo v1.1.1</Text>
        </Animated.View>
      </ScrollView>

      <MyCodeSheet code={friendsData.myFriendCode} visible={codeOpen} onShare={() => { void shareInvite(); }} onRedeem={redeemScanned} onClose={() => setCodeOpen(false)} />

      {/* Change industry warning (shared with Home) */}
      <SwitchIndustryModal
        visible={showChangeWarning}
        userId={user?.id}
        marketId={selectedMarket}
        marketName={getMarketName(selectedMarket || 'aerospace')}
        onClose={() => setShowChangeWarning(false)}
      />

      {/* Goal Picker Modal */}
      <Modal visible={showGoalPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Learning Goal</Text>
            <Text style={styles.modalSubtitle}>
              Your lessons and practice content will adapt to match your new objective.
            </Text>
            <View style={{ gap: 8, marginBottom: 16 }}>
              {GOAL_OPTIONS.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.pickerOption,
                    currentGoal === goal.id && { borderColor: goal.color, backgroundColor: goal.color + '08' },
                  ]}
                  onPress={() => handleChangeGoal(goal.id)}
                  disabled={savingPreference}
                >
                  <View style={[styles.pickerIcon, { backgroundColor: goal.color + '18' }]}>
                    <Feather name={goal.icon} size={18} color={goal.color} />
                  </View>
                  <Text style={[styles.pickerText, currentGoal === goal.id && { color: goal.color, fontWeight: '700' }]}>
                    {goal.title}
                  </Text>
                  {currentGoal === goal.id && (
                    <Feather name="check" size={18} color={goal.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowGoalPicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Level Picker Modal */}
      <Modal visible={showLevelPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Experience Level</Text>
            <Text style={styles.modalSubtitle}>
              This adjusts the depth and complexity of your daily lessons.
            </Text>
            <View style={{ gap: 8, marginBottom: 16 }}>
              {FAMILIARITY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.pickerOption,
                    currentLevel === level.id && { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.06)' },
                  ]}
                  onPress={() => handleChangeLevel(level.id)}
                  disabled={savingPreference}
                >
                  <View style={[styles.pickerIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Feather
                      name={level.id === 'beginner' ? 'sunrise' : level.id === 'intermediate' ? 'sun' : 'zap'}
                      size={18}
                      color="#10B981"
                    />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.pickerText, { flex: 0 }, currentLevel === level.id && { color: '#10B981', fontWeight: '700' }]}>
                      {level.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 15 }}>{level.description}</Text>
                  </View>
                  {currentLevel === level.id && (
                    <Feather name="check" size={18} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowLevelPicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MenuRow({ icon, title, subtitle, onPress, last, highlight }: {
  icon: keyof typeof Feather.glyphMap; title: string; subtitle: string; onPress: () => void; last?: boolean; highlight?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.row, !last && styles.rowDivider]} onPress={onPress} activeOpacity={0.75} accessibilityRole="button">
      <View style={[styles.menuIcon, { backgroundColor: highlight ? COLORS.accentSoft : COLORS.bg1 }]}>
        <Feather name={icon} size={18} color={COLORS.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  gear: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  avatarCrown: { position: 'absolute', top: -15, left: 16 },
  idCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 22, backgroundColor: COLORS.bg2, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border },
  name: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary },
  industry: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  qrBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.accentSoft, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.accentMedium, alignItems: 'center', justifyContent: 'center' },
  group: { borderRadius: 20, backgroundColor: COLORS.bg2, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 64 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  requestCount: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, marginRight: 8,
    backgroundColor: COLORS.error, alignItems: 'center', justifyContent: 'center',
  },
  requestCountText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16 },
  header: { marginBottom: 20 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary },
  email: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  proBadge: { backgroundColor: 'rgba(139, 92, 246, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  proBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.accent },
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  proBanner: { width: '100%', height: undefined, aspectRatio: 728 / 200, borderRadius: 16 },
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
  collectionCard: { backgroundColor: COLORS.bg2, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.border },
  collectionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
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
  logoutLink: { alignSelf: 'flex-start', paddingVertical: 14, paddingHorizontal: 4, minHeight: 44 },
  logoutText: { fontSize: 15, color: COLORS.textMuted },
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
  pickerOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.bg2,
  },
  pickerIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  pickerText: {
    fontSize: 15, fontWeight: '500', color: COLORS.textPrimary, flex: 1,
  },
});

