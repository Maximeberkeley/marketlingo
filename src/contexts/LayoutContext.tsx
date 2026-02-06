import { createContext, useContext, ReactNode } from 'react';

interface LayoutContextValue {
  /** Whether bottom navigation is currently visible */
  hasBottomNav: boolean;
  /** Whether this is inside a modal context */
  isInModal: boolean;
}

const LayoutContext = createContext<LayoutContextValue>({
  hasBottomNav: true,
  isInModal: false,
});

interface LayoutProviderProps {
  children: ReactNode;
  hasBottomNav?: boolean;
  isInModal?: boolean;
}

/**
 * Provides layout context for child components to know:
 * - If bottom nav is present (for proper spacing)
 * - If we're inside a modal (for safe area handling)
 */
export function LayoutProvider({ 
  children, 
  hasBottomNav = true,
  isInModal = false,
}: LayoutProviderProps) {
  return (
    <LayoutContext.Provider value={{ hasBottomNav, isInModal }}>
      {children}
    </LayoutContext.Provider>
  );
}

/**
 * Hook to access layout context
 */
export function useLayoutContext() {
  return useContext(LayoutContext);
}
