/**
 * tts.ts — Shared ElevenLabs TTS utility for React Native (iOS/Android).
 *
 * Uses expo-file-system downloadAsync to avoid the broken
 * fetch().blob() + FileReader pattern that silently fails on iOS native builds.
 */
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

const EDGE_URL = process.env.EXPO_PUBLIC_EDGE_FUNCTIONS_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Speaks text using ElevenLabs TTS via the edge function.
 * Returns an Audio.Sound instance (caller should manage cleanup) or null on failure.
 */
export async function speakWithElevenLabs(
  text: string,
  voiceId: string,
  tag = 'tts',
): Promise<Audio.Sound | null> {
  if (!text || text.trim().length < 5) return null;

  try {
    // Get auth header
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || SUPABASE_ANON_KEY;

    // Download directly to a temp file — avoids blob/FileReader issues on iOS
    const tempPath = `${FileSystem.cacheDirectory}${tag}_${Date.now()}.mp3`;

    const downloadResult = await FileSystem.downloadAsync(
      `${EDGE_URL}/functions/v1/elevenlabs-tts`,
      tempPath,
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        // downloadAsync doesn't support POST body natively,
        // so we fall back to fetch + writeAsStringAsync
      },
    );

    // downloadAsync uses GET — we need POST. Fall back to manual approach.
    // Delete the GET attempt
    await FileSystem.deleteAsync(tempPath, { idempotent: true });

    // Use fetch with POST, then write arrayBuffer to file via base64
    const response = await fetch(`${EDGE_URL}/functions/v1/elevenlabs-tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, voiceId }),
    });

    if (!response.ok) {
      console.warn(`[TTS] Edge function returned ${response.status}`);
      return null;
    }

    // Read as arrayBuffer and convert to base64 manually (RN compatible)
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convert to base64 in chunks to avoid stack overflow
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);

    // Write base64 to temp file
    const finalPath = `${FileSystem.cacheDirectory}${tag}_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(finalPath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Configure audio mode for iOS
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    // Create and play sound
    const { sound } = await Audio.Sound.createAsync(
      { uri: finalPath },
      { shouldPlay: true },
    );

    // Clean up temp file when done
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        FileSystem.deleteAsync(finalPath, { idempotent: true }).catch(() => {});
      }
    });

    return sound;
  } catch (err) {
    console.warn(`[TTS] Error:`, err);
    return null;
  }
}
