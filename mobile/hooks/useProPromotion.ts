import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscription } from './useSubscription';

const STORAGE_KEY = 'marketlingo_pro_promo';
const SESSION_THRESHOLD = 5; // Show after every 5 sessions (gentle ~1x/week)
const COOLDOWN_DAYS = 7; // Minimum days between random promotions

interface PromoState {
  sessionCount: number;
  lastPromoShown: string | null;
  dismissedCount: number;
  lastActivityDate: string | null;
}

export type PromoTrigger = 'lesson_complete' | 'feature_gate' | 'random' | 'low_engagement' | 'manual';

function getDefaultState(): PromoState {
  return {
    sessionCount: 0,
    lastPromoShown: null,
    dismissedCount: 0,
    lastActivityDate: null,
  };
}

export function useProPromotion() {
  const { isProUser, isLoading } = useSubscription();
  const [shouldShowPromo, setShouldShowPromo] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState<PromoTrigger | null>(null);
  const [promoState, setPromoState] = useState<PromoState>(getDefaultState());
  const [initialized, setInitialized] = useState(false);

  // Load state from AsyncStorage on mount
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setPromoState(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
      setInitialized(true);
    };
    load();
  }, []);

  // Save state to AsyncStorage
  useEffect(() => {
    if (!initialized) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(promoState)).catch(() => {});
  }, [promoState, initialized]);

  // Increment session count on mount (once per app load)
  useEffect(() => {
    if (!initialized) return;
    const today = new Date().toDateString();

    if (promoState.lastActivityDate !== today) {
      setPromoState(prev => ({
        ...prev,
        sessionCount: prev.sessionCount + 1,
        lastActivityDate: today,
      }));
    }
  }, [initialized]);

  // Check if enough time has passed since last promo
  const canShowPromo = useCallback(() => {
    if (isProUser || isLoading) return false;

    if (!promoState.lastPromoShown) return true;

    const lastShown = new Date(promoState.lastPromoShown);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - lastShown.getTime()) / (1000 * 60 * 60 * 24));

    return daysSince >= COOLDOWN_DAYS;
  }, [isProUser, isLoading, promoState.lastPromoShown]);

  // Check random interval trigger
  const checkRandomTrigger = useCallback(() => {
    if (!canShowPromo()) return false;
    return promoState.sessionCount > 0 && promoState.sessionCount % SESSION_THRESHOLD === 0;
  }, [canShowPromo, promoState.sessionCount]);

  // Trigger promo after lesson completion (every 4-5 lessons)
  const triggerAfterLesson = useCallback((lessonCount: number) => {
    if (!canShowPromo()) return;

    if (lessonCount > 0 && lessonCount % 4 === 0) {
      setCurrentTrigger('lesson_complete');
      setShouldShowPromo(true);
    }
  }, [canShowPromo]);

  // Trigger on feature gate (always show if not pro)
  const triggerFeatureGate = useCallback((featureName: string) => {
    if (isProUser) return false;

    setCurrentTrigger('feature_gate');
    setShouldShowPromo(true);
    return true;
  }, [isProUser]);

  // Check low engagement (3+ days inactive)
  const checkLowEngagement = useCallback((lastActivityDate: Date | null) => {
    if (!canShowPromo() || !lastActivityDate) return false;

    const now = new Date();
    const daysSince = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince >= 3) {
      setCurrentTrigger('low_engagement');
      setShouldShowPromo(true);
      return true;
    }
    return false;
  }, [canShowPromo]);

  // Manually trigger promo
  const showPromo = useCallback((trigger: PromoTrigger = 'manual') => {
    if (isProUser) return;
    setCurrentTrigger(trigger);
    setShouldShowPromo(true);
  }, [isProUser]);

  // Dismiss promo
  const dismissPromo = useCallback(() => {
    setShouldShowPromo(false);
    setCurrentTrigger(null);
    setPromoState(prev => ({
      ...prev,
      lastPromoShown: new Date().toISOString(),
      dismissedCount: prev.dismissedCount + 1,
    }));
  }, []);

  // Reset after successful purchase
  const onPurchaseComplete = useCallback(() => {
    setShouldShowPromo(false);
    setCurrentTrigger(null);
  }, []);

  // Auto-check random trigger on session count change
  useEffect(() => {
    if (!initialized) return;
    if (checkRandomTrigger() && !shouldShowPromo) {
      setCurrentTrigger('random');
      setShouldShowPromo(true);
    }
  }, [promoState.sessionCount, checkRandomTrigger, shouldShowPromo, initialized]);

  return {
    shouldShowPromo,
    currentTrigger,
    isProUser,
    triggerAfterLesson,
    triggerFeatureGate,
    checkLowEngagement,
    showPromo,
    dismissPromo,
    onPurchaseComplete,
    sessionCount: promoState.sessionCount,
  };
}
