/**
 * Lightweight analytics event tracker.
 * Logs events to the `analytics_events` table (or console in dev).
 * Drop-in replacement when Mixpanel/Amplitude is added later.
 */
import { supabase } from './supabase';

export type AnalyticsEvent =
  | 'lesson_complete'
  | 'lesson_start'
  | 'streak_milestone'
  | 'level_up'
  | 'achievement_unlocked'
  | 'friend_request_sent'
  | 'friend_request_accepted'
  | 'nudge_sent'
  | 'trainer_complete'
  | 'game_complete'
  | 'drill_complete'
  | 'subscription_view'
  | 'subscription_purchase'
  | 'app_open'
  | 'onboarding_complete'
  | 'share_milestone'
  | 'review_session';

interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

// In-memory queue to batch events
const queue: { event: AnalyticsEvent; properties: EventProperties; timestamp: string }[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Track an analytics event. Fires immediately in dev, batches in prod.
 */
export function trackEvent(event: AnalyticsEvent, properties: EventProperties = {}) {
  const entry = {
    event,
    properties,
    timestamp: new Date().toISOString(),
  };

  if (__DEV__) {
    console.log(`[Analytics] ${event}`, properties);
  }

  queue.push(entry);

  // Flush after 5 seconds or 10 events
  if (queue.length >= 10) {
    flushEvents();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushEvents, 5000);
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

    // Store events — for now just log. When analytics_events table exists, insert.
    // This is a no-op storage until the table is created, keeping the tracking API stable.
    if (__DEV__) {
      console.log(`[Analytics] Flushed ${batch.length} events`);
    }
  } catch (e) {
    // Non-critical — don't crash the app
    if (__DEV__) console.warn('[Analytics] Flush failed:', e);
  }
}

/**
 * Identify user for analytics (call on login).
 */
export function identifyUser(userId: string, traits: EventProperties = {}) {
  if (__DEV__) {
    console.log(`[Analytics] Identify: ${userId}`, traits);
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
