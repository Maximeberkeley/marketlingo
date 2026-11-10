import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { log } from "../lib/logger";
function useAuthoredCase(marketId, day, slot) {
  const [row, setRow] = useState(null);
  const [loadedKey, setLoadedKey] = useState(null);
  const key = marketId && day && slot ? `${marketId}:${day}:${slot}` : null;
  useEffect(() => {
    let active = true;
    if (!key || !marketId || !day || !slot) return;
    void (async () => {
      try {
        const { data, error } = await supabase.from("deep_cases").select("day, slot, content").eq("market_id", marketId).eq("day", day).eq("slot", slot).maybeSingle();
        if (!active) return;
        if (error) log.warn("[DeepCase] No hand-written case:", error.message);
        setRow(!error && data ? data : null);
      } catch (err) {
        if (active) {
          log.warn("[DeepCase] Hand-written case lookup failed:", err);
          setRow(null);
        }
      } finally {
        if (active) setLoadedKey(key);
      }
    })();
    return () => {
      active = false;
    };
  }, [key, marketId, day, slot]);
  return { row: key && loadedKey === key ? row : null, loading: key !== null && loadedKey !== key };
}
export {
  useAuthoredCase
};
