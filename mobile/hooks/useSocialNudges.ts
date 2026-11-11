import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { trackEvent } from '../lib/analytics';
import { localDateString } from '../lib/dayMath';
import { parseFriendSocial } from '../lib/friendSocial';
import { markShown, nudgeStorageKey, parseNudgeLog, pickNudge, SocialNudge, socialNudges } from '../lib/socialNudges';

/** Let Home settle (and launch celebrations show) before a reminder joins Leo's queue. */
const CHECK_DELAY_MS = 3000;

/**
 * Friend race and reward reminders, spoken by Leo through Home's popup queue
 * (so they never collide with his lesson nudges). One reminder per focus at
 * most, each shown once, spaced and capped per day by lib/socialNudges.
 */
export function useSocialNudges(userId: string | null | undefined, active: boolean, show: (nudge: SocialNudge) => void) {
  useEffect(() => {
    if (!userId || !active) return;
    let live = true;
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('get_friend_social');
        if (error || !live) return;
        const key = nudgeStorageKey(userId);
        const raw = await AsyncStorage.getItem(key);
        const book = parseNudgeLog(raw ? JSON.parse(raw) : null);
        const next = pickNudge(socialNudges(parseFriendSocial(data), localDateString()), book);
        if (!next || !live) return;
        await AsyncStorage.setItem(key, JSON.stringify(markShown(book, next.key)));
        trackEvent('social_nudge_shown', { kind: next.key.split(':')[0] });
        show(next);
      } catch (e) {
        log.warn('[Nudge] Could not check friend reminders:', e);
      }
    }, CHECK_DELAY_MS);
    return () => { live = false; clearTimeout(timer); };
    // `show` is recreated each render; the check runs per focus, not per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, active]);
}
