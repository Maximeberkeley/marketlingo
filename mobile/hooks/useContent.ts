import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { storage, FamiliarityLevel, UserTier } from '../lib/storage';
import { log } from '../lib/logger';

interface StackMetadata {
  learning_objectives?: string[];
  key_takeaway?: string;
  recap_bridge?: string;
  next_preview?: string;
}

interface Lesson {
  id: string;
  title: string;
  type: 'lesson' | 'news' | 'game' | 'drill';
  duration: number;
  xpReward: number;
  stackType: string;
  slides: Slide[];
  requiresPro: boolean;
  metadata?: StackMetadata;
}

interface Slide {
  slideNumber: number;
  title: string;
  body: string;
  sources?: { label: string; url: string }[];
}

interface SlideRow {
  slide_number: number;
  title: string;
  body: string;
  sources?: { label: string; url: string }[] | null;
}

interface StackRow {
  id: string;
  title: string;
  stack_type: string;
  duration_minutes: number | null;
  market_id: string;
  tags: string[] | null;
  metadata: unknown;
  slides: SlideRow[] | null;
}

interface ContentFilters {
  industry: string;
  familiarity: FamiliarityLevel;
  userTier: UserTier;
  day: number;
}


export function useContent() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ContentFilters | null>(null);

  const loadFilters = useCallback(async () => {
    const [industry, familiarity, userTier] = await Promise.all([
      storage.getIndustry(),
      storage.getFamiliarity(),
      storage.getUserTier(),
    ]);

    if (!industry || !familiarity) return;

    // Resolve the learner's current day from their saved progress for this
    // market. Falls back to day 1 when signed out or progress is missing.
    let day = 1;
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        const { data } = await supabase
          .from('user_progress')
          .select('current_day')
          .eq('user_id', auth.user.id)
          .eq('market_id', industry)
          .maybeSingle();
        if (data?.current_day) {
          day = Math.min(180, Math.max(1, data.current_day));
        }
      }
    } catch (error) {
      log.warn('[useContent] Could not resolve current day, defaulting to 1:', error);
    }

    setFilters({ industry, familiarity, userTier, day });
  }, []);


  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  const fetchLessonsForDay = useCallback(async (day: number) => {
    if (!filters) return;

    setIsLoading(true);
    try {
      // Fetch stacks for the given day and market
      // The stacks table uses tags array with 'day:X' format for day-based content
      const { data: stacks, error } = await supabase
        .from('stacks')
        .select(`
          id,
          title,
          stack_type,
          duration_minutes,
          market_id,
          tags,
          metadata,
          slides (
            slide_number,
            title,
            body,
            sources
          )
        `)
        .eq('market_id', filters.industry)
        .contains('tags', [`day-${day}`])
        .order('created_at', { ascending: true });

      if (error) {
        log.error('Error fetching lessons:', error);
        return;
      }

      // XP rewards based on stack type (matches web app logic)
      const getXpReward = (stackType: string) => {
        switch (stackType) {
          case 'lesson': return 50;
          case 'news': return 25;
          case 'game': return 25;
          case 'drill': return 25;
          default: return 50;
        }
      };

      const formattedLessons: Lesson[] = (stacks ?? []).map((stack) => {
        const row = stack as unknown as StackRow;
        return {
          id: row.id,
          title: row.title,
          type: getStackType(row.stack_type),
          duration: row.duration_minutes ?? 5,
          xpReward: getXpReward(row.stack_type),
          stackType: row.stack_type,
          slides: [...(row.slides ?? [])]
            .sort((a, b) => a.slide_number - b.slide_number)
            .map((s) => ({
              slideNumber: s.slide_number,
              title: s.title,
              body: s.body,
              sources: s.sources ?? undefined,
            })),
          requiresPro: row.stack_type === 'game' || row.stack_type === 'drill',
          metadata: (row.metadata ?? undefined) as StackMetadata | undefined,
        };
      });


      setLessons(formattedLessons);
    } catch (error) {
      log.error('Error in fetchLessonsForDay:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const getContentForFamiliarity = (content: string, familiarity: FamiliarityLevel): string => {
    // Adapt content depth based on familiarity level
    switch (familiarity) {
      case 'beginner':
        // Add more explanations, slower pacing
        return content;
      case 'intermediate':
        // Skip basic definitions, faster pacing
        return content;
      case 'advanced':
        // Expert-level only, no hand-holding
        return content;
      default:
        return content;
    }
  };

  const isContentAccessible = (lesson: Lesson, userTier: UserTier): boolean => {
    if (!lesson.requiresPro) return true;
    return userTier === 'pro';
  };

  return {
    lessons,
    isLoading,
    filters,
    fetchLessonsForDay,
    getContentForFamiliarity,
    isContentAccessible,
  };
}

function getStackType(stackType: string): 'lesson' | 'news' | 'game' | 'drill' {
  switch (stackType) {
    case 'news':
      return 'news';
    case 'game':
      return 'game';
    case 'drill':
      return 'drill';
    default:
      return 'lesson';
  }
}
