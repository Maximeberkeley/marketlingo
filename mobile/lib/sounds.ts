/**
 * Sound Effects System for MarketLingo
 * Uses Web Audio API on web, pairs with haptics on native.
 * All sounds are generated at runtime — no external files needed.
 */
import { Platform } from 'react-native';

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

// Sound configs — frequency sequences + durations + volume
const SOUND_CONFIG: Record<SoundType, { frequencies: number[]; durations: number[]; volume: number; type?: OscillatorType }> = {
  correct:         { frequencies: [523, 659, 784], durations: [100, 100, 200], volume: 0.3 },
  wrong:           { frequencies: [300, 250], durations: [150, 200], volume: 0.2 },
  levelUp:         { frequencies: [523, 659, 784, 1047], durations: [100, 100, 100, 300], volume: 0.4 },
  xpEarn:          { frequencies: [880, 1100], durations: [80, 120], volume: 0.2 },
  swipe:           { frequencies: [400], durations: [50], volume: 0.1 },
  tap:             { frequencies: [600], durations: [30], volume: 0.1 },
  streakMilestone: { frequencies: [523, 659, 784, 1047, 1319], durations: [80, 80, 80, 80, 300], volume: 0.4 },
  lessonComplete:  { frequencies: [523, 659, 784, 1047], durations: [150, 150, 150, 400], volume: 0.35 },
  buttonPress:     { frequencies: [700], durations: [25], volume: 0.08 },
  celebration:     { frequencies: [523, 659, 784, 1047, 1319, 1568], durations: [80, 80, 80, 80, 80, 400], volume: 0.35 },
  unlock:          { frequencies: [440, 554, 659], durations: [120, 120, 250], volume: 0.25 },
  navigate:        { frequencies: [500, 600], durations: [40, 60], volume: 0.08 },
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
 * On native, this is a lightweight no-op — pair with haptics.
 */
export function playSound(type: SoundType) {
  if (!soundEnabled) return;

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
        osc.type = config.type || 'sine';
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
}

/**
 * Combo — play sound + trigger haptic together.
 * Import triggerHaptic separately to avoid circular deps.
 */
export function playSoundAndHaptic(
  soundType: SoundType,
  hapticFn?: () => Promise<void>
) {
  playSound(soundType);
  hapticFn?.();
}
