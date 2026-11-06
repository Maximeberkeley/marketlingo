import { supabase } from "./supabase";
function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}
async function syncTimezone(userId) {
  const tz = deviceTimezone();
  if (!tz) return;
  const { data } = await supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle();
  if (data && data.timezone === tz) return;
  await supabase.from("profiles").update({ timezone: tz }).eq("id", userId);
}
export {
  deviceTimezone,
  syncTimezone
};
