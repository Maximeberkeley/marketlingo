/**
 * The learner's living document: their own lines, per goal, per market.
 *
 * Completion is the share of sections that hold at least one line. Every write
 * is stamped with the LOCAL day the learner is on, never a UTC timestamp.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { deliverableFor } from '../lib/deliverables';
export function useDeliverable(marketId, goal) {
    const template = useMemo(() => deliverableFor(goal), [goal]);
    const [entries, setEntries] = useState([]);
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
                .select('id, section_key, content, day_number, created_at')
                .eq('user_id', auth.user.id)
                .eq('market_id', marketId)
                .eq('goal_key', template.goal)
                .order('created_at', { ascending: false });
            if (error) {
                log.warn('[useDeliverable] Could not load entries:', error.message);
                return;
            }
            setEntries((data ?? []).map(row => ({
                id: row.id,
                sectionKey: row.section_key,
                content: row.content,
                dayNumber: row.day_number ?? null,
                createdAt: row.created_at,
            })));
        }
        catch (err) {
            log.warn('[useDeliverable] Lookup failed:', err);
        }
        finally {
            setLoading(false);
        }
    }, [marketId, template.goal]);
    useEffect(() => {
        load();
    }, [load]);
    const addLine = useCallback(async (sectionKey, content, dayNumber, source = 'learner') => {
        const text = content.trim();
        if (!marketId || text.length < 3)
            return false;
        try {
            const { data: auth } = await supabase.auth.getUser();
            if (!auth?.user)
                return false;
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
        }
        catch (err) {
            log.warn('[useDeliverable] Save failed:', err);
            return false;
        }
    }, [marketId, template.goal, load]);
    const removeLine = useCallback(async (id) => {
        try {
            const { error } = await supabase.from('deliverable_entries').delete().eq('id', id);
            if (error) {
                log.warn('[useDeliverable] Could not remove line:', error.message);
                return false;
            }
            setEntries(prev => prev.filter(e => e.id !== id));
            return true;
        }
        catch (err) {
            log.warn('[useDeliverable] Remove failed:', err);
            return false;
        }
    }, []);
    const bySection = useMemo(() => {
        const map = {};
        for (const entry of entries) {
            (map[entry.sectionKey] ||= []).push(entry);
        }
        return map;
    }, [entries]);
    const filledSections = template.sections.filter(s => (bySection[s.key]?.length ?? 0) > 0).length;
    const completion = Math.round((filledSections / template.sections.length) * 100);
    /** Plain-text export the learner can share or paste anywhere. */
    const exportText = useCallback((marketName) => {
        const lines = [`${template.title} — ${marketName}`, template.subtitle, ''];
        for (const section of template.sections) {
            lines.push(section.title.toUpperCase());
            const own = bySection[section.key] ?? [];
            if (!own.length)
                lines.push('  (not written yet)');
            own.forEach(e => lines.push(`  • ${e.content}${e.dayNumber ? ` (day ${e.dayNumber})` : ''}`));
            lines.push('');
        }
        lines.push(`${completion}% complete — written in my own words with MarketLingo.`);
        return lines.join('\n');
    }, [template, bySection, completion]);
    return {
        template,
        entries,
        bySection,
        completion,
        filledSections,
        loading,
        addLine,
        removeLine,
        reload: load,
        exportText,
    };
}
