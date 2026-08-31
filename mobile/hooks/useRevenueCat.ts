import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { storage } from '../lib/storage';
import { log } from '../lib/logger';
import { MONETIZATION_ENABLED } from '../lib/monetization';

const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// IMPORTANT: This must match the entitlement ID in RevenueCat dashboard
const ENTITLEMENT_ID = 'MarketLingo Pro';

/**
 * RevenueCat is fully lazy-loaded and only ever touched when
 * MONETIZATION_ENABLED is true. While the app is free, the StoreKit SDK is
 * never imported, never configured, and no purchase can be attempted.
 */
function loadPurchases(): any | null {
  try {
    return require('react-native-purchases').default;
  } catch {
    return null;
  }
}

export function useRevenueCat() {
  const [isProUser, setIsProUser] = useState(!MONETIZATION_ENABLED);
  const [isLoading, setIsLoading] = useState(MONETIZATION_ENABLED);
  const [offerings, setOfferings] = useState<any | null>(null);
  const [customerInfo, setCustomerInfo] = useState<any | null>(null);

  useEffect(() => {
    if (!MONETIZATION_ENABLED) return;
    initializeRevenueCat();
  }, []);

  const initializeRevenueCat = async () => {
    const Purchases = loadPurchases();
    if (!Purchases) {
      setIsLoading(false);
      return;
    }
    try {
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

      if (!apiKey) {
        log.warn('RevenueCat API key not configured');
        setIsLoading(false);
        return;
      }

      await Purchases.configure({ apiKey });

      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);

      const isPro = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsProUser(isPro);
      await storage.setUserTier(isPro ? 'pro' : 'free');

      const current = await Purchases.getOfferings();
      if (current.current) {
        setOfferings(current.current);
      }
    } catch (error) {
      log.error('RevenueCat initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const purchasePackage = async (pkg: any): Promise<boolean> => {
    if (!MONETIZATION_ENABLED) return true;
    const Purchases = loadPurchases();
    if (!Purchases) return false;
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      const isPro = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsProUser(isPro);
      setCustomerInfo(info);
      await storage.setUserTier(isPro ? 'pro' : 'free');
      return isPro;
    } catch (error: any) {
      if (!error.userCancelled) {
        log.error('Purchase error:', error);
      }
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    if (!MONETIZATION_ENABLED) return true;
    const Purchases = loadPurchases();
    if (!Purchases) return false;
    try {
      const info = await Purchases.restorePurchases();
      const isPro = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsProUser(isPro);
      setCustomerInfo(info);
      await storage.setUserTier(isPro ? 'pro' : 'free');
      return isPro;
    } catch (error) {
      log.error('Restore error:', error);
      return false;
    }
  };

  const getPackage = (identifier: string): any | undefined => {
    return offerings?.availablePackages?.find(
      (pkg: any) => pkg.identifier === identifier
    );
  };

  return {
    isProUser,
    isLoading,
    offerings,
    customerInfo,
    purchasePackage,
    restorePurchases,
    getPackage,
  };
}
