import React, { createContext, useContext, useLayoutEffect, useState } from 'react';

const LessonNavigationContext = createContext({ hidden: false, setHidden: (_hidden: boolean) => {} });

export function LessonNavigationProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  return <LessonNavigationContext.Provider value={{ hidden, setHidden }}>{children}</LessonNavigationContext.Provider>;
}

export const useLessonNavigation = () => useContext(LessonNavigationContext);

export function useLessonTabsHidden(active: boolean) {
  const { setHidden } = useLessonNavigation();
  useLayoutEffect(() => {
    setHidden(active);
    return () => setHidden(false);
  }, [active, setHidden]);
}