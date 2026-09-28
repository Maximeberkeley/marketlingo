import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useAuth } from "../hooks/useAuth";
function PushTokenSync() {
  const { user } = useAuth();
  const lastSyncedFor = useRef(null);
  useEffect(() => {
    if (!user) {
      lastSyncedFor.current = null;
      return;
    }
    const run = async () => {
      try {
        const [{ syncPushToken }, { scheduleDailyFallbackReminders }] = await Promise.all([
          import("../lib/pushToken"),
          import("../lib/leoNudges")
        ]);
        await syncPushToken(user.id);
        await scheduleDailyFallbackReminders();
        lastSyncedFor.current = user.id;
      } catch {
      }
    };
    const timer = setTimeout(() => void run(), 2500);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") run();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [user]);
  return null;
}
export {
  PushTokenSync
};
