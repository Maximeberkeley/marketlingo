/**
 * Leo call — a 3-minute spoken practice call.
 * Call type rotates automatically; Interview practice always uses the interview warm-up.
 * One call per local day per learner (kept on-device).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { localDateString } from './dayMath';

export type LeoCallType = 'explain' | 'coffee' | 'interview';

export const CALL_TYPE_LABEL: Record<LeoCallType, { title: string; subtitle: string }> = {
  explain: { title: 'Explain it to Leo', subtitle: 'Leo is curious. Teach him today’s idea.' },
  coffee: { title: 'Coffee chat', subtitle: 'Leo works in the industry. You ask the questions.' },
  interview: { title: 'Interview warm-up', subtitle: 'Leo plays your interviewer.' },
};

export const CALL_XP = 15;
export const CALL_SECONDS = 180;

export interface LeoCallContext {
  callType: LeoCallType;
  lessonTitle?: string;
  takeaway?: string;
  briefLines?: { section: string; text: string }[];
  briefSections?: { key: string; title: string }[];
  goal?: string | null;
  level?: string | null;
  industry?: string;
  target?: { company?: string; role?: string; date?: string | null } | null;
}

export interface LeoCallMessage { role: 'user' | 'assistant'; content: string }

export interface LeoCallRecap {
  explainedWell: string;
  nextTime: string;
  insiderWord: string;
  briefLine: string;
  sectionKey: string;
}

const dayKey = (userId: string) => `ml_leo_call_day:${userId}`;
const rotationKey = (userId: string) => `ml_leo_call_rotation:${userId}`;
const ROTATION: LeoCallType[] = ['explain', 'coffee', 'interview'];

/** True when the learner already used today's call. */
export async function hasCalledToday(userId?: string | null, today = localDateString()): Promise<boolean> {
  if (!userId) return false;
  try {
    return (await AsyncStorage.getItem(dayKey(userId))) === today;
  } catch {
    return false;
  }
}

export async function markCalledToday(userId: string, today = localDateString()): Promise<void> {
  await AsyncStorage.setItem(dayKey(userId), today).catch(() => {});
}

/** Next call type in the rotation; does not advance it. */
export async function nextCallType(userId?: string | null): Promise<LeoCallType> {
  if (!userId) return 'explain';
  try {
    const raw = Number(await AsyncStorage.getItem(rotationKey(userId)));
    return ROTATION[(Number.isFinite(raw) ? raw : 0) % ROTATION.length];
  } catch {
    return 'explain';
  }
}

export async function advanceCallType(userId: string): Promise<void> {
  try {
    const raw = Number(await AsyncStorage.getItem(rotationKey(userId)));
    await AsyncStorage.setItem(rotationKey(userId), String(((Number.isFinite(raw) ? raw : 0) + 1) % ROTATION.length));
  } catch { /* rotation is best-effort */ }
}

/** A sentence starter for the "Help me" button, per call type and turn. */
export function sentenceStarter(type: LeoCallType, learnerTurns: number, takeaway?: string): string {
  const pools: Record<LeoCallType, string[]> = {
    explain: [
      'The simple version is…',
      'Think of it like…',
      'It matters because…',
      takeaway ? 'The one thing to remember is…' : 'A real example would be…',
    ],
    coffee: [
      'What does a normal week look like for you?',
      'What’s the hardest problem your team is working on?',
      'What surprised you most when you joined?',
      'What would you learn first if you were me?',
    ],
    interview: [
      'In my last project, I…',
      'The way I’d approach that is…',
      'A time I did that was when…',
      'What I’d bring to this role is…',
    ],
  };
  const pool = pools[type];
  return pool[learnerTurns % pool.length];
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('leo-call', { body });
  if (error) {
    let message = 'Leo couldn’t connect. Try again in a moment.';
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        const parsed = await ctx.json();
        if (parsed?.error) message = String(parsed.error);
      }
    } catch { /* keep default */ }
    throw new Error(message);
  }
  return data as T;
}

export function leoCallTurn(context: LeoCallContext, messages: LeoCallMessage[]) {
  return invoke<{ reply: string; ended: boolean }>({ action: 'turn', context, messages });
}

export function leoCallRecap(context: LeoCallContext, messages: LeoCallMessage[]) {
  return invoke<{ recap: LeoCallRecap | null }>({ action: 'recap', context, messages });
}
