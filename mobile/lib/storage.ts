import AsyncStorage from '@react-native-async-storage/async-storage';

export type FamiliarityLevel = 'beginner' | 'intermediate' | 'advanced';
export type UserTier = 'free' | 'pro';

const KEYS = {
  INDUSTRY: '@marketlingo/industry',
  FAMILIARITY: '@marketlingo/familiarity',
  USER_TIER: '@marketlingo/user_tier',
  AUTH_TOKEN: '@marketlingo/auth_token',
  USER_ID: '@marketlingo/user_id',
  ONBOARDING_COMPLETE: '@marketlingo/onboarding_complete',
  LEARNING_GOAL: '@marketlingo/learning_goal',
  FEATURE_TOUR_SEEN: '@marketlingo/feature_tour_seen',
  LEO_HINT_COUNT: '@marketlingo/leo_hint_count',
};

export const storage = {
  // Industry
  async setIndustry(industry: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.INDUSTRY, industry);
  },

  async getIndustry(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.INDUSTRY);
  },

  async clearIndustry(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.INDUSTRY);
  },

  // Familiarity Level
  async setFamiliarity(level: FamiliarityLevel): Promise<void> {
    await AsyncStorage.setItem(KEYS.FAMILIARITY, level);
  },

  async getFamiliarity(): Promise<FamiliarityLevel | null> {
    const value = await AsyncStorage.getItem(KEYS.FAMILIARITY);
    return value as FamiliarityLevel | null;
  },

  // User Tier (free/pro)
  async setUserTier(tier: UserTier): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_TIER, tier);
  },

  async getUserTier(): Promise<UserTier> {
    const tier = await AsyncStorage.getItem(KEYS.USER_TIER);
    return (tier as UserTier) || 'free';
  },

  // Auth
  async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
  },

  async getAuthToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.AUTH_TOKEN);
  },

  async setUserId(userId: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_ID, userId);
  },

  async getUserId(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.USER_ID);
  },

  // Onboarding
  async setOnboardingComplete(complete: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, complete.toString());
  },

  async isOnboardingComplete(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
    return value === 'true';
  },

  async setLearningGoal(goal: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.LEARNING_GOAL, goal);
  },

  async getLearningGoal(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.LEARNING_GOAL);
  },

  async setFeatureTourSeen(): Promise<void> {
    await AsyncStorage.setItem(KEYS.FEATURE_TOUR_SEEN, 'true');
  },

  async hasSeenFeatureTour(): Promise<boolean> {
    return (await AsyncStorage.getItem(KEYS.FEATURE_TOUR_SEEN)) === 'true';
  },

  // Ask Leo hint — shown for the first two lessons only
  async getLeoHintCount(): Promise<number> {
    const value = await AsyncStorage.getItem(KEYS.LEO_HINT_COUNT);
    return value ? Number(value) : 0;
  },

  async bumpLeoHintCount(): Promise<void> {
    const current = await storage.getLeoHintCount();
    await AsyncStorage.setItem(KEYS.LEO_HINT_COUNT, String(current + 1));
  },

  // Clear all
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
