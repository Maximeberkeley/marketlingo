import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../lib/constants';
import { useSeminarDetail } from '../hooks/useSeminars';
import { PrepModule } from '../components/seminars/PrepModule';
import { SeminarChat } from '../components/seminars/SeminarChat';
import { VideoPlayer } from '../components/seminars/VideoPlayer';

type Tab = 'prep' | 'watch' | 'takeaways';

export default function SeminarDetailScreen() {
  const insets = useSafeAreaInsets();
  const { seminarId } = useLocalSearchParams<{ seminarId: string }>();
  const { seminar, prepModules, registration, loading, register, updatePrepProgress } = useSeminarDetail(seminarId || '');
  const [activeTab, setActiveTab] = useState<Tab>('prep');
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

  // Restore completion progress from server count (best-effort: marks first N modules as done)
  React.useEffect(() => {
    if (!registration || prepModules.length === 0) return;
    const done = registration.prep_modules_done || 0;
    if (done > 0 && completedModules.size === 0) {
      setCompletedModules(new Set(prepModules.slice(0, done).map(m => m.id)));
    }
  }, [registration?.id, prepModules.length]);

  const handleModuleComplete = useCallback((moduleId: string) => {
    setCompletedModules(prev => {
      if (prev.has(moduleId)) return prev;
      const next = new Set(prev);
      next.add(moduleId);
      updatePrepProgress(next.size, prepModules.length);
      return next;
    });
  }, [prepModules.length, updatePrepProgress]);

  const handleRegister = async () => {
    await register();
    Alert.alert('Registered!', 'You\'re all set for this seminar.');
  };

  if (loading || !seminar) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#4338CA" />
        </View>
      </View>
    );
  }

  const isVideoUnlocked = new Date(seminar.scheduled_at).getTime() <= Date.now();
  const isTakeawaysUnlocked = seminar.post_content_at ? new Date(seminar.post_content_at).getTime() <= Date.now() : false;
  const takeaways = Array.isArray(seminar.key_takeaways) ? seminar.key_takeaways : [];

  const TABS: { id: Tab; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { id: 'prep', label: 'Prep', icon: 'book-open' },
    { id: 'watch', label: 'Watch', icon: 'play-circle' },
    { id: 'takeaways', label: 'Takeaways', icon: 'award' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{seminar.title}</Text>
          {seminar.speaker_name && (
            <Text style={styles.headerSubtitle}>with {seminar.speaker_name}</Text>
          )}
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          >
            <Feather name={tab.icon} size={14} color={activeTab === tab.id ? '#4338CA' : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Register CTA if not registered */}
      {!registration && (
        <TouchableOpacity onPress={handleRegister} style={styles.registerCta} activeOpacity={0.85}>
          <LinearGradient colors={['#4338CA', '#6366F1']} style={styles.registerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Feather name="bell" size={16} color="#FFF" />
            <Text style={styles.registerText}>Register for this Seminar</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Tab content */}
      {activeTab === 'prep' && (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentInner} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionIntro}>
            Complete these modules before the seminar to get the most out of it.
          </Text>
          {prepModules.map((mod, idx) => (
            <PrepModule
              key={mod.id}
              module={mod}
              index={idx}
              isCompleted={completedModules.has(mod.id)}
              onComplete={() => handleModuleComplete(mod.id)}
            />
          ))}
          {prepModules.length === 0 && (
            <View style={styles.emptyTab}>
              <Feather name="book" size={28} color={COLORS.textMuted} />
              <Text style={styles.emptyTabText}>No prep modules for this seminar.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'watch' && (
        <View style={styles.watchTab}>
          <View style={styles.videoSection}>
            <VideoPlayer videoUrl={seminar.video_url} isLocked={!isVideoUnlocked} scheduledAt={seminar.scheduled_at} />
          </View>
          <SeminarChat seminarId={seminar.id} />
        </View>
      )}

      {activeTab === 'takeaways' && (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentInner} showsVerticalScrollIndicator={false}>
          {!isTakeawaysUnlocked ? (
            <View style={styles.lockedTab}>
              <Feather name="lock" size={28} color={COLORS.textMuted} />
              <Text style={styles.lockedTitle}>Takeaways Locked</Text>
              <Text style={styles.lockedSubtitle}>
                Available after the seminar on {seminar.post_content_at ? new Date(seminar.post_content_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'TBD'}.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Key Takeaways</Text>
              {takeaways.map((t, i) => (
                <View key={i} style={styles.takeawayCard}>
                  <View style={styles.takeawayNumber}>
                    <Text style={styles.takeawayNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.takeawayText}>{t.text}</Text>
                </View>
              ))}

              {seminar.mini_case && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Mini Case Study</Text>
                  <View style={styles.miniCaseCard}>
                    <Feather name="briefcase" size={18} color="#7C3AED" />
                    <Text style={styles.miniCaseText}>{seminar.mini_case}</Text>
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.bg1 },
  activeTab: { backgroundColor: '#EEF2FF' },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  activeTabText: { color: '#4338CA' },
  registerCta: { marginHorizontal: 20, marginTop: 12 },
  registerGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  registerText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  tabContent: { flex: 1 },
  tabContentInner: { padding: 20, gap: 12, paddingBottom: 40 },
  sectionIntro: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.2 },
  emptyTab: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  emptyTabText: { fontSize: 14, color: COLORS.textMuted },
  watchTab: { flex: 1 },
  videoSection: { padding: 20, paddingBottom: 0 },
  lockedTab: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  lockedTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  lockedSubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  takeawayCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  takeawayNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  takeawayNumberText: { fontSize: 12, fontWeight: '800', color: '#4338CA' },
  takeawayText: { flex: 1, fontSize: 14, lineHeight: 20, color: COLORS.textSecondary },
  miniCaseCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, backgroundColor: '#FAF5FF', borderRadius: 14, borderWidth: 1, borderColor: '#DDD6FE' },
  miniCaseText: { flex: 1, fontSize: 14, lineHeight: 22, color: COLORS.textPrimary },
});
