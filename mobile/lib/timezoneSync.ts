import { supabase } from './supabase';

/** The device's IANA timezone, or null when unavailable. */
export function deviceTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/**
 * Keep profiles.timezone in step with the device, so friends' "Done today"
 * and once-a-day nudges follow this learner's local day. Writes only on change.
 */
export async function syncTimezone(userId: string): Promise<void> {
  const tz = deviceTimezone();
  if (!tz) return;
  const { data } = await supabase.from('profiles').select('timezone').eq('id', userId).maybeSingle();
  if (data && data.timezone === tz) return;
  await supabase.from('profiles').update({ timezone: tz }).eq('id', userId);
}
