import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
} from 'react-native-purchases';
import { storage } from '../lib/storage';

const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

export function useRevenueCat() {
  const [isProUser, setIsProUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    initializeRevenueCat();
  }, []);

  const initializeRevenueCat = async () => {
    try {
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
      
      if (!apiKey) {
        console.warn('RevenueCat API key not configured');
        setIsLoading(false);
        return;
      }

      await Purchases.configure({ apiKey });

      // Get customer info
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      
      // Check if user has active entitlement
      const isPro = info.entitlements.active['pro'] !== undefined;
      setIsProUser(isPro);
      await storage.setUserTier(isPro ? 'pro' : 'free');

      // Get offerings
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setOfferings(offerings.current);
      }
    } catch (error) {
      console.error('RevenueCat initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPro = customerInfo.entitlements.active['pro'] !== undefined;
      setIsProUser(isPro);
      setCustomerInfo(customerInfo);
      await storage.setUserTier(isPro ? 'pro' : 'free');
      return isPro;
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Purchase error:', error);
      }
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPro = customerInfo.entitlements.active['pro'] !== undefined;
      setIsProUser(isPro);
      setCustomerInfo(customerInfo);
      await storage.setUserTier(isPro ? 'pro' : 'free');
      return isPro;
    } catch (error) {
      console.error('Restore error:', error);
      return false;
    }
  };

  const getPackage = (identifier: string): PurchasesPackage | undefined => {
    return offerings?.availablePackages.find(
      (pkg) => pkg.identifier === identifier
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
