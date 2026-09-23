import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';
import { log } from '../lib/logger';
import { DISPLAY_NAME_FALLBACK, normalizeDisplayName } from '../lib/displayName';

export { DISPLAY_NAME_FALLBACK, normalizeDisplayName } from '../lib/displayName';

export function useDisplayName() {
  const { user } = useAuth();
  const [displayName, setDisplayNameState] = useState(DISPLAY_NAME_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const local = await storage.getDisplayName();
        if (active && local) setDisplayNameState(normalizeDisplayName(local));
        if (!user) return;
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle();
        if (error) throw error;
        const resolved = normalizeDisplayName(data?.display_name || local);
        if (active) setDisplayNameState(resolved);
        if (data?.display_name) await storage.setDisplayName(resolved);
      } catch (error) {
        log.warn('[DisplayName] Falling back to local name:', error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const saveDisplayName = useCallback(async (value: string) => {
    const clean = normalizeDisplayName(value);
    if (clean === DISPLAY_NAME_FALLBACK && !value.trim()) return false;
    await storage.setDisplayName(clean);
    setDisplayNameState(clean);
    if (user) {
      const { error } = await supabase.from('profiles').update({ display_name: clean }).eq('id', user.id);
      if (error) {
        log.warn('[DisplayName] Profile update failed:', error.message);
        return false;
      }
    }
    return true;
  }, [user]);

  return { displayName, loading, saveDisplayName };
}