import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { log } from "../lib/logger";
import { trackEvent } from "../lib/analytics";
import { localDateString } from "../lib/dayMath";
import { parseFriendSocial } from "../lib/friendSocial";
import { markShown, nudgeStorageKey, parseNudgeLog, pickNudge, socialNudges } from "../lib/socialNudges";
const CHECK_DELAY_MS = 3e3;
function useSocialNudges(userId, active, show) {
  useEffect(() => {
    if (!userId || !active) return;
    let live = true;
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc("get_friend_social");
        if (error || !live) return;
        const key = nudgeStorageKey(userId);
        const raw = await AsyncStorage.getItem(key);
        const book = parseNudgeLog(raw ? JSON.parse(raw) : null);
        const next = pickNudge(socialNudges(parseFriendSocial(data), localDateString()), book);
        if (!next || !live) return;
        await AsyncStorage.setItem(key, JSON.stringify(markShown(book, next.key)));
        trackEvent("social_nudge_shown", { kind: next.key.split(":")[0] });
        show(next);
      } catch (e) {
        log.warn("[Nudge] Could not check friend reminders:", e);
      }
    }, CHECK_DELAY_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [userId, active]);
}
export {
  useSocialNudges
};
