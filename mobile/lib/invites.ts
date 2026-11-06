/**
 * Friend invites: share links, the pending code saved before sign-up, and
 * applying it through accept_invite. The inviter is pushed a "joined" note.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { log } from './logger';

export const PENDING_INVITE_KEY = '@marketlingo/pending_invite';
export const INVITE_ORIGIN = 'https://market-verse.com';

const CODE_RE = /^[A-Z0-9]{4,12}$/;

export function normalizeInviteCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  return CODE_RE.test(code) ? code : null;
}

export function inviteUrl(code: string): string {
  return `${INVITE_ORIGIN}/invite/${code}`;
}

export function inviteMessage(industry: string | null | undefined, code: string): string {
  const what = industry?.trim() ? industry.trim() : 'industries';
  return `I'm learning ${what} on MarketLingo, 5 minutes a day. Join me: ${inviteUrl(code)}`;
}

export async function savePendingInvite(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_INVITE_KEY, code);
  } catch (err) {
    log.warn('Could not save invite code', err);
  }
}

export type InviteResult =
  | { status: 'connected' | 'already'; name: string }
  | { status: 'invalid' | 'own_code' | 'error' };

/** Calls accept_invite; on a new connection, pushes the inviter. */
export async function acceptInvite(code: string): Promise<InviteResult> {
  const { data, error } = await supabase.rpc('accept_invite', { p_code: code });
  if (error || !data) {
    log.warn('accept_invite failed', error);
    return { status: 'error' };
  }
  const res = data as { status: string; friendship_id?: string; name?: string };
  if (res.status === 'connected' && res.friendship_id) {
    supabase.functions
      .invoke('friend-request-notify', { body: { friendshipId: res.friendship_id, kind: 'invite' } })
      .catch((err) => log.warn('Invite push failed', err));
  }
  if (res.status === 'connected' || res.status === 'already') {
    return { status: res.status, name: res.name || 'your friend' };
  }
  return { status: res.status === 'own_code' ? 'own_code' : 'invalid' };
}

/** Applies a code saved before sign-up, once. Clears it unless the call failed. */
export async function applyPendingInvite(): Promise<InviteResult | null> {
  let code: string | null = null;
  try {
    code = normalizeInviteCode(await AsyncStorage.getItem(PENDING_INVITE_KEY));
  } catch {
    return null;
  }
  if (!code) return null;
  const result = await acceptInvite(code);
  if (result.status !== 'error') {
    await AsyncStorage.removeItem(PENDING_INVITE_KEY).catch(() => {});
  }
  return result;
}

export function inviteToast(result: InviteResult | null): string | null {
  if (!result) return null;
  switch (result.status) {
    case 'connected': return `You and ${result.name} are now friends`;
    case 'already': return `You and ${result.name} are already friends`;
    case 'own_code': return "That's your own code";
    case 'invalid': return "That invite code isn't valid";
    default: return 'Invite not applied. Please try again.';
  }
}
