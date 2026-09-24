/**
 * Global monetization kill switch.
 *
 * While `false`, the app is 100% free:
 * - every user is treated as Pro (no gates, no daily limits)
 * - no "Go Pro" banners, upsell modals or Pro interstitial ads
 * - the subscription screen is not reachable from the UI
 *
 * Flip to `true` to bring back the paid tier.
 */
export const MONETIZATION_ENABLED = false;
