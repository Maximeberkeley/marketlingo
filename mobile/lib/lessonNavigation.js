import React, { createContext, useContext, useLayoutEffect, useState } from "react";
const LessonNavigationContext = createContext({ hidden: false, setHidden: (_hidden) => {
} });
function LessonNavigationProvider({ children }) {
  const [hidden, setHidden] = useState(false);
  return /* @__PURE__ */ React.createElement(LessonNavigationContext.Provider, { value: { hidden, setHidden } }, children);
}
const useLessonNavigation = () => useContext(LessonNavigationContext);
function useLessonTabsHidden(active) {
  const { setHidden } = useLessonNavigation();
  useLayoutEffect(() => {
    setHidden(active);
    return () => setHidden(false);
  }, [active, setHidden]);
}
export {
  LessonNavigationProvider,
  useLessonNavigation,
  useLessonTabsHidden
};
