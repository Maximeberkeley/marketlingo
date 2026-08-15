import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../lib/constants';
import { useSeminars, Seminar } from '../hooks/useSeminars';
import { SeminarCard } from '../components/seminars/SeminarCard';
import { useSelectedMarket } from '../hooks/useSelectedMarket';

export default function SeminarsScreen() {
  const insets = useSafeAreaInsets();
  const { marketId } = useSelectedMarket();
  const { seminars, loading } = useSeminars(marketId);

  const liveSeminars = seminars.filter(s => s.status === 'live');
  const upcomingSeminars = seminars.filter(s => s.status === 'upcoming');
  const pastSeminars = seminars.filter(s => s.status === 'completed');

  const handlePress = (seminar: Seminar) => {
    router.push({ pathname: '/seminar-detail', params: { seminarId: seminar.id } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Seminars</Text>
          <Text style={styles.headerSubtitle}>Expert talks & live learning</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#4338CA" />
        </View>
      ) : seminars.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.emptyIcon}>
            <Feather name="video" size={32} color="#4338CA" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No Seminars Yet</Text>
          <Text style={styles.emptySubtitle}>Expert talks and live learning events will appear here. Stay tuned!</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Live Now */}
          {liveSeminars.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.liveDot} />
                <Text style={styles.sectionTitle}>Live Now</Text>
              </View>
              {liveSeminars.map(s => (
                <SeminarCard key={s.id} seminar={s} onPress={() => handlePress(s)} />
              ))}
            </View>
          )}

          {/* Upcoming */}
          {upcomingSeminars.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming</Text>
              {upcomingSeminars.map(s => (
                <SeminarCard key={s.id} seminar={s} onPress={() => handlePress(s)} />
              ))}
            </View>
          )}

          {/* Past */}
          {pastSeminars.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Past Seminars</Text>
              {pastSeminars.map(s => (
                <SeminarCard key={s.id} seminar={s} onPress={() => handlePress(s)} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 1 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, gap: 24, paddingBottom: 40 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.2 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
});
