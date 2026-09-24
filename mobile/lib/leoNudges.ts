import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { localDateString } from './dayMath';
import { normalizeDisplayName } from './displayName';
import { log } from './logger';
import { storage } from './storage';

const NUDGE_STATE_KEY = 'ml_leo_nudge_state';
const LEGACY_STREAK_KEY = 'ml_streak_notif_ids';

export type LeoNudgeWindow = 'midday' | 'afternoon' | 'evening' | 'urgent' | 'idle';

const SCRIPTS: Record<LeoNudgeWindow, Array<{ title: string; body: string }>> = {
  midday: [
    { title: 'Your briefing is ready', body: '{name}, take one focused lesson now and keep today’s idea in motion.' },
    { title: 'Build today’s fluency', body: 'A short lesson now gives you one more industry mechanism you can explain.' },
  ],
  afternoon: [
    { title: 'One useful idea today', body: '{name}, your next course lesson is ready when you have a few focused minutes.' },
    { title: 'Continue the thread', body: 'Pick up where you left off and turn today’s concept into something you can use.' },
  ],
  evening: [
    { title: 'Protect your learning streak', body: '{name}, complete today’s lesson before your local day ends.' },
    { title: 'Close the loop', body: 'Finish today’s briefing and keep your insider streak intact.' },
  ],
  urgent: [
    { title: 'Your local day ends soon', body: '{name}, one completed lesson will protect your streak before midnight.' },
    { title: 'Last briefing window', body: 'Complete today’s lesson now to carry your progress into tomorrow.' },
  ],
  idle: [
    { title: 'Ready when you are', body: '{name}, today’s lesson is the clearest next step on your course map.' },
  ],
};

interface NudgeState {
  date: string;
  scheduledIds: string[];
  shown: string[];
}

function personalized(text: string, displayName: string): string {
  return text.replace(/\{name\}/g, normalizeDisplayName(displayName));
}

function pick(window: LeoNudgeWindow, date = new Date()): { title: string; body: string } {
  const choices = SCRIPTS[window];
  const index = (date.getDate() + date.getHours()) % choices.length;
  return choices[index];
}

export function getLeoNudge(window: LeoNudgeWindow, displayName: string): { title: string; body: string } {
  const script = pick(window);
  return {
    title: script.title,
    body: personalized(script.body, displayName),
  };
}

export function currentLeoNudgeWindow(date = new Date()): Exclude<LeoNudgeWindow, 'idle'> | null {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes >= 12 * 60 && minutes <= 14 * 60) return 'midday';
  if (minutes >= 17 * 60 && minutes <= 18 * 60 + 30) return 'afternoon';
  if (minutes >= 20 * 60 && minutes < 22 * 60) return 'evening';
  if (minutes >= 22 * 60 && minutes <= 22 * 60 + 30) return 'urgent';
  return null;
}

async function readState(): Promise<NudgeState> {
  const today = localDateString();
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(NUDGE_STATE_KEY)) || '{}') as Partial<NudgeState>;
    if (parsed.date === today) {
      return { date: today, scheduledIds: parsed.scheduledIds || [], shown: parsed.shown || [] };
    }
  } catch (error) {
    log.warn('[LeoNudges] Could not read state:', error);
  }
  return { date: today, scheduledIds: [], shown: [] };
}

async function writeState(state: NudgeState): Promise<void> {
  await AsyncStorage.setItem(NUDGE_STATE_KEY, JSON.stringify(state));
}

export async function claimLeoNudge(key: string): Promise<boolean> {
  const state = await readState();
  if (state.shown.includes(key)) return false;
  state.shown.push(key);
  await writeState(state);
  return true;
}

export async function cancelRollingLeoNudges(): Promise<void> {
  try {
    const state = await readState();
    await Promise.all(state.scheduledIds.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(scheduled
      .filter(item => item.content.data?.type === 'leo_rolling_nudge' || item.content.data?.type === 'streak_warning')
      .map(item => Notifications.cancelScheduledNotificationAsync(item.identifier).catch(() => {})));
    await AsyncStorage.removeItem(LEGACY_STREAK_KEY);
    await writeState({ ...state, scheduledIds: [] });
  } catch (error) {
    log.warn('[LeoNudges] Could not cancel reminders:', error);
  }
}

export async function scheduleRollingLeoNudges(lessonCompletedToday: boolean): Promise<void> {
  await cancelRollingLeoNudges();
  if (lessonCompletedToday) return;

  try {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted') return;

    const displayName = normalizeDisplayName(await storage.getDisplayName());
    const now = new Date();
    const windows: Array<{ key: Exclude<LeoNudgeWindow, 'idle'>; hour: number; minute: number }> = [
      { key: 'midday', hour: 12, minute: 35 },
      { key: 'afternoon', hour: 17, minute: 25 },
      { key: 'evening', hour: 20, minute: 20 },
      { key: 'urgent', hour: 22, minute: 10 },
    ];
    const ids: string[] = [];

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
          data: { type: 'leo_rolling_nudge', route: '/(tabs)/home', localDate: localDateString(now) },
        },
        trigger: fireAt,
      });
      ids.push(id);
    }

    const state = await readState();
    await writeState({ ...state, scheduledIds: ids });
  } catch (error) {
    log.warn('[LeoNudges] Could not schedule reminders:', error);
  }
}