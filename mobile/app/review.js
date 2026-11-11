import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { useSelectedMarket } from "../hooks/useSelectedMarket";
import { useUserXP } from "../hooks/useUserXP";
import { ArenaScreen } from "../lesson-kit/arena/ArenaScreen";
import { getMarketName } from "../lib/markets";
import { localDateString } from "../lib/dayMath";
import { applyReview, dueEntries, loadLedger, REVIEW_XP, reviewWave, saveLedger } from "../lib/reviewLedger";
import { COLORS, TYPE } from "../lib/constants";
import { log } from "../lib/logger";
function ReviewRoute() {
  const { user } = useAuth();
  const { marketId, loading: marketLoading } = useSelectedMarket();
  const { addXP } = useUserXP(marketId);
  const [ledger, setLedger] = useState(null);
  const today = localDateString();
  useEffect(() => {
    if (!user?.id || !marketId) return;
    let active = true;
    void loadLedger(user.id, marketId).then((rows) => {
      if (active) setLedger(rows);
    });
    return () => {
      active = false;
    };
  }, [user?.id, marketId]);
  const round = useMemo(() => ledger ? reviewWave(dueEntries(ledger, today)) : null, [ledger, today]);
  if (marketLoading || ledger === null) return /* @__PURE__ */ React.createElement(View, { style: styles.center }, /* @__PURE__ */ React.createElement(Text, { style: styles.text }, "Gathering your questions\u2026"));
  if (!round) {
    return /* @__PURE__ */ React.createElement(View, { style: styles.center }, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Nothing to review"), /* @__PURE__ */ React.createElement(Text, { style: styles.text }, "Questions you miss in the Arena or a lesson check come back here."), /* @__PURE__ */ React.createElement(Text, { style: styles.link, onPress: () => router.back() }, "Go back"));
  }
  const handleFinish = async (result) => {
    try {
      const results = {};
      for (const exercise of round.wave.exercises) results[round.keys[exercise.id]] = true;
      for (const exercise of result.missed) results[round.keys[exercise.id]] = false;
      if (user?.id && marketId) await saveLedger(user.id, marketId, applyReview(ledger, results, today));
      await addXP(REVIEW_XP, "review", void 0, "Worth another look");
    } catch (error) {
      log.warn("[Review] Could not bank the round:", error);
    }
    router.back();
  };
  return /* @__PURE__ */ React.createElement(
    ArenaScreen,
    {
      waves: [round.wave],
      marketId,
      marketName: getMarketName(marketId),
      bestScore: 0,
      onExit: () => router.back(),
      onFinish: handleFinish,
      fixedXp: REVIEW_XP
    }
  );
}
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: COLORS.bg0, paddingHorizontal: 32 },
  title: { ...TYPE.h2, color: COLORS.textPrimary, textAlign: "center" },
  text: { ...TYPE.caption, color: COLORS.textMuted, textAlign: "center" },
  link: { ...TYPE.caption, color: COLORS.accent, fontWeight: "700" }
});
export {
  ReviewRoute as default
};
