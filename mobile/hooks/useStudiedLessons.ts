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
import type { SlideLike } from '../lesson-kit/sequencer/extract';

export interface StudiedLesson {
  stackId: string;
  title: string;
  day: number | null;
  slides: SlideLike[];
}

interface SlideRow {
  slide_number: number;
  title: string;
  body: string;
}

interface StackRow {
  id: string;
  title: string;
  tags: string[] | null;
  created_at: string;
  slides: SlideRow[] | null;
}

const dayFromTags = (tags: string[] | null): number | null => {
  const hit = (tags || []).find(t => /^day-\d+$/.test(t));
  return hit ? Number(hit.slice(4)) : null;
};

/** How many recent lessons practice draws from. */
const WINDOW = 6;

/** Does this lesson touch the corner of the market the learner chose? */
const matchesFocus = (lesson: StudiedLesson, keywords: string[]) => {
  if (!keywords.length) return false;
  const haystack = `${lesson.title} ${lesson.slides.map(s => `${s.title} ${s.body}`).join(' ')}`.toLowerCase();
  return keywords.some(word => haystack.includes(word));
};

export function useStudiedLessons(marketId?: string, focusKeywords: string[] = []) {
  const [lessons, setLessons] = useState<StudiedLesson[]>([]);
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
          .select('start_date')
          .eq('user_id', auth.user.id)
          .eq('market_id', marketId)
          .maybeSingle();
        availableDay = calculateAvailableDay(progress?.start_date ?? null);
      }

      // Every day the learner's local calendar has reached, newest first.
      const days = Array.from({ length: Math.min(availableDay, WINDOW) }, (_, i) => availableDay - i).filter(
        d => d >= 1,
      );

      const { data, error } = await supabase
        .from('stacks')
        .select('id, title, tags, created_at, slides (slide_number, title, body)')
        .eq('market_id', marketId)
        .overlaps('tags', days.map(d => `day-${d}`))
        .order('created_at', { ascending: false })
        .limit(40);

      if (error) {
        log.warn('[useStudiedLessons] Could not load studied lessons:', error.message);
        setLessons([]);
        return;
      }

      const byDay = new Map<number, StudiedLesson>();
      for (const row of (data ?? []) as unknown as StackRow[]) {
        const day = dayFromTags(row.tags);
        if (day === null || day > availableDay) continue;
        // Newest authored lesson for a day wins (rows arrive newest first).
        if (byDay.has(day)) continue;
        const slides = [...(row.slides ?? [])]
          .sort((a, b) => a.slide_number - b.slide_number)
          .map(s => ({ slideNumber: s.slide_number, title: s.title, body: s.body }));
        if (!slides.length) continue;
        byDay.set(day, { stackId: row.id, title: row.title, day, slides });
      }

      setLessons([...byDay.values()].sort((a, b) => (b.day ?? 0) - (a.day ?? 0)));
    } catch (err) {
      log.warn('[useStudiedLessons] Lookup failed:', err);
      setLessons([]);
    } finally {
      setIsLoading(false);
    }
  }, [marketId]);

  useEffect(() => {
    load();
  }, [load]);

  return { lessons, isLoading, reload: load };
}
