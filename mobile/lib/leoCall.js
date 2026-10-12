import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { localDateString } from "./dayMath";
const CALL_TYPE_LABEL = {
  explain: { title: "Explain it to Leo", subtitle: "Leo is curious. Teach him today\u2019s idea." },
  coffee: { title: "Coffee chat", subtitle: "Leo works in the industry. You ask the questions." },
  interview: { title: "Interview warm-up", subtitle: "Leo plays your interviewer." }
};
const CALL_XP = 15;
const CALL_SECONDS = 180;
const dayKey = (userId) => `ml_leo_call_day:${userId}`;
const rotationKey = (userId) => `ml_leo_call_rotation:${userId}`;
const ROTATION = ["explain", "coffee", "interview"];
async function hasCalledToday(userId, today = localDateString()) {
  if (!userId) return false;
  try {
    return await AsyncStorage.getItem(dayKey(userId)) === today;
  } catch {
    return false;
  }
}
async function markCalledToday(userId, today = localDateString()) {
  await AsyncStorage.setItem(dayKey(userId), today).catch(() => {
  });
}
async function nextCallType(userId) {
  if (!userId) return "explain";
  try {
    const raw = Number(await AsyncStorage.getItem(rotationKey(userId)));
    return ROTATION[(Number.isFinite(raw) ? raw : 0) % ROTATION.length];
  } catch {
    return "explain";
  }
}
async function advanceCallType(userId) {
  try {
    const raw = Number(await AsyncStorage.getItem(rotationKey(userId)));
    await AsyncStorage.setItem(rotationKey(userId), String(((Number.isFinite(raw) ? raw : 0) + 1) % ROTATION.length));
  } catch {
  }
}
function sentenceStarter(type, learnerTurns, takeaway) {
  const pools = {
    explain: [
      "The simple version is\u2026",
      "Think of it like\u2026",
      "It matters because\u2026",
      takeaway ? "The one thing to remember is\u2026" : "A real example would be\u2026"
    ],
    coffee: [
      "What does a normal week look like for you?",
      "What\u2019s the hardest problem your team is working on?",
      "What surprised you most when you joined?",
      "What would you learn first if you were me?"
    ],
    interview: [
      "In my last project, I\u2026",
      "The way I\u2019d approach that is\u2026",
      "A time I did that was when\u2026",
      "What I\u2019d bring to this role is\u2026"
    ]
  };
  const pool = pools[type];
  return pool[learnerTurns % pool.length];
}
async function invoke(body) {
  const { data, error } = await supabase.functions.invoke("leo-call", { body });
  if (error) {
    let message = "Leo couldn\u2019t connect. Try again in a moment.";
    try {
      const ctx = error.context;
      if (ctx && typeof ctx.json === "function") {
        const parsed = await ctx.json();
        if (parsed?.error) message = String(parsed.error);
      }
    } catch {
    }
    throw new Error(message);
  }
  return data;
}
function leoCallTurn(context, messages) {
  return invoke({ action: "turn", context, messages });
}
function leoCallRecap(context, messages) {
  return invoke({ action: "recap", context, messages });
}
export {
  CALL_SECONDS,
  CALL_TYPE_LABEL,
  CALL_XP,
  advanceCallType,
  hasCalledToday,
  leoCallRecap,
  leoCallTurn,
  markCalledToday,
  nextCallType,
  sentenceStarter
};
