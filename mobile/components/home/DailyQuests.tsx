import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '../../lib/constants';
import { DailyQuest } from '../../hooks/useDailyQuests';
import { triggerHaptic } from '../../lib/haptics';

interface DailyQuestsProps {
  quests: DailyQuest[];
  completedCount: number;
  totalBonusXP: number;
  allComplete: boolean;
}

const QUEST_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  lesson: 'book-open',
  drill: 'zap',
  game: 'play-circle',
  combo: 'target',
  streak: 'activity',
};

const QUEST_ROUTES: Record<string, string> = {
  lesson: '/(tabs)/home',
  drill: '/drills',
  game: '/games',
  combo: '/(tabs)/practice',
  streak: '/(tabs)/home',
};

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
  const iconName = QUEST_ICONS[quest.type] || 'book-open';
  const route = QUEST_ROUTES[quest.type] || '/(tabs)/home';

  const handlePress = () => {
    triggerHaptic('light');
    if (!quest.isCompleted) {
      router.push(route as any);
    }
  };

  return (
    <Animated.View style={[{ transform: [{ translateX: slideAnim }], opacity: opacityAnim }]}>
      <TouchableOpacity
        style={[styles.questRow, quest.isCompleted && styles.questRowCompleted]}
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={quest.isCompleted}
      >
        <View style={[styles.questIcon, quest.isCompleted && styles.questIconDone]}>
          <Feather name={iconName} size={20} color={quest.isCompleted ? COLORS.success : COLORS.accent} />
        </View>
        <View style={styles.questContent}>
          <View style={styles.questHeader}>
            <Text style={[styles.questTitle, quest.isCompleted && styles.questTitleDone]} numberOfLines={1}>
              {quest.title}
            </Text>
            <View style={[styles.xpChip, quest.isCompleted && styles.xpChipDone]}>
              <Text style={[styles.xpChipText, quest.isCompleted && styles.xpChipTextDone]}>
                {quest.isCompleted ? '✓' : `+${quest.xpBonus}`}
              </Text>
            </View>
          </View>
          <Text style={styles.questDesc} numberOfLines={1}>{quest.description}</Text>
          <View style={styles.questProgressBg}>
            <View style={[styles.questProgressFill, quest.isCompleted && styles.questProgressFillDone, { width: `${progressPct * 100}%` }]} />
          </View>
          <Text style={styles.questProgress}>
            {quest.current}/{quest.target}
            {quest.multiplier > 1 && !quest.isCompleted && (
              <Text style={styles.multiplierText}> · {quest.multiplier}x</Text>
            )}
          </Text>
        </View>
        {quest.isCompleted ? (
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
            <Feather name="check" size={14} color="#fff" />
          </Animated.View>
        ) : (
          <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function DailyQuests({ quests, completedCount, totalBonusXP, allComplete }: DailyQuestsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="flag" size={18} color={COLORS.accent} />
          <Text style={styles.headerTitle}>Daily Quests</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{completedCount}/{quests.length}</Text>
        </View>
      </View>

      {allComplete && (
        <View style={styles.allCompleteBanner}>
          <Feather name="award" size={24} color={COLORS.success} />
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
    borderWidth: 1, borderColor: COLORS.border, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  countBadge: {
    backgroundColor: COLORS.accentSoft, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10,
  },
  countText: { fontSize: 12, fontWeight: '700', color: COLORS.accent },
  allCompleteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.successSoft, borderRadius: 12, padding: 12,
  },
  allCompleteTitle: { fontSize: 14, fontWeight: '700', color: COLORS.success },
  allCompleteSubtitle: { fontSize: 11, color: COLORS.textMuted },
  questRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg1, borderRadius: 14, padding: 12,
  },
  questRowCompleted: { backgroundColor: COLORS.successSoft },
  questIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  questIconDone: { backgroundColor: 'rgba(34,197,94,0.12)' },
  questContent: { flex: 1 },
  questHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  questTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
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
  questProgressFillDone: { backgroundColor: COLORS.success },
  questProgress: { fontSize: 10, color: COLORS.textMuted },
  multiplierText: { color: COLORS.gold, fontWeight: '600' },
  checkCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center',
  },
  chevron: { fontSize: 20, color: COLORS.textMuted, marginLeft: 4 },
});
