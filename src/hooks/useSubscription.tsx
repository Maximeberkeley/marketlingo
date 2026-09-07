/**
 * MarketLingo is a completely free app.
 *
 * There are no paid tiers, no subscriptions and no in-app purchases.
 * This hook exists only so feature code can keep asking "does this user have
 * full access?" — the answer is always yes.
 */

export const PRODUCT_IDS = {
  MONTHLY: 'free',
  ANNUAL: 'free',
} as const;

export const ENTITLEMENT_ID = 'free';

export const TRIAL_DURATION_DAYS = 0;

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
  planType: 'free';
}

const FULL_ACCESS_TRIAL: TrialStatus = {
  isInTrial: false,
  trialStartDate: null,
  trialEndDate: null,
  daysRemaining: 0,
  hasUsedTrial: false,
};

export function useSubscription() {
  const getSubscriptionInfo = (): SubscriptionInfo => ({
    isProUser: true,
    isInTrial: false,
    trialDaysRemaining: 0,
    expirationDate: null,
    willRenew: false,
    planType: 'free',
  });

  return {
    // Everyone gets full free access.
    isProUser: true,
    isLoading: false,
    error: null,
    offerings: null,
    customerInfo: null,
    purchasePackage: async () => ({ success: false, cancelled: false, error: 'MarketLingo is free — nothing to purchase' }),
    restorePurchases: async () => ({ success: true, restored: false, error: null }),
    getExpirationDate: () => null,
    willRenew: () => false,
    getPackage: () => null,
    toggleProForTesting: async () => {},
    loginUser: async () => {},
    logoutUser: async () => {},
    isNative: false,
    trialStatus: FULL_ACCESS_TRIAL,
    canStartTrial: false,
    startFreeTrial: async () => false,
    planType: 'free' as const,
    getSubscriptionInfo,
    refreshStatus: async () => {},
  };
}
