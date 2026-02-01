import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component - resets scroll position to top on route change
 * Must be placed inside BrowserRouter
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to absolute top immediately on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" as ScrollBehavior,
    });
    
    // Also reset any scrollable containers
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}

export default ScrollToTop;
