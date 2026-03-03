/**
 * useNarration — manages ElevenLabs TTS playback for lesson narration.
 * Each mentor has a unique voice. Audio is fetched from the elevenlabs-tts edge function.
 */

import { useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

interface UseNarrationOptions {
  voiceId: string;
  enabled: boolean;
}

export function useNarration({ voiceId, enabled }: UseNarrationOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!enabled || !text?.trim()) return;

    // Stop any current playback
    await stop();

    // Strip markdown/emoji for cleaner narration
    const cleanText = text
      .replace(/[#*_~`]/g, '')
      .replace(/•\s*/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    if (cleanText.length < 5) return;

    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Get auth token if available
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token
        ? `Bearer ${session.access_token}`
        : `Bearer ${SUPABASE_ANON_KEY}`;

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': authHeader,
          },
          body: JSON.stringify({ text: cleanText, voiceId }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        console.warn('TTS failed:', response.status);
        setIsLoading(false);
        return;
      }

      // Convert response to a playable audio file
      const blob = await response.blob();
      const reader = new FileReader();

      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 data after the comma
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      if (controller.signal.aborted) return;

      // Play using expo-av
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mpeg;base64,${base64}` },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            sound.unloadAsync();
            soundRef.current = null;
          }
        },
      );

      soundRef.current = sound;
      setIsPlaying(true);
      setIsLoading(false);
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Narration error:', err);
      }
      setIsLoading(false);
    }
  }, [enabled, voiceId, stop]);

  return { speak, stop, isPlaying, isLoading };
}
