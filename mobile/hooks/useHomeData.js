/**
 * useHomeData — extracts all data-fetching logic from the Home screen.
 * Returns market config, lesson/news stacks, news items, social nudge, tomorrow preview.
 */
import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getStreakRiskHours } from '../components/home/StreakAtRisk';
import { scheduleStreakNotifications } from '../lib/streakNotifications';
import { log } from '../lib/logger';
import { calculateAvailableDay } from '../lib/dayMath';
import { goalContentTag } from '../lib/goals';
// Normalize sources — DB has mixed formats
function normalizeSources(sources) {
    if (!Array.isArray(sources))
        return [];
    return sources.map((s) => {
        if (typeof s === 'string') {
            try {
                const url = new URL(s);
                return { label: url.hostname.replace('www.', ''), url: s };
            }
            catch {
                return { label: 'Source', url: s };
            }
        }
        if (s && typeof s === 'object' && s.url) {
            return { label: s.label || s.url, url: s.url };
        }
        return null;
    }).filter(Boolean);
}
export function useHomeData(userId, progress, xpData, lessonCompletedToday) {
    const [selectedMarket, setSelectedMarket] = useState(null);
    const [isProUser, setIsProUser] = useState(false);
    const [lessonStack, setLessonStack] = useState(null);
    const [newsStack, setNewsStack] = useState(null);
    const [newsItems, setNewsItems] = useState([]);
    const [streakRiskHours, setStreakRiskHours] = useState(null);
    const [socialNudge, setSocialNudge] = useState(null);
    const [tomorrowLesson, setTomorrowLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [newsRefreshing, setNewsRefreshing] = useState(false);
    const [currentDay, setCurrentDay] = useState(1);
    const [learningGoal, setLearningGoal] = useState('curiosity');
    // Read progress/xp through refs so `fetchData` keeps a stable identity.
    // Depending on those objects directly gave the callback a new reference on
    // every XP update, which retriggered the Home screen's focus effect.
    const progressRef = useRef(progress);
    progressRef.current = progress;
    const xpDataRef = useRef(xpData);
    xpDataRef.current = xpData;
    const lessonDoneRef = useRef(lessonCompletedToday);
    lessonDoneRef.current = lessonCompletedToday;
    const fetchData = useCallback(async () => {
        const progress = progressRef.current;
        const xpData = xpDataRef.current;
        const lessonCompletedToday = lessonDoneRef.current;
        if (!userId) {
            setLoading(false);
            return null;
        }
        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('selected_market, familiarity_level, is_pro_user')
                .eq('id', userId)
                .maybeSingle();
            if (profileError) {
                log.warn('[HomeData] Failed to load profile:', profileError.message);
                setLoading(false);
                return null;
            }
            if (!profile?.selected_market) {
                setLoading(false);
                return 'onboarding';
            }
            if (!profile?.familiarity_level) {
                setLoading(false);
                return 'familiarity';
            }
            setSelectedMarket(profile.selected_market);
            setIsProUser(profile.is_pro_user || false);
            const market = profile.selected_market;
            const familiarityLevel = profile.familiarity_level || 'beginner';
            // Get learning goal for content filtering
            const { data: userProgress, error: progressError } = await supabase
                .from('user_progress')
                .select('start_date, learning_goal, familiarity_level')
                .eq('user_id', userId)
                .eq('market_id', market)
                .maybeSingle();
            if (progressError && progressError.code !== 'PGRST116') {
                log.warn('[HomeData] Failed to load progress:', progressError.message);
            }
            const learningGoalValue = userProgress?.learning_goal || 'curiosity';
            setLearningGoal(learningGoalValue);
            const goalTag = goalContentTag(learningGoalValue);
            // Use market-specific familiarity if set, otherwise profile-level
            const effectiveLevel = userProgress?.familiarity_level || familiarityLevel;
            const levelTag = `level:${effectiveLevel}`;
            // One source of truth for the day: local calendar days since start_date.
            // (Parsing start_date with `new Date()` treated it as UTC midnight and
            // shifted the day by one west of UTC, so Home and progress disagreed.)
            const calcDay = calculateAvailableDay(userProgress?.start_date);
            setCurrentDay(calcDay);
            const dayTag = `day-${calcDay}`;
            // Fetch lesson stack with progressive fallbacks:
            // 1. Try goal + level + day (most specific)
            // 2. Try goal + day (without level)
            // 3. Try day only
            // 4. Closest available day
            let { data: lessonStacks } = await supabase
                .from('stacks')
                .select('id, title, stack_type, tags, duration_minutes, metadata, slides (id, slide_number, title, body, sources)')
                .eq('market_id', market)
                .contains('tags', ['MICRO_LESSON', dayTag, goalTag, levelTag])
                .not('published_at', 'is', null)
                // Newest authored version of a day wins.
                .order('created_at', { ascending: false })
                .limit(5);
            // Filter out stacks with no slides at every fallback level
            const hasSlides = (stacks) => (stacks || []).filter((s) => s.slides?.length > 0);
            // Fallback: goal + day (no level tag)
            if (!hasSlides(lessonStacks).length) {
                const { data: fb1 } = await supabase
                    .from('stacks')
                    .select('id, title, stack_type, tags, duration_minutes, metadata, slides (id, slide_number, title, body, sources)')
                    .eq('market_id', market)
                    .contains('tags', ['MICRO_LESSON', dayTag, goalTag])
                    .not('published_at', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(5);
                lessonStacks = fb1;
            }
            if (!hasSlides(lessonStacks).length) {
                const { data: fallback } = await supabase
                    .from('stacks')
                    .select('id, title, stack_type, tags, duration_minutes, metadata, slides (id, slide_number, title, body, sources)')
                    .eq('market_id', market)
                    .contains('tags', ['MICRO_LESSON', dayTag])
                    .not('published_at', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(5);
                lessonStacks = fallback;
            }
            if (!hasSlides(lessonStacks).length) {
                const { data: allLessons } = await supabase
                    .from('stacks')
                    .select('id, title, stack_type, tags, duration_minutes, metadata, slides (id, slide_number, title, body, sources)')
                    .eq('market_id', market)
                    .contains('tags', ['MICRO_LESSON'])
                    .not('published_at', 'is', null);
                if (allLessons?.length) {
                    // Only consider stacks that actually have slides
                    const withSlides = hasSlides(allLessons);
                    const lessonsWithDays = withSlides.map((stack) => {
                        const dayMatch = stack.tags?.find((t) => t.startsWith('day-'));
                        const dayNum = dayMatch ? parseInt(dayMatch.replace('day-', ''), 10) : 999;
                        return { ...stack, dayNum };
                    });
                    const validLessons = lessonsWithDays.filter((l) => l.dayNum <= calcDay);
                    const selectedLesson = validLessons.length > 0
                        ? validLessons.reduce((max, l) => (l.dayNum > max.dayNum ? l : max))
                        : lessonsWithDays.length > 0
                            ? lessonsWithDays.reduce((min, l) => (l.dayNum < min.dayNum ? l : min))
                            : null;
                    if (selectedLesson)
                        lessonStacks = [selectedLesson];
                }
            }
            // Filter out stacks with no slides (some were generated without content)
            const validLesson = (lessonStacks || []).find((s) => s.slides?.length > 0);
            if (validLesson) {
                const stack = validLesson;
                setLessonStack({
                    ...stack,
                    tags: stack.tags || [],
                    slides: (stack.slides || [])
                        .sort((a, b) => a.slide_number - b.slide_number)
                        .map((s) => ({ ...s, sources: normalizeSources(s.sources) })),
                });
            }
            // Fetch news/game stack
            const { data: newsStacks } = await supabase
                .from('stacks')
                .select('id, title, stack_type, tags, duration_minutes, metadata, slides (id, slide_number, title, body, sources)')
                .eq('market_id', market)
                .contains('tags', ['DAILY_GAME'])
                .not('published_at', 'is', null)
                .order('created_at', { ascending: true })
                .limit(1);
            if (newsStacks?.[0]) {
                const stack = newsStacks[0];
                setNewsStack({
                    ...stack,
                    tags: stack.tags || [],
                    slides: (stack.slides || [])
                        .sort((a, b) => a.slide_number - b.slide_number)
                        .map((s) => ({ ...s, sources: normalizeSources(s.sources) })),
                });
            }
            // Fetch news items
            const { data: cachedNews } = await supabase
                .from('news_items')
                .select('id, title, summary, source_name, source_url, published_at, category_tag, image_url')
                .eq('market_id', market)
                .order('published_at', { ascending: false })
                .limit(10);
            if (cachedNews && cachedNews.length > 0) {
                setNewsItems(cachedNews);
            }
            else {
                try {
                    const { data: liveData } = await supabase.functions.invoke('fetch-market-news', {
                        body: { marketId: market },
                    });
                    if (liveData?.data && liveData.data.length > 0) {
                        const { data: freshNews } = await supabase
                            .from('news_items')
                            .select('id, title, summary, source_name, source_url, published_at, category_tag, image_url')
                            .eq('market_id', market)
                            .order('published_at', { ascending: false })
                            .limit(10);
                        if (freshNews)
                            setNewsItems(freshNews);
                    }
                }
                catch (e) {
                    log.warn('Live news fetch failed:', e);
                }
            }
            // Streak risk
            const riskHours = getStreakRiskHours(progress?.streak_expires_at || null, progress?.current_streak || 0, lessonCompletedToday);
            setStreakRiskHours(riskHours);
            scheduleStreakNotifications(progress?.current_streak || 0, lessonCompletedToday);
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
                        const rival = rivals[0];
                        setSocialNudge({ name: rival.profiles?.username || 'Someone', xp: rival.total_xp });
                    }
                }
                catch (e) { /* non-critical */ }
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
                }
                catch (e) { /* non-critical */ }
            }
            setLoading(false);
            return null;
        }
        catch (error) {
            log.warn('[HomeData] Failed to load home data:', error);
            setLoading(false);
            return null;
        }
    }, [userId]);
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);
    const refreshNews = useCallback(async () => {
        if (!selectedMarket || newsRefreshing)
            return;
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
            if (freshNews)
                setNewsItems(freshNews);
        }
        catch (e) {
            log.warn('News refresh failed:', e);
        }
        finally {
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
        learningGoal,
        fetchData,
        onRefresh,
        refreshNews,
    };
}
