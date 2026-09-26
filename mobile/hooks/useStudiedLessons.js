import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import { log } from "../lib/logger";
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
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const focusSignature = focusKeywords.join("|");
  const load = useCallback(async () => {
    if (!marketId) {
      setLessons([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        const { data: progress } = await supabase.from("user_progress").select("completed_stacks").eq("user_id", auth.user.id).eq("market_id", marketId).maybeSingle();
        const completedIds = Array.isArray(progress?.completed_stacks) ? progress.completed_stacks.filter((id) => typeof id === "string") : [];
        const { data: daily, error: dailyError } = await supabase.from("daily_completions").select("completed_stack_id").eq("user_id", auth.user.id).eq("market_id", marketId).eq("lesson_completed", true).order("completion_date", { ascending: false }).limit(40);
        if (dailyError) log.warn("[useStudiedLessons] Daily credits unavailable:", dailyError.message);
        const creditedIds = [.../* @__PURE__ */ new Set([
          ...completedIds.slice(-40),
          ...(daily ?? []).map((row) => row.completed_stack_id).filter((id) => typeof id === "string")
        ])];
        if (creditedIds.length === 0) {
          setLessons([]);
          return;
        }
        const { data, error } = await supabase.from("stacks").select("id, title, tags, created_at, slides (slide_number, title, body)").eq("market_id", marketId).in("id", creditedIds).order("created_at", { ascending: false });
        if (error) {
          log.warn("[useStudiedLessons] Could not load studied lessons:", error.message);
          setLessons([]);
          return;
        }
        const byDay = /* @__PURE__ */ new Map();
        for (const row of data ?? []) {
          const day = dayFromTags(row.tags);
          if (day === null) continue;
          if (byDay.has(day)) continue;
          const slides = [...row.slides ?? []].sort((a, b) => a.slide_number - b.slide_number).map((s) => ({ slideNumber: s.slide_number, title: s.title, body: s.body }));
          if (!slides.length) continue;
          byDay.set(day, { stackId: row.id, title: row.title, day, slides });
        }
        const byRecency = [...byDay.values()].sort((a, b) => (b.day ?? 0) - (a.day ?? 0));
        if (preferredDay) {
          const selected = byRecency.filter((lesson) => lesson.day === preferredDay);
          setLessons(selected.length ? selected : byRecency);
          return;
        }
        const keywords = focusSignature ? focusSignature.split("|").filter(Boolean) : [];
        if (keywords.length) {
          const preferred = byRecency.filter((l) => matchesFocus(l, keywords));
          const rest = byRecency.filter((l) => !preferred.includes(l));
          setLessons([...preferred, ...rest]);
        } else {
          setLessons(byRecency);
        }
        return;
      }
      setLessons([]);
    } catch (err) {
      log.warn("[useStudiedLessons] Lookup failed:", err);
      setLessons([]);
    } finally {
      setIsLoading(false);
    }
  }, [marketId, focusSignature, preferredDay]);
  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));
  return { lessons, isLoading, reload: load };
}
export {
  useStudiedLessons
};
