/**
 * MarketLingo is a completely free app.
 *
 * There are no paid tiers, no subscriptions and no in-app purchases.
 * This hook exists only so feature code can keep asking "does this user have
 * full access?" — the answer is always yes.
 */
const FULL_ACCESS = {
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
export function useSubscription() {
    return FULL_ACCESS;
}
