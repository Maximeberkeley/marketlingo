import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export const PRODUCT_IDS = {
  MONTHLY: 'MarketLingo.pro.monthly',
  ANNUAL: 'MarketLingo.pro.yearly',
} as const;

export const TRIAL_DURATION_DAYS = 7;

interface TrialStatus {
  isInTrial: boolean;
  trialStartDate: string | null;
  trialEndDate: string | null;
  daysRemaining: number;
  hasUsedTrial: boolean;
}

interface PurchaseResult {
  success: boolean;
  cancelled: boolean;
  error: string | null;
}

interface RestoreResult {
  success: boolean;
  restored: boolean;
  error: string | null;
}

/**
 * useSubscription — unified subscription hook.
 * On native (iOS/Android), delegates purchases to RevenueCat via useRevenueCat.
 * On web, uses a DB-only mock for testing.
 * Trial logic is always DB-driven (profiles table).
 */
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

  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

  // ---------- RevenueCat lazy import for native ----------
  let revenueCatModule: any = null;
  if (isNative) {
    try {
      revenueCatModule = require('react-native-purchases').default;
    } catch {
      // RevenueCat not installed — fallback to DB-only
    }
  }

  // ---------- DB status fetch ----------
  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user) {
      setIsProUser(false);
      setTrialStatus({ isInTrial: false, trialStartDate: null, trialEndDate: null, daysRemaining: 0, hasUsedTrial: false });
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

      if (error || !profile) {
        setIsLoading(false);
        return;
      }

      let effectiveIsProUser = profile.is_pro_user;
      let effectivePlanType = profile.pro_plan_type as 'monthly' | 'annual' | 'trial' | null;
      let trialDaysRemaining = 0;
      let isInTrial = false;

      if (profile.pro_trial_end_date) {
        const endDate = new Date(profile.pro_trial_end_date);
        const now = new Date();
        trialDaysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        isInTrial = trialDaysRemaining > 0 && effectivePlanType === 'trial';

        // Auto-expire trial
        if (effectivePlanType === 'trial' && trialDaysRemaining <= 0) {
          effectiveIsProUser = false;
          effectivePlanType = null;
          await supabase.from('profiles').update({ is_pro_user: false, pro_plan_type: null }).eq('id', user.id);
        }
      }

      // On native, also check RevenueCat entitlements
      if (isNative && revenueCatModule && !isInTrial) {
        try {
          const info = await revenueCatModule.getCustomerInfo();
          const rcPro = info.entitlements?.active?.['MarketLingo Pro'] !== undefined;
          if (rcPro && !effectiveIsProUser) {
            // RevenueCat says pro but DB doesn't — sync
            effectiveIsProUser = true;
            effectivePlanType = 'annual'; // default to annual if we can't determine
            await supabase.from('profiles').update({
              is_pro_user: true,
              pro_plan_type: 'annual',
            }).eq('id', user.id);
          }
        } catch {
          // RevenueCat unavailable — use DB state
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
    } catch (error) {
      console.error('Error in fetchSubscriptionStatus:', error);
    }

    setIsLoading(false);
  }, [user, isNative]);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  // ---------- RevenueCat init on native ----------
  useEffect(() => {
    if (!isNative || !revenueCatModule) return;
    const apiKey = Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

    if (!apiKey) return;

    (async () => {
      try {
        await revenueCatModule.configure({ apiKey });
        // Identify user if logged in
        if (user?.id) {
          await revenueCatModule.logIn(user.id);
        }
      } catch (e) {
        console.warn('RevenueCat configure error:', e);
      }
    })();
  }, [isNative, user?.id]);

  // ---------- Trial ----------
  const canStartTrial = !trialStatus.hasUsedTrial && !isProUser;

  const startFreeTrial = useCallback(async () => {
    if (!user || trialStatus.hasUsedTrial || isProUser) return false;

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

      if (error) return false;

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
    } catch {
      return false;
    }
  }, [user, trialStatus.hasUsedTrial, isProUser]);

  // ---------- Purchase ----------
  const purchasePackage = useCallback(async (pkg: any): Promise<PurchaseResult> => {
    if (!user) return { success: false, cancelled: false, error: 'Not logged in' };

    const type = pkg.identifier as 'monthly' | 'annual';

    // Native: use RevenueCat
    if (isNative && revenueCatModule) {
      try {
        const { customerInfo } = await revenueCatModule.purchasePackage(pkg);
        const isPro = customerInfo.entitlements?.active?.['MarketLingo Pro'] !== undefined;

        if (isPro) {
          // Sync to DB
          await supabase.from('profiles').update({
            is_pro_user: true,
            pro_plan_type: type,
            pro_subscription_date: new Date().toISOString(),
          }).eq('id', user.id);
          setIsProUser(true);
          setPlanType(type);
          return { success: true, cancelled: false, error: null };
        }
        return { success: false, cancelled: false, error: 'Entitlement not granted' };
      } catch (error: any) {
        if (error.userCancelled) return { success: false, cancelled: true, error: null };
        return { success: false, cancelled: false, error: error.message || 'Purchase failed' };
      }
    }

    // Web/testing fallback: DB-only mock
    try {
      const { error } = await supabase.from('profiles').update({
        is_pro_user: true,
        pro_plan_type: type,
      }).eq('id', user.id);

      if (error) return { success: false, cancelled: false, error: error.message };
      setIsProUser(true);
      setPlanType(type);
      return { success: true, cancelled: false, error: null };
    } catch {
      return { success: false, cancelled: false, error: 'Purchase failed' };
    }
  }, [user, isNative]);

  // ---------- Restore ----------
  const restorePurchases = useCallback(async (): Promise<RestoreResult> => {
    if (isNative && revenueCatModule) {
      try {
        const customerInfo = await revenueCatModule.restorePurchases();
        const isPro = customerInfo.entitlements?.active?.['MarketLingo Pro'] !== undefined;

        if (isPro && user) {
          await supabase.from('profiles').update({
            is_pro_user: true,
            pro_plan_type: 'annual',
          }).eq('id', user.id);
          setIsProUser(true);
          setPlanType('annual');
        }
        return { success: true, restored: isPro, error: null };
      } catch (error: any) {
        return { success: false, restored: false, error: error.message || 'Restore failed' };
      }
    }

    // Web fallback
    await fetchSubscriptionStatus();
    return { success: true, restored: isProUser, error: null };
  }, [isNative, user, fetchSubscriptionStatus, isProUser]);

  // ---------- Testing toggle ----------
  const toggleProForTesting = useCallback(async () => {
    if (!user) return;
    const newValue = !isProUser;
    try {
      await supabase.from('profiles').update({
        is_pro_user: newValue,
        pro_plan_type: newValue ? 'monthly' : null,
      }).eq('id', user.id);
      setIsProUser(newValue);
      setPlanType(newValue ? 'monthly' : null);
    } catch {}
  }, [user, isProUser]);

  // ---------- Helpers ----------
  const getExpirationDate = useCallback(() => {
    if (trialStatus.isInTrial && trialStatus.trialEndDate) return new Date(trialStatus.trialEndDate);
    return null;
  }, [trialStatus]);

  const willRenew = useCallback(() => {
    if (planType === 'trial') return false;
    return isProUser && planType !== null;
  }, [isProUser, planType]);

  const getPackage = useCallback((type: 'monthly' | 'annual') => {
    // On native with RevenueCat, try to get real packages
    // This is a simplified version — real implementation would cache offerings
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

  return {
    isProUser, isLoading, isNative, planType, trialStatus, canStartTrial,
    purchasePackage, restorePurchases, getExpirationDate, willRenew, getPackage,
    startFreeTrial, toggleProForTesting, refreshStatus: fetchSubscriptionStatus,
  };
}
