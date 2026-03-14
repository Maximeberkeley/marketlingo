// Voice utilities for Interview Lab
// Uses existing elevenlabs-tts edge function with Sophia's voice (Jessica)
// ======================================================================

import { Audio } from 'expo-av';
import { supabase } from './supabase';

// Sophia Hernández voice = Jessica (warm, professional)
const SOPHIA_VOICE_ID = 'cgSgspJ2msm6clMCkdW9';

const EDGE_URL = process.env.EXPO_PUBLIC_EDGE_FUNCTIONS_URL || '';

/**
 * Play TTS audio using Sophia's voice
 */
export async function speakAsSophia(text: string): Promise<Audio.Sound | null> {
  if (!text || text.trim().length === 0) return null;

  try {
    const ttsUrl = `${EDGE_URL}/elevenlabs-tts`;
    
    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId: SOPHIA_VOICE_ID }),
    });

    if (!response.ok) {
      console.warn('TTS failed:', response.status);
      return null;
    }

    const audioBlob = await response.blob();
    const reader = new FileReader();
    
    return new Promise((resolve) => {
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const uri = `data:audio/mpeg;base64,${base64}`;
          
          const { sound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true }
          );
          resolve(sound);
        } catch (err) {
          console.warn('Audio playback error:', err);
          resolve(null);
        }
      };
      reader.readAsDataURL(audioBlob);
    });
  } catch (err) {
    console.warn('Sophia TTS error:', err);
    return null;
  }
}

/**
 * Transcribe audio recording using ElevenLabs STT
 */
export async function transcribeAudio(uri: string): Promise<string> {
  try {
    const sttUrl = `${EDGE_URL}/elevenlabs-stt`;

    // Read the file and create FormData
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const formData = new FormData();
    formData.append('audio', {
      uri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);

    const sttResponse = await fetch(sttUrl, {
      method: 'POST',
      body: formData,
    });

    if (!sttResponse.ok) {
      console.warn('STT failed:', sttResponse.status);
      return '';
    }

    const data = await sttResponse.json();
    return data.text || '';
  } catch (err) {
    console.warn('Transcription error:', err);
    return '';
  }
}

/**
 * Build a narration-friendly version of feedback
 */
export function buildFeedbackNarration(feedback: any): string {
  if (!feedback) return '';
  
  const parts: string[] = [];
  
  if (feedback.sophiaSays) {
    parts.push(feedback.sophiaSays);
  }
  
  parts.push(`You scored ${feedback.score} out of 100.`);
  
  if (feedback.awesome?.length > 0) {
    parts.push(`Here's what was awesome. ${feedback.awesome.join('. ')}.`);
  }
  
  if (feedback.missing?.length > 0) {
    parts.push(`Here's what was missing. ${feedback.missing.join('. ')}.`);
  }
  
  if (feedback.trySaying) {
    parts.push(`Try saying something like this instead. ${feedback.trySaying}`);
  }
  
  if (feedback.buzzwordsUsed?.length > 0) {
    parts.push(`Great job using these industry terms: ${feedback.buzzwordsUsed.join(', ')}.`);
  }
  
  if (feedback.buzzwordsMissed?.length > 0) {
    parts.push(`Next time, try to include: ${feedback.buzzwordsMissed.join(', ')}.`);
  }
  
  return parts.join(' ');
}
