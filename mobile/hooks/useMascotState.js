import { useState, useCallback, useRef } from 'react';
export function useMascotState(options = {}) {
    const { idleTimeout = 2500, initialState = 'idle' } = options;
    const [state, setStateInternal] = useState(initialState);
    const timeoutRef = useRef(undefined);
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
        setStateInternal('encouraging');
        scheduleIdle();
    }, [clearTimer, scheduleIdle]);
    const triggerWave = useCallback(() => {
        clearTimer();
        setStateInternal('waving');
        scheduleIdle(1500);
    }, [clearTimer, scheduleIdle]);
    const handleAnswer = useCallback((isCorrect) => {
        if (isCorrect) {
            triggerCorrect();
        }
        else {
            triggerIncorrect();
        }
    }, [triggerCorrect, triggerIncorrect]);
    const setState = useCallback((newState) => {
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
