/**
 * Small shared pieces of the shop: the gold price button, the XP chip, section headers and the carousel.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ViewStyle, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { ChunkyButton } from '../social/ChunkyButton';
import { Dots, useReduceMotion, MotionScope } from './Motion';

const FLASK_ON_GOLD = '#6D28D9';
const fmt = (n: number) => n.toLocaleString('en-US');

/** The app's XP flask with its cyan sparkle. */
export function Flask({ size = 16, color = COLORS.xpBadgeIcon }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size + 2, height: size + 2, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name="flask" size={size} color={color} />
      <MaterialCommunityIcons name="star-four-points" size={Math.round(size * 0.46)} color={COLORS.xpBadgeSpark} style={{ position: 'absolute', top: -3, right: -3 }} />
    </View>
  );
}

/** "6,240" with the flask, in the lavender pill the Home XP badge uses. */
export function XPChip({ value, onPress, label }: { value: number; onPress?: () => void; label?: string }) {
  const body = (
    <View style={styles.chip}>
      <Flask size={18} />
      <Text maxFontSizeMultiplier={1.3} style={styles.chipText}>{fmt(value)}</Text>
    </View>
  );
  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={label ?? `${fmt(value)} XP to spend`}>{body}</TouchableOpacity>
  ) : body;
}

/** The yellow chunky button with the price on it: "[flask] 800 · Buy & equip", with an old price struck through. */
export function PriceButton({ price, was, label, onPress, disabled, busy, height = 48, style }: {
  price: number; was?: number | null; label?: string; onPress: () => void; disabled?: boolean; busy?: boolean; height?: number; style?: ViewStyle;
}) {
  return (
    <ChunkyButton
      tone="gold"
      haptic
      height={height}
      onPress={onPress}
      disabled={disabled}
      busy={busy}
      style={style}
      accessibilityLabel={`${label ?? 'Buy'} for ${fmt(price)} XP${was ? `, was ${fmt(was)}` : ''}`}
      icon={(
        <View style={styles.priceIcon}>
          <Flask size={17} color={FLASK_ON_GOLD} />
          {was ? <Text maxFontSizeMultiplier={1.3} style={styles.was}>{fmt(was)}</Text> : null}
        </View>
      )}
      label={label ? `${fmt(price)} · ${label}` : fmt(price)}
    />
  );
}

export function SectionHead({ title, sub, action, onAction, tag }: { title: string; sub?: string; action?: string; onAction?: () => void; tag?: string }) {
  return (
    <View style={styles.head}>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text maxFontSizeMultiplier={1.3} style={styles.title}>{title}</Text>
          {tag ? <View style={styles.tag}><Text maxFontSizeMultiplier={1.3} style={styles.tagText}>{tag}</Text></View> : null}
        </View>
        {sub ? <Text maxFontSizeMultiplier={1.3} style={styles.sub}>{sub}</Text> : null}
      </View>
      {action && onAction ? (
        <TouchableOpacity onPress={onAction} hitSlop={10} accessibilityRole="button"><Text maxFontSizeMultiplier={1.3} style={styles.action}>{action}</Text></TouchableOpacity>
      ) : null}
    </View>
  );
}

/**
 * Big swipe cards like the Intel news cards: one card per page with the next one peeking, snapping, page dots,
 * and a gentle auto-advance every few seconds that pauses once the learner swipes.
 */
export function Carousel<T>({ items, render, keyOf, autoMs = 4000, cardWidth: forced, padTop = 0 }: {
  items: T[]; render: (item: T, width: number) => React.ReactNode; keyOf: (item: T) => string; autoMs?: number; cardWidth?: number;
  /** Room above the cards, so art can break out of their top edge. */
  padTop?: number;
}) {
  const { width } = useWindowDimensions();
  const cardWidth = forced ?? Math.min(340, width - 52);
  const gap = 12;
  const ref = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const touched = useRef(false);
  const reduce = useReduceMotion();
  useEffect(() => {
    if (reduce || items.length < 2 || !autoMs) return;
    const id = setInterval(() => {
      if (touched.current) return;
      setIndex(i => {
        const next = (i + 1) % items.length;
        ref.current?.scrollTo({ x: next * (cardWidth + gap), animated: true });
        return next;
      });
    }, autoMs);
    return () => clearInterval(id);
  }, [reduce, items.length, autoMs, cardWidth]);
  return (
    <View>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + gap}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 20, gap, paddingTop: padTop }}
        onScrollBeginDrag={() => { touched.current = true; }}
        onMomentumScrollEnd={e => setIndex(Math.round(e.nativeEvent.contentOffset.x / (cardWidth + gap)))}
      >
        {items.map((item, i) => (
          <View key={keyOf(item)} style={{ width: cardWidth }}>
            {/* Only the card in front animates. */}
            <MotionScope active={i === Math.min(index, items.length - 1)}>{render(item, cardWidth)}</MotionScope>
          </View>
        ))}
      </ScrollView>
      <Dots count={items.length} index={Math.min(index, items.length - 1)} color={COLORS.accent} idle={COLORS.border} />
    </View>
  );
}

/** A plain horizontal row of tiles (power-ups, deals, bundles). */
export function Row({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 6 }}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 13, borderRadius: 19, backgroundColor: COLORS.xpBadgeSurface, borderWidth: 1, borderColor: COLORS.xpBadgeBorder },
  chipText: { fontSize: 17, fontWeight: '800', color: COLORS.xpBadgeText },
  priceIcon: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  was: { fontSize: 14, fontWeight: '700', color: '#7A5A00', textDecorationLine: 'line-through' },
  head: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, marginBottom: 12, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  action: { fontSize: 14, fontWeight: '800', color: COLORS.accent, marginBottom: 2 },
  tag: { paddingHorizontal: 8, height: 20, borderRadius: 6, backgroundColor: '#14141F', alignItems: 'center', justifyContent: 'center' },
  tagText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, color: '#FCD34D' },
});
