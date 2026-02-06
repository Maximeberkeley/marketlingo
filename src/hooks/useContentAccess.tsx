import { useMemo, useCallback } from 'react';
import { useSubscription } from './useSubscription';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Content access tiers for MarketLingo
 * 
 * FREE tier: 
 * - Basic concepts and vocabulary
 * - High-level industry structure
 * - Light daily lessons (first 3 slides only)
 * - Intro-level news and examples
 * - Limited games/drills (3 per day)
 * 
 * PRO tier:
 * - Full slide stacks (all 6 slides)
 * - Deeper explanations and real-world nuance
 * - Case studies, market dynamics, strategy context
 * - Advanced lessons tied to real news/events
 * - Fewer simplifications, more professional language
 * - Interview-level + analyst-level understanding
 * - Unlimited games/drills
 * - AI Mentor access
 * - Investment Lab
 * - Pro Trainer scenarios
 */

export type AccessTier = 'free' | 'pro' | 'trial';
export type FamiliarityLevel = 'beginner' | 'intermediate' | 'advanced';

interface ContentAccessConfig {
  // Lesson limits
  maxSlidesPerStack: number;
  showSourceLinks: boolean;
  
  // Daily limits
  maxGamesPerDay: number;
  maxDrillsPerDay: number;
  maxTrainerScenariosPerDay: number;
  
  // Feature access
  hasAIMentorAccess: boolean;
  hasInvestmentLabAccess: boolean;
  hasProTrainerAccess: boolean;
  hasAdvancedContent: boolean;
  hasCertificationAccess: boolean;
  
  // Content depth
  contentDepth: 'basic' | 'intermediate' | 'professional';
}

const FREE_CONFIG: ContentAccessConfig = {
  maxSlidesPerStack: 3, // Only first 3 slides
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
  maxSlidesPerStack: 6, // All slides
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

// Daily usage tracking
const USAGE_STORAGE_KEY = 'marketlingo_daily_usage';

interface DailyUsage {
  date: string;
  gamesPlayed: number;
  drillsCompleted: number;
  trainerScenariosCompleted: number;
}

function getTodayUsage(): DailyUsage {
  const today = new Date().toDateString();
  try {
    const stored = localStorage.getItem(USAGE_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as DailyUsage;
      if (data.date === today) {
        return data;
      }
    }
  } catch {}
  
  return {
    date: today,
    gamesPlayed: 0,
    drillsCompleted: 0,
    trainerScenariosCompleted: 0,
  };
}

function saveDailyUsage(usage: DailyUsage) {
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
}

export function useContentAccess() {
  const { isProUser, trialStatus, planType } = useSubscription();
  const { user } = useAuth();

  // Determine access tier
  const accessTier = useMemo((): AccessTier => {
    if (isProUser) {
      return trialStatus.isInTrial ? 'trial' : 'pro';
    }
    return 'free';
  }, [isProUser, trialStatus.isInTrial]);

  // Get content config based on tier
  const contentConfig = useMemo((): ContentAccessConfig => {
    if (isProUser) return PRO_CONFIG;
    return FREE_CONFIG;
  }, [isProUser]);

  // Check if a feature is accessible
  const canAccessFeature = useCallback((feature: keyof ContentAccessConfig): boolean => {
    const value = contentConfig[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    return true;
  }, [contentConfig]);

  // Check daily usage limits
  const checkDailyLimit = useCallback((type: 'games' | 'drills' | 'trainer'): { 
    canAccess: boolean; 
    remaining: number;
    limit: number;
  } => {
    if (isProUser) {
      return { canAccess: true, remaining: Infinity, limit: Infinity };
    }

    const usage = getTodayUsage();
    
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

  // Increment usage
  const incrementUsage = useCallback((type: 'games' | 'drills' | 'trainer') => {
    const usage = getTodayUsage();
    
    switch (type) {
      case 'games':
        usage.gamesPlayed++;
        break;
      case 'drills':
        usage.drillsCompleted++;
        break;
      case 'trainer':
        usage.trainerScenariosCompleted++;
        break;
    }
    
    saveDailyUsage(usage);
  }, []);

  // Filter slides based on access tier
  const filterSlides = useCallback(<T extends { slideNumber?: number }>(slides: T[]): T[] => {
    if (isProUser) return slides;
    
    // Free users only get first 3 slides
    return slides.filter((slide) => {
      const slideNum = slide.slideNumber ?? 0;
      return slideNum <= contentConfig.maxSlidesPerStack;
    });
  }, [isProUser, contentConfig.maxSlidesPerStack]);

  // Check if current slide is gated
  const isSlideGated = useCallback((slideNumber: number): boolean => {
    if (isProUser) return false;
    return slideNumber > contentConfig.maxSlidesPerStack;
  }, [isProUser, contentConfig.maxSlidesPerStack]);

  // Get content depth label for familiarity + tier combo
  const getContentLabel = useCallback((familiarityLevel: FamiliarityLevel): string => {
    if (!isProUser) {
      // Free tier always gets basics regardless of familiarity
      return 'Foundation Level';
    }
    
    // Pro tier adapts to familiarity
    switch (familiarityLevel) {
      case 'beginner':
        return 'Guided Professional';
      case 'intermediate':
        return 'Applied Professional';
      case 'advanced':
        return 'Expert Professional';
    }
  }, [isProUser]);

  // Calculate what % of content is accessible
  const getAccessPercentage = useCallback((): number => {
    if (isProUser) return 100;
    // Free tier gets ~50% of slides, limited activities
    return 50;
  }, [isProUser]);

  return {
    accessTier,
    contentConfig,
    isProUser,
    trialStatus,
    planType,
    
    // Access checks
    canAccessFeature,
    checkDailyLimit,
    
    // Usage tracking
    incrementUsage,
    
    // Content filtering
    filterSlides,
    isSlideGated,
    
    // Labels
    getContentLabel,
    getAccessPercentage,
    
    // Quick checks
    canAccessAIMentor: contentConfig.hasAIMentorAccess,
    canAccessInvestmentLab: contentConfig.hasInvestmentLabAccess,
    canAccessProTrainer: contentConfig.hasProTrainerAccess,
    canAccessAdvancedContent: contentConfig.hasAdvancedContent,
  };
}