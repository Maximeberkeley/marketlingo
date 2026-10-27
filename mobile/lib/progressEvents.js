const xpListeners = /* @__PURE__ */ new Set();
const progressListeners = /* @__PURE__ */ new Set();
function emitXP(row) {
  xpListeners.forEach((l) => {
    try {
      l(row);
    } catch {
    }
  });
}
function emitProgress(row) {
  progressListeners.forEach((l) => {
    try {
      l(row);
    } catch {
    }
  });
}
function onXP(l) {
  xpListeners.add(l);
  return () => {
    xpListeners.delete(l);
  };
}
function onProgress(l) {
  progressListeners.add(l);
  return () => {
    progressListeners.delete(l);
  };
}
export {
  emitProgress,
  emitXP,
  onProgress,
  onXP
};
