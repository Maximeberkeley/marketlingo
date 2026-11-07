import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import { log } from "../lib/logger";
import { studiedMaterial } from "../lesson-kit/practice/studiedMaterial";
const dayFromTags = (tags) => {
  const hit = (tags || []).find((t) => /^day-\d+$/.test(t));
  return hit ? Number(hit.slice(4)) : null;
};
const matchesFocus = (lesson, keywords) => {
  if (!keywords.length) return false;
  const haystack = `${lesson.title} ${lesson.slides.map((s) => `${s.title} ${s.body}`).join(" ")}`.toLowerCase();
  return keywords.some((word) => haystack.includes(word));
};
function useStudiedLessons(marketId, focusKeywords = [], preferredDay) {
  const [studied, setStudied] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedMarketId, setLoadedMarketId] = useState(void 0);
  const focusSignature = focusKeywords.join("|");
  const load = useCallback(async () => {
    if (!marketId) {
      setStudied([]);
      setIsLoading(false);
      setLoadedMarketId(marketId);
      return;
    }
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setStudied([]);
        return;
      }
      const [{ data: progress }, { data: daily, error: dailyError }] = await Promise.all([
        supabase.from("user_progress").select("completed_stacks").eq("user_id", userId).eq("market_id", marketId).maybeSingle(),
        supabase.from("daily_completions").select("completed_stack_id").eq("user_id", userId).eq("market_id", marketId).eq("lesson_completed", true).order("completion_date", { ascending: false }).limit(40)
      ]);
      const completedIds = Array.isArray(progress?.completed_stacks) ? progress.completed_stacks.filter((id) => typeof id === "string") : [];
      if (dailyError) log.warn("[useStudiedLessons] Daily credits unavailable:", dailyError.message);
      const creditedIds = [.../* @__PURE__ */ new Set([
        ...completedIds.slice(-40),
        ...(daily ?? []).map((row) => row.completed_stack_id).filter((id) => typeof id === "string")
      ])];
      if (creditedIds.length === 0) {
        setStudied([]);
        return;
      }
      const { data, error } = await supabase.from("stacks").select("id, title, tags, created_at, authored_lesson, slides (slide_number, title, body)").eq("market_id", marketId).in("id", creditedIds).order("created_at", { ascending: false });
      if (error) {
        log.warn("[useStudiedLessons] Could not load studied lessons:", error.message);
        setStudied([]);
        return;
      }
      const byDay = /* @__PURE__ */ new Map();
      for (const row of data ?? []) {
        const day = dayFromTags(row.tags);
        if (day === null) continue;
        if (byDay.has(day)) continue;
        const slides = [...row.slides ?? []].sort((a, b) => a.slide_number - b.slide_number).map((s) => ({ slideNumber: s.slide_number, title: s.title, body: s.body }));
        const material = studiedMaterial(row.authored_lesson);
        if (!slides.length && !material.questions.length) continue;
        byDay.set(day, { stackId: row.id, title: row.title, day, slides, ...material });
      }
      setStudied([...byDay.values()].sort((a, b) => (b.day ?? 0) - (a.day ?? 0)));
    } catch (err) {
      log.warn("[useStudiedLessons] Lookup failed:", err);
      setStudied([]);
    } finally {
      setIsLoading(false);
      setLoadedMarketId(marketId);
    }
  }, [marketId]);
  const lessons = useMemo(() => orderStudiedLessons(studied, preferredDay, focusSignature), [studied, preferredDay, focusSignature]);
  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));
  return { lessons, isLoading: isLoading || loadedMarketId !== marketId, reload: load };
}
function orderStudiedLessons(byRecency, preferredDay, focusSignature) {
  if (preferredDay) {
    const selected = byRecency.filter((lesson) => lesson.day === preferredDay);
    return selected.length ? [...selected, ...byRecency.filter((lesson) => lesson.day !== preferredDay)] : byRecency;
  }
  const keywords = focusSignature ? focusSignature.split("|").filter(Boolean) : [];
  if (!keywords.length) return byRecency;
  const preferred = byRecency.filter((l) => matchesFocus(l, keywords));
  return [...preferred, ...byRecency.filter((l) => !preferred.includes(l))];
}
export {
  orderStudiedLessons,
  useStudiedLessons
};
