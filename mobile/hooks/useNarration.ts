/**
 * useNarration — manages ElevenLabs TTS playback for lesson narration.
 * Each mentor has a unique voice. Audio is fetched via the shared TTS utility.
 */

import { useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import { speakWithElevenLabs } from '../lib/tts';

interface UseNarrationOptions {
  voiceId: string;
  enabled: boolean;
}

export function useNarration({ voiceId, enabled }: UseNarrationOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const abortedRef = useRef(false);

  const stop = useCallback(async () => {
    abortedRef.current = true;
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
    abortedRef.current = false;

    // Strip markdown/emoji for cleaner narration
    const cleanText = text
      .replace(/[#*_~`]/g, '')
      .replace(/•\s*/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    if (cleanText.length < 5) return;

    setIsLoading(true);

    try {
      const sound = await speakWithElevenLabs(cleanText, voiceId, 'narration');

      if (abortedRef.current || !sound) {
        setIsLoading(false);
        return;
      }

      soundRef.current = sound;
      setIsPlaying(true);
      setIsLoading(false);

      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (err: any) {
      console.warn('Narration error:', err);
      setIsLoading(false);
    }
  }, [enabled, voiceId, stop]);

  return { speak, stop, isPlaying, isLoading };
}
