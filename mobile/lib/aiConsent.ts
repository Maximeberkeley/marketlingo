/**
 * aiConsent.ts — AI + voice disclosure and consent state.
 *
 * Consent is asked once, right before the first AI action (never at launch).
 * Voice has its own explicit opt-in. Both are revocable from Settings.
 * The full curriculum, drills and reviews stay usable without consent.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export const AI_DISCLOSURE_TEXT =
  'Leo uses an external AI service to answer questions and personalize explanations. Your question and relevant lesson context may be sent for processing. Voice recordings are processed when you use voice mode.';

export const VOICE_DISCLOSURE_TEXT =
  'Voice mode records your microphone and sends the audio to an external speech service so Leo can hear and reply. Recordings are used only to produce your answer and are not used to identify you.';

export interface ConsentState {
  ai: boolean;
  voice: boolean;
  declined: boolean;
  loaded: boolean;
}

const CACHE_KEY = 'ai_consent_state_v1';

export const emptyConsent: ConsentState = { ai: false, voice: false, declined: false, loaded: false };

/** Reads consent from the local cache first (instant), then the backend. */
export async function loadConsent(): Promise<ConsentState> {
  let cached: ConsentState = { ...emptyConsent };
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) cached = { ...cached, ...JSON.parse(raw), loaded: true };
  } catch {
    // ignore cache errors
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ...cached, loaded: true };

    const { data } = await supabase
      .from('profiles')
      .select('ai_consent_at, voice_consent_at, ai_consent_declined_at')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      const state: ConsentState = {
        ai: !!data.ai_consent_at,
        voice: !!data.voice_consent_at,
        declined: !!data.ai_consent_declined_at && !data.ai_consent_at,
        loaded: true,
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(state)).catch(() => {});
      return state;
    }
  } catch {
    // offline — fall back to the cached value
  }

  return { ...cached, loaded: true };
}

async function persist(patch: Record<string, string | null>, next: Partial<ConsentState>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update(patch).eq('id', user.id);
    }
  } catch {
    // non-blocking — the local cache keeps the UI consistent
  }
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const current = raw ? JSON.parse(raw) : {};
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ ...current, ...next }));
  } catch {
    // ignore
  }
}

export async function grantAIConsent() {
  await persist(
    { ai_consent_at: new Date().toISOString(), ai_consent_declined_at: null },
    { ai: true, declined: false },
  );
}

export async function declineAIConsent() {
  await persist(
    { ai_consent_declined_at: new Date().toISOString(), ai_consent_at: null, voice_consent_at: null },
    { ai: false, voice: false, declined: true },
  );
}

export async function revokeAIConsent() {
  await persist({ ai_consent_at: null, voice_consent_at: null }, { ai: false, voice: false });
}

export async function grantVoiceConsent() {
  await persist(
    { voice_consent_at: new Date().toISOString(), ai_consent_at: new Date().toISOString() },
    { voice: true, ai: true, declined: false },
  );
}

export async function revokeVoiceConsent() {
  await persist({ voice_consent_at: null }, { voice: false });
}
