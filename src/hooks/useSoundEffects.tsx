import { useCallback, useRef } from "react";

type SoundType = 
  | "correct" 
  | "incorrect" 
  | "tap" 
  | "success" 
  | "levelUp" 
  | "streak" 
  | "complete" 
  | "notification"
  | "celebration";

// Simple sound synthesizer using Web Audio API
class SoundSynthesizer {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.3) {
    if (!this.enabled) return;
    
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      // Envelope for smoother sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Sound playback failed:", e);
    }
  }

  // Correct answer - cheerful ascending arpeggio (like Duolingo)
  playCorrect() {
    this.playTone(523, 0.1, "sine", 0.25); // C5
    setTimeout(() => this.playTone(659, 0.1, "sine", 0.25), 80); // E5
    setTimeout(() => this.playTone(784, 0.15, "sine", 0.3), 160); // G5
  }

  // Incorrect answer - gentle descending tone
  playIncorrect() {
    this.playTone(392, 0.15, "triangle", 0.2); // G4
    setTimeout(() => this.playTone(330, 0.2, "triangle", 0.15), 100); // E4
  }

  // Button tap - subtle click
  playTap() {
    this.playTone(800, 0.05, "sine", 0.1);
  }

  // Success/completion - fanfare
  playSuccess() {
    this.playTone(523, 0.12, "sine", 0.25); // C5
    setTimeout(() => this.playTone(659, 0.12, "sine", 0.25), 100); // E5
    setTimeout(() => this.playTone(784, 0.12, "sine", 0.25), 200); // G5
    setTimeout(() => this.playTone(1047, 0.25, "sine", 0.3), 300); // C6
  }

  // Level up - triumphant ascending
  playLevelUp() {
    const notes = [523, 587, 659, 784, 880, 1047]; // C5 to C6 scale
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, "sine", 0.2), i * 60);
    });
  }

  // Streak milestone - exciting burst
  playStreak() {
    this.playTone(880, 0.08, "square", 0.15); // A5
    setTimeout(() => this.playTone(1047, 0.08, "square", 0.15), 50); // C6
    setTimeout(() => this.playTone(1319, 0.15, "square", 0.2), 100); // E6
  }

  // Lesson/game complete - celebratory
  playComplete() {
    this.playTone(659, 0.12, "sine", 0.2); // E5
    setTimeout(() => this.playTone(784, 0.12, "sine", 0.2), 80); // G5
    setTimeout(() => this.playTone(988, 0.12, "sine", 0.25), 160); // B5
    setTimeout(() => this.playTone(1175, 0.2, "sine", 0.3), 240); // D6
  }

  // Notification - gentle chime
  playNotification() {
    this.playTone(988, 0.1, "sine", 0.15); // B5
    setTimeout(() => this.playTone(1319, 0.15, "sine", 0.2), 100); // E6
  }

  // Celebration - full fanfare for achievements
  playCelebration() {
    const melody = [
      { freq: 523, delay: 0 },    // C5
      { freq: 659, delay: 100 },  // E5
      { freq: 784, delay: 200 },  // G5
      { freq: 1047, delay: 300 }, // C6
      { freq: 784, delay: 450 },  // G5
      { freq: 1047, delay: 550 }, // C6
    ];
    melody.forEach(({ freq, delay }) => {
      setTimeout(() => this.playTone(freq, 0.15, "sine", 0.25), delay);
    });
  }
}

// Singleton instance
const soundSynthesizer = new SoundSynthesizer();

export function useSoundEffects() {
  const synthRef = useRef(soundSynthesizer);

  const play = useCallback((sound: SoundType) => {
    const synth = synthRef.current;
    
    switch (sound) {
      case "correct":
        synth.playCorrect();
        break;
      case "incorrect":
        synth.playIncorrect();
        break;
      case "tap":
        synth.playTap();
        break;
      case "success":
        synth.playSuccess();
        break;
      case "levelUp":
        synth.playLevelUp();
        break;
      case "streak":
        synth.playStreak();
        break;
      case "complete":
        synth.playComplete();
        break;
      case "notification":
        synth.playNotification();
        break;
      case "celebration":
        synth.playCelebration();
        break;
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    synthRef.current.setEnabled(enabled);
  }, []);

  const isEnabled = useCallback(() => {
    return synthRef.current.isEnabled();
  }, []);

  return { play, setEnabled, isEnabled };
}

// Export for direct usage without hook
export { soundSynthesizer };
