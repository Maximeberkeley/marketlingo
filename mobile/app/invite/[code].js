import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../lib/constants";
import { useAuth } from "../../hooks/useAuth";
import { normalizeInviteCode, savePendingInvite, applyPendingInvite, inviteToast } from "../../lib/invites";
function InviteRoute() {
  const { code } = useLocalSearchParams();
  const { user, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    let live = true;
    (async () => {
      const clean = normalizeInviteCode(code);
      if (clean) await savePendingInvite(clean);
      if (!user) {
        if (live) router.replace("/");
        return;
      }
      const result = await applyPendingInvite();
      if (!live) return;
      const toast = inviteToast(result);
      router.replace(toast ? { pathname: "/friends", params: { toast } } : "/friends");
    })();
    return () => {
      live = false;
    };
  }, [code, user, loading]);
  return <View style={styles.container}>
      <ActivityIndicator color={COLORS.accent} size="large" />
    </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg0 }
});
export {
  InviteRoute as default
};
