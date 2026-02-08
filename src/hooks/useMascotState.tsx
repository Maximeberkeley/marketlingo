import { useState, useCallback, useRef } from "react";
import type { MascotState } from "@/components/mascot/MascotReaction";

// ============================================
// MASCOT STATE MANAGEMENT HOOK
// ============================================

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
}

/**
 * Hook to manage mascot state transitions
 * 
 * Usage:
 * ```tsx
 * const { state, setThinking, handleAnswer } = useMascotState();
 * 
 * // When user starts selecting
 * <button onFocus={setThinking}>Option A</button>
 * 
 * // When user submits answer
 * <button onClick={() => handleAnswer(isCorrect)}>Submit</button>
 * 
 * // In JSX
 * <MascotReaction state={state} />
 * ```
 */
export function useMascotState(options: UseMascotStateOptions = {}): UseMascotStateReturn {
  const { idleTimeout = 2500, initialState = "idle" } = options;
  const [state, setState] = useState<MascotState>(initialState);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any pending timeout
  const clearIdleTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Schedule return to idle
  const scheduleIdle = useCallback((delay = idleTimeout) => {
    clearIdleTimeout();
    timeoutRef.current = setTimeout(() => {
      setState("idle");
    }, delay);
  }, [idleTimeout, clearIdleTimeout]);

  // State setters
  const setIdle = useCallback(() => {
    clearIdleTimeout();
    setState("idle");
  }, [clearIdleTimeout]);

  const setThinking = useCallback(() => {
    clearIdleTimeout();
    setState("thinking");
  }, [clearIdleTimeout]);

  const triggerCorrect = useCallback(() => {
    clearIdleTimeout();
    setState("correct");
    scheduleIdle();
  }, [clearIdleTimeout, scheduleIdle]);

  const triggerIncorrect = useCallback(() => {
    clearIdleTimeout();
    setState("incorrect");
    scheduleIdle(2000);
  }, [clearIdleTimeout, scheduleIdle]);

  const triggerCelebration = useCallback(() => {
    clearIdleTimeout();
    setState("celebrating");
    scheduleIdle(3000);
  }, [clearIdleTimeout, scheduleIdle]);

  const triggerEncouraging = useCallback(() => {
    clearIdleTimeout();
    setState("encouraging");
    scheduleIdle();
  }, [clearIdleTimeout, scheduleIdle]);

  const triggerWave = useCallback(() => {
    clearIdleTimeout();
    setState("waving");
    scheduleIdle(1500);
  }, [clearIdleTimeout, scheduleIdle]);

  // Convenience method for answer handling
  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      triggerCorrect();
    } else {
      triggerIncorrect();
    }
  }, [triggerCorrect, triggerIncorrect]);

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
  };
}

export default useMascotState;
