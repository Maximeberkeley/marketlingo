import { createContext, useCallback, useContext, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';
import { revealDelta } from './answerState';

type Reveal = (node: View | null) => void;

const RevealCorrectContext = createContext<Reveal | null>(null);

/** Wraps a question's content so its graded right answer can ask to be scrolled into view. */
export const RevealCorrectProvider = RevealCorrectContext.Provider;

export function useRevealCorrectTarget(): Reveal | null {
  return useContext(RevealCorrectContext);
}

/**
 * Once a question is graded the feedback panel takes space from the question,
 * which can push the right answer off screen. This scrolls just enough to show it.
 */
export function useRevealCorrect(scrollRef: React.RefObject<ScrollView | null>) {
  const offset = useRef(0);
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = event.nativeEvent.contentOffset.y;
  }, []);
  const reveal = useCallback<Reveal>(node => {
    const scroll: any = (scrollRef.current as any)?.getNativeScrollRef?.() ?? scrollRef.current;
    if (!node?.measureInWindow || !scroll?.measureInWindow) return;
    node.measureInWindow((_x, y, _w, h) => {
      scroll.measureInWindow((_sx: number, sy: number, _sw: number, sh: number) => {
        const delta = revealDelta({ top: y, height: h }, { top: sy, height: sh });
        if (delta) scrollRef.current?.scrollTo({ y: Math.max(0, offset.current + delta), animated: true });
      });
    });
  }, [scrollRef]);
  return { onScroll, reveal };
}
