/**
 * Live XP / streak broadcast. Each screen owns its own useUserXP/useUserProgress
 * state, so when XP is earned on one screen every other mounted copy is updated
 * in the background without waiting for a focus or remount.
 */
type XPListener = (row: any | null) => void;
type ProgressListener = (row: any | null) => void;

const xpListeners = new Set<XPListener>();
const progressListeners = new Set<ProgressListener>();

/** row = fresh user_xp row, or null meaning "refetch from server". */
export function emitXP(row: any | null) {
  xpListeners.forEach((l) => { try { l(row); } catch { /* listener errors never block earning */ } });
}
export function emitProgress(row: any | null) {
  progressListeners.forEach((l) => { try { l(row); } catch { /* noop */ } });
}
export function onXP(l: XPListener) { xpListeners.add(l); return () => { xpListeners.delete(l); }; }
export function onProgress(l: ProgressListener) { progressListeners.add(l); return () => { progressListeners.delete(l); }; }
