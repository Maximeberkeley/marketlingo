# Plan: Remove all IAP/App Store purchase surface (app is 100% free)

## Why the old step is obsolete
"Attach IAP products to v1.0.3" was only needed because the app sold subscriptions. Since `MONETIZATION_ENABLED = false` makes everything free, that step is **deleted from the release checklist**. In fact, shipping with purchasable IAP products still attached in App Store Connect would risk the same Guideline 2.1(b) rejection (a reviewer could hit a broken purchase path). Free app = no IAP in the submission at all.

## Code changes (mobile)

1. **Fully neutralize RevenueCat at runtime** (currently it still initializes StoreKit on app start via `useRevenueCat.ts`):
   - Gate `useRevenueCat` behind `MONETIZATION_ENABLED`: when false, return `{ isProUser: true, isLoading: false, offerings: null }` immediately — no `Purchases.configure()`, no StoreKit network calls, no errors possible.
   - Gate `useSubscription` purchase/restore functions the same way (already partially done; verify no path calls `Purchases.purchasePackage` when disabled).
2. **Remove dead UI routes**: make `/subscription` screen render a "MarketLingo is free" placeholder (or redirect to settings) so no purchase UI is reachable even by deep link.
3. **Keep everything behind the single flag** (`mobile/lib/monetization.ts`) so re-enabling Pro later is a one-line change — no code deletion.
4. Optional (recommended): remove `react-native-purchases` from `package.json` for the App Store build to eliminate the StoreKit SDK entirely from the binary. This reduces review surface. Flag for later: reinstall when re-enabling Pro.

## App Store Connect changes (you do these)

1. **Do NOT attach** `pro_monthly` / `pro_annual` to version 1.0.3.
2. Delete the two IAP products (or leave them — they're inert if not attached, but deleting is cleanest) in App Store Connect > In-App Purchases.
3. In App Review Information: answer **"No"** to in-app purchases if asked.
4. Update app metadata/screenshots to remove any "subscription" or "free trial" mentions.
5. Rebuild v1.0.3 in Xcode and resubmit — with zero IAP surface, Guideline 2.1(b) (purchase error) and 3.1.2(c) (subscription disclosures) no longer apply.

## Verification
- Grep mobile build for any reachable purchase path with the flag off.
- Playwright/manual check: settings, profile, home show no Pro/upgrade UI.
- Confirm app launches with no RevenueCat/StoreKit calls in device logs.
