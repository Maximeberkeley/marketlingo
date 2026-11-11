/**
 * Weekly Case: every call to the backend, in one place. The model never runs on the phone; scoring and
 * release are the weekly-case edge function, and a score only reaches this file once the server has released it.
 */
import { supabase } from './supabase';
import { log } from './logger';
import {
  caseFromRow, WeeklyAnswers, WeeklyBoardRow, WeeklyCase, WeeklyCaseRow, WeeklyResult, WeeklyReveal,
} from './weeklyCase';

export async function loadOpenedCases(now = Date.now()): Promise<WeeklyCase[]> {
  const { data, error } = await supabase
    .from('weekly_cases')
    .select('*')
    .lte('opens_at', new Date(now).toISOString())
    .order('opens_at', { ascending: false })
    .limit(8);
  if (error) throw error;
  return ((data ?? []) as WeeklyCaseRow[]).map(caseFromRow);
}

export async function loadCaseById(id: string): Promise<WeeklyCase | null> {
  const { data, error } = await supabase.from('weekly_cases').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? caseFromRow(data as WeeklyCaseRow) : null;
}

export interface MySubmission {
  case_id: string;
  answers: WeeklyAnswers;
  released_at: string | null;
  submitted_at: string;
}

export async function loadMySubmissions(userId: string, caseIds: string[]): Promise<MySubmission[]> {
  if (!caseIds.length) return [];
  const { data, error } = await supabase
    .from('weekly_case_submissions')
    .select('case_id, answers, released_at, submitted_at')
    .eq('user_id', userId)
    .eq('status', 'submitted')
    .in('case_id', caseIds);
  if (error) throw error;
  return (data ?? []) as MySubmission[];
}

export async function loadResult(caseId: string): Promise<WeeklyResult> {
  const { data, error } = await supabase.rpc('get_weekly_case_result', { p_case_id: caseId });
  if (error) throw error;
  return (data ?? { state: 'none' }) as WeeklyResult;
}

/** The model answer and common traps: the server returns null until the case has closed. */
export async function loadReveal(caseId: string): Promise<WeeklyReveal | null> {
  const { data, error } = await supabase.rpc('get_weekly_case_reveal', { p_case_id: caseId });
  if (error) throw error;
  return (data ?? null) as WeeklyReveal | null;
}

export async function loadBoard(caseId: string): Promise<WeeklyBoardRow[]> {
  const { data, error } = await supabase.rpc('get_weekly_case_board', { p_case_id: caseId });
  if (error) throw error;
  return ((data ?? []) as WeeklyBoardRow[]).map(r => ({ ...r, score: r.score === null ? null : Number(r.score), rank: r.rank === null ? null : Number(r.rank) }));
}

export type SubmitOutcome =
  | { ok: true; created: boolean }
  | { ok: false; reason: 'closed' | 'unavailable' | 'invalid' | 'network'; field?: string };

/** The server decides everything: the window, the limits, and that a learner submits once. */
export async function submitAnswers(caseId: string, answers: WeeklyAnswers, seconds: number): Promise<SubmitOutcome> {
  const { data, error } = await supabase.rpc('submit_weekly_case', { p_case_id: caseId, p_answers: answers, p_seconds: Math.round(seconds) });
  if (error) {
    const m = String(error.message || '');
    if (m.includes('case_closed')) return { ok: false, reason: 'closed' };
    if (m.includes('case_not_available')) return { ok: false, reason: 'unavailable' };
    const bad = m.match(/too_(?:short|long):(\w+)/);
    if (bad) return { ok: false, reason: 'invalid', field: bad[1] };
    log.warn('[WeeklyCase] submit failed', error);
    return { ok: false, reason: 'network' };
  }
  return { ok: true, created: Boolean((data as { created?: boolean } | null)?.created) };
}

/** Asks the server to grade this learner's answer now; the score stays hidden until release. Never blocks the UI. */
export function requestScoring(caseId: string): void {
  supabase.functions.invoke('weekly-case', { body: { action: 'score', caseId } })
    .catch((error: unknown) => log.warn('[WeeklyCase] scoring request failed', error));
}

/** Lets the server release a finished week now instead of waiting for its hourly run. */
export async function requestRelease(): Promise<void> {
  try {
    await supabase.functions.invoke('weekly-case', { body: { action: 'release' } });
  } catch (error) {
    log.warn('[WeeklyCase] release request failed', error);
  }
}

/** True when this case already paid its XP: the ledger is the one record, so a retry can never pay twice. */
export async function xpAlreadyPaid(userId: string, caseId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('xp_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('source_type', 'weekly_case')
    .eq('source_id', caseId)
    .limit(1);
  // An unreadable ledger is not "unpaid": throw, so the caller waits instead of risking a second payment.
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}
