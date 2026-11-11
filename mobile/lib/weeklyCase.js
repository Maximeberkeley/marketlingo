const WEEKLY_CASE_XP = 200;
const SUGGESTED_MINUTES = 10;
const MIN_PART_WORDS = 3;
const HARD_CAP_FACTOR = 2;
const str = (v) => typeof v === "string" ? v : "";
function caseFromRow(row) {
  const c = row.content && typeof row.content === "object" ? row.content : {};
  const parts = (Array.isArray(c.response?.parts) ? c.response.parts : []).filter((p) => p && typeof p.id === "string").map((p) => ({ id: p.id, label: str(p.label), prompt: str(p.prompt), maxWords: Number(p.max_words) || 120, minutes: Number(p.minutes) || 2 }));
  const exhibits = (Array.isArray(c.exhibits) ? c.exhibits : []).filter((e) => e && Array.isArray(e.columns) && Array.isArray(e.rows)).map((e) => ({ id: str(e.id), title: str(e.title), note: typeof e.note === "string" ? e.note : null, columns: e.columns.map(String), rows: e.rows.map((r) => r.map(String)) }));
  return {
    id: row.id,
    weekStart: row.week_start,
    marketId: row.market_id,
    kind: row.kind === "startup" ? "startup" : "original",
    presentedBy: row.presented_by || "MarketLingo",
    title: row.title,
    topic: row.topic,
    hook: str(c.hook),
    tension: str(c.tension),
    disclosure: str(c.disclosure),
    asOf: typeof c.as_of === "string" ? c.as_of : null,
    brief: (Array.isArray(c.brief) ? c.brief : []).map(String),
    exhibits,
    question: str(c.question?.text),
    parts,
    sources: Array.isArray(c.sources) ? c.sources : [],
    opensAt: Date.parse(row.opens_at),
    closesAt: Date.parse(row.closes_at)
  };
}
const presenter = (c) => c.kind === "startup" ? c.presentedBy : null;
function phaseOf(c, now) {
  if (now < c.opensAt) return "upcoming";
  return now < c.closesAt ? "open" : "closed";
}
function pickCases(cases, now) {
  const opened = cases.filter((c) => c.opensAt <= now).sort((a, b) => b.opensAt - a.opensAt);
  return { current: opened[0] ?? null, previous: opened[1] ?? null };
}
const DAY = 864e5;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function countdown(ms) {
  if (ms < 6e4) return "under a minute";
  const minutes = Math.floor(ms / 6e4);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor(minutes % 1440 / 60);
  if (days >= 1) return hours ? `${days}d ${hours}h` : `${days}d`;
  if (hours >= 1) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}
function resultsDay(at, now) {
  const r = new Date(at);
  const n = new Date(now);
  const sameDay = r.getFullYear() === n.getFullYear() && r.getMonth() === n.getMonth() && r.getDate() === n.getDate();
  return sameDay ? "today" : WEEKDAYS[r.getDay()];
}
function weekNumber(weekStart) {
  const d = /* @__PURE__ */ new Date(`${weekStart}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - first.getTime()) / DAY - 3 + (first.getUTCDay() + 6) % 7) / 7);
}
const countWords = (text) => (text.trim().match(/\S+/g) ?? []).length;
function suggestedMinutes(c) {
  if (!c.parts.length) return SUGGESTED_MINUTES;
  const reading = countWords([...c.brief, c.question, ...c.parts.map((p) => p.prompt), ...c.exhibits.flatMap((e) => [e.title, ...e.rows.flat()])].join(" ")) / 200;
  const writing = c.parts.reduce((n, p) => n + p.minutes, 0);
  return Math.min(15, Math.max(5, Math.round(reading + writing)));
}
function weeklyCardInfo(input) {
  const { now, current } = input;
  const extra = input.previous && input.previous.score !== null ? { label: `Last week: ${Math.round(input.previous.score)} / 100 \xB7 See results`, path: `/weekly-case-results?id=${input.previous.case.id}` } : void 0;
  if (!current) {
    return { kind: "none", title: "Next case Monday", state: { before: "A new business problem every week." }, button: null, path: "/weekly-case", tile: { icon: "calendar", label: "SOON" }, extra };
  }
  const byline = presenter(current) ? `Presented by ${current.presentedBy}` : void 0;
  const tile = { icon: "calendar", label: `WEEK ${weekNumber(current.weekStart)}` };
  const phase = phaseOf(current, now);
  if (phase === "closed" && input.submitted) {
    return {
      kind: "results",
      title: current.title,
      byline,
      tile: { ...tile, icon: "award" },
      state: input.score != null ? { before: "You scored ", bold: `${Math.round(input.score)} / 100` } : { before: "Your results are ready." },
      button: "See results",
      path: `/weekly-case-results?id=${current.id}`,
      extra
    };
  }
  if (input.submitted) {
    return {
      kind: "submitted",
      title: current.title,
      byline,
      tile: { ...tile, icon: "check-circle" },
      state: { before: `Submitted \xB7 results ${resultsDay(current.closesAt, now)}` },
      button: null,
      path: "/weekly-case",
      extra
    };
  }
  if (phase === "open") {
    return {
      kind: "open",
      title: current.title,
      byline,
      tile,
      state: { bold: `Closes in ${countdown(current.closesAt - now)}`, after: ` \xB7 about ${suggestedMinutes(current)} min` },
      button: "Start the case",
      path: "/weekly-case",
      extra
    };
  }
  return { kind: "none", title: "Next case Monday", state: { before: "This week\u2019s case has closed." }, button: null, path: "/weekly-case", tile: { icon: "calendar", label: "SOON" }, extra };
}
const emptyAnswers = (parts) => Object.fromEntries(parts.map((p) => [p.id, ""]));
const totalWords = (answers) => Object.values(answers).reduce((n, t) => n + countWords(t), 0);
const hardCap = (part) => part.maxWords * HARD_CAP_FACTOR;
function partStatus(text, part) {
  const n = countWords(text);
  if (n === 0) return "empty";
  if (n < MIN_PART_WORDS) return "short";
  if (n > hardCap(part)) return "toolong";
  return n > part.maxWords ? "over" : "ok";
}
function blockingParts(answers, parts) {
  return parts.filter((p) => {
    const s = partStatus(answers[p.id] ?? "", p);
    return s === "empty" || s === "short" || s === "toolong";
  }).map((p) => p.id);
}
const canSubmit = (answers, parts) => parts.length > 0 && blockingParts(answers, parts).length === 0;
function timerLabel(elapsedMs, suggested = SUGGESTED_MINUTES) {
  const total = suggested * 6e4;
  const diff = Math.abs(total - Math.max(0, elapsedMs));
  const m = Math.floor(diff / 6e4);
  const s = Math.floor(diff % 6e4 / 1e3);
  const clock = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return elapsedMs > total ? { text: `+${clock}`, over: true } : { text: clock, over: false };
}
const draftKey = (userId, caseId) => `ml_weekly_draft_v2/${userId}/${caseId}`;
function parseDraft(raw, parts) {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object" || typeof v.answers !== "object") return null;
    const answers = emptyAnswers(parts);
    for (const p of parts) answers[p.id] = typeof v.answers?.[p.id] === "string" ? v.answers[p.id].slice(0, hardCap(p) * 16) : "";
    return { answers, startedAt: typeof v.startedAt === "number" ? v.startedAt : null, savedAt: Number(v.savedAt) || 0 };
  } catch {
    return null;
  }
}
function scoreHeadline(score) {
  if (score >= 85) return "A plan you could pitch.";
  if (score >= 70) return "Strong thinking. A few sharp edges left.";
  if (score >= 50) return "A solid start. Tighten the numbers.";
  return "Good try. Start from the numbers next time.";
}
function shareText(title, score, rank, friends) {
  const place = rank && friends > 1 ? ` I came #${rank} of ${friends} among my friends.` : "";
  return `I scored ${Math.round(score)}/100 on this week's MarketLingo case: "${title}".${place}`;
}
export {
  HARD_CAP_FACTOR,
  MIN_PART_WORDS,
  SUGGESTED_MINUTES,
  WEEKLY_CASE_XP,
  blockingParts,
  canSubmit,
  caseFromRow,
  countWords,
  countdown,
  draftKey,
  emptyAnswers,
  hardCap,
  parseDraft,
  partStatus,
  phaseOf,
  pickCases,
  presenter,
  resultsDay,
  scoreHeadline,
  shareText,
  suggestedMinutes,
  timerLabel,
  totalWords,
  weekNumber,
  weeklyCardInfo
};
