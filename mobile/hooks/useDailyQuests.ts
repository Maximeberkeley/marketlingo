import { useMemo } from 'react';
import { DailyCompletion } from '../lib/types';
import { localDateString } from '../lib/dayMath';

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

type QuestTemplate = Omit<DailyQuest, 'current' | 'isCompleted'>;

/**
 * Each weekday has its own theme so the home screen genuinely changes shape
 * from one day to the next, and quests are only ever drawn from the pool that
 * we can actually measure (lessons, drills, games, streak).
 */
const DAY_THEMES: { key: string; title: string; tagline: string }[] = [
  { key: 'sun', title: 'Reset Sunday', tagline: 'Light session, keep the chain alive' },
  { key: 'mon', title: 'Momentum Monday', tagline: 'Set the tone for the week' },
  { key: 'tue', title: 'Tactics Tuesday', tagline: 'Sharpen the fundamentals' },
  { key: 'wed', title: 'Deep Dive Wednesday', tagline: 'Go one layer deeper' },
  { key: 'thu', title: 'Throughput Thursday', tagline: 'Volume day — stack the reps' },
  { key: 'fri', title: 'Field Test Friday', tagline: 'Put the theory to work' },
  { key: 'sat', title: 'Sharpshooter Saturday', tagline: 'Precision over speed' },
];

const LESSON_QUESTS: QuestTemplate[] = [
  { id: 'complete_lesson', title: 'Scholar', description: "Complete today's lesson", emoji: '', target: 1, xpBonus: 25, multiplier: 1.5, type: 'lesson' },
  { id: 'daily_brief', title: 'Daily Brief', description: 'Finish the mission briefing', emoji: '', target: 1, xpBonus: 25, multiplier: 1.5, type: 'lesson' },
  { id: 'make_the_call', title: 'Make the Call', description: "Close out today's lesson decision", emoji: '', target: 1, xpBonus: 30, multiplier: 1.6, type: 'lesson' },
];

const SIDE_QUESTS: QuestTemplate[] = [
  { id: 'finish_2_drills', title: 'Drill Master', description: 'Finish 2 drills', emoji: '', target: 2, xpBonus: 20, multiplier: 1.3, type: 'drill' },
  { id: 'finish_3_drills', title: 'Sharpshooter', description: 'Finish 3 drills', emoji: '', target: 3, xpBonus: 30, multiplier: 1.5, type: 'drill' },
  { id: 'finish_5_drills', title: 'Rep Machine', description: 'Finish 5 drills', emoji: '', target: 5, xpBonus: 45, multiplier: 1.7, type: 'drill' },
  { id: 'finish_1_game', title: 'Game On', description: 'Complete 1 game', emoji: '', target: 1, xpBonus: 15, multiplier: 1.3, type: 'game' },
  { id: 'finish_2_games', title: 'Gamer', description: 'Complete 2 games', emoji: '', target: 2, xpBonus: 25, multiplier: 1.4, type: 'game' },
  { id: 'finish_3_games', title: 'Arcade Run', description: 'Complete 3 games', emoji: '', target: 3, xpBonus: 40, multiplier: 1.6, type: 'game' },
  { id: 'lesson_plus_drill', title: 'Power Combo', description: 'Complete a lesson + 1 drill', emoji: '⚡', target: 2, xpBonus: 40, multiplier: 2.0, type: 'combo' },
  { id: 'lesson_plus_game', title: 'Warm Down', description: 'Complete a lesson + 1 game', emoji: '', target: 2, xpBonus: 35, multiplier: 1.8, type: 'combo' },
  { id: 'triple_threat', title: 'Triple Threat', description: 'Lesson + game + drill in one day', emoji: '', target: 3, xpBonus: 60, multiplier: 2.5, type: 'combo' },
  { id: 'double_drills_games', title: 'Two Front War', description: '2 drills + 2 games', emoji: '', target: 4, xpBonus: 50, multiplier: 2.0, type: 'combo' },
  { id: 'keep_streak_3', title: 'Chain Keeper', description: 'Hold a 3-day streak', emoji: '', target: 3, xpBonus: 20, multiplier: 1.3, type: 'streak' },
  { id: 'keep_streak_7', title: 'Week Warrior', description: 'Hold a 7-day streak', emoji: '', target: 7, xpBonus: 45, multiplier: 1.8, type: 'streak' },
];

/** Deterministic 32-bit hash so every device shows the same quests on a date. */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickDeterministic<T>(pool: T[], count: number, seed: number): T[] {
  const items = [...pool];
  const picked: T[] = [];
  let s = seed || 1;
  while (picked.length < count && items.length > 0) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const idx = s % items.length;
    picked.push(items.splice(idx, 1)[0]);
  }
  return picked;
}

function progressFor(t: QuestTemplate, lesson: boolean, drills: number, games: number, streak: number): number {
  switch (t.type) {
    case 'lesson':
      return lesson ? 1 : 0;
    case 'drill':
      return Math.min(drills, t.target);
    case 'game':
      return Math.min(games, t.target);
    case 'streak':
      return Math.min(streak, t.target);
    case 'combo':
      if (t.id === 'lesson_plus_drill') return (lesson ? 1 : 0) + Math.min(drills, 1);
      if (t.id === 'lesson_plus_game') return (lesson ? 1 : 0) + Math.min(games, 1);
      if (t.id === 'triple_threat') return (lesson ? 1 : 0) + (games > 0 ? 1 : 0) + (drills > 0 ? 1 : 0);
      if (t.id === 'double_drills_games') return Math.min(drills, 2) + Math.min(games, 2);
      return 0;
    default:
      return 0;
  }
}

export function useDailyQuests(dailyCompletion: DailyCompletion | null, streak?: number) {
  // Local calendar day — quests roll over at the learner's midnight, anywhere.
  const today = localDateString();
  const weekday = new Date().getDay();

  const theme = DAY_THEMES[weekday];

  const quests = useMemo<DailyQuest[]>(() => {
    const seed = hashSeed(today);
    const lessonQuest = pickDeterministic(LESSON_QUESTS, 1, seed)[0];

    // Sunday is deliberately lighter (2 quests), Thursday heavier (4).
    const sideCount = weekday === 0 ? 1 : weekday === 4 ? 3 : 2;
    const sides = pickDeterministic(SIDE_QUESTS, sideCount, seed ^ 0x9e3779b9);

    const templates = [lessonQuest, ...sides];
    const lesson = dailyCompletion?.lesson_completed || false;
    const drills = dailyCompletion?.drills_completed || 0;
    const games = dailyCompletion?.games_completed || 0;

    return templates.map((t) => {
      const current = progressFor(t, lesson, drills, games, streak || 0);
      return { ...t, current, isCompleted: current >= t.target };
    });
  }, [today, weekday, dailyCompletion, streak]);

  const completedCount = quests.filter((q) => q.isCompleted).length;
  const totalBonusXP = quests.filter((q) => q.isCompleted).reduce((sum, q) => sum + q.xpBonus, 0);
  const allComplete = quests.length > 0 && completedCount === quests.length;

  return {
    quests,
    completedCount,
    totalBonusXP,
    allComplete,
    themeTitle: theme.title,
    themeTagline: theme.tagline,
  };
}
