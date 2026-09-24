/**
 * The lessons this learner has actually studied in their market.
 *
 * Practice (Daily Arena, Deep Case) must test what the learner has already
 * read — not a random day and not market trivia. This hook returns the slides
 * of the lessons behind the learner up to the day their timezone has unlocked,
 * newest first, so practice beats can be generated from that material.
 *
 * Frame of reference is always the LOCAL calendar day (lib/dayMath), never the
 * timestamp of the moment a lesson happened to be completed.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { calculateAvailableDay } from '../lib/dayMath';
import { log } from '../lib/logger';
const dayFromTags = (tags) => {
    const hit = (tags || []).find(t => /^day-\d+$/.test(t));
    return hit ? Number(hit.slice(4)) : null;
};
/** Does this lesson touch the corner of the market the learner chose? */
const matchesFocus = (lesson, keywords) => {
    if (!keywords.length)
        return false;
    const haystack = `${lesson.title} ${lesson.slides.map(s => `${s.title} ${s.body}`).join(' ')}`.toLowerCase();
    return keywords.some(word => haystack.includes(word));
};
export function useStudiedLessons(marketId, focusKeywords = [], preferredDay) {
    const [lessons, setLessons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const focusSignature = focusKeywords.join('|');
    const load = useCallback(async () => {
        if (!marketId) {
            setLessons([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const { data: auth } = await supabase.auth.getUser();
            let availableDay = 1;
            if (auth?.user) {
                const { data: progress } = await supabase
                    .from('user_progress')
                    .select('start_date, completed_stacks')
                    .eq('user_id', auth.user.id)
                    .eq('market_id', marketId)
                    .maybeSingle();
                availableDay = calculateAvailableDay(progress?.start_date ?? null);
                const completedIds = Array.isArray(progress?.completed_stacks)
                    ? progress.completed_stacks.filter((id) => typeof id === 'string')
                    : [];
                if (completedIds.length === 0) {
                    setLessons([]);
                    return;
                }
                const { data, error } = await supabase
                    .from('stacks')
                    .select('id, title, tags, created_at, slides (slide_number, title, body)')
                    .eq('market_id', marketId)
                    .in('id', completedIds.slice(-40))
                    .order('created_at', { ascending: false });
                if (error) {
                    log.warn('[useStudiedLessons] Could not load studied lessons:', error.message);
                    setLessons([]);
                    return;
                }
                const byDay = new Map();
                for (const row of (data ?? [])) {
                    const day = dayFromTags(row.tags);
                    if (day === null || day > availableDay)
                        continue;
                    if (byDay.has(day))
                        continue;
                    const slides = [...(row.slides ?? [])]
                        .sort((a, b) => a.slide_number - b.slide_number)
                        .map(s => ({ slideNumber: s.slide_number, title: s.title, body: s.body }));
                    if (!slides.length)
                        continue;
                    byDay.set(day, { stackId: row.id, title: row.title, day, slides });
                }
                const byRecency = [...byDay.values()].sort((a, b) => (b.day ?? 0) - (a.day ?? 0));
                // A Course-section launch is intentionally strict: practice must test
                // that displayed day, never silently substitute another studied day.
                if (preferredDay) {
                    setLessons(byRecency.filter(lesson => lesson.day === preferredDay));
                    return;
                }
                const keywords = focusSignature ? focusSignature.split('|').filter(Boolean) : [];
                if (keywords.length) {
                    const preferred = byRecency.filter(l => matchesFocus(l, keywords));
                    const rest = byRecency.filter(l => !preferred.includes(l));
                    setLessons([...preferred, ...rest]);
                }
                else {
                    setLessons(byRecency);
                }
                return;
            }
            setLessons([]);
        }
        catch (err) {
            log.warn('[useStudiedLessons] Lookup failed:', err);
            setLessons([]);
        }
        finally {
            setIsLoading(false);
        }
    }, [marketId, focusSignature, preferredDay]);
    useEffect(() => {
        load();
    }, [load]);
    return { lessons, isLoading, reload: load };
}
