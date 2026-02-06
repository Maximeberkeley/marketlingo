import { useState, useEffect, useCallback } from 'react';

interface KeyboardState {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  viewportHeight: number;
}

/**
 * Hook that uses visualViewport API to detect real keyboard presence on iOS/Android
 * This is the ONLY reliable way to get actual keyboard height on mobile browsers
 */
export function useKeyboardAware(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    isKeyboardVisible: false,
    keyboardHeight: 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const visualViewport = window.visualViewport;
    if (!visualViewport) {
      // Fallback for browsers without visualViewport
      setState({
        isKeyboardVisible: false,
        keyboardHeight: 0,
        viewportHeight: window.innerHeight,
      });
      return;
    }

    const windowHeight = window.innerHeight;
    const viewportHeight = visualViewport.height;
    
    // Keyboard is visible if visual viewport is significantly smaller than window
    // Use 150px threshold to avoid false positives from address bar changes
    const heightDiff = windowHeight - viewportHeight;
    const isKeyboardVisible = heightDiff > 150;
    
    setState({
      isKeyboardVisible,
      keyboardHeight: isKeyboardVisible ? heightDiff : 0,
      viewportHeight,
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const visualViewport = window.visualViewport;
    
    // Initial update
    updateViewport();

    if (visualViewport) {
      // Use visualViewport resize event - most reliable
      visualViewport.addEventListener('resize', updateViewport);
      visualViewport.addEventListener('scroll', updateViewport);
      
      return () => {
        visualViewport.removeEventListener('resize', updateViewport);
        visualViewport.removeEventListener('scroll', updateViewport);
      };
    } else {
      // Fallback: listen for focus/blur on inputs
      const handleFocus = (e: FocusEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          // Estimate keyboard height on focus (fallback)
          setTimeout(() => {
            setState(prev => ({
              ...prev,
              isKeyboardVisible: true,
              keyboardHeight: 300, // Approximate iOS keyboard height
            }));
          }, 300);
        }
      };

      const handleBlur = () => {
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            isKeyboardVisible: false,
            keyboardHeight: 0,
          }));
        }, 100);
      };

      document.addEventListener('focusin', handleFocus);
      document.addEventListener('focusout', handleBlur);

      return () => {
        document.removeEventListener('focusin', handleFocus);
        document.removeEventListener('focusout', handleBlur);
      };
    }
  }, [updateViewport]);

  return state;
}

/**
 * Utility to scroll an input into view when keyboard appears
 * Call this in onFocus of inputs near the bottom of the screen
 */
export function scrollInputIntoView(element: HTMLElement | null, delay = 300) {
  if (!element) return;
  
  setTimeout(() => {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, delay);
}
