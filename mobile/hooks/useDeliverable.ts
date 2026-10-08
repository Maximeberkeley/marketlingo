/**
 * The learner's living document: their own lines, per goal, per market.
 *
 * Completion is the share of sections holding at least one line the learner
 * wrote. Older auto-filled lines (source 'lesson') are shown only as suggestions. Every write
 * is stamped with the LOCAL day the learner is on, never a UTC timestamp.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { DeliverableTemplate, deliverableFor, sameDossierText } from '../lib/deliverables';

export interface DeliverableEntry {
  id: string;
  sectionKey: string;
  content: string;
  dayNumber: number | null;
  createdAt: string;
  /** 'learner' when written by the learner; 'lesson' for old automatic suggestions. */
  source: string;
}

export function useDeliverable(marketId?: string, goal?: string | null) {
  const template: DeliverableTemplate = useMemo(() => deliverableFor(goal), [goal]);
  const [entries, setEntries] = useState<DeliverableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!marketId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        setEntries([]);
        return;
      }
      const { data, error } = await supabase
        .from('deliverable_entries')
        .select('id, section_key, content, day_number, created_at, source')
        .eq('user_id', auth.user.id)
        .eq('market_id', marketId)
        .eq('goal_key', template.goal)
        .order('created_at', { ascending: false });

      if (error) {
        log.warn('[useDeliverable] Could not load entries:', error.message);
        return;
      }
      setEntries(
        (data ?? []).map(row => ({
          id: row.id as string,
          sectionKey: row.section_key as string,
          content: row.content as string,
          dayNumber: (row.day_number as number | null) ?? null,
          createdAt: row.created_at as string,
          source: ((row as { source?: string | null }).source ?? 'learner') as string,
        })),
      );
    } catch (err) {
      log.warn('[useDeliverable] Lookup failed:', err);
    } finally {
      setLoading(false);
    }
  }, [marketId, template.goal]);

  useEffect(() => {
    load();
  }, [load]);

  const addLine = useCallback(
    async (sectionKey: string, content: string, dayNumber?: number, source = 'learner') => {
      const text = content.trim();
      if (!marketId || text.length < 3) return false;
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) return false;
        const { error } = await supabase.from('deliverable_entries').insert({
          user_id: auth.user.id,
          market_id: marketId,
          goal_key: template.goal,
          section_key: sectionKey,
          content: text,
          day_number: dayNumber ?? null,
          source,
        });
        if (error) {
          log.warn('[useDeliverable] Could not save line:', error.message);
          return false;
        }
        await load();
        return true;
      } catch (err) {
        log.warn('[useDeliverable] Save failed:', err);
        return false;
      }
    },
    [marketId, template.goal, load],
  );

  const removeLine = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from('deliverable_entries').delete().eq('id', id);
        if (error) {
          log.warn('[useDeliverable] Could not remove line:', error.message);
          return false;
        }
        setEntries(prev => prev.filter(e => e.id !== id));
        return true;
      } catch (err) {
        log.warn('[useDeliverable] Remove failed:', err);
        return false;
      }
    },
    [],
  );

  /** Rewrites an old suggestion: saves the learner's version, then drops the suggestion. */
  const replaceSuggestion = useCallback(
    async (id: string, sectionKey: string, content: string, dayNumber?: number) => {
      const suggestion = entries.find(entry => entry.id === id && entry.source !== 'learner' && entry.sectionKey === sectionKey);
      if (!suggestion || sameDossierText(content, suggestion.content)) return false;
      const ok = await addLine(sectionKey, content, dayNumber, 'learner');
      if (ok) await removeLine(id);
      return ok;
    },
    [addLine, removeLine, entries],
  );

  /** Only the learner's own lines count toward the document. */
  const learnerEntries = useMemo(() => entries.filter(e => e.source === 'learner'), [entries]);
  const bySection = useMemo(() => {
    const map: Record<string, DeliverableEntry[]> = {};
    for (const entry of learnerEntries) {
      (map[entry.sectionKey] ||= []).push(entry);
    }
    return map;
  }, [learnerEntries]);
  const suggestionsBySection = useMemo(() => {
    const map: Record<string, DeliverableEntry[]> = {};
    for (const entry of entries) {
      if (entry.source === 'learner') continue;
      (map[entry.sectionKey] ||= []).push(entry);
    }
    return map;
  }, [entries]);
  /** First section with no learner-written line. */
  const firstOpenSection = template.sections.find(s => !(bySection[s.key]?.length)) ?? null;

  const filledSections = template.sections.filter(s => (bySection[s.key]?.length ?? 0) > 0).length;
  const completion = Math.round((filledSections / template.sections.length) * 100);

  /** Plain-text export the learner can share or paste anywhere. */
  const exportText = useCallback(
    (marketName: string) => {
      const lines = [`${template.title} — ${marketName}`, template.subtitle, ''];
      for (const section of template.sections) {
        lines.push(section.title.toUpperCase());
        const own = bySection[section.key] ?? [];
        if (!own.length) lines.push('  (not written yet)');
        own.forEach(e => lines.push(`  • ${e.content}${e.dayNumber ? ` (day ${e.dayNumber})` : ''}`));
        lines.push('');
      }
      lines.push(`${filledSections} of ${template.sections.length} sections written with MarketLingo.`);
      return lines.join('\n');
    },
    [template, bySection, filledSections],
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
    loading,
    addLine,
    removeLine,
    reload: load,
    exportText,
  };
}
