import { useState, useEffect, useCallback, useRef } from 'react';

interface KeyboardState {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  viewportHeight: number;
  isStabilized: boolean;
}

/**
 * Hook that uses visualViewport API to detect real keyboard presence on iOS/Android
 * Includes:
 * - Debouncing to handle jittery values during orientation/zoom changes
 * - Fallback for older WebViews without visualViewport
 * - Stabilization detection for proper scroll timing
 */
export function useKeyboardAware(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    isKeyboardVisible: false,
    keyboardHeight: 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    isStabilized: true,
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeightRef = useRef<number>(0);
  const stabilizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const visualViewport = window.visualViewport;
    
    // Mark as unstabilized during updates
    setState(prev => ({ ...prev, isStabilized: false }));
    
    // Clear previous stabilization timeout
    if (stabilizeTimeoutRef.current) {
      clearTimeout(stabilizeTimeoutRef.current);
    }

    let newState: KeyboardState;
    
    if (visualViewport) {
      const windowHeight = window.innerHeight;
      const viewportHeight = visualViewport.height;
      
      // Account for zoom - use scale to normalize
      const scale = visualViewport.scale || 1;
      const adjustedViewportHeight = viewportHeight * scale;
      
      // Keyboard is visible if visual viewport is significantly smaller than window
      // Use 150px threshold to avoid false positives from address bar changes
      const heightDiff = windowHeight - adjustedViewportHeight;
      const isKeyboardVisible = heightDiff > 150;
      
      newState = {
        isKeyboardVisible,
        keyboardHeight: isKeyboardVisible ? heightDiff : 0,
        viewportHeight: adjustedViewportHeight,
        isStabilized: false,
      };
    } else {
      // Fallback: use window.innerHeight delta detection
      const currentHeight = window.innerHeight;
      const heightDelta = lastHeightRef.current - currentHeight;
      
      // If height decreased by > 150px, assume keyboard opened
      const isKeyboardVisible = heightDelta > 150;
      
      newState = {
        isKeyboardVisible,
        keyboardHeight: isKeyboardVisible ? heightDelta : 0,
        viewportHeight: currentHeight,
        isStabilized: false,
      };
      
      lastHeightRef.current = currentHeight;
    }
    
    setState(newState);
    
    // Mark as stabilized after values settle (100ms of no changes)
    stabilizeTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isStabilized: true }));
    }, 100);
  }, []);

  // Debounced update to handle jittery values
  const debouncedUpdate = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(updateViewport, 16); // ~1 frame
  }, [updateViewport]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const visualViewport = window.visualViewport;
    
    // Store initial height for fallback detection
    lastHeightRef.current = window.innerHeight;
    
    // Initial update
    updateViewport();

    if (visualViewport) {
      // Use visualViewport resize event - most reliable
      visualViewport.addEventListener('resize', debouncedUpdate);
      visualViewport.addEventListener('scroll', debouncedUpdate);
      
      // Also listen for orientation changes
      window.addEventListener('orientationchange', debouncedUpdate);
      
      return () => {
        visualViewport.removeEventListener('resize', debouncedUpdate);
        visualViewport.removeEventListener('scroll', debouncedUpdate);
        window.removeEventListener('orientationchange', debouncedUpdate);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (stabilizeTimeoutRef.current) clearTimeout(stabilizeTimeoutRef.current);
      };
    } else {
      // Fallback: listen for resize and focus/blur on inputs
      const handleResize = () => {
        debouncedUpdate();
      };

      const handleFocus = (e: FocusEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          // Wait for keyboard to appear before measuring
          setTimeout(() => {
            const newHeight = window.innerHeight;
            const delta = lastHeightRef.current - newHeight;
            if (delta > 150) {
              setState({
                isKeyboardVisible: true,
                keyboardHeight: delta,
                viewportHeight: newHeight,
                isStabilized: true,
              });
            }
          }, 300);
        }
      };

      const handleBlur = () => {
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            isKeyboardVisible: false,
            keyboardHeight: 0,
            viewportHeight: window.innerHeight,
            isStabilized: true,
          }));
          lastHeightRef.current = window.innerHeight;
        }, 100);
      };

      window.addEventListener('resize', handleResize);
      document.addEventListener('focusin', handleFocus);
      document.addEventListener('focusout', handleBlur);

      return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('focusin', handleFocus);
        document.removeEventListener('focusout', handleBlur);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (stabilizeTimeoutRef.current) clearTimeout(stabilizeTimeoutRef.current);
      };
    }
  }, [updateViewport, debouncedUpdate]);

  return state;
}

/**
 * Utility to scroll an input into view when keyboard appears
 * Uses requestAnimationFrame chain + delay to ensure proper timing on iOS
 * 
 * @param element - The input element to scroll into view
 * @param waitForStabilization - If true, waits longer for keyboard to fully appear
 */
export function scrollInputIntoView(
  element: HTMLElement | null, 
  waitForStabilization = true
) {
  if (!element) return;
  
  const performScroll = () => {
    // Use requestAnimationFrame chain for reliable iOS timing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    });
  };
  
  if (waitForStabilization) {
    // Wait for keyboard to fully appear and viewport to stabilize
    setTimeout(performScroll, 350);
  } else {
    performScroll();
  }
}

/**
 * Hook version that auto-scrolls focused element when keyboard opens
 */
export function useAutoScrollOnKeyboard() {
  const { isKeyboardVisible, isStabilized } = useKeyboardAware();
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Track currently focused element
    const handleFocus = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        lastFocusedRef.current = e.target;
      }
    };
    
    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, []);

  // Scroll when keyboard opens AND viewport stabilizes
  useEffect(() => {
    if (isKeyboardVisible && isStabilized && lastFocusedRef.current) {
      scrollInputIntoView(lastFocusedRef.current, false);
    }
  }, [isKeyboardVisible, isStabilized]);
}
