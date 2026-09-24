import AsyncStorage from '@react-native-async-storage/async-storage';
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
    DISPLAY_NAME: '@marketlingo/display_name',
    DEMO_STATUS: '@marketlingo/demo_status',
};
export const storage = {
    // Industry
    async setIndustry(industry) {
        await AsyncStorage.setItem(KEYS.INDUSTRY, industry);
    },
    async getIndustry() {
        return AsyncStorage.getItem(KEYS.INDUSTRY);
    },
    async clearIndustry() {
        await AsyncStorage.removeItem(KEYS.INDUSTRY);
    },
    // Familiarity Level
    async setFamiliarity(level) {
        await AsyncStorage.setItem(KEYS.FAMILIARITY, level);
    },
    async getFamiliarity() {
        const value = await AsyncStorage.getItem(KEYS.FAMILIARITY);
        return value;
    },
    // User Tier (free/pro)
    async setUserTier(tier) {
        await AsyncStorage.setItem(KEYS.USER_TIER, tier);
    },
    async getUserTier() {
        const tier = await AsyncStorage.getItem(KEYS.USER_TIER);
        return tier || 'free';
    },
    // Auth
    async setAuthToken(token) {
        await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
    },
    async getAuthToken() {
        return AsyncStorage.getItem(KEYS.AUTH_TOKEN);
    },
    async setUserId(userId) {
        await AsyncStorage.setItem(KEYS.USER_ID, userId);
    },
    async getUserId() {
        return AsyncStorage.getItem(KEYS.USER_ID);
    },
    // Onboarding
    async setOnboardingComplete(complete) {
        await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, complete.toString());
    },
    async isOnboardingComplete() {
        const value = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
        return value === 'true';
    },
    async setLearningGoal(goal) {
        await AsyncStorage.setItem(KEYS.LEARNING_GOAL, goal);
    },
    async getLearningGoal() {
        return AsyncStorage.getItem(KEYS.LEARNING_GOAL);
    },
    async setDisplayName(name) {
        await AsyncStorage.setItem(KEYS.DISPLAY_NAME, name.trim().slice(0, 40));
    },
    async getDisplayName() {
        return AsyncStorage.getItem(KEYS.DISPLAY_NAME);
    },
    async setDemoStatus(status) {
        await AsyncStorage.setItem(KEYS.DEMO_STATUS, status);
    },
    async getDemoStatus() {
        const value = await AsyncStorage.getItem(KEYS.DEMO_STATUS);
        return value === 'pending' || value === 'completed' || value === 'skipped' ? value : null;
    },
    async setFeatureTourSeen() {
        await AsyncStorage.setItem(KEYS.FEATURE_TOUR_SEEN, 'true');
    },
    async hasSeenFeatureTour() {
        return (await AsyncStorage.getItem(KEYS.FEATURE_TOUR_SEEN)) === 'true';
    },
    // Ask Leo hint — shown for the first two lessons only
    async getLeoHintCount() {
        const value = await AsyncStorage.getItem(KEYS.LEO_HINT_COUNT);
        return value ? Number(value) : 0;
    },
    async bumpLeoHintCount() {
        const current = await storage.getLeoHintCount();
        await AsyncStorage.setItem(KEYS.LEO_HINT_COUNT, String(current + 1));
    },
    // Clear all
    async clearAll() {
        await AsyncStorage.multiRemove(Object.values(KEYS));
    },
};
