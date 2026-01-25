import { Flame, Zap, BookOpen, Target, Trophy, Rocket, Calendar, Star, Award, Crown, Medal, Sparkles } from "lucide-react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof achievementIcons;
  xpReward: number;
  requirement: {
    type: "streak" | "xp" | "lessons" | "drills" | "games" | "days" | "level";
    value: number;
  };
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export const achievementIcons = {
  flame: Flame,
  zap: Zap,
  book: BookOpen,
  target: Target,
  trophy: Trophy,
  rocket: Rocket,
  calendar: Calendar,
  star: Star,
  award: Award,
  crown: Crown,
  medal: Medal,
  sparkles: Sparkles,
};

export const tierColors = {
  bronze: { bg: "bg-orange-900/20", border: "border-orange-700/30", text: "text-orange-400" },
  silver: { bg: "bg-slate-400/20", border: "border-slate-400/30", text: "text-slate-300" },
  gold: { bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-400" },
  platinum: { bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-400" },
};

export const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  { id: "first_flame", name: "First Flame", description: "Complete your first day", icon: "flame", xpReward: 25, requirement: { type: "streak", value: 1 }, tier: "bronze" },
  { id: "week_warrior", name: "Week Warrior", description: "7-day streak", icon: "flame", xpReward: 100, requirement: { type: "streak", value: 7 }, tier: "silver" },
  { id: "month_master", name: "Month Master", description: "30-day streak", icon: "flame", xpReward: 500, requirement: { type: "streak", value: 30 }, tier: "gold" },
  { id: "unstoppable", name: "Unstoppable", description: "90-day streak", icon: "crown", xpReward: 1500, requirement: { type: "streak", value: 90 }, tier: "platinum" },
  
  // XP achievements
  { id: "xp_starter", name: "Getting Started", description: "Earn 100 XP", icon: "zap", xpReward: 10, requirement: { type: "xp", value: 100 }, tier: "bronze" },
  { id: "xp_century", name: "Century Club", description: "Earn 1,000 XP", icon: "zap", xpReward: 50, requirement: { type: "xp", value: 1000 }, tier: "silver" },
  { id: "xp_master", name: "XP Master", description: "Earn 5,000 XP", icon: "star", xpReward: 250, requirement: { type: "xp", value: 5000 }, tier: "gold" },
  { id: "xp_legend", name: "Legendary", description: "Earn 10,000 XP", icon: "crown", xpReward: 1000, requirement: { type: "xp", value: 10000 }, tier: "platinum" },
  
  // Lesson achievements
  { id: "first_lesson", name: "First Steps", description: "Complete your first lesson", icon: "book", xpReward: 25, requirement: { type: "lessons", value: 1 }, tier: "bronze" },
  { id: "ten_lessons", name: "Quick Learner", description: "Complete 10 lessons", icon: "book", xpReward: 100, requirement: { type: "lessons", value: 10 }, tier: "silver" },
  { id: "fifty_lessons", name: "Knowledge Seeker", description: "Complete 50 lessons", icon: "award", xpReward: 500, requirement: { type: "lessons", value: 50 }, tier: "gold" },
  
  // Level achievements
  { id: "level_5", name: "Rising Star", description: "Reach level 5", icon: "rocket", xpReward: 100, requirement: { type: "level", value: 5 }, tier: "bronze" },
  { id: "level_10", name: "Industry Expert", description: "Reach level 10", icon: "trophy", xpReward: 250, requirement: { type: "level", value: 10 }, tier: "silver" },
  { id: "level_20", name: "Market Maven", description: "Reach level 20", icon: "medal", xpReward: 750, requirement: { type: "level", value: 20 }, tier: "gold" },
  
  // Special achievements
  { id: "early_bird", name: "Early Bird", description: "Complete a lesson before 8 AM", icon: "sparkles", xpReward: 50, requirement: { type: "days", value: 1 }, tier: "bronze" },
];
