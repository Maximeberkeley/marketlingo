import AsyncStorage from "@react-native-async-storage/async-storage";
import { REVIEW_GAPS } from "../lesson-kit/arena/buildArena";
import { quizQuestionKeys } from "./quizHistory";
import { localDateString, parseLocalDate } from "./dayMath";
import { log } from "./logger";
const REVIEW_XP = 10;
const REVIEW_ROUND_LIMIT = 5;
const LEDGER_LIMIT = 60;
const STAGES = REVIEW_GAPS.length;
const ledgerStorageKey = (userId, marketId) => `ml_review_v1/${userId}/${marketId}`;
function addDays(date, days) {
  const d = parseLocalDate(date);
  d.setDate(d.getDate() + days);
  return localDateString(d);
}
function daysBetween(from, to) {
  const a = parseLocalDate(from);
  const b = parseLocalDate(to);
  return Math.round((b.getTime() - a.getTime()) / 864e5);
}
const entryKey = (exercise) => quizQuestionKeys(exercise)[0] || exercise.id;
function isReviewable(exercise) {
  return exercise.kind === "multipleChoice" || exercise.kind === "theCall" || exercise.kind === "numberSense" || exercise.kind === "faceOff" || exercise.kind === "spotFake" || exercise.kind === "buildChain" || exercise.kind === "mapMarket";
}
function parseLedger(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((row) => Boolean(row && typeof row.key === "string" && row.exercise && typeof row.due === "string" && typeof row.stage === "number" && typeof row.missed === "string"));
}
function recordMisses(entries, missed, today) {
  let next = [...entries];
  for (const exercise of missed) {
    if (!isReviewable(exercise)) continue;
    const key = entryKey(exercise);
    const source = exercise.source?.type === "lesson" ? exercise.source : null;
    const entry = {
      key,
      exercise: { ...exercise, id: `rv-${key.slice(0, 40)}` },
      title: source?.title || "From the industry",
      day: typeof source?.day === "number" ? source.day : null,
      stage: 0,
      due: addDays(today, REVIEW_GAPS[0]),
      missed: today
    };
    next = [...next.filter((row) => row.key !== key), entry];
  }
  if (next.length > LEDGER_LIMIT) next = next.sort((a, b) => b.due.localeCompare(a.due)).slice(0, LEDGER_LIMIT);
  return next;
}
function dueEntries(entries, today) {
  return entries.filter((row) => row.due <= today).sort((a, b) => a.due.localeCompare(b.due) || a.stage - b.stage);
}
function nextDue(entries, today) {
  const later = entries.filter((row) => row.due > today).map((row) => row.due).sort();
  return later[0] ?? null;
}
function applyReview(entries, results, today) {
  const out = [];
  for (const row of entries) {
    if (!(row.key in results)) {
      out.push(row);
      continue;
    }
    if (!results[row.key]) {
      out.push({ ...row, stage: 0, due: addDays(today, REVIEW_GAPS[0]), missed: today });
    } else if (row.stage + 1 < STAGES) {
      const stage = row.stage + 1;
      out.push({ ...row, stage, due: addDays(today, REVIEW_GAPS[stage]) });
    }
  }
  return out;
}
function dueMeta(entry, today) {
  const late = daysBetween(entry.due, today);
  const since = daysBetween(entry.missed, today);
  const day = entry.day !== null ? `Day ${entry.day}` : "Industry";
  const when = entry.stage === 0 && since === 1 ? "missed yesterday" : late > 1 ? `${late} days late` : "due today";
  return `${day} \xB7 ${when}`;
}
function reviewWave(due, limit = REVIEW_ROUND_LIMIT) {
  const picked = due.slice(0, limit);
  if (!picked.length) return null;
  const keys = {};
  const exercises = picked.map((entry, i) => {
    const id = `review-${i}`;
    keys[id] = entry.key;
    return { ...entry.exercise, id };
  });
  return {
    wave: {
      key: "review",
      name: "Worth another look",
      tagline: "Questions that got away. Answer them now and they come back less often.",
      seconds: 30,
      multiplier: 1,
      exercises,
      covers: "From lessons you studied."
    },
    keys
  };
}
async function loadLedger(userId, marketId) {
  try {
    const raw = await AsyncStorage.getItem(ledgerStorageKey(userId, marketId));
    return parseLedger(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}
async function saveLedger(userId, marketId, entries) {
  await AsyncStorage.setItem(ledgerStorageKey(userId, marketId), JSON.stringify(entries));
}
function withLessonSource(exercises, source) {
  if (!source) return exercises;
  return exercises.map((e) => e.source ? e : { ...e, source: { type: "lesson", day: source.day ?? null, title: source.title } });
}
async function fileMisses(userId, marketId, missed, today = localDateString()) {
  if (!userId || !marketId || !missed.length) return;
  try {
    const ledger = await loadLedger(userId, marketId);
    await saveLedger(userId, marketId, recordMisses(ledger, missed, today));
  } catch (error) {
    log.warn("[Review] Could not file the misses for review:", error);
  }
}
export {
  LEDGER_LIMIT,
  REVIEW_ROUND_LIMIT,
  REVIEW_XP,
  STAGES,
  addDays,
  applyReview,
  daysBetween,
  dueEntries,
  dueMeta,
  fileMisses,
  isReviewable,
  ledgerStorageKey,
  loadLedger,
  nextDue,
  parseLedger,
  recordMisses,
  reviewWave,
  saveLedger,
  withLessonSource
};
