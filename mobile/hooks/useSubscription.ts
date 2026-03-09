import { useState, useEffect, useCallback, useRef } from 'react';
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
 * On native (iOS/Android), delegates purchases to RevenueCat.
 * On web or when RevenueCat unavailable, uses DB-only mock.
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

  // RevenueCat cached offerings (real packages from App Store)
  const [rcOfferings, setRcOfferings] = useState<any>(null);
  const [rcReady, setRcReady] = useState(false);

  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

  // ---------- RevenueCat lazy import ----------
  const revenueCatRef = useRef<any>(null);
  
  useEffect(() => {
    if (!isNative) return;
    try {
      revenueCatRef.current = require('react-native-purchases').default;
    } catch {
      // RevenueCat not available (e.g. Expo Go)
      revenueCatRef.current = null;
    }
  }, [isNative]);

  // ---------- RevenueCat init on native ----------
  useEffect(() => {
    if (!isNative) return;
    
    const initRC = async () => {
      const rc = revenueCatRef.current;
      if (!rc) return;

      const apiKey = Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

      if (!apiKey) return;

      try {
        const alreadyConfigured = rc.isConfigured?.() ?? false;
        if (!alreadyConfigured) {
          await rc.configure({ apiKey });
        }
        if (user?.id) {
          await rc.logIn(user.id);
        }

        // Cache offerings for purchase flow
        const offerings = await rc.getOfferings();
        if (offerings?.current) {
          setRcOfferings(offerings.current);
        }
        setRcReady(true);
      } catch (e) {
        console.warn('RevenueCat init skipped:', e);
        setRcReady(false);
      }
    };

    // Small delay to let the ref be set
    const timer = setTimeout(initRC, 100);
    return () => clearTimeout(timer);
  }, [isNative, user?.id]);

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
        console.error('Failed to fetch subscription status:', error?.message);
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

      // On native, also check RevenueCat entitlements (skip if in trial)
      if (isNative && revenueCatRef.current && rcReady && !isInTrial) {
        try {
          const isConfigured = revenueCatRef.current.isConfigured?.() ?? false;
          if (isConfigured) {
            const info = await revenueCatRef.current.getCustomerInfo();
            const rcPro = info.entitlements?.active?.['MarketLingo Pro'] !== undefined;
            if (rcPro && !effectiveIsProUser) {
              effectiveIsProUser = true;
              // Determine plan type from active subscription
              const activeEntitlement = info.entitlements?.active?.['MarketLingo Pro'];
              const productId = activeEntitlement?.productIdentifier || '';
              effectivePlanType = productId.includes('monthly') ? 'monthly' : 'annual';
              await supabase.from('profiles').update({
                is_pro_user: true,
                pro_plan_type: effectivePlanType,
                pro_subscription_date: new Date().toISOString(),
              }).eq('id', user.id);
            }
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
  }, [user, isNative, rcReady]);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  // ---------- Trial ----------
  const canStartTrial = !trialStatus.hasUsedTrial && !isProUser;

  const startFreeTrial = useCallback(async () => {
    if (!user) {
      console.error('Cannot start trial: no user');
      return false;
    }
    if (trialStatus.hasUsedTrial) {
      console.warn('Trial already used');
      return false;
    }
    if (isProUser) {
      console.warn('Already a Pro user');
      return false;
    }

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
        console.error('Failed to start trial:', error.message);
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
    } catch (e) {
      console.error('startFreeTrial error:', e);
      return false;
    }
  }, [user, trialStatus.hasUsedTrial, isProUser]);

  // ---------- Purchase ----------
  const purchasePackage = useCallback(async (pkg: any): Promise<PurchaseResult> => {
    if (!user) return { success: false, cancelled: false, error: 'Not logged in' };

    const type = (pkg?.identifier || pkg) as 'monthly' | 'annual';

    // Native: use RevenueCat if we have real offerings
    if (isNative && revenueCatRef.current && rcReady && rcOfferings) {
      try {
        // Find the REAL RevenueCat package from cached offerings
        const realPackage = rcOfferings.availablePackages?.find(
          (p: any) => p.identifier === `$rc_${type}` || 
                      p.identifier === type ||
                      p.product?.identifier?.includes(type)
        );

        if (!realPackage) {
          console.warn(`No RevenueCat package found for "${type}", falling back to DB mock`);
          // Fall through to DB mock below
        } else {
          const { customerInfo } = await revenueCatRef.current.purchasePackage(realPackage);
          const isPro = customerInfo.entitlements?.active?.['MarketLingo Pro'] !== undefined;

          if (isPro) {
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
        }
      } catch (error: any) {
        if (error.userCancelled) return { success: false, cancelled: true, error: null };
        console.error('RevenueCat purchase error:', error);
        // Fall through to DB mock on error
      }
    }

    // DB-only mock (web, testing, or RevenueCat unavailable)
    try {
      const { error } = await supabase.from('profiles').update({
        is_pro_user: true,
        pro_plan_type: type,
        pro_subscription_date: new Date().toISOString(),
      }).eq('id', user.id);

      if (error) {
        console.error('DB purchase error:', error.message);
        return { success: false, cancelled: false, error: error.message };
      }
      setIsProUser(true);
      setPlanType(type);
      return { success: true, cancelled: false, error: null };
    } catch {
      return { success: false, cancelled: false, error: 'Purchase failed' };
    }
  }, [user, isNative, rcReady, rcOfferings]);

  // ---------- Restore ----------
  const restorePurchases = useCallback(async (): Promise<RestoreResult> => {
    if (isNative && revenueCatRef.current && rcReady) {
      try {
        const isConfigured = revenueCatRef.current.isConfigured?.() ?? false;
        if (isConfigured) {
          const customerInfo = await revenueCatRef.current.restorePurchases();
          const isPro = customerInfo.entitlements?.active?.['MarketLingo Pro'] !== undefined;

          if (isPro && user) {
            const activeEntitlement = customerInfo.entitlements?.active?.['MarketLingo Pro'];
            const productId = activeEntitlement?.productIdentifier || '';
            const restoredType = productId.includes('monthly') ? 'monthly' : 'annual';
            await supabase.from('profiles').update({
              is_pro_user: true,
              pro_plan_type: restoredType,
              pro_subscription_date: new Date().toISOString(),
            }).eq('id', user.id);
            setIsProUser(true);
            setPlanType(restoredType as 'monthly' | 'annual');
          }
          return { success: true, restored: isPro, error: null };
        }
      } catch (error: any) {
        console.error('Restore error:', error);
        return { success: false, restored: false, error: error.message || 'Restore failed' };
      }
    }

    // Web/testing fallback
    await fetchSubscriptionStatus();
    return { success: true, restored: isProUser, error: null };
  }, [isNative, rcReady, user, fetchSubscriptionStatus, isProUser]);

  // ---------- Testing toggle ----------
  const toggleProForTesting = useCallback(async () => {
    if (!user) return;
    const newValue = !isProUser;
    try {
      const { error } = await supabase.from('profiles').update({
        is_pro_user: newValue,
        pro_plan_type: newValue ? 'monthly' : null,
        // Clear trial dates when toggling off
        ...(newValue ? {} : { pro_trial_start_date: null, pro_trial_end_date: null }),
      }).eq('id', user.id);
      
      if (error) {
        console.error('Toggle pro error:', error.message);
        return;
      }
      setIsProUser(newValue);
      setPlanType(newValue ? 'monthly' : null);
      if (!newValue) {
        setTrialStatus({ isInTrial: false, trialStartDate: null, trialEndDate: null, daysRemaining: 0, hasUsedTrial: false });
      }
    } catch (e) {
      console.error('toggleProForTesting error:', e);
    }
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
    // Try to return real RevenueCat package if available
    if (rcOfferings?.availablePackages) {
      const realPkg = rcOfferings.availablePackages.find(
        (p: any) => p.identifier === `$rc_${type}` ||
                    p.identifier === type ||
                    p.product?.identifier?.includes(type)
      );
      if (realPkg) {
        return {
          identifier: type,
          product: {
            identifier: realPkg.product?.identifier || PRODUCT_IDS[type.toUpperCase() as keyof typeof PRODUCT_IDS],
            priceString: realPkg.product?.priceString || (type === 'monthly' ? '$9.99' : '$79.99'),
            price: realPkg.product?.price || (type === 'monthly' ? 9.99 : 79.99),
          },
          _rcPackage: realPkg, // Keep reference to real package
        };
      }
    }

    // Fallback mock prices
    const prices = {
      monthly: { priceString: '$9.99/mo', price: 9.99 },
      annual: { priceString: '$79.99/yr', price: 79.99 },
    };
    return {
      identifier: type,
      product: {
        identifier: PRODUCT_IDS[type.toUpperCase() as keyof typeof PRODUCT_IDS],
        ...prices[type],
      },
    };
  }, [rcOfferings]);

  return {
    isProUser, isLoading, isNative, planType, trialStatus, canStartTrial,
    purchasePackage, restorePurchases, getExpirationDate, willRenew, getPackage,
    startFreeTrial, toggleProForTesting, refreshStatus: fetchSubscriptionStatus,
    rcReady, // expose for UI to know if RevenueCat is available
  };
}
