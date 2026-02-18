import { useMemo, useCallback } from 'react';
import { useSubscription } from './useSubscription';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AccessTier = 'free' | 'pro' | 'trial';

interface ContentAccessConfig {
  maxSlidesPerStack: number;
  showSourceLinks: boolean;
  maxGamesPerDay: number;
  maxDrillsPerDay: number;
  maxTrainerScenariosPerDay: number;
  hasAIMentorAccess: boolean;
  hasInvestmentLabAccess: boolean;
  hasProTrainerAccess: boolean;
  hasAdvancedContent: boolean;
  hasCertificationAccess: boolean;
  contentDepth: 'basic' | 'intermediate' | 'professional';
}

const FREE_CONFIG: ContentAccessConfig = {
  maxSlidesPerStack: 3,
  showSourceLinks: false,
  maxGamesPerDay: 3,
  maxDrillsPerDay: 5,
  maxTrainerScenariosPerDay: 1,
  hasAIMentorAccess: false,
  hasInvestmentLabAccess: false,
  hasProTrainerAccess: false,
  hasAdvancedContent: false,
  hasCertificationAccess: false,
  contentDepth: 'basic',
};

const PRO_CONFIG: ContentAccessConfig = {
  maxSlidesPerStack: 6,
  showSourceLinks: true,
  maxGamesPerDay: Infinity,
  maxDrillsPerDay: Infinity,
  maxTrainerScenariosPerDay: Infinity,
  hasAIMentorAccess: true,
  hasInvestmentLabAccess: true,
  hasProTrainerAccess: true,
  hasAdvancedContent: true,
  hasCertificationAccess: true,
  contentDepth: 'professional',
};

const USAGE_STORAGE_KEY = 'marketlingo_daily_usage';

interface DailyUsage {
  date: string;
  gamesPlayed: number;
  drillsCompleted: number;
  trainerScenariosCompleted: number;
}

async function getTodayUsage(): Promise<DailyUsage> {
  const today = new Date().toDateString();
  try {
    const stored = await AsyncStorage.getItem(USAGE_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as DailyUsage;
      if (data.date === today) return data;
    }
  } catch {}
  return { date: today, gamesPlayed: 0, drillsCompleted: 0, trainerScenariosCompleted: 0 };
}

async function saveDailyUsage(usage: DailyUsage) {
  await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
}

export function useContentAccess() {
  const { isProUser, trialStatus, planType } = useSubscription();

  const accessTier = useMemo((): AccessTier => {
    if (isProUser) return trialStatus.isInTrial ? 'trial' : 'pro';
    return 'free';
  }, [isProUser, trialStatus.isInTrial]);

  const contentConfig = useMemo((): ContentAccessConfig => {
    return isProUser ? PRO_CONFIG : FREE_CONFIG;
  }, [isProUser]);

  const checkDailyLimit = useCallback(async (type: 'games' | 'drills' | 'trainer'): Promise<{
    canAccess: boolean;
    remaining: number;
    limit: number;
  }> => {
    if (isProUser) return { canAccess: true, remaining: Infinity, limit: Infinity };

    const usage = await getTodayUsage();
    switch (type) {
      case 'games':
        return {
          canAccess: usage.gamesPlayed < contentConfig.maxGamesPerDay,
          remaining: Math.max(0, contentConfig.maxGamesPerDay - usage.gamesPlayed),
          limit: contentConfig.maxGamesPerDay,
        };
      case 'drills':
        return {
          canAccess: usage.drillsCompleted < contentConfig.maxDrillsPerDay,
          remaining: Math.max(0, contentConfig.maxDrillsPerDay - usage.drillsCompleted),
          limit: contentConfig.maxDrillsPerDay,
        };
      case 'trainer':
        return {
          canAccess: usage.trainerScenariosCompleted < contentConfig.maxTrainerScenariosPerDay,
          remaining: Math.max(0, contentConfig.maxTrainerScenariosPerDay - usage.trainerScenariosCompleted),
          limit: contentConfig.maxTrainerScenariosPerDay,
        };
    }
  }, [isProUser, contentConfig]);

  const incrementUsage = useCallback(async (type: 'games' | 'drills' | 'trainer') => {
    const usage = await getTodayUsage();
    switch (type) {
      case 'games': usage.gamesPlayed++; break;
      case 'drills': usage.drillsCompleted++; break;
      case 'trainer': usage.trainerScenariosCompleted++; break;
    }
    await saveDailyUsage(usage);
  }, []);

  const filterSlides = useCallback(<T extends { slideNumber?: number }>(slides: T[]): T[] => {
    if (isProUser) return slides;
    return slides.filter((slide) => (slide.slideNumber ?? 0) <= contentConfig.maxSlidesPerStack);
  }, [isProUser, contentConfig.maxSlidesPerStack]);

  const isSlideGated = useCallback((slideNumber: number): boolean => {
    if (isProUser) return false;
    return slideNumber > contentConfig.maxSlidesPerStack;
  }, [isProUser, contentConfig.maxSlidesPerStack]);

  return {
    accessTier,
    contentConfig,
    isProUser,
    trialStatus,
    planType,
    checkDailyLimit,
    incrementUsage,
    filterSlides,
    isSlideGated,
    canAccessAIMentor: contentConfig.hasAIMentorAccess,
    canAccessInvestmentLab: contentConfig.hasInvestmentLabAccess,
    canAccessProTrainer: contentConfig.hasProTrainerAccess,
    canAccessAdvancedContent: contentConfig.hasAdvancedContent,
  };
}
