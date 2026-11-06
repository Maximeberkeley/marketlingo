/**
 * FriendNudgeBanner — one slim, dismissible line on Home when friends nudged me.
 * Floats over the course so it never shifts the lesson, rings or loading gate.
 * Nudges are marked read as soon as the banner shows, so it appears once.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { log } from '../../lib/logger';

export function nudgeBannerText(names: string[]): string {
  const first = names[0] || 'A friend';
  const others = names.length - 1;
  if (others <= 0) return `${first} nudged you 👋 Keep your streak going`;
  return `${first} and ${others} ${others === 1 ? 'other' : 'others'} nudged you 👋 Keep your streak going`;
}

export function FriendNudgeBanner({ top }: { top: number }) {
  const { user } = useAuth();
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: nudges, error } = await supabase
          .from('friend_nudges')
          .select('id, sender_id, created_at')
          .eq('receiver_id', user.id)
          .is('read_at', null)
          .order('created_at', { ascending: false })
          .limit(20);
        if (error || !nudges?.length || cancelled) return;
        const senderIds = Array.from(new Set(nudges.map((n) => n.sender_id)));
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, display_name')
          .in('id', senderIds);
        if (cancelled) return;
        const names = senderIds.map(
          (id) => profiles?.find((p) => p.id === id)?.display_name?.trim() || 'A friend',
        );
        setText(nudgeBannerText(names));
        await supabase
          .from('friend_nudges')
          .update({ read_at: new Date().toISOString() })
          .in('id', nudges.map((n) => n.id));
      } catch (err) {
        log.warn('Friend nudges failed to load', err);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!text) return null;
  return (
    <View style={[styles.banner, { top }]} accessibilityRole="alert">
      <Text style={styles.text} numberOfLines={2}>{text}</Text>
      <TouchableOpacity
        onPress={() => setText(null)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Dismiss"
      >
        <Feather name="x" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', left: 16, right: 16, zIndex: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.bg2, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: COLORS.accent + '30',
  },
  text: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
});
