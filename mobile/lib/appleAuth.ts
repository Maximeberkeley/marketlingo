/**
 * Sign in with Apple, native on iOS: Apple returns an identity token, Supabase verifies it (provider "apple", the
 * app's bundle ID as an authorised client ID) and opens a session. No password, no web redirect.
 *
 * Apple shares the person's name only on the very first authorisation, so it is saved straight away.
 */
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import { normalizeDisplayName } from './displayName';

export type AppleSignInResult =
  | { status: 'ok'; userId: string; givenName: string | null; isNew: boolean }
  | { status: 'canceled' }
  | { status: 'error'; error: string };

/** The name Apple shared, as a display name: the given name, else the family name, else null. */
export function appleDisplayName(fullName: { givenName?: string | null; familyName?: string | null } | null | undefined): string | null {
  const name = fullName?.givenName?.trim() || fullName?.familyName?.trim();
  return name ? normalizeDisplayName(name) : null;
}

/** True only where the native Apple sheet exists (iOS 13+). */
export async function appleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Opens the Apple sheet and signs in to Supabase with the token. A raw nonce goes to Supabase and its SHA-256 to Apple,
 * so a token cannot be replayed. `isNew` is true when the account has no industry yet (fresh sign-up).
 */
export async function signInWithApple(): Promise<AppleSignInResult> {
  try {
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    if (!credential.identityToken) return { status: 'error', error: 'Apple did not return a sign-in token. Try again.' };

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error || !data.user) return { status: 'error', error: error?.message || 'Apple sign-in failed. Try again.' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('selected_market')
      .eq('id', data.user.id)
      .maybeSingle();

    return {
      status: 'ok',
      userId: data.user.id,
      givenName: appleDisplayName(credential.fullName),
      isNew: !profile?.selected_market,
    };
  } catch (e: any) {
    if (e?.code === 'ERR_REQUEST_CANCELED') return { status: 'canceled' };
    return { status: 'error', error: e?.message || 'Apple sign-in failed. Try again.' };
  }
}

/** Saves a display name on a new Apple account when it has none yet (the sign-up trigger only sees email metadata). */
export async function saveAppleDisplayName(userId: string, name: string | null): Promise<void> {
  const clean = name ? normalizeDisplayName(name) : '';
  if (!clean) return;
  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle();
  if (profile?.display_name) return;
  await Promise.allSettled([
    supabase.from('profiles').update({ display_name: clean }).eq('id', userId),
    supabase.auth.updateUser({ data: { display_name: clean } }),
  ]);
}
