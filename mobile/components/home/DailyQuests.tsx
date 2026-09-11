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
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 60, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (quest.isCompleted) {
      Animated.spring(checkScale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();
    }
  }, [quest.isCompleted]);

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
        style={styles.questRow}
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={quest.isCompleted}
      >
        {/* Icon circle */}
        <View style={[styles.questIcon, quest.isCompleted && styles.questIconDone]}>
          {quest.isCompleted ? (
            <Animated.View style={{ transform: [{ scale: checkScale }] }}>
              <Feather name="check" size={14} color="#fff" />
            </Animated.View>
          ) : (
            <Feather name={iconName} size={14} color={COLORS.accent} />
          )}
        </View>

        {/* Title */}
        <Text
          style={[styles.questTitle, quest.isCompleted && styles.questTitleDone]}
          numberOfLines={1}
        >
          {quest.title}
        </Text>

        {/* XP chip */}
        <View style={[styles.xpChip, quest.isCompleted && styles.xpChipDone]}>
          <Text style={[styles.xpChipText, quest.isCompleted && styles.xpChipTextDone]}>
            {quest.isCompleted ? '✓' : `+${quest.xpBonus}`}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function DailyQuests({ quests, completedCount, totalBonusXP, allComplete }: DailyQuestsProps) {
  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.header}>
        <Feather name="flag" size={14} color={COLORS.accent} />
        <Text style={styles.headerTitle}>Daily Quests</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{completedCount}/{quests.length}</Text>
        </View>
      </View>

      {/* All complete banner (compact) */}
      {allComplete && (
        <View style={styles.allCompleteBanner}>
          <Feather name="award" size={16} color={COLORS.success} />
          <Text style={styles.allCompleteText}>All done! +{totalBonusXP} XP</Text>
        </View>
      )}

      {/* Quest rows */}
      {quests.map((quest, idx) => (
        <QuestRow key={quest.id} quest={quest} index={idx} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: COLORS.border, gap: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 2,
  },
  headerTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  countBadge: {
    backgroundColor: COLORS.accentSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  countText: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
  allCompleteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.successSoft, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10,
  },
  allCompleteText: { fontSize: 12, fontWeight: '700', color: COLORS.success },
  questRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, paddingHorizontal: 4,
  },
  questIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  questIconDone: { backgroundColor: COLORS.success },
  questTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  questTitleDone: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  xpChip: {
    backgroundColor: COLORS.accentSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  xpChipDone: { backgroundColor: 'rgba(34,197,94,0.12)' },
  xpChipText: { fontSize: 10, fontWeight: '700', color: COLORS.accent },
  xpChipTextDone: { color: COLORS.success },
});
