import { supabase } from "./supabase";
import { log } from "./logger";
const queue = [];
let flushTimer = null;
function trackEvent(event, properties = {}) {
  const entry = {
    event,
    properties,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (__DEV__) {
    log.debug(`[Analytics] ${event}`, properties);
  }
  queue.push(entry);
  if (queue.length >= 10) {
    flushEvents();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushEvents, 5e3);
  }
}
async function flushEvents() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const rows = batch.map((entry) => ({
      user_id: user.id,
      event: entry.event,
      properties: entry.properties,
      occurred_at: entry.timestamp
    }));
    const { error } = await supabase.from("analytics_events").insert(rows);
    if (error && __DEV__) log.warn("[Analytics] Insert failed:", error.message);
    if (__DEV__) {
      log.debug(`[Analytics] Flushed ${batch.length} events`);
    }
  } catch (e) {
    if (__DEV__) log.warn("[Analytics] Flush failed:", e);
  }
}
function identifyUser(userId, traits = {}) {
  if (__DEV__) {
    log.debug(`[Analytics] Identify: ${userId}`, traits);
  }
}
function resetAnalytics() {
  queue.length = 0;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
export {
  identifyUser,
  resetAnalytics,
  trackEvent
};
