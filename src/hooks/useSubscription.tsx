import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// Subscription hook with 7-day free trial support
// For production, connect to native StoreKit via Capacitor plugin

export const PRODUCT_IDS = {
  MONTHLY: 'MarketLingo.pro.monthly',
  ANNUAL: 'MarketLingo.pro.yearly',
} as const;

export const ENTITLEMENT_ID = 'MarketLingo Pro';

export const TRIAL_DURATION_DAYS = 7;

interface TrialStatus {
  isInTrial: boolean;
  trialStartDate: string | null;
  trialEndDate: string | null;
  daysRemaining: number;
  hasUsedTrial: boolean;
}

interface SubscriptionInfo {
  isProUser: boolean;
  isInTrial: boolean;
  trialDaysRemaining: number;
  expirationDate: Date | null;
  willRenew: boolean;
  planType: 'monthly' | 'annual' | 'trial' | null;
}

const TRIAL_STORAGE_KEY = 'marketlingo_trial';
const PRO_STORAGE_KEY = 'marketlingo_pro';

function getTrialStatus(): TrialStatus {
  try {
    const stored = localStorage.getItem(TRIAL_STORAGE_KEY);
    if (!stored) {
      return {
        isInTrial: false,
        trialStartDate: null,
        trialEndDate: null,
        daysRemaining: 0,
        hasUsedTrial: false,
      };
    }
    
    const data = JSON.parse(stored);
    const endDate = new Date(data.trialEndDate);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const isInTrial = daysRemaining > 0;
    
    return {
      isInTrial,
      trialStartDate: data.trialStartDate,
      trialEndDate: data.trialEndDate,
      daysRemaining,
      hasUsedTrial: true,
    };
  } catch {
    return {
      isInTrial: false,
      trialStartDate: null,
      trialEndDate: null,
      daysRemaining: 0,
      hasUsedTrial: false,
    };
  }
}

export function useSubscription() {
  const [isProUser, setIsProUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState<TrialStatus>(getTrialStatus);
  const [planType, setPlanType] = useState<'monthly' | 'annual' | 'trial' | null>(null);

  let isNative = false;
  try {
    isNative = Capacitor.isNativePlatform();
  } catch (error) {
    console.warn('Capacitor not available:', error);
  }

  // Initialize - check localStorage for pro status and trial
  useEffect(() => {
    try {
      const proStatus = localStorage.getItem(PRO_STORAGE_KEY);
      const trial = getTrialStatus();
      setTrialStatus(trial);
      
      if (proStatus === 'true') {
        setIsProUser(true);
        // Check if it's a paid plan or trial
        const storedPlanType = localStorage.getItem('marketlingo_plan_type');
        setPlanType(storedPlanType as any || 'monthly');
      } else if (trial.isInTrial) {
        setIsProUser(true);
        setPlanType('trial');
      }
    } catch (error) {
      console.warn('Error reading subscription status:', error);
    }
    setIsLoading(false);
  }, []);

  // Check if user can start a trial
  const canStartTrial = useCallback(() => {
    return !trialStatus.hasUsedTrial && !isProUser;
  }, [trialStatus.hasUsedTrial, isProUser]);

  // Start 7-day free trial
  const startFreeTrial = useCallback(() => {
    if (!canStartTrial()) return false;
    
    const now = new Date();
    const endDate = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
    
    const trialData = {
      trialStartDate: now.toISOString(),
      trialEndDate: endDate.toISOString(),
    };
    
    localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(trialData));
    localStorage.setItem(PRO_STORAGE_KEY, 'true');
    localStorage.setItem('marketlingo_plan_type', 'trial');
    
    setTrialStatus({
      isInTrial: true,
      trialStartDate: trialData.trialStartDate,
      trialEndDate: trialData.trialEndDate,
      daysRemaining: TRIAL_DURATION_DAYS,
      hasUsedTrial: true,
    });
    setIsProUser(true);
    setPlanType('trial');
    
    return true;
  }, [canStartTrial]);

  // Toggle pro status (for testing/development)
  const toggleProForTesting = useCallback(() => {
    const current = localStorage.getItem(PRO_STORAGE_KEY);
    const newValue = current === 'true' ? 'false' : 'true';
    localStorage.setItem(PRO_STORAGE_KEY, newValue);
    setIsProUser(newValue === 'true');
    if (newValue === 'true') {
      setPlanType('monthly');
      localStorage.setItem('marketlingo_plan_type', 'monthly');
    } else {
      setPlanType(null);
      localStorage.removeItem('marketlingo_plan_type');
    }
  }, []);

  // Purchase package
  const purchasePackage = useCallback(async (pkg: any) => {
    const type = pkg.identifier as 'monthly' | 'annual';
    
    localStorage.setItem(PRO_STORAGE_KEY, 'true');
    localStorage.setItem('marketlingo_plan_type', type);
    
    // If converting from trial, clear trial status
    if (trialStatus.isInTrial) {
      const trialData = JSON.parse(localStorage.getItem(TRIAL_STORAGE_KEY) || '{}');
      trialData.convertedToPaid = true;
      localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(trialData));
    }
    
    setIsProUser(true);
    setPlanType(type);
    
    return { success: true, cancelled: false, error: null };
  }, [trialStatus.isInTrial]);

  const restorePurchases = useCallback(async () => {
    const hasProAccess = localStorage.getItem(PRO_STORAGE_KEY) === 'true';
    return { success: true, restored: hasProAccess, error: null };
  }, []);

  const getExpirationDate = useCallback(() => {
    if (trialStatus.isInTrial && trialStatus.trialEndDate) {
      return new Date(trialStatus.trialEndDate);
    }
    return null;
  }, [trialStatus]);

  const willRenew = useCallback(() => {
    // Trial doesn't auto-renew
    if (planType === 'trial') return false;
    return isProUser && planType !== null;
  }, [isProUser, planType]);

  const getPackage = useCallback((type: 'monthly' | 'annual') => {
    const prices = {
      monthly: { priceString: '$9.99', price: 9.99 },
      annual: { priceString: '$79.99', price: 79.99 },
    };
    
    return {
      identifier: type,
      product: {
        identifier: PRODUCT_IDS[type.toUpperCase() as keyof typeof PRODUCT_IDS],
        ...prices[type],
      },
    };
  }, []);

  const loginUser = useCallback(async (_userId: string) => {
    // Placeholder for user login sync
  }, []);

  const logoutUser = useCallback(async () => {
    // Placeholder for user logout sync
  }, []);

  // Get subscription info summary
  const getSubscriptionInfo = useCallback((): SubscriptionInfo => {
    return {
      isProUser,
      isInTrial: trialStatus.isInTrial,
      trialDaysRemaining: trialStatus.daysRemaining,
      expirationDate: getExpirationDate(),
      willRenew: willRenew(),
      planType,
    };
  }, [isProUser, trialStatus, getExpirationDate, willRenew, planType]);

  return {
    isProUser,
    isLoading,
    error: null,
    offerings: null,
    customerInfo: null,
    purchasePackage,
    restorePurchases,
    getExpirationDate,
    willRenew,
    getPackage,
    toggleProForTesting,
    loginUser,
    logoutUser,
    isNative,
    // Trial-specific
    trialStatus,
    canStartTrial: canStartTrial(),
    startFreeTrial,
    planType,
    getSubscriptionInfo,
  };
}
