import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// Simple subscription hook using localStorage for development/testing
// For production, this would connect to native StoreKit via Capacitor plugin

export const PRODUCT_IDS = {
  MONTHLY: 'MarketLingo.pro.monthly',
  ANNUAL: 'MarketLingo.pro.yearly', 
  LIFETIME: 'MarketLingo.pro.lifetime',
} as const;

export const ENTITLEMENT_ID = 'MarketLingo Pro';

export function useSubscription() {
  const [isProUser, setIsProUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  let isNative = false;
  try {
    isNative = Capacitor.isNativePlatform();
  } catch (error) {
    console.warn('Capacitor not available:', error);
  }

  // Initialize - check localStorage for pro status
  useEffect(() => {
    try {
      const proStatus = localStorage.getItem('marketlingo_pro');
      setIsProUser(proStatus === 'true');
    } catch (error) {
      console.warn('Error reading pro status:', error);
    }
    setIsLoading(false);
  }, []);

  // Toggle pro status (for testing/development)
  const toggleProForTesting = useCallback(() => {
    const current = localStorage.getItem('marketlingo_pro');
    const newValue = current === 'true' ? 'false' : 'true';
    localStorage.setItem('marketlingo_pro', newValue);
    setIsProUser(newValue === 'true');
  }, []);

  // Placeholder functions - for production, connect to native StoreKit
  const purchasePackage = useCallback(async (_pkg: any) => {
    // For now, just toggle pro status
    localStorage.setItem('marketlingo_pro', 'true');
    setIsProUser(true);
    return { success: true, cancelled: false, error: null };
  }, []);

  const restorePurchases = useCallback(async () => {
    // Check if user already has pro
    const hasProAccess = localStorage.getItem('marketlingo_pro') === 'true';
    return { success: true, restored: hasProAccess, error: null };
  }, []);

  const getExpirationDate = useCallback(() => {
    return null; // No expiration for simple implementation
  }, []);

  const willRenew = useCallback(() => {
    return false;
  }, []);

  const getPackage = useCallback((type: 'monthly' | 'annual' | 'lifetime') => {
    // Return mock package data for display purposes
    const prices = {
      monthly: { priceString: '$9.99', price: 9.99 },
      annual: { priceString: '$79.99', price: 79.99 },
      lifetime: { priceString: '$199.99', price: 199.99 },
    };
    
    return {
      identifier: `$rc_${type}`,
      product: {
        identifier: PRODUCT_IDS[type.toUpperCase() as keyof typeof PRODUCT_IDS],
        ...prices[type],
      },
    };
  }, []);

  const loginUser = useCallback(async (_userId: string) => {
    // Placeholder for user login sync
  }, []);

  const logoutUser = useCallback(async () => {
    // Placeholder for user logout sync
  }, []);

  return {
    isProUser,
    isLoading,
    error: null,
    offerings: null,
    customerInfo: null,
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
