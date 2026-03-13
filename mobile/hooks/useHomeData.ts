/**
 * useHomeData — extracts all data-fetching logic from the Home screen.
 * Returns market config, lesson/news stacks, news items, social nudge, tomorrow preview.
 */

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { StackWithSlides } from '../lib/types';
import { getStreakRiskHours } from '../components/home/StreakAtRisk';
import { scheduleStreakNotifications } from '../lib/streakNotifications';

interface NewsItem {
  id: string;
  title: string;
  summary: string | null;
  source_name: string;
  source_url: string;
  published_at: string;
  category_tag: string | null;
}

interface KeyPlayer {
  id: string;
  name: string;
  ticker?: string;
  logo: string;
  segment: string;
}

interface HomeData {
  selectedMarket: string | null;
  isProUser: boolean;
  lessonStack: StackWithSlides | null;
  newsStack: StackWithSlides | null;
  newsItems: NewsItem[];
  streakRiskHours: number | null;
  socialNudge: { name: string; xp: number } | null;
  tomorrowLesson: { title: string; dayNumber: number } | null;
  loading: boolean;
  refreshing: boolean;
  newsRefreshing: boolean;
  currentDay: number;
}

// Normalize sources — DB has mixed formats
function normalizeSources(sources: any): { label: string; url: string }[] {
  if (!Array.isArray(sources)) return [];
  return sources.map((s: any) => {
    if (typeof s === 'string') {
      try {
        const url = new URL(s);
        return { label: url.hostname.replace('www.', ''), url: s };
      } catch {
        return { label: 'Source', url: s };
      }
    }
    if (s && typeof s === 'object' && s.url) {
      return { label: s.label || s.url, url: s.url };
    }
    return null;
  }).filter(Boolean) as { label: string; url: string }[];
}

export function useHomeData(
  userId: string | undefined,
  progress: any,
  xpData: any,
  lessonCompletedToday: boolean,
) {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [isProUser, setIsProUser] = useState(false);
  const [lessonStack, setLessonStack] = useState<StackWithSlides | null>(null);
  const [newsStack, setNewsStack] = useState<StackWithSlides | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [streakRiskHours, setStreakRiskHours] = useState<number | null>(null);
  const [socialNudge, setSocialNudge] = useState<{ name: string; xp: number } | null>(null);
  const [tomorrowLesson, setTomorrowLesson] = useState<{ title: string; dayNumber: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newsRefreshing, setNewsRefreshing] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);

  const fetchData = useCallback(async () => {
    if (!userId) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('selected_market, familiarity_level, is_pro_user')
      .eq('id', userId)
      .single();

    if (!profile?.selected_market) return 'onboarding';
    if (!profile?.familiarity_level) return 'familiarity';

    setSelectedMarket(profile.selected_market);
    setIsProUser(profile.is_pro_user || false);
    const market = profile.selected_market;
    const familiarityLevel = profile.familiarity_level || 'beginner';

    // Get learning goal for content filtering
    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('start_date, learning_goal, familiarity_level')
      .eq('user_id', userId)
      .eq('market_id', market)
      .single();

    const learningGoal = userProgress?.learning_goal || 'curiosity';
    const goalTag = `goal:${learningGoal}`;
    // Use market-specific familiarity if set, otherwise profile-level
    const effectiveLevel = userProgress?.familiarity_level || familiarityLevel;
    const levelTag = `level:${effectiveLevel}`;

    let calcDay = 1;
    if (userProgress?.start_date) {
      const start = new Date(userProgress.start_date);
      const today = new Date();
      start.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      calcDay = Math.min(180, Math.max(1, diffDays + 1));
    }
    setCurrentDay(calcDay);
    const dayTag = `day-${calcDay}`;

    // Fetch lesson stack with progressive fallbacks:
    // 1. Try goal + level + day (most specific)
    // 2. Try goal + day (without level)
    // 3. Try day only
    // 4. Closest available day
    let { data: lessonStacks } = await supabase
      .from('stacks')
      .select('id, title, stack_type, tags, duration_minutes, metadata, slides (slide_number, title, body, sources)')
      .eq('market_id', market)
      .contains('tags', ['MICRO_LESSON', dayTag, goalTag, levelTag])
      .not('published_at', 'is', null)
      .limit(5);

    // Filter out stacks with no slides at every fallback level
    const hasSlides = (stacks: any[] | null) => (stacks || []).filter((s: any) => (s.slides as any[])?.length > 0);

    // Fallback: goal + day (no level tag)
    if (!hasSlides(lessonStacks).length) {
      const { data: fb1 } = await supabase
        .from('stacks')
        .select('id, title, stack_type, tags, duration_minutes, metadata, slides (slide_number, title, body, sources)')
        .eq('market_id', market)
        .contains('tags', ['MICRO_LESSON', dayTag, goalTag])
        .not('published_at', 'is', null)
        .limit(5);
      lessonStacks = fb1;
    }

    if (!hasSlides(lessonStacks).length) {
      const { data: fallback } = await supabase
        .from('stacks')
        .select('id, title, stack_type, tags, duration_minutes, metadata, slides (slide_number, title, body, sources)')
        .eq('market_id', market)
        .contains('tags', ['MICRO_LESSON', dayTag])
        .not('published_at', 'is', null)
        .limit(5);
      lessonStacks = fallback;
    }

    if (!hasSlides(lessonStacks).length) {
      const { data: allLessons } = await supabase
        .from('stacks')
        .select('id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)')
        .eq('market_id', market)
        .contains('tags', ['MICRO_LESSON'])
        .not('published_at', 'is', null);

      if (allLessons?.length) {
        // Only consider stacks that actually have slides
        const withSlides = hasSlides(allLessons);
        const lessonsWithDays = withSlides.map((stack: any) => {
          const dayMatch = (stack.tags as string[])?.find((t: string) => t.startsWith('day-'));
          const dayNum = dayMatch ? parseInt(dayMatch.replace('day-', ''), 10) : 999;
          return { ...stack, dayNum };
        });
        const validLessons = lessonsWithDays.filter((l: any) => l.dayNum <= calcDay);
        const selectedLesson = validLessons.length > 0
          ? validLessons.reduce((max: any, l: any) => (l.dayNum > max.dayNum ? l : max))
          : lessonsWithDays.length > 0
            ? lessonsWithDays.reduce((min: any, l: any) => (l.dayNum < min.dayNum ? l : min))
            : null;
        if (selectedLesson) lessonStacks = [selectedLesson];
      }
    }

    // Filter out stacks with no slides (some were generated without content)
    const validLesson = (lessonStacks || []).find((s: any) => (s.slides as any[])?.length > 0);
    if (validLesson) {
      const stack = validLesson as any;
      setLessonStack({
        ...stack,
        tags: stack.tags || [],
        slides: ((stack.slides as any[]) || [])
          .sort((a: any, b: any) => a.slide_number - b.slide_number)
          .map((s: any) => ({ ...s, sources: normalizeSources(s.sources) })),
      });
    }

    // Fetch news/game stack
    const { data: newsStacks } = await supabase
      .from('stacks')
      .select('id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)')
      .eq('market_id', market)
      .contains('tags', ['DAILY_GAME'])
      .not('published_at', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1);

    if (newsStacks?.[0]) {
      const stack = newsStacks[0] as any;
      setNewsStack({
        ...stack,
        tags: stack.tags || [],
        slides: ((stack.slides as any[]) || [])
          .sort((a: any, b: any) => a.slide_number - b.slide_number)
          .map((s: any) => ({ ...s, sources: normalizeSources(s.sources) })),
      });
    }

    // Fetch news items
    const { data: cachedNews } = await supabase
      .from('news_items')
      .select('id, title, summary, source_name, source_url, published_at, category_tag')
      .eq('market_id', market)
      .order('published_at', { ascending: false })
      .limit(10);

    if (cachedNews && cachedNews.length > 0) {
      setNewsItems(cachedNews);
    } else {
      try {
        const { data: liveData } = await supabase.functions.invoke('fetch-market-news', {
          body: { marketId: market },
        });
        if (liveData?.data && liveData.data.length > 0) {
          const { data: freshNews } = await supabase
            .from('news_items')
            .select('id, title, summary, source_name, source_url, published_at, category_tag')
            .eq('market_id', market)
            .order('published_at', { ascending: false })
            .limit(10);
          if (freshNews) setNewsItems(freshNews);
        }
      } catch (e) {
        console.warn('Live news fetch failed:', e);
      }
    }

    // Streak risk
    const riskHours = getStreakRiskHours(
      progress?.streak_expires_at || null,
      progress?.current_streak || 0,
      lessonCompletedToday,
    );
    setStreakRiskHours(riskHours);

    scheduleStreakNotifications(
      progress?.current_streak || 0,
      lessonCompletedToday,
    );

    // Social nudge
    if (xpData?.total_xp && market) {
      try {
        const { data: rivals } = await supabase
          .from('user_xp')
          .select('total_xp, user_id, profiles!inner(username)')
          .eq('market_id', market)
          .gt('total_xp', xpData.total_xp)
          .order('total_xp', { ascending: true })
          .limit(1);

        if (rivals?.[0]) {
          const rival = rivals[0] as any;
          setSocialNudge({ name: rival.profiles?.username || 'Someone', xp: rival.total_xp });
        }
      } catch (e) { /* non-critical */ }
    }

    // Tomorrow preview
    const tomorrowDay = calcDay + 1;
    if (tomorrowDay <= 180) {
      try {
        const { data: tomorrowStacks } = await supabase
          .from('stacks')
          .select('title')
          .eq('market_id', market)
          .contains('tags', ['MICRO_LESSON', `day-${tomorrowDay}`])
          .not('published_at', 'is', null)
          .limit(1);

        if (tomorrowStacks?.[0]) {
          setTomorrowLesson({ title: tomorrowStacks[0].title, dayNumber: tomorrowDay });
        }
      } catch (e) { /* non-critical */ }
    }

    setLoading(false);
    return null;
  }, [userId, progress, xpData, lessonCompletedToday]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const refreshNews = useCallback(async () => {
    if (!selectedMarket || newsRefreshing) return;
    setNewsRefreshing(true);
    try {
      await supabase.functions.invoke('fetch-market-news', {
        body: { marketId: selectedMarket },
      });
      const { data: freshNews } = await supabase
        .from('news_items')
        .select('id, title, summary, source_name, source_url, published_at, category_tag')
        .eq('market_id', selectedMarket)
        .order('published_at', { ascending: false })
        .limit(10);
      if (freshNews) setNewsItems(freshNews);
    } catch (e) {
      console.warn('News refresh failed:', e);
    } finally {
      setNewsRefreshing(false);
    }
  }, [selectedMarket, newsRefreshing]);

  return {
    selectedMarket,
    isProUser,
    lessonStack,
    newsStack,
    newsItems,
    streakRiskHours,
    socialNudge,
    tomorrowLesson,
    loading,
    refreshing,
    newsRefreshing,
    currentDay,
    fetchData,
    onRefresh,
    refreshNews,
  };
}
