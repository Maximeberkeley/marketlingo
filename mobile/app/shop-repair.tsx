import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../lib/constants';
import { isDark } from '../lib/theme';
import { triggerHaptic } from '../lib/haptics';
import { trackEvent } from '../lib/analytics';
import {
  REPAIR_COOLDOWN_DAYS, REPAIR_COPY, REPAIR_MIN_STREAK, RepairStatus, STREAK_REPAIR_PRICE,
} from '../lib/boosts';
import { useShop } from '../hooks/useShop';
import { useSelectedMarket } from '../hooks/useSelectedMarket';
import { ShopIcon } from '../components/shop/ItemArt';
import { PriceButton } from '../components/shop/ShopKit';
import { ChunkyButton } from '../components/social/ChunkyButton';
import { Float } from '../components/shop/Motion';

const fmt = (n: number) => n.toLocaleString('en-US');
const dayName = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });

/** Streak Repair: 1,200 XP brings back a 7+ day streak within 48 hours of the break, once every 30 days. */
export default function StreakRepairScreen() {
  const insets = useSafeAreaInsets();
  const shop = useShop();
  const { marketId, loading: marketLoading } = useSelectedMarket();
  const [status, setStatus] = useState<RepairStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [restored, setRestored] = useState<number | null>(null);

  const check = useCallback(async () => {
    if (marketLoading) return;
    setStatus(await shop.repairStatus(marketId));
  }, [marketId, marketLoading, shop.repairStatus]);
  useEffect(() => { void check(); }, [check]);

  const short = Math.max(0, STREAK_REPAIR_PRICE - shop.balance.balance);
  const eligible = status?.reason === 'eligible';

  const repair = async () => {
    setBusy(true);
    const r = await shop.repairStreak(marketId);
    setBusy(false);
    if (r.ok) {
      triggerHaptic('success');
      trackEvent('streak_repaired', { streak: r.streak });
      setRestored(r.streak);
      setNote(null);
    } else if (r.error === 'not_enough') {
      setNote(`${fmt(short)} XP to go.`);
    } else {
      setNote(REPAIR_COPY[r.error as keyof typeof REPAIR_COPY] ?? 'That did not go through. Try again.');
      void check();
    }
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 14 }]}>
      <LinearGradient colors={isDark ? ['#3B1A0C', '#15171B'] : ['#FFEDD5', '#FFFFFF']} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
          <Feather name="x" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Float distance={6}><ShopIcon id="streak-repair" size={128} /></Float>
        <Text maxFontSizeMultiplier={1.3} style={styles.title}>Streak Repair</Text>
        <Text maxFontSizeMultiplier={1.3} style={styles.sub}>Lost it? Get it back.</Text>
      </LinearGradient>

      <View style={styles.body}>
        {!status ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
        ) : restored !== null ? (
          <View style={[styles.card, styles.goodCard]}>
            <Text maxFontSizeMultiplier={1.2} style={styles.big}>{restored}</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.cardLabel}>day streak, back. Do today's lesson to keep it.</Text>
          </View>
        ) : eligible ? (
          <>
            <View style={styles.card}>
              <Text maxFontSizeMultiplier={1.2} style={styles.big}>{status.lostStreak}</Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.cardLabel}>day streak ready to repair</Text>
            </View>
            <View style={styles.week}>
              {status.missedDays.map(d => (
                <View key={d} style={styles.day}>
                  <View style={[styles.dayDot, styles.dayFix]}><Text maxFontSizeMultiplier={1.3} style={[styles.dayText, { color: '#C2410C' }]}>{dayName(d)}</Text></View>
                  <Text maxFontSizeMultiplier={1.3} style={styles.dayLabel}>Covered</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text maxFontSizeMultiplier={1.3} style={styles.cardLabel}>
              {status.reason === 'used_recently' && status.availableAgain
                ? `One repair every ${REPAIR_COOLDOWN_DAYS} days. Next one from ${new Date(status.availableAgain).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`
                : REPAIR_COPY[status.reason as keyof typeof REPAIR_COPY]}
            </Text>
          </View>
        )}
        <Text maxFontSizeMultiplier={1.3} style={styles.rule}>
          {`Works for 48 hours after a streak of ${REPAIR_MIN_STREAK}+ days breaks, once every ${REPAIR_COOLDOWN_DAYS} days. It covers the missed days the way a freeze does, so a freeze held ahead is still the cheaper move.`}
        </Text>
      </View>

      <View style={styles.footer}>
        {note ? <Text maxFontSizeMultiplier={1.3} style={styles.note}>{note}</Text> : null}
        {restored !== null ? (
          <ChunkyButton label="Do today's lesson" onPress={() => router.replace('/(tabs)/home' as any)} height={52} />
        ) : eligible ? (
          <>
            <PriceButton price={STREAK_REPAIR_PRICE} label="Repair streak" onPress={() => { void repair(); }} busy={busy} disabled={short > 0} height={52} />
            <Text maxFontSizeMultiplier={1.3} style={styles.after}>
              {short > 0 ? `${fmt(short)} XP to go` : `${fmt(shop.balance.balance)} XP now, ${fmt(shop.balance.balance - STREAK_REPAIR_PRICE)} after`}
            </Text>
          </>
        ) : (
          <ChunkyButton label="Get a Streak Freeze" tone="plain" onPress={() => router.replace('/shop-freeze' as any)} height={52} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  hero: { alignItems: 'center', paddingBottom: 26 },
  close: { alignSelf: 'flex-start', marginLeft: 16, width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg2 + 'CC', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: isDark ? '#FDBA74' : '#9A3412', marginTop: 8 },
  sub: { fontSize: 15, fontWeight: '700', color: isDark ? '#FB923C' : '#C2410C', marginTop: 2 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 18, gap: 18 },
  card: { alignItems: 'center', gap: 2, padding: 16, borderRadius: 18, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border, backgroundColor: COLORS.bg2 },
  goodCard: { borderColor: COLORS.success },
  big: { fontSize: 44, fontWeight: '900', color: COLORS.streak },
  cardLabel: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  week: { flexDirection: 'row', justifyContent: 'center', gap: 28 },
  day: { alignItems: 'center', gap: 6 },
  dayDot: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  dayFix: { backgroundColor: isDark ? '#431407' : '#FFEDD5', borderWidth: 2, borderColor: '#FB923C' },
  dayText: { fontSize: 13, fontWeight: '900' },
  dayLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  rule: { fontSize: 14, lineHeight: 20, color: COLORS.textSecondary, textAlign: 'center' },
  footer: { paddingHorizontal: 20, gap: 8 },
  note: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  after: { fontSize: 12.5, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
});
