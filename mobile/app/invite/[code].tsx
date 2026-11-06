import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { normalizeInviteCode, savePendingInvite, applyPendingInvite, inviteToast } from '../../lib/invites';

/**
 * marketlingo://invite/<code> and https://market-verse.com/invite/<code>.
 * Saves the code; signed-in learners are connected now, everyone else after sign-up.
 */
export default function InviteRoute() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    let live = true;
    (async () => {
      const clean = normalizeInviteCode(code);
      if (clean) await savePendingInvite(clean);
      if (!user) {
        // Normal first-open flow (Industry → Goal → Level → sign-up) is unchanged.
        if (live) router.replace('/');
        return;
      }
      const result = await applyPendingInvite();
      if (!live) return;
      const toast = inviteToast(result);
      router.replace(toast ? ({ pathname: '/friends', params: { toast } } as any) : '/friends');
    })();
    return () => { live = false; };
  }, [code, user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={COLORS.accent} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg0 },
});
