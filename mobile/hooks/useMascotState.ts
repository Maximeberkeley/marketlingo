import { useState, useCallback, useRef } from 'react';
import { MascotState } from '../lib/mascots';

interface UseMascotStateOptions {
  /** Time to return to idle after one-shot animations (ms) */
  idleTimeout?: number;
  /** Initial state */
  initialState?: MascotState;
}

interface UseMascotStateReturn {
  /** Current mascot state */
  state: MascotState;
  /** Set mascot to idle (breathing/blinking) */
  setIdle: () => void;
  /** Set mascot to thinking (when user is selecting) */
  setThinking: () => void;
  /** Trigger correct answer celebration */
  triggerCorrect: () => void;
  /** Trigger incorrect answer reaction */
  triggerIncorrect: () => void;
  /** Trigger big celebration (lesson complete) */
  triggerCelebration: () => void;
  /** Trigger encouraging message */
  triggerEncouraging: () => void;
  /** Trigger wave animation */
  triggerWave: () => void;
  /** Set any custom state */
  setState: (state: MascotState) => void;
  /** Handle answer submission (auto-detects correct/incorrect) */
  handleAnswer: (isCorrect: boolean) => void;
  /** Legacy alias for triggerCelebration */
  setCelebrate: () => void;
}

export function useMascotState(options: UseMascotStateOptions = {}): UseMascotStateReturn {
  const { idleTimeout = 2500, initialState = 'idle' } = options;
  const [state, setStateInternal] = useState<MascotState>(initialState);
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const scheduleIdle = useCallback((delay = idleTimeout) => {
    clearTimer();
    timeoutRef.current = setTimeout(() => {
      setStateInternal('idle');
    }, delay);
  }, [idleTimeout, clearTimer]);

  const setIdle = useCallback(() => {
    clearTimer();
    setStateInternal('idle');
  }, [clearTimer]);

  const setThinking = useCallback(() => {
    clearTimer();
    setStateInternal('thinking');
  }, [clearTimer]);

  const triggerCorrect = useCallback(() => {
    clearTimer();
    setStateInternal('correct');
    scheduleIdle();
  }, [clearTimer, scheduleIdle]);

  const triggerIncorrect = useCallback(() => {
    clearTimer();
    setStateInternal('incorrect');
    scheduleIdle(2000);
  }, [clearTimer, scheduleIdle]);

  const triggerCelebration = useCallback(() => {
    clearTimer();
    setStateInternal('celebrate');
    scheduleIdle(3000);
  }, [clearTimer, scheduleIdle]);

  const triggerEncouraging = useCallback(() => {
    clearTimer();
    setStateInternal('encouraging' as MascotState);
    scheduleIdle();
  }, [clearTimer, scheduleIdle]);

  const triggerWave = useCallback(() => {
    clearTimer();
    setStateInternal('waving' as MascotState);
    scheduleIdle(1500);
  }, [clearTimer, scheduleIdle]);

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      triggerCorrect();
    } else {
      triggerIncorrect();
    }
  }, [triggerCorrect, triggerIncorrect]);

  const setState = useCallback((newState: MascotState) => {
    clearTimer();
    setStateInternal(newState);
  }, [clearTimer]);

  return {
    state,
    setIdle,
    setThinking,
    triggerCorrect,
    triggerIncorrect,
    triggerCelebration,
    triggerEncouraging,
    triggerWave,
    setState,
    handleAnswer,
    setCelebrate: triggerCelebration,
  };
}

export default useMascotState;
