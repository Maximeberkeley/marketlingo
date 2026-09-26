import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { syncPushToken } from "../lib/pushToken";
import { scheduleDailyFallbackReminders } from "../lib/leoNudges";
function PushTokenSync() {
  const { user } = useAuth();
  const lastSyncedFor = useRef(null);
  useEffect(() => {
    if (!user) {
      lastSyncedFor.current = null;
      return;
    }
    const run = async () => {
      await syncPushToken(user.id);
      await scheduleDailyFallbackReminders();
      lastSyncedFor.current = user.id;
    };
    run();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") run();
    });
    return () => sub.remove();
  }, [user]);
  return null;
}
export {
  PushTokenSync
};
