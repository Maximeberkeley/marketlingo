import { useState, useEffect, useCallback, useMemo } from 'react';
import { DailyCompletion } from '../lib/types';

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  emoji: string;
  target: number;
  current: number;
  xpBonus: number;
  /** XP multiplier applied when quest is completed (e.g., 1.5 = 50% bonus) */
  multiplier: number;
  isCompleted: boolean;
  type: 'lesson' | 'drill' | 'game' | 'combo' | 'streak';
}

// Deterministic quest pool — rotated daily based on date seed
const QUEST_POOL: Omit<DailyQuest, 'current' | 'isCompleted'>[] = [
  {
    id: 'complete_lesson',
    title: 'Scholar',
    description: 'Complete today\'s lesson',
    emoji: '📚',
    target: 1,
    xpBonus: 25,
    multiplier: 1.5,
    type: 'lesson',
  },
  {
    id: 'finish_2_drills',
    title: 'Drill Master',
    description: 'Finish 2 drills',
    emoji: '🎯',
    target: 2,
    xpBonus: 20,
    multiplier: 1.3,
    type: 'drill',
  },
  {
    id: 'finish_1_game',
    title: 'Game On',
    description: 'Complete 1 game',
    emoji: '🎮',
    target: 1,
    xpBonus: 15,
    multiplier: 1.3,
    type: 'game',
  },
  {
    id: 'lesson_plus_drill',
    title: 'Power Combo',
    description: 'Complete a lesson + 1 drill',
    emoji: '⚡',
    target: 2,
    xpBonus: 40,
    multiplier: 2.0,
    type: 'combo',
  },
  {
    id: 'triple_threat',
    title: 'Triple Threat',
    description: 'Lesson + Game + Drill in one day',
    emoji: '🔥',
    target: 3,
    xpBonus: 60,
    multiplier: 2.5,
    type: 'combo',
  },
  {
    id: 'finish_3_drills',
    title: 'Sharpshooter',
    description: 'Finish 3 drills',
    emoji: '🏹',
    target: 3,
    xpBonus: 30,
    multiplier: 1.5,
    type: 'drill',
  },
  {
    id: 'speed_learner',
    title: 'Speed Learner',
    description: 'Complete lesson in under 5 min',
    emoji: '⏱️',
    target: 1,
    xpBonus: 35,
    multiplier: 1.8,
    type: 'lesson',
  },
  {
    id: 'finish_2_games',
    title: 'Gamer',
    description: 'Complete 2 games',
    emoji: '🕹️',
    target: 2,
    xpBonus: 25,
    multiplier: 1.4,
    type: 'game',
  },
];

/**
 * Simple deterministic seeded shuffle to pick 3 quests per day
 */
function getDayQuests(dateStr: string): typeof QUEST_POOL {
  // Simple hash from date string
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = (seed * 31 + dateStr.charCodeAt(i)) | 0;
  }

  const pool = [...QUEST_POOL];
  // Fisher-Yates with seed
  for (let i = pool.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) | 0;
    const j = ((seed >>> 16) & 0x7fff) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Always include "lesson" type as first quest, then pick 2 others
  const lessonQuest = pool.find((q) => q.type === 'lesson') || pool[0];
  const others = pool.filter((q) => q.id !== lessonQuest.id).slice(0, 2);
  return [lessonQuest, ...others];
}

export function useDailyQuests(dailyCompletion: DailyCompletion | null, streak?: number) {
  const today = new Date().toISOString().split('T')[0];

  const quests = useMemo<DailyQuest[]>(() => {
    const templates = getDayQuests(today);
    const lesson = dailyCompletion?.lesson_completed || false;
    const drills = dailyCompletion?.drills_completed || 0;
    const games = dailyCompletion?.games_completed || 0;

    return templates.map((t) => {
      let current = 0;

      switch (t.type) {
        case 'lesson':
          current = lesson ? 1 : 0;
          break;
        case 'drill':
          current = Math.min(drills, t.target);
          break;
        case 'game':
          current = Math.min(games, t.target);
          break;
        case 'combo':
          if (t.id === 'lesson_plus_drill') {
            current = (lesson ? 1 : 0) + Math.min(drills, 1);
          } else if (t.id === 'triple_threat') {
            current = (lesson ? 1 : 0) + (games > 0 ? 1 : 0) + (drills > 0 ? 1 : 0);
          }
          break;
        case 'streak':
          current = Math.min(streak || 0, t.target);
          break;
      }

      return {
        ...t,
        current,
        isCompleted: current >= t.target,
      };
    });
  }, [today, dailyCompletion, streak]);

  const completedCount = quests.filter((q) => q.isCompleted).length;
  const totalBonusXP = quests.filter((q) => q.isCompleted).reduce((sum, q) => sum + q.xpBonus, 0);
  const allComplete = completedCount === quests.length;

  return {
    quests,
    completedCount,
    totalBonusXP,
    allComplete,
  };
}
