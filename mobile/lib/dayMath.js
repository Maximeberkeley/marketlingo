function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}
function localDateString(date = /* @__PURE__ */ new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function nextLocalMidnightISOString(date = /* @__PURE__ */ new Date()) {
  const next = new Date(date);
  next.setHours(24, 0, 0, 0);
  return next.toISOString();
}
function streakCountdownLabel(streak, lessonDone, date = /* @__PURE__ */ new Date()) {
  if (streak <= 0 || lessonDone) return null;
  const midnight = new Date(date);
  midnight.setHours(24, 0, 0, 0);
  const minutes = Math.ceil((midnight.getTime() - date.getTime()) / 6e4);
  if (minutes <= 0 || minutes > 90) return null;
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}
function calculateAvailableDay(startDate) {
  if (!startDate) return 1;
  const start = parseLocalDate(startDate);
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - start.getTime()) / 864e5);
  return Math.min(180, Math.max(1, diffDays + 1));
}
export {
  calculateAvailableDay,
  localDateString,
  nextLocalMidnightISOString,
  parseLocalDate,
  streakCountdownLabel
};
