import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPE } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { getMonthlyStandings } from '../../lib/socialStandings';
import { FriendStanding, friendStanding, friendStandingLabel } from '../../lib/friendStanding';
import { triggerHaptic } from '../../lib/haptics';
import { log } from '../../lib/logger';

interface FriendStandingChipProps {
  userId?: string | null;
  marketId?: string | null;
  focused: boolean;
}

/**
 * "#2 of 4 among friends this month" under today's lesson, or an invitation to
 * race a friend. It loads on its own after Home is ready and stays hidden until
 * it knows, so it never holds up the rings, the lesson or the loading gate.
 */
export function FriendStandingChip({ userId, marketId, focused }: FriendStandingChipProps) {
  const [standing, setStanding] = useState<FriendStanding | null | undefined>(undefined);

  useEffect(() => { setStanding(undefined); }, [userId, marketId]);

  useEffect(() => {
    if (!focused || !userId || !marketId) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase.rpc('get_friends_overview');
      if (error) throw error;
      const friendIds = ((data ?? []) as any[]).map(row => row?.friend_id).filter(Boolean);
      if (!friendIds.length) { if (active) setStanding(null); return; }
      const standings = await getMonthlyStandings(marketId);
      if (active) setStanding(friendStanding(userId, friendIds, standings));
    })().catch(error => log.warn('[Home] Friend standing could not load:', error));
    return () => { active = false; };
  }, [focused, userId, marketId]);

  if (standing === undefined) return null;
  const label = friendStandingLabel(standing);

  return (
    <TouchableOpacity
      style={styles.chip}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Open friends`}
      onPress={() => { triggerHaptic('light'); router.push('/friends' as any); }}
    >
      <Feather name={standing ? 'users' : 'user-plus'} size={14} color={COLORS.accent} />
      <Text style={styles.text} numberOfLines={1}>{label}</Text>
      <Feather name="chevron-right" size={14} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    marginBottom: 12,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
    maxWidth: '90%',
  },
  text: { ...TYPE.caption, color: COLORS.textPrimary, fontWeight: '700', flexShrink: 1 },
});
