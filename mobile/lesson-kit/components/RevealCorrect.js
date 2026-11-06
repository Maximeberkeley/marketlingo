import { createContext, useCallback, useContext, useRef } from "react";
import { revealDelta } from "./answerState";
const RevealCorrectContext = createContext(null);
const RevealCorrectProvider = RevealCorrectContext.Provider;
function useRevealCorrectTarget() {
  return useContext(RevealCorrectContext);
}
function useRevealCorrect(scrollRef) {
  const offset = useRef(0);
  const onScroll = useCallback((event) => {
    offset.current = event.nativeEvent.contentOffset.y;
  }, []);
  const reveal = useCallback((node) => {
    const scroll = scrollRef.current?.getNativeScrollRef?.() ?? scrollRef.current;
    if (!node?.measureInWindow || !scroll?.measureInWindow) return;
    node.measureInWindow((_x, y, _w, h) => {
      scroll.measureInWindow((_sx, sy, _sw, sh) => {
        const delta = revealDelta({ top: y, height: h }, { top: sy, height: sh });
        if (delta) scrollRef.current?.scrollTo({ y: Math.max(0, offset.current + delta), animated: true });
      });
    });
  }, [scrollRef]);
  return { onScroll, reveal };
}
export {
  RevealCorrectProvider,
  useRevealCorrect,
  useRevealCorrectTarget
};
