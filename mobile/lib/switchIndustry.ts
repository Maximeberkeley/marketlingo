/**
 * Switching industry, shared by Home and Profile so both warn and reset the
 * same way: the course and streak in the industry being left go back to
 * day 1, then the learner picks a new industry in onboarding.
 */
import { supabase } from './supabase';

export interface SwitchIndustryCopy {
  title: string;
  body: string;
  confirm: string;
}

export function switchIndustryCopy(marketName: string): SwitchIndustryCopy {
  return {
    title: 'Switch industry?',
    body: `Switching resets your ${marketName} course and streak. This can't be undone.`,
    confirm: 'Switch industry',
  };
}

/** Resets the industry being left. Returns false when the reset did not save. */
export async function resetIndustryForSwitch(userId: string, marketId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_progress')
    .update({ current_streak: 0, current_day: 1, completed_stacks: [] })
    .eq('user_id', userId)
    .eq('market_id', marketId);
  return !error;
}
