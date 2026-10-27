import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { emitXP } from "../lib/progressEvents";
import { useAuth } from "./useAuth";
import { log } from "../lib/logger";
const INTEL_DAILY_TARGET = 3;
const INTEL_HABIT_XP = 20;
const EVENT = "intel_read";
const COMPLETE_EVENT = "intel_completed";
function localDayStartISO() {
  const now = /* @__PURE__ */ new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return start.toISOString();
}
function useIntelHabit(marketId) {
  const { user } = useAuth();
  const [readToday, setReadToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completedToday, setCompletedToday] = useState(false);
  const seen = useRef(/* @__PURE__ */ new Set());
  const rewarded = useRef(false);
  const refresh = useCallback(async () => {
    if (!user || !marketId) {
      setReadToday(0);
      setCompletedToday(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from("analytics_events").select("event, properties").eq("user_id", user.id).in("event", [EVENT, COMPLETE_EVENT]).gte("occurred_at", localDayStartISO());
      if (error) throw error;
      const ids = /* @__PURE__ */ new Set();
      let complete = false;
      (data || []).forEach((row) => {
        const props = row?.properties || {};
        if (props.market_id !== marketId) return;
        if (row.event === COMPLETE_EVENT) {
          complete = true;
          return;
        }
        const id = typeof props.article_id === "string" ? props.article_id : "";
        if (id) ids.add(id);
      });
      seen.current = ids;
      setReadToday(ids.size);
      setCompletedToday(complete);
    } catch (e) {
      log.warn("useIntelHabit refresh failed", e);
    } finally {
      setLoading(false);
    }
  }, [user, marketId]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const recordComplete = useCallback(async (articleId) => {
    if (!user || !marketId || !articleId) return;
    const { error } = await supabase.from("analytics_events").insert({
      user_id: user.id,
      event: COMPLETE_EVENT,
      properties: { article_id: articleId, market_id: marketId }
    });
    if (error) {
      log.warn("intel completion not recorded", error);
      return;
    }
    setCompletedToday(true);
  }, [user, marketId]);
  const bankReward = useCallback(async () => {
    if (!user || !marketId || rewarded.current) return;
    rewarded.current = true;
    try {
      const { data: existing } = await supabase.from("xp_transactions").select("id").eq("user_id", user.id).eq("market_id", marketId).eq("source_type", "intel_habit").gte("created_at", localDayStartISO()).limit(1);
      if (existing && existing.length > 0) return;
      await supabase.rpc("increment_user_xp", {
        p_user_id: user.id,
        p_market_id: marketId,
        p_amount: INTEL_HABIT_XP
      });
      emitXP(null);
      await supabase.from("xp_transactions").insert({
        user_id: user.id,
        market_id: marketId,
        xp_amount: INTEL_HABIT_XP,
        source_type: "intel_habit",
        description: `Read ${INTEL_DAILY_TARGET} industry intel stories`
      });
    } catch (e) {
      log.warn("intel habit reward failed", e);
    }
  }, [user, marketId]);
  const recordRead = useCallback(async (articleId) => {
    if (!user || !marketId || !articleId || seen.current.has(articleId)) return;
    seen.current.add(articleId);
    const next = seen.current.size;
    setReadToday(next);
    try {
      const { error } = await supabase.from("analytics_events").insert({
        user_id: user.id,
        event: EVENT,
        properties: { article_id: articleId, market_id: marketId ?? null }
      });
      if (error) throw error;
    } catch (e) {
      seen.current.delete(articleId);
      setReadToday(seen.current.size);
      log.warn("intel read not recorded", e);
    }
    if (next >= INTEL_DAILY_TARGET) bankReward();
  }, [user, marketId, bankReward]);
  const remaining = Math.max(0, INTEL_DAILY_TARGET - readToday);
  return {
    readToday,
    target: INTEL_DAILY_TARGET,
    remaining,
    done: completedToday || remaining === 0,
    loading,
    recordRead,
    recordComplete,
    refresh
  };
}
export {
  INTEL_DAILY_TARGET,
  INTEL_HABIT_XP,
  useIntelHabit
};
