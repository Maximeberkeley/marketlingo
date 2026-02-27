/**
 * Sound Effects System for MarketLingo
 * Uses expo-av for audio playback with generated tones as fallback.
 * Sounds are simple sine-wave beeps generated at runtime — no external files needed.
 */
import { Platform } from 'react-native';

// We use a simple approach: trigger haptics + visual feedback.
// For full sound effects, expo-av would be needed, but we can create
// a lightweight system using the Web Audio API on web or expo-av on native.

type SoundType =
  | 'correct'
  | 'wrong'
  | 'levelUp'
  | 'xpEarn'
  | 'swipe'
  | 'tap'
  | 'streakMilestone'
  | 'lessonComplete';

// Sound configurations (frequency, duration, pattern)
const SOUND_CONFIG: Record<SoundType, { frequencies: number[]; durations: number[]; volume: number }> = {
  correct: { frequencies: [523, 659, 784], durations: [100, 100, 200], volume: 0.3 },
  wrong: { frequencies: [300, 250], durations: [150, 200], volume: 0.2 },
  levelUp: { frequencies: [523, 659, 784, 1047], durations: [100, 100, 100, 300], volume: 0.4 },
  xpEarn: { frequencies: [880, 1100], durations: [80, 120], volume: 0.2 },
  swipe: { frequencies: [400], durations: [50], volume: 0.1 },
  tap: { frequencies: [600], durations: [30], volume: 0.1 },
  streakMilestone: { frequencies: [523, 659, 784, 1047, 1319], durations: [80, 80, 80, 80, 300], volume: 0.4 },
  lessonComplete: { frequencies: [523, 659, 784, 1047], durations: [150, 150, 150, 400], volume: 0.35 },
};

let soundEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/**
 * Play a sound effect. On web, uses Web Audio API.
 * On native, this is a no-op placeholder — pair with haptics for feedback.
 */
export function playSound(type: SoundType) {
  if (!soundEnabled) return;

  // Web Audio API (works in web preview)
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.AudioContext) {
    try {
      const config = SOUND_CONFIG[type];
      const ctx = new AudioContext();
      let time = ctx.currentTime;

      config.frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.value = config.volume;
        gain.gain.exponentialRampToValueAtTime(0.001, time + config.durations[i] / 1000);
        osc.start(time);
        osc.stop(time + config.durations[i] / 1000);
        time += config.durations[i] / 1000;
      });
    } catch {
      // Silent fail
    }
  }
  // On native, rely on haptics (already integrated)
}
