import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { storage, FamiliarityLevel, UserTier } from '../lib/storage';

interface Lesson {
  id: string;
  title: string;
  type: 'lesson' | 'news' | 'game' | 'drill';
  duration: number;
  xpReward: number;
  stackType: string;
  slides: Slide[];
  requiresPro: boolean;
}

interface Slide {
  slideNumber: number;
  title: string;
  body: string;
  sources?: { label: string; url: string }[];
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

    if (industry && familiarity) {
      setFilters({
        industry,
        familiarity,
        userTier,
        day: 1, // TODO: Get from user progress
      });
    }
  }, []);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  const fetchLessonsForDay = useCallback(async (day: number) => {
    if (!filters) return;

    setIsLoading(true);
    try {
      // Fetch lesson stacks for the given day
      const { data: stacks, error } = await supabase
        .from('lesson_stacks')
        .select(`
          id,
          title,
          stack_type,
          duration_minutes,
          xp_reward,
          slides (
            slide_number,
            title,
            body,
            sources
          )
        `)
        .eq('day_number', day)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching lessons:', error);
        return;
      }

      const formattedLessons: Lesson[] = (stacks || []).map((stack: any) => ({
        id: stack.id,
        title: stack.title,
        type: getStackType(stack.stack_type),
        duration: stack.duration_minutes || 5,
        xpReward: stack.xp_reward || 50,
        stackType: stack.stack_type,
        slides: (stack.slides || []).sort((a: any, b: any) => a.slide_number - b.slide_number),
        requiresPro: stack.stack_type === 'game' || stack.stack_type === 'drill',
      }));

      setLessons(formattedLessons);
    } catch (error) {
      console.error('Error in fetchLessonsForDay:', error);
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
