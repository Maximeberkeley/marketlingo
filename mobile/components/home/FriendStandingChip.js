import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { COLORS, TYPE } from "../../lib/constants";
import { supabase } from "../../lib/supabase";
import { myFriendRaceXP } from "../../lib/socialStandings";
import { friendStanding, friendStandingLabel } from "../../lib/friendStanding";
import { triggerHaptic } from "../../lib/haptics";
import { log } from "../../lib/logger";
function FriendStandingChip({ userId, marketId, focused }) {
  const [standing, setStanding] = useState(void 0);
  useEffect(() => {
    setStanding(void 0);
  }, [userId, marketId]);
  useEffect(() => {
    if (!focused || !userId || !marketId) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase.rpc("get_friends_overview");
      if (error) throw error;
      const friends = (data ?? []).filter((row) => row?.friend_id);
      if (!friends.length) {
        if (active) setStanding(null);
        return;
      }
      const mine = await myFriendRaceXP(userId);
      const board = [{ user_id: userId, monthly_xp: mine }, ...friends.map((row) => ({ user_id: row.friend_id, monthly_xp: Number(row.month_xp) || 0 }))];
      if (active) setStanding(friendStanding(userId, friends.map((row) => row.friend_id), board));
    })().catch((error) => log.warn("[Home] Friend standing could not load:", error));
    return () => {
      active = false;
    };
  }, [focused, userId, marketId]);
  if (standing === void 0) return null;
  const label = friendStandingLabel(standing);
  return /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      style: styles.chip,
      activeOpacity: 0.85,
      accessibilityRole: "button",
      accessibilityLabel: `${label}. Open friends`,
      onPress: () => {
        triggerHaptic("light");
        router.push("/friends");
      }
    },
    /* @__PURE__ */ React.createElement(Feather, { name: standing ? "users" : "user-plus", size: 14, color: COLORS.accent }),
    /* @__PURE__ */ React.createElement(Text, { style: styles.text, numberOfLines: 1 }, label),
    /* @__PURE__ */ React.createElement(Feather, { name: "chevron-right", size: 14, color: COLORS.textMuted })
  );
}
const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 8,
    marginBottom: 12,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
    maxWidth: "90%"
  },
  text: { ...TYPE.caption, color: COLORS.textPrimary, fontWeight: "700", flexShrink: 1 }
});
export {
  FriendStandingChip
};
