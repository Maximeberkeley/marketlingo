function leoAnimationDelay(kind, random = Math.random()) {
  return kind === "peek" ? 12e3 + Math.floor(random * 8e3) : 1e4 + Math.floor(random * 5e3);
}
function leoDoneKey(userId, marketId, localDay) {
  return `@marketlingo/leo-done-anim/${userId ?? "guest"}/${marketId}/${localDay}`;
}
function leoCallClip(isGenerating, isSpeaking) {
  return isGenerating ? "leo-call-think" : isSpeaking ? "leo-call-talk" : "leo-call-listen";
}
export {
  leoAnimationDelay,
  leoCallClip,
  leoDoneKey
};
