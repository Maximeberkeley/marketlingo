import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { localDateString } from '../lib/dayMath';
import { getMarketName } from '../lib/markets';
import { COLORS, SHADOWS } from '../lib/constants';
import { LeoAnim, LeoCharacter } from '../components/mascot/LeoCharacter';
import { SpeechBubble } from '../components/ui/SpeechBubble';
import { triggerHaptic } from '../lib/haptics';
import { log } from '../lib/logger';

type Reminder = { market: string; streak: number; expiresAt: string | null };

const STARTUP_TIMEOUT_MS = 6000;

function withStartupTimeout<T>(request: PromiseLike<T>): Promise<T> {
  return Promise.race([
    Promise.resolve(request),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Daily check-in timed out')), STARTUP_TIMEOUT_MS);
    }),
  ]);
}

function presentation(data: Reminder) {
  const hour = new Date().getHours();
  const expiry = data.expiresAt ? new Date(data.expiresAt).getTime() : NaN;
  const hoursLeft = Number.isFinite(expiry) ? Math.max(0, (expiry - Date.now()) / 3600000) : 24 - hour;
  const market = getMarketName(data.market);

  if (hoursLeft <= 3 || hour >= 21) {
    return { mood: 'urgent' as LeoAnim, eyebrow: 'FINAL HOURS', line: `${Math.ceil(hoursLeft)} hours left. I brought the rain. You bring five minutes for ${market}.` };
  }
  if (hour >= 18) {
    return { mood: 'thinking' as LeoAnim, eyebrow: 'EVENING CHECK', line: `Your ${market} lesson is still waiting. Bold strategy. Shall we save the streak?` };
  }
  if (hour >= 12) {
    return { mood: 'sassy' as LeoAnim, eyebrow: 'AFTERNOON CHECK', line: `You have time. Your excuses are simply getting more creative than your ${market} knowledge.` };
  }
  return { mood: 'reading' as LeoAnim, eyebrow: 'TODAY’S MISSION', line: `${market} is moving while you sleep. Conveniently, I took notes.` };
}

export default function DailyLeoScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [data, setData] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        router.replace('/auth');
        return;
      }
      try {
        const { data: profile, error: profileError } = await withStartupTimeout(
          supabase.from('profiles').select('selected_market').eq('id', user.id).maybeSingle()
        );
        if (profileError) throw profileError;
        const market = profile?.selected_market;
        if (!market) {
          router.replace('/(tabs)/home');
          return;
        }
        const [{ data: daily, error: dailyError }, { data: progress, error: progressError }] = await withStartupTimeout(Promise.all([
          supabase.from('daily_completions').select('lesson_completed').eq('user_id', user.id).eq('market_id', market).eq('completion_date', localDateString()).maybeSingle(),
          supabase.from('user_progress').select('current_streak, streak_expires_at').eq('user_id', user.id).eq('market_id', market).maybeSingle(),
        ]));
        if (dailyError) throw dailyError;
        if (progressError) throw progressError;
        if (!active) return;
        if (daily?.lesson_completed) {
          router.replace('/(tabs)/home');
          return;
        }
        setData({ market, streak: progress?.current_streak ?? 0, expiresAt: progress?.streak_expires_at ?? null });
      } catch (error) {
        log.warn('[DailyLeo] Could not load daily check-in:', error);
        router.replace('/(tabs)/home');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const content = useMemo(() => data ? presentation(data) : null, [data]);

  if (loading || !data || !content) {
    return <View style={styles.loading}><ActivityIndicator color={COLORS.accent} /></View>;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 22 }]}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>{content.eyebrow}</Text>
        <Text style={styles.title}>{data.streak > 0 ? `${data.streak}-day streak on the line` : 'Your daily edge starts here'}</Text>
      </View>

      <View style={styles.scene}>
        <View style={styles.leoWrap}><LeoCharacter size="xl" animation={content.mood} still /></View>
        <SpeechBubble text={content.line} tail="left" tone="purple" style={styles.bubble} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.caption}>One lesson. About five minutes. Then I stop judging.</Text>
        <TouchableOpacity
          style={styles.continueButton}
          activeOpacity={0.88}
          onPress={() => { triggerHaptic('medium'); router.replace('/(tabs)/home'); }}
        >
          <Text style={styles.continueText}>Continue</Text>
          <Feather name="arrow-right" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 22, justifyContent: 'space-between' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg0 },
  heading: { paddingTop: 20 },
  eyebrow: { fontSize: 11, fontWeight: '900', color: COLORS.accent, letterSpacing: 1.2, marginBottom: 10 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '900', color: COLORS.textPrimary, maxWidth: 330 },
  scene: { flex: 1, minHeight: 310, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  leoWrap: { width: 174, height: 220, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  bubble: { flex: 1, maxWidth: 190, marginLeft: 8 },
  footer: { gap: 14 },
  caption: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center', fontWeight: '600' },
  continueButton: { height: 58, borderRadius: 18, backgroundColor: COLORS.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...SHADOWS.accent },
  continueText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
});
