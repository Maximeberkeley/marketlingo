import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { COLORS } from '../../lib/constants';
import { APP_ICONS } from '../../lib/icons';
import { DailyQuest } from '../../hooks/useDailyQuests';

interface DailyQuestsProps {
  quests: DailyQuest[];
  completedCount: number;
  totalBonusXP: number;
  allComplete: boolean;
}

function QuestRow({ quest, index }: { quest: DailyQuest; index: number }) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 80, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 280, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (quest.isCompleted) {
      Animated.spring(checkScale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();
    }
  }, [quest.isCompleted]);

  const progressPct = quest.target > 0 ? Math.min(1, quest.current / quest.target) : 0;

  return (
    <Animated.View
      style={[
        styles.questRow,
        quest.isCompleted && styles.questRowCompleted,
        { transform: [{ translateX: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <View style={[styles.questIcon, quest.isCompleted && styles.questIconDone]}>
        <Text style={styles.questEmoji}>{quest.emoji}</Text>
      </View>
      <View style={styles.questContent}>
        <View style={styles.questHeader}>
          <Text style={[styles.questTitle, quest.isCompleted && styles.questTitleDone]} numberOfLines={1}>
            {quest.title}
          </Text>
          <View style={[styles.xpChip, quest.isCompleted && styles.xpChipDone]}>
            <Text style={[styles.xpChipText, quest.isCompleted && styles.xpChipTextDone]}>
              {quest.isCompleted ? '✓' : `+${quest.xpBonus} XP`}
            </Text>
          </View>
        </View>
        <Text style={styles.questDesc} numberOfLines={1}>{quest.description}</Text>
        <View style={styles.questProgressBg}>
          <View style={[styles.questProgressFill, { width: `${progressPct * 100}%` }]} />
        </View>
        <Text style={styles.questProgress}>
          {quest.current}/{quest.target}
          {quest.multiplier > 1 && !quest.isCompleted && (
            <Text style={styles.multiplierText}> • {quest.multiplier}x XP</Text>
          )}
        </Text>
      </View>
      {quest.isCompleted && (
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
          <Text style={styles.checkText}>✓</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export function DailyQuests({ quests, completedCount, totalBonusXP, allComplete }: DailyQuestsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={APP_ICONS.quests} style={{ width: 22, height: 22, resizeMode: 'contain' }} />
          <Text style={styles.headerTitle}>Daily Quests</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{completedCount}/{quests.length}</Text>
        </View>
      </View>

      {allComplete && (
        <View style={styles.allCompleteBanner}>
          <Text style={styles.allCompleteEmoji}>🏆</Text>
          <View>
            <Text style={styles.allCompleteTitle}>All Quests Complete!</Text>
            <Text style={styles.allCompleteSubtitle}>+{totalBonusXP} bonus XP earned</Text>
          </View>
        </View>
      )}

      {quests.map((quest, idx) => (
        <QuestRow key={quest.id} quest={quest} index={idx} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg2, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerEmoji: { fontSize: 18 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  countBadge: {
    backgroundColor: COLORS.accentSoft, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  countText: { fontSize: 12, fontWeight: '700', color: COLORS.accent },
  allCompleteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.successSoft, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
  },
  allCompleteEmoji: { fontSize: 28 },
  allCompleteTitle: { fontSize: 14, fontWeight: '700', color: COLORS.success },
  allCompleteSubtitle: { fontSize: 11, color: COLORS.textMuted },
  questRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg1, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  questRowCompleted: {
    backgroundColor: COLORS.successSoft, borderColor: 'rgba(34,197,94,0.15)',
  },
  questIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  questIconDone: { backgroundColor: 'rgba(34,197,94,0.12)' },
  questEmoji: { fontSize: 20 },
  questContent: { flex: 1 },
  questHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  questTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  questTitleDone: { color: COLORS.success },
  questDesc: { fontSize: 11, color: COLORS.textMuted, marginBottom: 6 },
  xpChip: { backgroundColor: COLORS.accentSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  xpChipDone: { backgroundColor: 'rgba(34,197,94,0.15)' },
  xpChipText: { fontSize: 10, fontWeight: '700', color: COLORS.accent },
  xpChipTextDone: { color: COLORS.success },
  questProgressBg: {
    height: 4, borderRadius: 2, backgroundColor: COLORS.surfaceLight, overflow: 'hidden', marginBottom: 3,
  },
  questProgressFill: { height: '100%', borderRadius: 2, backgroundColor: COLORS.accent },
  questProgress: { fontSize: 10, color: COLORS.textMuted },
  multiplierText: { color: COLORS.gold, fontWeight: '600' },
  checkCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center',
  },
  checkText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
