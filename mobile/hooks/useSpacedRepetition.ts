/**
 * useSpacedRepetition — SM-2 algorithm for reviewing weak concepts.
 * Automatically queues concepts from completed lessons and surfaces them
 * based on performance-adjusted intervals.
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface ReviewItem {
  id: string;
  concept: string;
  stack_id: string | null;
  slide_number: number | null;
  ease_factor: number;
  interval_days: number;
  next_review_at: string;
  review_count: number;
  last_grade: number | null;
}

/**
 * SM-2 Algorithm: Calculate next review interval
 * grade: 0=forgot, 1=hard, 2=good, 3=easy
 */
function sm2(easeFactor: number, intervalDays: number, grade: number) {
  let newEF = easeFactor + (0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02));
  newEF = Math.max(1.3, newEF); // Floor at 1.3

  let newInterval: number;
  if (grade < 1) {
    // Forgot — reset to 1 day
    newInterval = 1;
  } else if (intervalDays === 1) {
    newInterval = grade >= 2 ? 3 : 1;
  } else {
    newInterval = Math.round(intervalDays * newEF);
  }

  return { easeFactor: newEF, intervalDays: newInterval };
}

export function useSpacedRepetition(marketId?: string) {
  const { user } = useAuth();
  const [dueItems, setDueItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dueCount, setDueCount] = useState(0);

  const fetchDueItems = useCallback(async () => {
    if (!user || !marketId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('review_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('market_id', marketId)
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at', { ascending: true })
      .limit(20);

    if (!error && data) {
      setDueItems(data as ReviewItem[]);
      setDueCount(data.length);
    }
    setLoading(false);
  }, [user, marketId]);

  useEffect(() => {
    fetchDueItems();
  }, [fetchDueItems]);

  /**
   * Add a concept to the review queue (called after lesson completion)
   */
  const addToReview = useCallback(async (
    concept: string,
    stackId?: string,
    slideNumber?: number,
  ) => {
    if (!user || !marketId) return;

    // Check if already exists
    const { data: existing } = await supabase
      .from('review_queue')
      .select('id')
      .eq('user_id', user.id)
      .eq('market_id', marketId)
      .eq('concept', concept)
      .maybeSingle();

    if (existing) return; // Already tracked

    await supabase.from('review_queue').insert({
      user_id: user.id,
      market_id: marketId,
      stack_id: stackId || null,
      slide_number: slideNumber || null,
      concept,
      next_review_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // First review tomorrow
    });
  }, [user, marketId]);

  /**
   * Add all key concepts from a completed lesson's slides
   */
  const addLessonConcepts = useCallback(async (
    stackId: string,
    slides: { slide_number: number; title: string; body: string }[],
  ) => {
    if (!user || !marketId) return;

    // Extract key concepts from slide titles (each title IS a concept)
    for (const slide of slides) {
      await addToReview(slide.title, stackId, slide.slide_number);
    }
  }, [user, marketId, addToReview]);

  /**
   * Grade a review item and update its schedule
   * grade: 0=forgot, 1=hard, 2=good, 3=easy
   */
  const gradeReview = useCallback(async (itemId: string, grade: number) => {
    const item = dueItems.find((i) => i.id === itemId);
    if (!item) return;

    const { easeFactor, intervalDays } = sm2(item.ease_factor, item.interval_days, grade);
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + intervalDays);

    await supabase
      .from('review_queue')
      .update({
        ease_factor: easeFactor,
        interval_days: intervalDays,
        next_review_at: nextReview.toISOString(),
        review_count: item.review_count + 1,
        last_grade: grade,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    // Remove from local state
    setDueItems((prev) => prev.filter((i) => i.id !== itemId));
    setDueCount((prev) => prev - 1);
  }, [dueItems]);

  return {
    dueItems,
    dueCount,
    loading,
    addToReview,
    addLessonConcepts,
    gradeReview,
    refetch: fetchDueItems,
  };
}
