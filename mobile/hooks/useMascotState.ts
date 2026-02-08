import { useState, useCallback, useRef } from 'react';
import { MascotState } from '../lib/mascots';

interface UseMascotStateReturn {
  state: MascotState;
  handleAnswer: (isCorrect: boolean) => void;
  setThinking: () => void;
  setIdle: () => void;
  setCelebrate: () => void;
}

export function useMascotState(): UseMascotStateReturn {
  const [state, setState] = useState<MascotState>('idle');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const setWithAutoReset = useCallback((newState: MascotState, resetDelay = 2500) => {
    clearTimer();
    setState(newState);
    
    if (newState !== 'idle') {
      timeoutRef.current = setTimeout(() => {
        setState('idle');
      }, resetDelay);
    }
  }, [clearTimer]);

  const handleAnswer = useCallback((isCorrect: boolean) => {
    setWithAutoReset(isCorrect ? 'correct' : 'incorrect');
  }, [setWithAutoReset]);

  const setThinking = useCallback(() => {
    setState('thinking');
  }, []);

  const setIdle = useCallback(() => {
    clearTimer();
    setState('idle');
  }, [clearTimer]);

  const setCelebrate = useCallback(() => {
    setWithAutoReset('celebrate', 4000);
  }, [setWithAutoReset]);

  return {
    state,
    handleAnswer,
    setThinking,
    setIdle,
    setCelebrate,
  };
}
