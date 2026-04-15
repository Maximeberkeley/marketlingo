import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../../lib/constants';
import type { Seminar } from '../../hooks/useSeminars';

function getCountdown(date: string): string {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return 'Now';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

const STATUS_CONFIG: Record<string, { label: string; colors: readonly [string, string]; icon: keyof typeof Feather.glyphMap }> = {
  upcoming: { label: 'Upcoming', colors: ['#4338CA', '#6366F1'] as const, icon: 'clock' },
  live: { label: 'LIVE', colors: ['#DC2626', '#EF4444'] as const, icon: 'radio' },
  completed: { label: 'Replay', colors: ['#059669', '#10B981'] as const, icon: 'play-circle' },
};

interface Props {
  seminar: Seminar;
  onPress: () => void;
  prepProgress?: number;
}

export function SeminarCard({ seminar, onPress, prepProgress }: Props) {
  const [countdown, setCountdown] = useState(getCountdown(seminar.scheduled_at));
  const config = STATUS_CONFIG[seminar.status] || STATUS_CONFIG.upcoming;

  useEffect(() => {
    if (seminar.status === 'completed') return;
    const timer = setInterval(() => setCountdown(getCountdown(seminar.scheduled_at)), 60000);
    return () => clearInterval(timer);
  }, [seminar.scheduled_at, seminar.status]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      <LinearGradient colors={['#1E1B4B', '#312E81', '#4338CA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        {/* Status badge */}
        <View style={styles.header}>
          <LinearGradient colors={config.colors} style={styles.statusBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Feather name={config.icon} size={10} color="#FFF" />
            <Text style={styles.statusText}>{config.label}</Text>
          </LinearGradient>
          {seminar.status !== 'completed' && (
            <Text style={styles.countdown}>{countdown}</Text>
          )}
        </View>

        {/* Content */}
        <Text style={styles.title} numberOfLines={2}>{seminar.title}</Text>
        
        {seminar.speaker_name && (
          <View style={styles.speakerRow}>
            <View style={styles.speakerAvatar}>
              <Feather name="user" size={12} color="#A5B4FC" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.speakerName}>{seminar.speaker_name}</Text>
              {seminar.speaker_title && (
                <Text style={styles.speakerTitle} numberOfLines={1}>{seminar.speaker_title}</Text>
              )}
            </View>
          </View>
        )}

        {/* Prep progress */}
        {prepProgress !== undefined && prepProgress > 0 && (
          <View style={styles.prepRow}>
            <View style={styles.prepBarBg}>
              <View style={[styles.prepBarFill, { width: `${Math.min(100, prepProgress)}%` }]} />
            </View>
            <Text style={styles.prepLabel}>{Math.round(prepProgress)}% prepped</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.metaRow}>
            <Feather name="clock" size={12} color="#A5B4FC" />
            <Text style={styles.metaText}>{seminar.duration_minutes} min</Text>
          </View>
          {seminar.is_pro_only && (
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, overflow: 'hidden', ...SHADOWS.card },
  gradient: { padding: 20, minHeight: 180 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#FFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  countdown: { color: '#C7D2FE', fontSize: 13, fontWeight: '600' },
  title: { color: '#FFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginBottom: 12, lineHeight: 26 },
  speakerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  speakerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(165, 180, 252, 0.15)', alignItems: 'center', justifyContent: 'center' },
  speakerName: { color: '#E0E7FF', fontSize: 13, fontWeight: '700' },
  speakerTitle: { color: '#A5B4FC', fontSize: 11, marginTop: 1 },
  prepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  prepBarBg: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' },
  prepBarFill: { height: '100%', backgroundColor: '#818CF8', borderRadius: 2 },
  prepLabel: { color: '#C7D2FE', fontSize: 11, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#A5B4FC', fontSize: 12, fontWeight: '500' },
  proBadge: { backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  proText: { color: '#FCD34D', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
