/**
 * Nudge messages. The learner picks one; the server sends it as the push body
 * from a fixed list (supabase/functions/send-nudge keeps the same ids and text),
 * so nobody can push arbitrary text to a friend.
 */

export const NUDGE_MESSAGES = {
  leo_pacing: 'Leo is pacing by the door. Five minutes and he calms down.',
  friendly_warning: "This is a friendly reminder. Leo's next one won't be.",
  coffee: 'One lesson takes less time than your coffee order. Go.',
  market_moved: 'The market moved today. Did you?',
  future_you: 'Future you, mid-interview, says thanks in advance.',
  streak_shivering: 'Our flame is shivering. Do your lesson before it goes out.',
  streak_my_part: 'I did my part of our streak. Your turn, partner.',
  race_ahead: "I'm ahead in our race. Just thought you should know.",
  race_behind: "You're ahead in our race. Enjoy it while it lasts.",
  race_tied: 'Our race is tied. One lesson breaks it.',
} as const;

export type NudgeId = keyof typeof NUDGE_MESSAGES;

/** What we know about you and this friend when nudging. */
export interface NudgeContext {
  /** Length of an active friend streak with them, if any. */
  streakLength?: number | null;
  /** You already did today's lesson (matters for the shared streak line). */
  meDoneToday?: boolean;
  /** Your XP minus theirs in an active race, if any. */
  raceLead?: number | null;
}

const GENERAL: NudgeId[] = ['leo_pacing', 'friendly_warning', 'coffee', 'market_moved', 'future_you'];

/** Up to four messages, the ones about your shared streak or race first. */
export function nudgeOptions(ctx: NudgeContext = {}): NudgeId[] {
  const picks: NudgeId[] = [];
  if (ctx.streakLength != null) picks.push(ctx.meDoneToday ? 'streak_my_part' : 'streak_shivering');
  if (ctx.raceLead != null) picks.push(ctx.raceLead > 0 ? 'race_ahead' : ctx.raceLead < 0 ? 'race_behind' : 'race_tied');
  for (const id of GENERAL) {
    if (picks.length >= 4) break;
    picks.push(id);
  }
  return picks;
}

export type NudgeResult = 'sent' | 'saved' | 'already' | 'error' | 'offline';
