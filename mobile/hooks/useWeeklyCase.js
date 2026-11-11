import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./useAuth";
import { log } from "../lib/logger";
import { pickCases, phaseOf } from "../lib/weeklyCase";
import { loadMySubmissions, loadOpenedCases, loadResult, requestRelease } from "../lib/weeklyCaseApi";
const seenKey = (userId, caseId) => `ml_weekly_seen_v1/${userId}/${caseId}`;
const EMPTY = { loading: true, current: null, previous: null, submitted: false, score: null, previousScore: null, failed: false };
function useWeeklyCase() {
  const { user } = useAuth();
  const [state, setState] = useState(EMPTY);
  const released = useRef(false);
  const refresh = useCallback(async () => {
    if (!user?.id) {
      setState({ ...EMPTY, loading: false });
      return;
    }
    try {
      const now = Date.now();
      const { current, previous } = pickCases(await loadOpenedCases(now), now);
      const ids = [current?.id, previous?.id].filter((id) => !!id);
      let subs = await loadMySubmissions(user.id, ids);
      const needsRelease = (c) => !!c && phaseOf(c, now) === "closed" && subs.some((s) => s.case_id === c.id && !s.released_at);
      if (!released.current && (needsRelease(current) || needsRelease(previous))) {
        released.current = true;
        await requestRelease();
        subs = await loadMySubmissions(user.id, ids);
      }
      const scoreOf = async (c) => {
        const s = c && subs.find((x) => x.case_id === c.id);
        if (!c || !s?.released_at) return null;
        const r = await loadResult(c.id);
        return r.state === "ready" && typeof r.score === "number" ? r.score : null;
      };
      const score = await scoreOf(current);
      let previousScore = await scoreOf(previous);
      if (previous && previousScore !== null && await AsyncStorage.getItem(seenKey(user.id, previous.id))) previousScore = null;
      setState({
        loading: false,
        current,
        previous,
        submitted: !!current && subs.some((s) => s.case_id === current.id),
        score,
        previousScore,
        failed: false
      });
    } catch (error) {
      log.warn("[WeeklyCase] could not load", error);
      setState((s) => ({ ...s, loading: false, failed: true }));
    }
  }, [user?.id]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { ...state, refresh, userId: user?.id ?? null };
}
async function markResultsSeen(userId, caseId) {
  try {
    await AsyncStorage.setItem(seenKey(userId, caseId), "1");
  } catch {
  }
}
export {
  markResultsSeen,
  seenKey,
  useWeeklyCase
};
