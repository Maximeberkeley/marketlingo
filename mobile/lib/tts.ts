/**
 * tts.ts — Shared ElevenLabs TTS utility for React Native (iOS/Android).
 *
 * Uses XMLHttpRequest with responseType='blob' which is more reliable
 * than fetch().blob() on React Native iOS. Then converts via FileReader
 * and writes to temp file for expo-av playback.
 */
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

const EDGE_URL = process.env.EXPO_PUBLIC_EDGE_FUNCTIONS_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

// Log config once at import time
console.log('[TTS] EDGE_URL:', EDGE_URL ? `${EDGE_URL.substring(0, 30)}...` : '⚠️ EMPTY');
console.log('[TTS] ANON_KEY:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 10)}...` : '⚠️ EMPTY');

async function getAuthToken(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || SUPABASE_ANON_KEY;
  } catch {
    return SUPABASE_ANON_KEY;
  }
}

/**
 * Fetches audio from ElevenLabs TTS edge function using XMLHttpRequest
 * (more reliable for binary data on React Native than fetch).
 */
function fetchAudioAsBase64(text: string, voiceId: string, token: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `${EDGE_URL}/functions/v1/elevenlabs-tts`;
    console.log('[TTS] Fetching audio from:', url);
    
    if (!EDGE_URL) {
      reject(new Error('EDGE_URL is empty — check EXPO_PUBLIC_EDGE_FUNCTIONS_URL or EXPO_PUBLIC_SUPABASE_URL env vars'));
      return;
    }
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.responseType = 'blob';

    xhr.onload = () => {
      console.log('[TTS] XHR response status:', xhr.status);
      if (xhr.status !== 200) {
        reject(new Error(`TTS returned ${xhr.status}`));
        return;
      }

      const blob = xhr.response;
      if (!blob || blob.size === 0) {
        reject(new Error('Empty audio response'));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        if (!dataUrl || !dataUrl.includes(',')) {
          reject(new Error('FileReader produced invalid result'));
          return;
        }
        const base64 = dataUrl.split(',')[1];
        if (!base64 || base64.length < 100) {
          reject(new Error('Base64 data too short'));
          return;
        }
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    };

    xhr.onerror = () => reject(new Error('XHR network error'));
    xhr.ontimeout = () => reject(new Error('XHR timeout'));
    xhr.timeout = 30000;

    xhr.send(JSON.stringify({ text, voiceId }));
  });
}

/**
 * Speaks text using ElevenLabs TTS via the edge function.
 * Returns an Audio.Sound instance (caller manages cleanup) or null on failure.
 */
export async function speakWithElevenLabs(
  text: string,
  voiceId: string,
  tag = 'tts',
): Promise<Audio.Sound | null> {
  if (!text || text.trim().length < 5) return null;

  try {
    const token = await getAuthToken();
    const base64 = await fetchAudioAsBase64(text, voiceId, token);

    // Write to temp file
    const tempPath = `${FileSystem.cacheDirectory}${tag}_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(tempPath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Verify file was written
    const info = await FileSystem.getInfoAsync(tempPath);
    if (!info.exists || (info as any).size < 100) {
      console.warn(`[TTS] Temp file too small or missing: ${tempPath}`);
      return null;
    }

    // Configure audio mode for iOS
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    // Create and play sound
    const { sound } = await Audio.Sound.createAsync(
      { uri: tempPath },
      { shouldPlay: true },
    );

    // Clean up temp file when done
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
      }
    });

    return sound;
  } catch (err) {
    console.warn(`[TTS] Error:`, err);
    return null;
  }
}
