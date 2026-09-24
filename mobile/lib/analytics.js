/**
 * Lightweight analytics event tracker.
 * Logs events to the `analytics_events` table (or console in dev).
 * Drop-in replacement when Mixpanel/Amplitude is added later.
 */
import { supabase } from './supabase';
import { log } from './logger';
// In-memory queue to batch events
const queue = [];
let flushTimer = null;
/**
 * Track an analytics event. Fires immediately in dev, batches in prod.
 */
export function trackEvent(event, properties = {}) {
    const entry = {
        event,
        properties,
        timestamp: new Date().toISOString(),
    };
    if (__DEV__) {
        log.debug(`[Analytics] ${event}`, properties);
    }
    queue.push(entry);
    // Flush after 5 seconds or 10 events
    if (queue.length >= 10) {
        flushEvents();
    }
    else if (!flushTimer) {
        flushTimer = setTimeout(flushEvents, 5000);
    }
}
async function flushEvents() {
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
    if (queue.length === 0)
        return;
    const batch = queue.splice(0, queue.length);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user)
            return;
        const rows = batch.map((entry) => ({
            user_id: user.id,
            event: entry.event,
            properties: entry.properties,
            occurred_at: entry.timestamp,
        }));
        const { error } = await supabase.from('analytics_events').insert(rows);
        if (error && __DEV__)
            log.warn('[Analytics] Insert failed:', error.message);
        if (__DEV__) {
            log.debug(`[Analytics] Flushed ${batch.length} events`);
        }
    }
    catch (e) {
        // Non-critical — don't crash the app
        if (__DEV__)
            log.warn('[Analytics] Flush failed:', e);
    }
}
/**
 * Identify user for analytics (call on login).
 */
export function identifyUser(userId, traits = {}) {
    if (__DEV__) {
        log.debug(`[Analytics] Identify: ${userId}`, traits);
    }
}
/**
 * Reset analytics (call on logout).
 */
export function resetAnalytics() {
    queue.length = 0;
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
}
