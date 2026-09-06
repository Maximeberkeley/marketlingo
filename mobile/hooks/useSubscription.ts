/**
 * MarketLingo is a completely free app.
 *
 * There are no paid tiers, no subscriptions and no in-app purchases.
 * This hook exists only so feature code can keep asking "does this user have
 * full access?" — the answer is always yes.
 */

export interface AccessStatus {
  isProUser: boolean;
  isLoading: boolean;
  planType: 'free';
  trialStatus: {
    isInTrial: boolean;
    daysRemaining: number;
    hasUsedTrial: boolean;
    trialEndDate: Date | null;
  };
}

const FULL_ACCESS: AccessStatus = {
  isProUser: true,
  isLoading: false,
  planType: 'free',
  trialStatus: {
    isInTrial: false,
    daysRemaining: 0,
    hasUsedTrial: false,
    trialEndDate: null,
  },
};

export function useSubscription(): AccessStatus {
  return FULL_ACCESS;
}
