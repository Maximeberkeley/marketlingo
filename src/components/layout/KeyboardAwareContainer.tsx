import { ReactNode, useEffect, useRef } from "react";
import { useKeyboardAware } from "@/hooks/useKeyboardAware";
import { cn } from "@/lib/utils";

interface KeyboardAwareContainerProps {
  children: ReactNode;
  className?: string;
  /** Auto-scroll focused input into view */
  autoScroll?: boolean;
}

/**
 * Container that responds to keyboard visibility on iOS/Android
 * Automatically adjusts its max-height when keyboard appears
 * 
 * Use this to wrap forms or content with inputs near the bottom
 */
export function KeyboardAwareContainer({ 
  children, 
  className,
  autoScroll = true,
}: KeyboardAwareContainerProps) {
  const { isKeyboardVisible, keyboardHeight, viewportHeight } = useKeyboardAware();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll focused element into view when keyboard appears
  useEffect(() => {
    if (!autoScroll || !isKeyboardVisible) return;
    
    const focusedElement = document.activeElement as HTMLElement;
    if (focusedElement && (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA')) {
      setTimeout(() => {
        focusedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [isKeyboardVisible, autoScroll]);

  return (
    <div
      ref={containerRef}
      className={cn("transition-all duration-200", className)}
      style={{
        // Reduce max-height when keyboard is visible
        maxHeight: isKeyboardVisible 
          ? `${viewportHeight}px`
          : undefined,
        // Prevent content from being pushed off-screen
        overflow: isKeyboardVisible ? 'auto' : undefined,
      }}
    >
      {children}
    </div>
  );
}
