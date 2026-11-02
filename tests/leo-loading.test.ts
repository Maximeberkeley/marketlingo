import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLoadingLeoController, LOADING_LEO_TIMING } from '../mobile/components/home/loadingLeoController';

const { showDelayMs, handoffMs } = LOADING_LEO_TIMING;

function setup() {
  const show = vi.fn(); const hide = vi.fn(); const unmount = vi.fn();
  const c = createLoadingLeoController({ show, hide, unmount });
  return { c, show, hide, unmount };
}

describe('Home loading Leo', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('never shows Leo for a fast load', () => {
    const { c, show } = setup();
    c.add(); vi.advanceTimersByTime(200); c.remove(); vi.advanceTimersByTime(1000);
    expect(show).not.toHaveBeenCalled();
    expect(c.state).toBe('hidden');
  });

  it('shows Leo once after the delay for a slow load', () => {
    const { c, show } = setup();
    c.add(); vi.advanceTimersByTime(showDelayMs - 1); expect(show).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); expect(show).toHaveBeenCalledTimes(1);
  });

  it('keeps the same Leo through a hand-off between loading steps (no hide, no second show)', () => {
    const { c, show, hide } = setup();
    c.add(); vi.advanceTimersByTime(1000);
    c.remove(); c.add();                 // Home's boot skeleton hands over to the course skeleton
    vi.advanceTimersByTime(1000);
    c.remove(); vi.advanceTimersByTime(handoffMs - 1); c.add();   // a later step starts just in time
    vi.advanceTimersByTime(1000);
    expect(show).toHaveBeenCalledTimes(1);
    expect(hide).not.toHaveBeenCalled();
  });

  it('keeps counting the delay across a hand-off before Leo appears', () => {
    const { c, show } = setup();
    c.add(); vi.advanceTimersByTime(150);
    c.remove(); c.add();
    vi.advanceTimersByTime(showDelayMs - 150); expect(show).toHaveBeenCalledTimes(1);
  });

  it('fades out after the last step ends, then unmounts', () => {
    const { c, hide, unmount } = setup();
    c.add(); vi.advanceTimersByTime(1000); c.remove();
    vi.advanceTimersByTime(handoffMs - 1); expect(hide).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); expect(hide).toHaveBeenCalledTimes(1);
    c.hidden(); expect(unmount).toHaveBeenCalledTimes(1); expect(c.state).toBe('hidden');
  });

  it('brings Leo straight back if loading restarts while he fades out', () => {
    const { c, show, unmount } = setup();
    c.add(); vi.advanceTimersByTime(1000); c.remove(); vi.advanceTimersByTime(handoffMs);
    c.add(); expect(show).toHaveBeenCalledTimes(2);
    c.hidden(); expect(unmount).not.toHaveBeenCalled();
  });
});
