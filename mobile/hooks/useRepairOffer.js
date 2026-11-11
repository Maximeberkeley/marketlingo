import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { log } from "../lib/logger";
import { trackEvent } from "../lib/analytics";
import { localDateString } from "../lib/dayMath";
import { repairFromJson } from "../lib/boosts";
const CHECK_DELAY_MS = 4500;
function useRepairOffer(userId, marketId, streak, active, show) {
  useEffect(() => {
    if (!userId || !marketId || !active || streak > 1) return;
    let live = true;
    const timer = setTimeout(async () => {
      try {
        const today = localDateString();
        const { data, error } = await supabase.rpc("shop_repair_status", { p_market_id: marketId, p_today: today });
        if (error || !live) return;
        const status = repairFromJson(data);
        if (status.reason !== "eligible" || !status.missedDays.length) return;
        const key = `ml_repair_offer_v1/${userId}/${marketId}/${status.missedDays[0]}/${today}`;
        if (await AsyncStorage.getItem(key)) return;
        await AsyncStorage.setItem(key, "1");
        if (!live) return;
        trackEvent("streak_repair_offered", { lost_streak: status.lostStreak });
        show(status);
      } catch (e) {
        log.warn("[Repair] Could not check the streak repair:", e);
      }
    }, CHECK_DELAY_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [userId, marketId, streak, active]);
}
export {
  useRepairOffer
};
