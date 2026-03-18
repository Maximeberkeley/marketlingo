/**
 * Sound Effects System for MarketLingo
 * Uses expo-av on native iOS/Android, Web Audio API on web.
 * Sounds are generated as tiny WAV files at runtime — no bundled assets needed.
 */
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

type SoundType =
  | 'correct'
  | 'wrong'
  | 'levelUp'
  | 'xpEarn'
  | 'swipe'
  | 'tap'
  | 'streakMilestone'
  | 'lessonComplete'
  | 'buttonPress'
  | 'celebration'
  | 'unlock'
  | 'navigate';

interface ToneStep {
  freq: number;
  durationMs: number;
}

const SOUND_CONFIG: Record<SoundType, { steps: ToneStep[]; volume: number }> = {
  correct:         { steps: [{ freq: 523, durationMs: 100 }, { freq: 659, durationMs: 100 }, { freq: 784, durationMs: 200 }], volume: 0.3 },
  wrong:           { steps: [{ freq: 300, durationMs: 150 }, { freq: 250, durationMs: 200 }], volume: 0.2 },
  levelUp:         { steps: [{ freq: 523, durationMs: 100 }, { freq: 659, durationMs: 100 }, { freq: 784, durationMs: 100 }, { freq: 1047, durationMs: 300 }], volume: 0.4 },
  xpEarn:          { steps: [{ freq: 880, durationMs: 80 }, { freq: 1100, durationMs: 120 }], volume: 0.2 },
  swipe:           { steps: [{ freq: 400, durationMs: 50 }], volume: 0.1 },
  tap:             { steps: [{ freq: 600, durationMs: 30 }], volume: 0.1 },
  streakMilestone: { steps: [{ freq: 523, durationMs: 80 }, { freq: 659, durationMs: 80 }, { freq: 784, durationMs: 80 }, { freq: 1047, durationMs: 80 }, { freq: 1319, durationMs: 300 }], volume: 0.4 },
  lessonComplete:  { steps: [{ freq: 523, durationMs: 150 }, { freq: 659, durationMs: 150 }, { freq: 784, durationMs: 150 }, { freq: 1047, durationMs: 400 }], volume: 0.35 },
  buttonPress:     { steps: [{ freq: 700, durationMs: 25 }], volume: 0.08 },
  celebration:     { steps: [{ freq: 523, durationMs: 80 }, { freq: 659, durationMs: 80 }, { freq: 784, durationMs: 80 }, { freq: 1047, durationMs: 80 }, { freq: 1319, durationMs: 80 }, { freq: 1568, durationMs: 400 }], volume: 0.35 },
  unlock:          { steps: [{ freq: 440, durationMs: 120 }, { freq: 554, durationMs: 120 }, { freq: 659, durationMs: 250 }], volume: 0.25 },
  navigate:        { steps: [{ freq: 500, durationMs: 40 }, { freq: 600, durationMs: 60 }], volume: 0.08 },
};

let soundEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

// ─── WAV generation helpers ───────────────────────────────────────
const SAMPLE_RATE = 22050;

function generateSineWav(steps: ToneStep[], volume: number): string {
  // Calculate total samples
  const totalSamples = steps.reduce((sum, s) => sum + Math.round((s.durationMs / 1000) * SAMPLE_RATE), 0);
  const dataSize = totalSamples * 2; // 16-bit mono
  const fileSize = 44 + dataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Generate PCM samples
  let offset = 44;
  for (const step of steps) {
    const numSamples = Math.round((step.durationMs / 1000) * SAMPLE_RATE);
    for (let i = 0; i < numSamples; i++) {
      const t = i / SAMPLE_RATE;
      // Sine wave with exponential decay envelope
      const envelope = Math.exp(-t * 8) * volume;
      const sample = Math.sin(2 * Math.PI * step.freq * t) * envelope;
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, clamped * 32767, true);
      offset += 2;
    }
  }

  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// ─── Cache for generated sound files ──────────────────────────────
const soundCache: Map<SoundType, string> = new Map();

async function getSoundFilePath(type: SoundType): Promise<string> {
  const cached = soundCache.get(type);
  if (cached) return cached;

  const config = SOUND_CONFIG[type];
  const base64 = generateSineWav(config.steps, config.volume);
  const filePath = `${FileSystem.cacheDirectory}sfx_${type}.wav`;

  await FileSystem.writeAsStringAsync(filePath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  soundCache.set(type, filePath);
  return filePath;
}

// ─── Web Audio API fallback (for web platform) ───────────────────
function playWebSound(type: SoundType) {
  if (typeof window === 'undefined' || !window.AudioContext) return;
  try {
    const config = SOUND_CONFIG[type];
    const ctx = new AudioContext();
    let time = ctx.currentTime;

    config.steps.forEach((step) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = step.freq;
      osc.type = 'sine';
      gain.gain.value = config.volume;
      gain.gain.exponentialRampToValueAtTime(0.001, time + step.durationMs / 1000);
      osc.start(time);
      osc.stop(time + step.durationMs / 1000);
      time += step.durationMs / 1000;
    });
  } catch {
    // Silent fail
  }
}

// ─── Main playSound function ─────────────────────────────────────
export async function playSound(type: SoundType) {
  if (!soundEnabled) return;

  if (Platform.OS === 'web') {
    playWebSound(type);
    return;
  }

  // Native iOS / Android — use expo-av
  try {
    const filePath = await getSoundFilePath(type);
    const { sound } = await Audio.Sound.createAsync(
      { uri: filePath },
      { shouldPlay: true, volume: 1.0 },
    );
    // Auto-cleanup after playback
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (err) {
    // Silent fail — don't crash the app for a sound effect
    console.warn('[SFX] playSound error:', err);
  }
}

/**
 * Combo — play sound + trigger haptic together.
 */
export function playSoundAndHaptic(
  soundType: SoundType,
  hapticFn?: () => Promise<void>
) {
  playSound(soundType);
  hapticFn?.();
}
