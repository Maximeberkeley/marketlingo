export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  xpReward: number;
  requirement: {
    type: 'streak' | 'xp' | 'lessons' | 'drills' | 'games' | 'days' | 'level';
    value: number;
  };
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const tierColors: Record<string, { bg: string; border: string; text: string }> = {
  bronze: { bg: 'rgba(234, 88, 12, 0.15)', border: 'rgba(234, 88, 12, 0.3)', text: '#F97316' },
  silver: { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)', text: '#94A3B8' },
  gold: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#F59E0B' },
  platinum: { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)', text: '#8B5CF6' },
};

export const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  { id: 'first_flame', name: 'First Flame', description: 'Complete your first day', emoji: '🔥', xpReward: 25, requirement: { type: 'streak', value: 1 }, tier: 'bronze' },
  { id: 'week_warrior', name: 'Week Warrior', description: '7-day streak', emoji: '🔥', xpReward: 100, requirement: { type: 'streak', value: 7 }, tier: 'silver' },
  { id: 'month_master', name: 'Month Master', description: '30-day streak', emoji: '🔥', xpReward: 500, requirement: { type: 'streak', value: 30 }, tier: 'gold' },
  { id: 'unstoppable', name: 'Unstoppable', description: '90-day streak', emoji: '👑', xpReward: 1500, requirement: { type: 'streak', value: 90 }, tier: 'platinum' },

  // XP achievements
  { id: 'xp_starter', name: 'Getting Started', description: 'Earn 100 XP', emoji: '⚡', xpReward: 10, requirement: { type: 'xp', value: 100 }, tier: 'bronze' },
  { id: 'xp_century', name: 'Century Club', description: 'Earn 1,000 XP', emoji: '⚡', xpReward: 50, requirement: { type: 'xp', value: 1000 }, tier: 'silver' },
  { id: 'xp_master', name: 'XP Master', description: 'Earn 5,000 XP', emoji: '⭐', xpReward: 250, requirement: { type: 'xp', value: 5000 }, tier: 'gold' },
  { id: 'xp_legend', name: 'Legendary', description: 'Earn 10,000 XP', emoji: '👑', xpReward: 1000, requirement: { type: 'xp', value: 10000 }, tier: 'platinum' },

  // Lesson achievements
  { id: 'first_lesson', name: 'First Steps', description: 'Complete your first lesson', emoji: '📚', xpReward: 25, requirement: { type: 'lessons', value: 1 }, tier: 'bronze' },
  { id: 'ten_lessons', name: 'Quick Learner', description: 'Complete 10 lessons', emoji: '📚', xpReward: 100, requirement: { type: 'lessons', value: 10 }, tier: 'silver' },
  { id: 'fifty_lessons', name: 'Knowledge Seeker', description: 'Complete 50 lessons', emoji: '🏆', xpReward: 500, requirement: { type: 'lessons', value: 50 }, tier: 'gold' },

  // Level achievements
  { id: 'level_5', name: 'Rising Star', description: 'Reach level 5', emoji: '🚀', xpReward: 100, requirement: { type: 'level', value: 5 }, tier: 'bronze' },
  { id: 'level_10', name: 'Industry Expert', description: 'Reach level 10', emoji: '🏆', xpReward: 250, requirement: { type: 'level', value: 10 }, tier: 'silver' },
  { id: 'level_20', name: 'Market Maven', description: 'Reach level 20', emoji: '🎖️', xpReward: 750, requirement: { type: 'level', value: 20 }, tier: 'gold' },

  // Special achievements
  { id: 'early_bird', name: 'Early Bird', description: 'Complete a lesson before 8 AM', emoji: '✨', xpReward: 50, requirement: { type: 'days', value: 1 }, tier: 'bronze' },
];
