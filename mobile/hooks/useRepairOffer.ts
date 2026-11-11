import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { trackEvent } from '../lib/analytics';
import { localDateString } from '../lib/dayMath';
import { RepairStatus, repairFromJson } from '../lib/boosts';

/** After social reminders have had their turn, so the two never arrive together. */
const CHECK_DELAY_MS = 4500;

/**
 * When a streak of 7+ days broke in the last 48 hours and a repair is allowed, Leo offers it once a day through
 * Home's popup queue. The server decides eligibility (shop_repair_status); nothing shows while the streak is alive.
 */
export function useRepairOffer(
  userId: string | null | undefined,
  marketId: string | null | undefined,
  streak: number,
  active: boolean,
  show: (offer: RepairStatus) => void,
) {
  useEffect(() => {
    // A live streak above 1 cannot have just broken; skip the call entirely.
    if (!userId || !marketId || !active || streak > 1) return;
    let live = true;
    const timer = setTimeout(async () => {
      try {
        const today = localDateString();
        const { data, error } = await supabase.rpc('shop_repair_status', { p_market_id: marketId, p_today: today });
        if (error || !live) return;
        const status = repairFromJson(data);
        if (status.reason !== 'eligible' || !status.missedDays.length) return;
        const key = `ml_repair_offer_v1/${userId}/${marketId}/${status.missedDays[0]}/${today}`;
        if (await AsyncStorage.getItem(key)) return;
        await AsyncStorage.setItem(key, '1');
        if (!live) return;
        trackEvent('streak_repair_offered', { lost_streak: status.lostStreak });
        show(status);
      } catch (e) {
        log.warn('[Repair] Could not check the streak repair:', e);
      }
    }, CHECK_DELAY_MS);
    return () => { live = false; clearTimeout(timer); };
    // `show` is recreated each render; the check runs per focus, not per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, marketId, streak, active]);
}
