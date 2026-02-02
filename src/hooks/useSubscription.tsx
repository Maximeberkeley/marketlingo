import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from '@revenuecat/purchases-capacitor';

// Product IDs - must match App Store Connect and RevenueCat
export const PRODUCT_IDS = {
  MONTHLY: 'MarketLingo.pro.monthly',
  ANNUAL: 'MarketLingo.pro.yearly', 
  LIFETIME: 'MarketLingo.pro.lifetime',
} as const;

// Entitlement ID - the "pro" access level (must match RevenueCat dashboard)
export const ENTITLEMENT_ID = 'MarketLingo Pro';

// RevenueCat API Key
const REVENUECAT_API_KEY = 'test_mGwqlvGwZYUnyBsIYtCcWDYcLbS';

export function useSubscription() {
  const [isProUser, setIsProUser] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  // Initialize RevenueCat
  useEffect(() => {
    const initializePurchases = async () => {
      if (!isNative) {
        // Web fallback - check localStorage for testing
        const webProStatus = localStorage.getItem('marketlingo_pro');
        setIsProUser(webProStatus === 'true');
        setIsLoading(false);
        return;
      }

      try {
        const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
        
        // Enable debug logging in development
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        
        // Configure RevenueCat with API key
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });

        // Get customer info to check current subscription status
        const customerInfoResult = await Purchases.getCustomerInfo();
        const info = customerInfoResult.customerInfo;
        setCustomerInfo(info);
        
        // Check if user has active "MarketLingo Pro" entitlement
        const hasProAccess = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
        setIsProUser(hasProAccess);

        // Get available offerings (subscription packages)
        const offeringsResult = await Purchases.getOfferings();
        if (offeringsResult.current) {
          setOfferings(offeringsResult.current);
        }

        // Listen for customer info updates (e.g., subscription changes)
        Purchases.addCustomerInfoUpdateListener((updatedInfo: CustomerInfo) => {
          setCustomerInfo(updatedInfo);
          const hasAccess = updatedInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
          setIsProUser(hasAccess);
        });

      } catch (err) {
        console.error('Failed to initialize RevenueCat:', err);
        setError('Failed to load subscription info');
      } finally {
        setIsLoading(false);
      }
    };

    initializePurchases();
  }, [isNative]);

  // Purchase a subscription package
  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    if (!isNative) {
      // Web fallback for testing
      localStorage.setItem('marketlingo_pro', 'true');
      setIsProUser(true);
      return { success: true };
    }

    try {
      setIsLoading(true);
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      
      const result = await Purchases.purchasePackage({ 
        aPackage: pkg 
      });
      
      const info = result.customerInfo;
      setCustomerInfo(info);
      const hasProAccess = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsProUser(hasProAccess);
      
      return { success: true };
    } catch (err: any) {
      // User cancelled is not an error
      if (err.code === 'PURCHASE_CANCELLED' || err.userCancelled) {
        return { success: false, cancelled: true };
      }
      console.error('Purchase failed:', err);
      setError(err.message || 'Purchase failed');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [isNative]);

  // Restore purchases (for users who reinstall or switch devices)
  const restorePurchases = useCallback(async () => {
    if (!isNative) {
      return { success: true };
    }

    try {
      setIsLoading(true);
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      
      const result = await Purchases.restorePurchases();
      
      const info = result.customerInfo;
      setCustomerInfo(info);
      const hasProAccess = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsProUser(hasProAccess);
      
      return { success: true, restored: hasProAccess };
    } catch (err: any) {
      console.error('Restore failed:', err);
      setError(err.message || 'Restore failed');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [isNative]);

  // Get subscription expiration date
  const getExpirationDate = useCallback(() => {
    if (!customerInfo || !isProUser) return null;
    
    const proEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!proEntitlement?.expirationDate) return null;
    
    return new Date(proEntitlement.expirationDate);
  }, [customerInfo, isProUser]);

  // Check if subscription will auto-renew
  const willRenew = useCallback(() => {
    if (!customerInfo || !isProUser) return false;
    
    const proEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    return proEntitlement?.willRenew ?? false;
  }, [customerInfo, isProUser]);

  // Get specific package by type
  const getPackage = useCallback((type: 'monthly' | 'annual' | 'lifetime') => {
    if (!offerings) return null;
    
    switch (type) {
      case 'monthly':
        return offerings.monthly || offerings.availablePackages?.find(
          p => p.identifier === '$rc_monthly' || p.product?.identifier === PRODUCT_IDS.MONTHLY
        );
      case 'annual':
        return offerings.annual || offerings.availablePackages?.find(
          p => p.identifier === '$rc_annual' || p.product?.identifier === PRODUCT_IDS.ANNUAL
        );
      case 'lifetime':
        return offerings.lifetime || offerings.availablePackages?.find(
          p => p.identifier === '$rc_lifetime' || p.product?.identifier === PRODUCT_IDS.LIFETIME
        );
      default:
        return null;
    }
  }, [offerings]);

  // For testing on web - toggle pro status
  const toggleProForTesting = useCallback(() => {
    if (!isNative) {
      const current = localStorage.getItem('marketlingo_pro');
      const newValue = current === 'true' ? 'false' : 'true';
      localStorage.setItem('marketlingo_pro', newValue);
      setIsProUser(newValue === 'true');
    }
  }, [isNative]);

  // Login with user ID (for linking purchases to your user system)
  const loginUser = useCallback(async (userId: string) => {
    if (!isNative) return;
    
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const result = await Purchases.logIn({ appUserID: userId });
      setCustomerInfo(result.customerInfo);
      const hasProAccess = result.customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsProUser(hasProAccess);
    } catch (err) {
      console.error('Failed to login user to RevenueCat:', err);
    }
  }, [isNative]);

  // Logout user
  const logoutUser = useCallback(async () => {
    if (!isNative) return;
    
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const result = await Purchases.logOut();
      setCustomerInfo(result.customerInfo);
      const hasProAccess = result.customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsProUser(hasProAccess);
    } catch (err) {
      console.error('Failed to logout user from RevenueCat:', err);
    }
  }, [isNative]);

  return {
    isProUser,
    isLoading,
    error,
    offerings,
    customerInfo,
    purchasePackage,
    restorePurchases,
    getExpirationDate,
    willRenew,
    getPackage,
    toggleProForTesting,
    loginUser,
    logoutUser,
    isNative,
  };
}
