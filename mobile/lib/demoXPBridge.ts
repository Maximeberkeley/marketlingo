import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const DEMO_XP_KEY = 'ml_demo_xp';
const DEMO_MARKET_KEY = 'ml_demo_market';

/**
 * Save XP earned during the pre-auth demo lesson.
 * Called each time the user earns XP in the demo flow.
 */
export async function saveDemoXP(xp: number) {
  try {
    const existing = await AsyncStorage.getItem(DEMO_XP_KEY);
    const current = existing ? parseInt(existing, 10) : 0;
    await AsyncStorage.setItem(DEMO_XP_KEY, String(current + xp));
  } catch (e) {
    console.warn('Failed to save demo XP:', e);
  }
}

/**
 * Save which market the demo was in (always 'ai' for now).
 */
export async function saveDemoMarket(market: string) {
  try {
    await AsyncStorage.setItem(DEMO_MARKET_KEY, market);
  } catch (e) {
    console.warn('Failed to save demo market:', e);
  }
}

/**
 * Get stored demo XP and market.
 */
export async function getDemoXP(): Promise<{ xp: number; market: string | null }> {
  try {
    const xpStr = await AsyncStorage.getItem(DEMO_XP_KEY);
    const market = await AsyncStorage.getItem(DEMO_MARKET_KEY);
    return { xp: xpStr ? parseInt(xpStr, 10) : 0, market };
  } catch {
    return { xp: 0, market: null };
  }
}

/**
 * Apply stored demo XP to the user's real account.
 * Called after onboarding is complete (market + familiarity selected).
 * Returns the amount of XP applied, or 0 if none.
 */
export async function applyDemoXP(userId: string, marketId: string): Promise<number> {
  try {
    const { xp } = await getDemoXP();
    if (xp <= 0) return 0;

    // Credit the XP via Supabase
    const { error } = await supabase.from('xp_transactions').insert({
      user_id: userId,
      market_id: marketId,
      amount: xp,
      source: 'demo_bridge',
      description: 'XP earned during demo lesson — welcome bonus!',
    });

    if (!error) {
      // Update the total XP
      await supabase.rpc('add_user_xp', {
        p_user_id: userId,
        p_market_id: marketId,
        p_amount: xp,
        p_source: 'demo_bridge',
      });

      // Clear stored demo XP
      await AsyncStorage.multiRemove([DEMO_XP_KEY, DEMO_MARKET_KEY]);
    }

    return xp;
  } catch (e) {
    console.warn('Failed to apply demo XP:', e);
    return 0;
  }
}

/**
 * Clear demo XP without applying (e.g., user logged in to existing account).
 */
export async function clearDemoXP() {
  try {
    await AsyncStorage.multiRemove([DEMO_XP_KEY, DEMO_MARKET_KEY]);
  } catch (e) {
    // Silent
  }
}
