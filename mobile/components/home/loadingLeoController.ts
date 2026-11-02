/** Timing for Home's loading Leo. */
export const LOADING_LEO_TIMING = {
  /** Loads faster than this never show Leo at all. */
  showDelayMs: 250,
  fadeInMs: 200,
  /** How long Leo waits after one loading step ends, so the next step can take over without a gap. */
  handoffMs: 150,
  fadeOutMs: 180,
};

export interface LoadingLeoCallbacks {
  /** Mount Leo (if needed) and fade him in. */
  show: () => void;
  /** Fade Leo out; call `hidden()` when the fade finishes. */
  hide: () => void;
  /** Remove Leo from the screen. */
  unmount: () => void;
}

type Timers = { setTimeout: (fn: () => void, ms: number) => unknown; clearTimeout: (id: any) => void };

// Call the global timers directly: calling them as methods of another object throws "Illegal invocation".
const globalTimers: Timers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: id => clearTimeout(id),
};

/**
 * Counts the loading screens currently asking for Leo, so one Leo can serve
 * several loading steps in a row without disappearing in between.
 */
export function createLoadingLeoController(callbacks: LoadingLeoCallbacks, timers: Timers = globalTimers) {
  let count = 0;
  let state: 'hidden' | 'waiting' | 'shown' | 'hiding' = 'hidden';
  let showTimer: unknown = null;
  let hideTimer: unknown = null;
  const clearShow = () => { if (showTimer !== null) { timers.clearTimeout(showTimer); showTimer = null; } };
  const clearHide = () => { if (hideTimer !== null) { timers.clearTimeout(hideTimer); hideTimer = null; } };

  return {
    add() {
      count += 1;
      clearHide();
      if (state === 'hidden') {
        state = 'waiting';
        showTimer = timers.setTimeout(() => {
          showTimer = null;
          if (count > 0) { state = 'shown'; callbacks.show(); } else { state = 'hidden'; }
        }, LOADING_LEO_TIMING.showDelayMs);
      } else if (state === 'hiding') {
        // Loading started again while Leo was fading out: bring him straight back.
        state = 'shown';
        callbacks.show();
      }
    },
    remove() {
      count = Math.max(0, count - 1);
      if (count > 0) return;
      clearHide();
      hideTimer = timers.setTimeout(() => {
        hideTimer = null;
        if (count > 0) return;
        if (state === 'waiting') { clearShow(); state = 'hidden'; return; }
        if (state === 'shown') { state = 'hiding'; callbacks.hide(); }
      }, LOADING_LEO_TIMING.handoffMs);
    },
    /** The fade-out finished. */
    hidden() {
      if (state !== 'hiding' || count > 0) return;
      state = 'hidden';
      callbacks.unmount();
    },
    dispose() {
      clearShow();
      clearHide();
      count = 0;
      state = 'hidden';
    },
    get state() { return state; },
  };
}
