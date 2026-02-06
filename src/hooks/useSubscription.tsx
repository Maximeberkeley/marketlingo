import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

// Subscription hook with 7-day free trial support
// Pro status is now stored in the database per-user

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

export function useSubscription() {
  const { user } = useAuth();
  const [isProUser, setIsProUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isInTrial: false,
    trialStartDate: null,
    trialEndDate: null,
    daysRemaining: 0,
    hasUsedTrial: false,
  });
  const [planType, setPlanType] = useState<'monthly' | 'annual' | 'trial' | null>(null);

  let isNative = false;
  try {
    isNative = Capacitor.isNativePlatform();
  } catch (error) {
    console.warn('Capacitor not available:', error);
  }

  // Fetch subscription status from database
  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user) {
      setIsProUser(false);
      setTrialStatus({
        isInTrial: false,
        trialStartDate: null,
        trialEndDate: null,
        daysRemaining: 0,
        hasUsedTrial: false,
      });
      setPlanType(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_pro_user, pro_plan_type, pro_trial_start_date, pro_trial_end_date')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching subscription status:', error);
        setIsLoading(false);
        return;
      }

      if (profile) {
        // Check if trial is still active
        let effectiveIsProUser = profile.is_pro_user;
        let effectivePlanType = profile.pro_plan_type as 'monthly' | 'annual' | 'trial' | null;
        let trialDaysRemaining = 0;
        let isInTrial = false;

        if (profile.pro_trial_end_date) {
          const endDate = new Date(profile.pro_trial_end_date);
          const now = new Date();
          trialDaysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          isInTrial = trialDaysRemaining > 0 && effectivePlanType === 'trial';
          
          // If trial expired, update status
          if (effectivePlanType === 'trial' && trialDaysRemaining <= 0) {
            effectiveIsProUser = false;
            effectivePlanType = null;
            // Update database to reflect expired trial
            await supabase
              .from('profiles')
              .update({ is_pro_user: false, pro_plan_type: null })
              .eq('id', user.id);
          }
        }

        setIsProUser(effectiveIsProUser);
        setPlanType(effectivePlanType);
        setTrialStatus({
          isInTrial,
          trialStartDate: profile.pro_trial_start_date,
          trialEndDate: profile.pro_trial_end_date,
          daysRemaining: trialDaysRemaining,
          hasUsedTrial: !!profile.pro_trial_start_date,
        });
      }
    } catch (error) {
      console.error('Error in fetchSubscriptionStatus:', error);
    }
    
    setIsLoading(false);
  }, [user]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  // Check if user can start a trial
  const canStartTrial = useCallback(() => {
    return !trialStatus.hasUsedTrial && !isProUser;
  }, [trialStatus.hasUsedTrial, isProUser]);

  // Start 7-day free trial (saves to database)
  const startFreeTrial = useCallback(async () => {
    if (!user || !canStartTrial()) return false;
    
    const now = new Date();
    const endDate = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_pro_user: true,
          pro_plan_type: 'trial',
          pro_trial_start_date: now.toISOString(),
          pro_trial_end_date: endDate.toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error starting trial:', error);
        return false;
      }

      setTrialStatus({
        isInTrial: true,
        trialStartDate: now.toISOString(),
        trialEndDate: endDate.toISOString(),
        daysRemaining: TRIAL_DURATION_DAYS,
        hasUsedTrial: true,
      });
      setIsProUser(true);
      setPlanType('trial');
      
      return true;
    } catch (error) {
      console.error('Error starting trial:', error);
      return false;
    }
  }, [user, canStartTrial]);

  // Toggle pro status (for testing/development)
  const toggleProForTesting = useCallback(async () => {
    if (!user) return;
    
    const newValue = !isProUser;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_pro_user: newValue,
          pro_plan_type: newValue ? 'monthly' : null,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error toggling pro status:', error);
        return;
      }

      setIsProUser(newValue);
      setPlanType(newValue ? 'monthly' : null);
    } catch (error) {
      console.error('Error toggling pro status:', error);
    }
  }, [user, isProUser]);

  // Purchase package (saves to database)
  const purchasePackage = useCallback(async (pkg: any) => {
    if (!user) return { success: false, cancelled: false, error: 'Not logged in' };
    
    const type = pkg.identifier as 'monthly' | 'annual';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_pro_user: true,
          pro_plan_type: type,
          pro_subscription_date: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error purchasing package:', error);
        return { success: false, cancelled: false, error: error.message };
      }

      setIsProUser(true);
      setPlanType(type);
      
      return { success: true, cancelled: false, error: null };
    } catch (error) {
      console.error('Error purchasing package:', error);
      return { success: false, cancelled: false, error: 'Purchase failed' };
    }
  }, [user]);

  const restorePurchases = useCallback(async () => {
    // Re-fetch from database
    await fetchSubscriptionStatus();
    return { success: true, restored: isProUser, error: null };
  }, [fetchSubscriptionStatus, isProUser]);

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
    // Refresh subscription status when user logs in
    await fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  const logoutUser = useCallback(async () => {
    setIsProUser(false);
    setPlanType(null);
    setTrialStatus({
      isInTrial: false,
      trialStartDate: null,
      trialEndDate: null,
      daysRemaining: 0,
      hasUsedTrial: false,
    });
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
    // Refresh function
    refreshStatus: fetchSubscriptionStatus,
  };
}
