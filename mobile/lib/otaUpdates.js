import { Platform } from "react-native";
import { log } from "./logger";
const CHECK_EVERY_MS = 4 * 60 * 60 * 1e3;
let lastCheck = 0;
let running = false;
function checkDue(last, now, every = CHECK_EVERY_MS) {
  return now - last >= every;
}
async function fetchUpdateInBackground(now = Date.now()) {
  if (Platform.OS === "web" || __DEV__ || running || !checkDue(lastCheck, now)) return "skipped";
  running = true;
  lastCheck = now;
  try {
    const Updates = await import("expo-updates");
    if (!Updates.isEnabled) return "skipped";
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return "none";
    await Updates.fetchUpdateAsync();
    return "downloaded";
  } catch (e) {
    log.warn("[Updates] Background check failed:", e);
    return "failed";
  } finally {
    running = false;
  }
}
export {
  CHECK_EVERY_MS,
  checkDue,
  fetchUpdateInBackground
};
