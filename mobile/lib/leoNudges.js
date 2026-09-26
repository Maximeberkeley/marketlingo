import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { localDateString } from "./dayMath";
import { normalizeDisplayName } from "./displayName";
import { log } from "./logger";
import { storage } from "./storage";
const NUDGE_STATE_KEY = "ml_leo_nudge_state";
const LEGACY_STREAK_KEY = "ml_streak_notif_ids";
const SCRIPTS = {
  midday: [
    { title: "Your briefing is ready", body: "{name}, take one focused lesson now and keep today\u2019s idea in motion." },
    { title: "Build today\u2019s fluency", body: "A short lesson now gives you one more industry mechanism you can explain." }
  ],
  afternoon: [
    { title: "One useful idea today", body: "{name}, your next course lesson is ready when you have a few focused minutes." },
    { title: "Continue the thread", body: "Pick up where you left off and turn today\u2019s concept into something you can use." }
  ],
  evening: [
    { title: "Protect your learning streak", body: "{name}, complete today\u2019s lesson before your local day ends." },
    { title: "Close the loop", body: "Finish today\u2019s briefing and keep your insider streak intact." }
  ],
  urgent: [
    { title: "Your local day ends soon", body: "{name}, one completed lesson will protect your streak before midnight." },
    { title: "Last briefing window", body: "Complete today\u2019s lesson now to carry your progress into tomorrow." }
  ],
  idle: [
    { title: "Ready when you are", body: "{name}, today\u2019s lesson is the clearest next step on your course map." }
  ]
};
function personalized(text, displayName) {
  return text.replace(/\{name\}/g, normalizeDisplayName(displayName));
}
function pick(window, date = /* @__PURE__ */ new Date()) {
  const choices = SCRIPTS[window];
  const index = (date.getDate() + date.getHours()) % choices.length;
  return choices[index];
}
function getLeoNudge(window, displayName) {
  const script = pick(window);
  return {
    title: script.title,
    body: personalized(script.body, displayName)
  };
}
function currentLeoNudgeWindow(date = /* @__PURE__ */ new Date()) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes >= 12 * 60 && minutes <= 14 * 60) return "midday";
  if (minutes >= 17 * 60 && minutes <= 18 * 60 + 30) return "afternoon";
  if (minutes >= 20 * 60 && minutes < 22 * 60) return "evening";
  if (minutes >= 22 * 60 && minutes <= 22 * 60 + 30) return "urgent";
  return null;
}
async function readState() {
  const today = localDateString();
  try {
    const parsed = JSON.parse(await AsyncStorage.getItem(NUDGE_STATE_KEY) || "{}");
    if (parsed.date === today) {
      return { date: today, scheduledIds: parsed.scheduledIds || [], shown: parsed.shown || [] };
    }
  } catch (error) {
    log.warn("[LeoNudges] Could not read state:", error);
  }
  return { date: today, scheduledIds: [], shown: [] };
}
async function writeState(state) {
  await AsyncStorage.setItem(NUDGE_STATE_KEY, JSON.stringify(state));
}
async function claimLeoNudge(key) {
  const state = await readState();
  if (state.shown.includes(key)) return false;
  state.shown.push(key);
  await writeState(state);
  return true;
}
async function cancelRollingLeoNudges() {
  try {
    const state = await readState();
    await Promise.all(state.scheduledIds.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {
    })));
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(scheduled.filter((item) => item.content.data?.type === "leo_rolling_nudge" || item.content.data?.type === "streak_warning").map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier).catch(() => {
    })));
    await AsyncStorage.removeItem(LEGACY_STREAK_KEY);
    await writeState({ ...state, scheduledIds: [] });
  } catch (error) {
    log.warn("[LeoNudges] Could not cancel reminders:", error);
  }
}
async function scheduleRollingLeoNudges(lessonCompletedToday) {
  await cancelRollingLeoNudges();
  if (lessonCompletedToday) return;
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== "granted") return;
    const displayName = normalizeDisplayName(await storage.getDisplayName());
    const now = /* @__PURE__ */ new Date();
    const windows = [
      { key: "midday", hour: 12, minute: 35 },
      { key: "afternoon", hour: 17, minute: 25 },
      { key: "evening", hour: 20, minute: 20 },
      { key: "urgent", hour: 22, minute: 10 }
    ];
    const ids = [];
    for (const window of windows) {
      const fireAt = new Date(now);
      fireAt.setHours(window.hour, window.minute, 0, 0);
      if (fireAt <= now) continue;
      const script = getLeoNudge(window.key, displayName);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: script.title,
          body: script.body,
          sound: true,
          data: { type: "leo_rolling_nudge", route: "/(tabs)/home", localDate: localDateString(now) }
        },
        trigger: fireAt
      });
      ids.push(id);
    }
    const state = await readState();
    await writeState({ ...state, scheduledIds: ids });
  } catch (error) {
    log.warn("[LeoNudges] Could not schedule reminders:", error);
  }
}
const DAILY_FALLBACKS = [
  {
    key: "morning",
    hour: 9,
    minute: 0,
    title: "Your daily briefing is ready",
    body: "{name}, one focused lesson and today\u2019s market idea is yours."
  },
  {
    key: "evening",
    hour: 20,
    minute: 30,
    title: "Keep your streak alive",
    body: "{name}, today\u2019s lesson takes about five minutes. Then the day is closed."
  }
];
async function scheduleDailyFallbackReminders() {
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== "granted") return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(scheduled.filter((item) => item.content.data?.type === "daily_fallback").map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier).catch(() => {
    })));
    const displayName = normalizeDisplayName(await storage.getDisplayName());
    for (const slot of DAILY_FALLBACKS) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: slot.title,
          body: personalized(slot.body, displayName),
          sound: true,
          data: { type: "daily_fallback", route: "/(tabs)/home", slot: slot.key }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: slot.hour,
          minute: slot.minute
        }
      });
    }
  } catch (error) {
    log.warn("[LeoNudges] Could not schedule daily fallbacks:", error);
  }
}
async function cancelDailyFallbackReminders() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(scheduled.filter((item) => item.content.data?.type === "daily_fallback").map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier).catch(() => {
    })));
  } catch (error) {
    log.warn("[LeoNudges] Could not cancel daily fallbacks:", error);
  }
}
export {
  cancelDailyFallbackReminders,
  cancelRollingLeoNudges,
  claimLeoNudge,
  currentLeoNudgeWindow,
  getLeoNudge,
  scheduleDailyFallbackReminders,
  scheduleRollingLeoNudges
};
