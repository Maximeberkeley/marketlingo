/**
 * useNarration — web browser TTS via ElevenLabs edge function.
 * Uses fetch + Audio API (no expo-av needed).
 */
import { useState, useCallback, useRef } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

interface UseNarrationOptions {
  voiceId: string;
  enabled: boolean;
}

export function useNarration({ voiceId, enabled }: UseNarrationOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!enabled || !text?.trim()) return;

      stop();

      // Strip markdown for cleaner narration
      const cleanText = text
        .replace(/[#*_~`]/g, "")
        .replace(/•\s*/g, "")
        .replace(/\[.*?\]\(.*?\)/g, "")
        .replace(/\n+/g, ". ")
        .trim();

      if (cleanText.length < 5) return;

      setIsLoading(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/elevenlabs-tts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ text: cleanText, voiceId }),
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          console.warn("TTS failed:", response.status);
          setIsLoading(false);
          return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        if (controller.signal.aborted) return;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        audio.onplay = () => {
          setIsPlaying(true);
          setIsLoading(false);
        };

        await audio.play();
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.warn("Narration error:", err);
        }
        setIsLoading(false);
      }
    },
    [enabled, voiceId, stop]
  );

  return { speak, stop, isPlaying, isLoading };
}
