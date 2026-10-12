import { trackEvent } from "../lib/analytics";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { log } from "../lib/logger";
import { deliverableFor, sameDossierText } from "../lib/deliverables";
function useDeliverable(marketId, goal) {
  const template = useMemo(() => deliverableFor(goal), [goal]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedKey, setLoadedKey] = useState(null);
  const load = useCallback(async (showLoading = true) => {
    const loadedForKey = marketId ? `${marketId}:${template.goal}` : null;
    if (!marketId) {
      setEntries([]);
      setLoading(false);
      setLoadedKey(null);
      return;
    }
    if (showLoading) setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        setEntries([]);
        return;
      }
      const { data, error } = await supabase.from("deliverable_entries").select("id, section_key, content, day_number, created_at, source").eq("user_id", auth.user.id).eq("market_id", marketId).eq("goal_key", template.goal).order("created_at", { ascending: false });
      if (error) {
        log.warn("[useDeliverable] Could not load entries:", error.message);
        return;
      }
      setEntries(
        (data ?? []).map((row) => ({
          id: row.id,
          sectionKey: row.section_key,
          content: row.content,
          dayNumber: row.day_number ?? null,
          createdAt: row.created_at,
          source: row.source ?? "learner"
        }))
      );
    } catch (err) {
      log.warn("[useDeliverable] Lookup failed:", err);
    } finally {
      setLoading(false);
      setLoadedKey(loadedForKey);
    }
  }, [marketId, template.goal]);
  useEffect(() => {
    load();
  }, [load]);
  const addLine = useCallback(
    async (sectionKey, content, dayNumber, source = "learner") => {
      const text = content.trim();
      if (!marketId || text.length < 3) return false;
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) return false;
        const { error } = await supabase.from("deliverable_entries").insert({
          user_id: auth.user.id,
          market_id: marketId,
          goal_key: template.goal,
          section_key: sectionKey,
          content: text,
          day_number: dayNumber ?? null,
          source
        });
        if (error) {
          log.warn("[useDeliverable] Could not save line:", error.message);
          return false;
        }
        if (source === "learner") trackEvent("dossier_line_saved", { source: "learner", sectionKey, marketId: marketId ?? null });
        await load(false);
        return true;
      } catch (err) {
        log.warn("[useDeliverable] Save failed:", err);
        return false;
      }
    },
    [marketId, template.goal, load]
  );
  const removeLine = useCallback(
    async (id) => {
      try {
        const { error } = await supabase.from("deliverable_entries").delete().eq("id", id);
        if (error) {
          log.warn("[useDeliverable] Could not remove line:", error.message);
          return false;
        }
        setEntries((prev) => prev.filter((e) => e.id !== id));
        return true;
      } catch (err) {
        log.warn("[useDeliverable] Remove failed:", err);
        return false;
      }
    },
    []
  );
  const updateLine = useCallback(async (id, content) => {
    const text = content.trim();
    if (!marketId || text.length < 3) return false;
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return false;
      const { data, error } = await supabase.from("deliverable_entries").update({ content: text }).eq("id", id).eq("user_id", auth.user.id).eq("market_id", marketId).eq("goal_key", template.goal).eq("source", "learner").select("id");
      if (error || !data?.length) return false;
      setEntries((prev) => prev.map((entry) => entry.id === id ? { ...entry, content: text } : entry));
      return true;
    } catch (error) {
      log.warn("[useDeliverable] Edit failed:", error);
      return false;
    }
  }, [marketId, template.goal]);
  const replaceSuggestion = useCallback(
    async (id, sectionKey, content, dayNumber) => {
      const suggestion = entries.find((entry) => entry.id === id && entry.source !== "learner" && entry.sectionKey === sectionKey);
      if (!suggestion || sameDossierText(content, suggestion.content)) return false;
      const ok = await addLine(sectionKey, content, dayNumber, "learner");
      if (ok) await removeLine(id);
      return ok;
    },
    [addLine, removeLine, entries]
  );
  const learnerEntries = useMemo(() => entries.filter((e) => e.source === "learner"), [entries]);
  const bySection = useMemo(() => {
    const map = {};
    for (const entry of learnerEntries) {
      (map[entry.sectionKey] ||= []).push(entry);
    }
    return map;
  }, [learnerEntries]);
  const suggestionsBySection = useMemo(() => {
    const map = {};
    for (const entry of entries) {
      if (entry.source === "learner") continue;
      (map[entry.sectionKey] ||= []).push(entry);
    }
    return map;
  }, [entries]);
  const firstOpenSection = template.sections.find((s) => !bySection[s.key]?.length) ?? null;
  const filledSections = template.sections.filter((s) => (bySection[s.key]?.length ?? 0) > 0).length;
  const completion = Math.round(filledSections / template.sections.length * 100);
  const exportText = useCallback(
    (marketName) => {
      const lines = [`${template.title} \u2014 ${marketName}`, template.subtitle, ""];
      for (const section of template.sections) {
        lines.push(section.title.toUpperCase());
        const own = bySection[section.key] ?? [];
        if (!own.length) lines.push("  (not written yet)");
        own.forEach((e) => lines.push(`  \u2022 ${e.content}${e.dayNumber ? ` (day ${e.dayNumber})` : ""}`));
        lines.push("");
      }
      lines.push(`${filledSections} of ${template.sections.length} sections written with MarketLingo.`);
      return lines.join("\n");
    },
    [template, bySection, filledSections]
  );
  return {
    template,
    entries,
    learnerEntries,
    bySection,
    suggestionsBySection,
    firstOpenSection,
    replaceSuggestion,
    completion,
    filledSections,
    loading: loading || loadedKey !== (marketId ? `${marketId}:${template.goal}` : null),
    addLine,
    updateLine,
    removeLine,
    reload: load,
    exportText
  };
}
export {
  useDeliverable
};
