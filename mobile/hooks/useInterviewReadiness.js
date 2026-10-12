import { trackEvent } from "../lib/analytics";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { deliverableFor } from "../lib/deliverables";
import { computeReadiness, loadInterviewTarget, saveInterviewTarget } from "../lib/interviewPrep";
import { log } from "../lib/logger";
const EMPTY = { briefWritten: 0, briefTotal: 6, mocksDone: 0, lastMockScore: null, lessonsCovered: 0, currentEventsAnswered: 0 };
function useInterviewReadiness(marketId) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [inputs, setInputs] = useState(EMPTY);
  const [concepts, setConcepts] = useState([]);
  const [news, setNews] = useState([]);
  const refresh = useCallback(async () => {
    if (!user || !marketId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const template = deliverableFor("career");
      const [stored, brief, attempts, progress, newsRes] = await Promise.all([
        loadInterviewTarget(user.id, marketId),
        supabase.from("deliverable_entries").select("section_key").eq("user_id", user.id).eq("market_id", marketId).eq("goal_key", template.goal).eq("source", "learner"),
        supabase.from("interview_lab_attempts").select("attempt_type, score, created_at").eq("user_id", user.id).eq("market_id", marketId).order("created_at", { ascending: false }).limit(200),
        supabase.from("user_progress").select("completed_stacks").eq("user_id", user.id).eq("market_id", marketId).maybeSingle(),
        supabase.from("news_items").select("title").eq("market_id", marketId).order("published_at", { ascending: false }).limit(14)
      ]);
      setTarget(stored);
      const sections = new Set((brief.data || []).map((r) => r.section_key));
      const rows = attempts.data || [];
      const mocks = rows.filter((r) => r.attempt_type === "mock");
      const completed = progress.data?.completed_stacks || [];
      setInputs({
        briefWritten: sections.size,
        briefTotal: template.sections.length,
        mocksDone: mocks.length,
        lastMockScore: mocks[0]?.score ?? null,
        lessonsCovered: completed.length,
        currentEventsAnswered: rows.filter((r) => r.attempt_type === "current_events").length
      });
      setNews((newsRes.data || []).map((n) => n.title).filter(Boolean));
      if (completed.length) {
        const { data } = await supabase.from("stacks").select("title").in("id", completed.slice(-14));
        setConcepts((data || []).map((s) => s.title.replace(/^day\s*\d+\s*[:·—-]\s*/i, "").trim()).filter(Boolean));
      } else setConcepts([]);
    } catch (error) {
      log.warn("[InterviewReadiness] load failed:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, marketId]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const saveTarget = useCallback(async (t) => {
    if (!user || !marketId) return;
    await saveInterviewTarget(user.id, marketId, t);
    trackEvent("interview_target_saved", { hasTarget: !!t, hasDate: !!t?.date, role: t?.role ?? null });
    setTarget(t);
  }, [user?.id, marketId]);
  const markCurrentEvent = useCallback(async (headline) => {
    if (!user || !marketId) return;
    const { error } = await supabase.from("interview_lab_attempts").insert({
      user_id: user.id,
      market_id: marketId,
      path: "consulting",
      stage: 0,
      attempt_type: "current_events",
      scenario_question: headline
    });
    if (error) log.warn("[InterviewReadiness] current event save failed:", error);
    setInputs((prev) => ({ ...prev, currentEventsAnswered: prev.currentEventsAnswered + 1 }));
  }, [user?.id, marketId]);
  const { percent, parts } = computeReadiness(inputs);
  return { loading, target, inputs, percent, parts, concepts, news, saveTarget, markCurrentEvent, refresh };
}
export {
  useInterviewReadiness
};
