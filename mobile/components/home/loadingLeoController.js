const LOADING_LEO_TIMING = {
  /** Loads faster than this never show Leo at all. */
  showDelayMs: 250,
  fadeInMs: 200,
  /** How long Leo waits after one loading step ends, so the next step can take over without a gap. */
  handoffMs: 150,
  fadeOutMs: 180
};
const globalTimers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id)
};
function createLoadingLeoController(callbacks, timers = globalTimers) {
  let count = 0;
  let state = "hidden";
  let showTimer = null;
  let hideTimer = null;
  const clearShow = () => {
    if (showTimer !== null) {
      timers.clearTimeout(showTimer);
      showTimer = null;
    }
  };
  const clearHide = () => {
    if (hideTimer !== null) {
      timers.clearTimeout(hideTimer);
      hideTimer = null;
    }
  };
  return {
    add() {
      count += 1;
      clearHide();
      if (state === "hidden") {
        state = "waiting";
        showTimer = timers.setTimeout(() => {
          showTimer = null;
          if (count > 0) {
            state = "shown";
            callbacks.show();
          } else {
            state = "hidden";
          }
        }, LOADING_LEO_TIMING.showDelayMs);
      } else if (state === "hiding") {
        state = "shown";
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
        if (state === "waiting") {
          clearShow();
          state = "hidden";
          return;
        }
        if (state === "shown") {
          state = "hiding";
          callbacks.hide();
        }
      }, LOADING_LEO_TIMING.handoffMs);
    },
    /** The fade-out finished. */
    hidden() {
      if (state !== "hiding" || count > 0) return;
      state = "hidden";
      callbacks.unmount();
    },
    dispose() {
      clearShow();
      clearHide();
      count = 0;
      state = "hidden";
    },
    get state() {
      return state;
    }
  };
}
export {
  LOADING_LEO_TIMING,
  createLoadingLeoController
};
