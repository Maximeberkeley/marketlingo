import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { triggerHaptic } from '../lib/haptics';
import { log } from '../lib/logger';

/**
 * Hook to save Interview Lab content to the Notebook (notes table).
 * Uses linked_label prefix 'interview-' to distinguish source.
 */
export function useInterviewNotebook(marketId: string) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const saveToNotebook = useCallback(async (
    content: string,
    label: string, // e.g. 'interview-framework', 'interview-glossary', 'interview-feedback'
  ) => {
    if (!user || !content.trim()) return false;
    setSaving(true);
    triggerHaptic('medium');
    try {
      const { error } = await supabase.from('notes').insert({
        user_id: user.id,
        content: content.trim(),
        linked_label: label,
        market_id: marketId,
      });
      if (error) throw error;
      triggerHaptic('success');
      Alert.alert('Saved! 📝', 'Added to your Notebook.');
      return true;
    } catch (err) {
      log.warn('Save to notebook error:', err);
      Alert.alert('Error', 'Could not save. Try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, marketId]);

  return { saveToNotebook, saving };
}
