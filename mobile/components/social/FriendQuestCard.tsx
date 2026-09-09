import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { FriendQuest } from '../../hooks/useFriendQuests';
import { triggerHaptic } from '../../lib/haptics';

const QUEST_ICON: Record<string, keyof typeof Feather.glyphMap> = {
  lessons: 'book-open',
  drills: 'zap',
  games: 'play-circle',
};

interface Props {
  quest: FriendQuest;
  onRespond?: (accept: boolean) => void;
}

export function FriendQuestCard({ quest, onRespond }: Props) {
  const pct = Math.min(1, quest.target > 0 ? quest.totalProgress / quest.target : 0);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 600,
      useNativeDriver: false, // width animation
    }).start();
  }, [pct]);

  const done = quest.status === 'completed';

  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <View style={styles.head}>
        <View style={[styles.icon, done && { backgroundColor: COLORS.successSoft }]}>
          <Feather
            name={done ? 'check' : QUEST_ICON[quest.questKey] || 'target'}
            size={15}
            color={done ? COLORS.success : COLORS.accent}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{quest.title}</Text>
          <Text style={styles.sub}>with {quest.partnerName}</Text>
        </View>
        <View style={styles.xpPill}>
          <Text style={styles.xpText}>+{quest.xpReward} XP</Text>
        </View>
      </View>

      {quest.status === 'pending' ? (
        onRespond ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={() => { triggerHaptic('light'); onRespond(false); }}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => { triggerHaptic('success'); onRespond(true); }}
            >
              <Text style={styles.acceptText}>Accept quest</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.waiting}>Waiting for {quest.partnerName} to accept…</Text>
        )
      ) : (
        <>
          <View style={styles.track}>
            <Animated.View
              style={[
                styles.fill,
                done && { backgroundColor: COLORS.success },
                { width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
              ]}
            />
          </View>
          <View style={styles.footRow}>
            <Text style={styles.progressText}>
              {Math.min(quest.totalProgress, quest.target)} / {quest.target}
            </Text>
            <Text style={styles.splitText}>
              You {quest.myProgress} · {quest.partnerName} {quest.partnerProgress}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg2, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  cardDone: { borderColor: 'rgba(16,185,129,0.3)', backgroundColor: COLORS.successSoft },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  sub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  xpPill: { backgroundColor: COLORS.accentSoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  xpText: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
  track: { height: 8, borderRadius: 4, backgroundColor: COLORS.bg1, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  footRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  splitText: { fontSize: 11, color: COLORS.textMuted },
  actions: { flexDirection: 'row', gap: 8 },
  declineBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border,
  },
  declineText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  acceptBtn: { flex: 2, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.accent },
  acceptText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  waiting: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
});
