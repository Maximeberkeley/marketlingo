import { useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { getStreakRiskHours } from "../components/home/StreakAtRisk";
import { scheduleStreakNotifications } from "../lib/streakNotifications";
import { log } from "../lib/logger";
import { calculateAvailableDay } from "../lib/dayMath";
import { goalContentTag } from "../lib/goals";
import { HANDWRITTEN_TAG, HANDWRITTEN_MAX_DAY } from "../lib/handwritten";
import { realLessonTitle } from "../lib/lessonIdentity";
function normalizeSources(sources) {
  if (!Array.isArray(sources)) return [];
  return sources.map((s) => {
    if (typeof s === "string") {
      try {
        const url = new URL(s);
        return { label: url.hostname.replace("www.", ""), url: s };
      } catch {
        return { label: "Source", url: s };
      }
    }
    if (s && typeof s === "object" && s.url) {
      return { label: s.label || s.url, url: s.url };
    }
    return null;
  }).filter(Boolean);
}
function useHomeData(userId, progress, xpData, lessonCompletedToday) {
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
  const [learningGoal, setLearningGoal] = useState("curiosity");
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const xpDataRef = useRef(xpData);
  xpDataRef.current = xpData;
  const lessonDoneRef = useRef(lessonCompletedToday);
  lessonDoneRef.current = lessonCompletedToday;
  const fetchData = useCallback(async () => {
    const progress2 = progressRef.current;
    const xpData2 = xpDataRef.current;
    const lessonCompletedToday2 = lessonDoneRef.current;
    if (!userId) {
      setLoading(false);
      return null;
    }
    try {
      const { data: profile, error: profileError } = await supabase.from("profiles").select("selected_market, familiarity_level, is_pro_user").eq("id", userId).maybeSingle();
      if (profileError) {
        log.warn("[HomeData] Failed to load profile:", profileError.message);
        setLoading(false);
        return null;
      }
      if (!profile?.selected_market) {
        setLoading(false);
        return "onboarding";
      }
      if (!profile?.familiarity_level) {
        setLoading(false);
        return "familiarity";
      }
      setSelectedMarket(profile.selected_market);
      setIsProUser(profile.is_pro_user || false);
      const market = profile.selected_market;
      const familiarityLevel = profile.familiarity_level || "beginner";
      const { data: userProgress, error: progressError } = await supabase.from("user_progress").select("start_date, learning_goal, familiarity_level, completed_stacks").eq("user_id", userId).eq("market_id", market).maybeSingle();
      if (progressError && progressError.code !== "PGRST116") {
        throw progressError;
      }
      const learningGoalValue = userProgress?.learning_goal || "curiosity";
      setLearningGoal(learningGoalValue);
      const goalTag = goalContentTag(learningGoalValue);
      const effectiveLevel = userProgress?.familiarity_level || familiarityLevel;
      const levelTag = `level:${effectiveLevel}`;
      const calcDay = calculateAvailableDay(userProgress?.start_date);
      setCurrentDay(calcDay);
      const completedIds = userProgress?.completed_stacks || [];
      const completedDays = /* @__PURE__ */ new Set();
      if (completedIds.length) {
        const { data: credited, error } = await supabase.from("stacks").select("tags").in("id", completedIds).eq("market_id", market);
        if (error) throw error;
        (credited || []).forEach((stack) => {
          const tag = (stack.tags || []).find((value) => /^day-\d+$/.test(value));
          if (tag) completedDays.add(Number(tag.slice(4)));
        });
      }
      const lessonDay = Array.from({ length: calcDay }, (_, i) => i + 1).find((day) => !completedDays.has(day)) || calcDay;
      const dayTag = `day-${lessonDay}`;
      // Days 1-30: a hand-written lesson (goal match first) wins over legacy stacks.
      let handwritten = null;
      if (lessonDay <= HANDWRITTEN_MAX_DAY) {
        const { data: hw } = await supabase.from("stacks").select("id, title, stack_type, tags, duration_minutes, metadata, authored_lesson, slides (id, slide_number, title, body, sources)").eq("market_id", market).contains("tags", ["MICRO_LESSON", dayTag, HANDWRITTEN_TAG]).not("published_at", "is", null).order("created_at", { ascending: false }).limit(10);
        const usable = (hw || []).filter((s) => s.slides?.length > 0);
        handwritten = usable.find((s) => (s.tags || []).includes(goalTag)) || usable[0] || null;
      }
      let { data: lessonStacks } = handwritten ? { data: [handwritten] } : await supabase.from("stacks").select("id, title, stack_type, tags, duration_minutes, metadata, authored_lesson, slides (id, slide_number, title, body, sources)").eq("market_id", market).contains("tags", ["MICRO_LESSON", dayTag, goalTag, levelTag]).not("published_at", "is", null).order("created_at", { ascending: false }).limit(5);
      const hasSlides = (stacks) => (stacks || []).filter((s) => s.slides?.length > 0);
      if (!hasSlides(lessonStacks).length) {
        const { data: fb1 } = await supabase.from("stacks").select("id, title, stack_type, tags, duration_minutes, metadata, authored_lesson, slides (id, slide_number, title, body, sources)").eq("market_id", market).contains("tags", ["MICRO_LESSON", dayTag, goalTag]).not("published_at", "is", null).order("created_at", { ascending: false }).limit(5);
        lessonStacks = fb1;
      }
      if (!hasSlides(lessonStacks).length) {
        const { data: fallback } = await supabase.from("stacks").select("id, title, stack_type, tags, duration_minutes, metadata, authored_lesson, slides (id, slide_number, title, body, sources)").eq("market_id", market).contains("tags", ["MICRO_LESSON", dayTag]).not("published_at", "is", null).order("created_at", { ascending: false }).limit(5);
        lessonStacks = fallback;
      }
      if (!hasSlides(lessonStacks).length) {
        const { data: allLessons } = await supabase.from("stacks").select("id, title, stack_type, tags, duration_minutes, metadata, authored_lesson, slides (id, slide_number, title, body, sources)").eq("market_id", market).contains("tags", ["MICRO_LESSON"]).not("published_at", "is", null);
        if (allLessons?.length) {
          const withSlides = hasSlides(allLessons);
          const lessonsWithDays = withSlides.map((stack) => {
            const dayMatch = stack.tags?.find((t) => t.startsWith("day-"));
            const dayNum = dayMatch ? parseInt(dayMatch.replace("day-", ""), 10) : 999;
            return { ...stack, dayNum };
          });
          const validLessons = lessonsWithDays.filter((l) => l.dayNum <= lessonDay);
          const selectedLesson = validLessons.length > 0 ? validLessons.reduce((max, l) => l.dayNum > max.dayNum ? l : max) : lessonsWithDays.length > 0 ? lessonsWithDays.reduce((min, l) => l.dayNum < min.dayNum ? l : min) : null;
          if (selectedLesson) lessonStacks = [selectedLesson];
        }
      }
      const validLesson = (lessonStacks || []).find((s) => s.slides?.length > 0);
      if (validLesson) {
        const stack = validLesson;
        setLessonStack({
          ...stack,
          title: realLessonTitle(stack),
          tags: stack.tags || [],
          slides: (stack.slides || []).sort((a, b) => a.slide_number - b.slide_number).map((s) => ({ ...s, sources: normalizeSources(s.sources) }))
        });
      }
      const { data: newsStacks } = await supabase.from("stacks").select("id, title, stack_type, tags, duration_minutes, metadata, authored_lesson, slides (id, slide_number, title, body, sources)").eq("market_id", market).contains("tags", ["DAILY_GAME"]).not("published_at", "is", null).order("created_at", { ascending: true }).limit(1);
      if (newsStacks?.[0]) {
        const stack = newsStacks[0];
        setNewsStack({
          ...stack,
          tags: stack.tags || [],
          slides: (stack.slides || []).sort((a, b) => a.slide_number - b.slide_number).map((s) => ({ ...s, sources: normalizeSources(s.sources) }))
        });
      }
      const { data: cachedNews } = await supabase.from("news_items").select("id, title, summary, source_name, source_url, published_at, category_tag, image_url").eq("market_id", market).order("published_at", { ascending: false }).limit(10);
      if (cachedNews && cachedNews.length > 0) {
        setNewsItems(cachedNews);
      } else {
        try {
          const { data: liveData } = await supabase.functions.invoke("fetch-market-news", {
            body: { marketId: market }
          });
          if (liveData?.data && liveData.data.length > 0) {
            const { data: freshNews } = await supabase.from("news_items").select("id, title, summary, source_name, source_url, published_at, category_tag, image_url").eq("market_id", market).order("published_at", { ascending: false }).limit(10);
            if (freshNews) setNewsItems(freshNews);
          }
        } catch (e) {
          log.warn("Live news fetch failed:", e);
        }
      }
      const riskHours = getStreakRiskHours(
        progress2?.streak_expires_at || null,
        progress2?.current_streak || 0,
        lessonCompletedToday2
      );
      setStreakRiskHours(riskHours);
      scheduleStreakNotifications(
        progress2?.current_streak || 0,
        lessonCompletedToday2
      );
      if (xpData2?.total_xp && market) {
        try {
          const { data: rivals } = await supabase.from("user_xp").select("total_xp, user_id, profiles!inner(username)").eq("market_id", market).gt("total_xp", xpData2.total_xp).order("total_xp", { ascending: true }).limit(1);
          if (rivals?.[0]) {
            const rival = rivals[0];
            setSocialNudge({ name: rival.profiles?.username || "Someone", xp: rival.total_xp });
          }
        } catch (e) {
        }
      }
      const tomorrowDay = calcDay + 1;
      if (tomorrowDay <= 180) {
        try {
          const { data: tomorrowStacks } = await supabase.from("stacks").select("title").eq("market_id", market).contains("tags", ["MICRO_LESSON", `day-${tomorrowDay}`]).not("published_at", "is", null).limit(1);
          if (tomorrowStacks?.[0]) {
            setTomorrowLesson({ title: tomorrowStacks[0].title, dayNumber: tomorrowDay });
          }
        } catch (e) {
        }
      }
      setLoading(false);
      return null;
    } catch (error) {
      log.warn("[HomeData] Failed to load home data:", error);
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
    if (!selectedMarket || newsRefreshing) return;
    setNewsRefreshing(true);
    try {
      await supabase.functions.invoke("fetch-market-news", {
        body: { marketId: selectedMarket }
      });
      const { data: freshNews } = await supabase.from("news_items").select("id, title, summary, source_name, source_url, published_at, category_tag").eq("market_id", selectedMarket).order("published_at", { ascending: false }).limit(10);
      if (freshNews) setNewsItems(freshNews);
    } catch (e) {
      log.warn("News refresh failed:", e);
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
    learningGoal,
    fetchData,
    onRefresh,
    refreshNews
  };
}
export {
  useHomeData
};
