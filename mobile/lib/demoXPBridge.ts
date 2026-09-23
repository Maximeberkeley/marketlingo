import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { log } from './logger';

const DEMO_XP_KEY = 'ml_demo_xp';
const DEMO_MARKET_KEY = 'ml_demo_market';
const DEMO_COMPLETED_KEY = 'ml_demo_completed';
const DEMO_REWARD_XP = 20;

/**
 * Save XP earned during the pre-auth demo lesson.
 * Called each time the user earns XP in the demo flow.
 */
export async function saveDemoXP(xp: number) {
  try {
    const completed = await AsyncStorage.getItem(DEMO_COMPLETED_KEY);
    if (completed === 'true') return;
    await AsyncStorage.multiSet([
      [DEMO_XP_KEY, String(Math.min(DEMO_REWARD_XP, Math.max(0, xp)))],
      [DEMO_COMPLETED_KEY, 'true'],
    ]);
  } catch (e) {
    log.warn('Failed to save demo XP:', e);
  }
}

/**
 * Save which market the demo was in (always 'ai' for now).
 */
export async function saveDemoMarket(market: string) {
  try {
    await AsyncStorage.setItem(DEMO_MARKET_KEY, market);
  } catch (e) {
    log.warn('Failed to save demo market:', e);
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
    const today = new Date();
    const localDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const { data, error } = await supabase.rpc('claim_demo_onboarding_reward', {
      p_market_id: marketId,
      p_today: localDay,
    });
    if (error) throw error;
    await AsyncStorage.multiRemove([DEMO_XP_KEY, DEMO_MARKET_KEY, DEMO_COMPLETED_KEY]);
    return typeof data === 'number' ? data : 0;
  } catch (e) {
    log.warn('Failed to apply demo XP:', e);
    return 0;
  }
}

/**
 * Clear demo XP without applying (e.g., user logged in to existing account).
 */
export async function clearDemoXP() {
  try {
    await AsyncStorage.multiRemove([DEMO_XP_KEY, DEMO_MARKET_KEY, DEMO_COMPLETED_KEY]);
  } catch (e) {
    // Silent
  }
}
