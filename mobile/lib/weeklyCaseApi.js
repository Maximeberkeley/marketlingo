import { supabase } from "./supabase";
import { log } from "./logger";
import {
  caseFromRow
} from "./weeklyCase";
async function loadOpenedCases(now = Date.now()) {
  const { data, error } = await supabase.from("weekly_cases").select("*").lte("opens_at", new Date(now).toISOString()).order("opens_at", { ascending: false }).limit(8);
  if (error) throw error;
  return (data ?? []).map(caseFromRow);
}
async function loadCaseById(id) {
  const { data, error } = await supabase.from("weekly_cases").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? caseFromRow(data) : null;
}
async function loadMySubmissions(userId, caseIds) {
  if (!caseIds.length) return [];
  const { data, error } = await supabase.from("weekly_case_submissions").select("case_id, answers, released_at, submitted_at").eq("user_id", userId).eq("status", "submitted").in("case_id", caseIds);
  if (error) throw error;
  return data ?? [];
}
async function loadResult(caseId) {
  const { data, error } = await supabase.rpc("get_weekly_case_result", { p_case_id: caseId });
  if (error) throw error;
  return data ?? { state: "none" };
}
async function loadReveal(caseId) {
  const { data, error } = await supabase.rpc("get_weekly_case_reveal", { p_case_id: caseId });
  if (error) throw error;
  return data ?? null;
}
async function loadBoard(caseId) {
  const { data, error } = await supabase.rpc("get_weekly_case_board", { p_case_id: caseId });
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, score: r.score === null ? null : Number(r.score), rank: r.rank === null ? null : Number(r.rank) }));
}
async function submitAnswers(caseId, answers, seconds) {
  const { data, error } = await supabase.rpc("submit_weekly_case", { p_case_id: caseId, p_answers: answers, p_seconds: Math.round(seconds) });
  if (error) {
    const m = String(error.message || "");
    if (m.includes("case_closed")) return { ok: false, reason: "closed" };
    if (m.includes("case_not_available")) return { ok: false, reason: "unavailable" };
    const bad = m.match(/too_(?:short|long):(\w+)/);
    if (bad) return { ok: false, reason: "invalid", field: bad[1] };
    log.warn("[WeeklyCase] submit failed", error);
    return { ok: false, reason: "network" };
  }
  return { ok: true, created: Boolean(data?.created) };
}
function requestScoring(caseId) {
  supabase.functions.invoke("weekly-case", { body: { action: "score", caseId } }).catch((error) => log.warn("[WeeklyCase] scoring request failed", error));
}
async function requestRelease() {
  try {
    await supabase.functions.invoke("weekly-case", { body: { action: "release" } });
  } catch (error) {
    log.warn("[WeeklyCase] release request failed", error);
  }
}
async function xpAlreadyPaid(userId, caseId) {
  const { data, error } = await supabase.from("xp_transactions").select("id").eq("user_id", userId).eq("source_type", "weekly_case").eq("source_id", caseId).limit(1);
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}
export {
  loadBoard,
  loadCaseById,
  loadMySubmissions,
  loadOpenedCases,
  loadResult,
  loadReveal,
  requestRelease,
  requestScoring,
  submitAnswers,
  xpAlreadyPaid
};
