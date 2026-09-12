import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, LayoutRectangle } from 'react-native';
import { tokens } from '../theme/tokens';
import { SortSignalExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { Prompt, shuffle, tick, useShake } from './shared';
import { ColorText } from '../components/ColorText';
import { shortLabel } from '../text';

/**
 * Sort the Signal — drag each headline into the bucket it belongs to.
 * Correct drops fly into the bucket; wrong drops bounce back with a reason.
 */
export function SortSignal({ exercise, phase, onChange }: ExerciseProps<SortSignalExercise>) {
  const order = useMemo(() => shuffle(exercise.items.map((_, i) => i)), [exercise.id]);
  const [cursor, setCursor] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]); // bucket index per item, in order sorted
  const [wrongs, setWrongs] = useState(0);
  const [why, setWhy] = useState<string | null>(null);
  const bucketRects = useRef<(LayoutRectangle | null)[]>([]);
  const bucketRefs = useRef<(View | null)[]>([]);
  const cardRect = useRef<LayoutRectangle | null>(null);
  const cardRef = useRef<View | null>(null);

  const measure = (node: View | null, store: (r: LayoutRectangle) => void) => {
    node?.measureInWindow?.((x, y, width, height) => {
      if (width && height) store({ x, y, width, height });
    });
  };
  const [hover, setHover] = useState<number | null>(null);
  const pan = useRef(new Animated.ValueXY()).current;
  const { shake, translateX } = useShake();

  useEffect(() => {
    setCursor(0);
    setPlaced([]);
    setWrongs(0);
    setWhy(null);
    pan.setValue({ x: 0, y: 0 });
    onChange({ canCheck: false, isCorrect: false });
  }, [exercise.id]);

  const itemIndex = order[cursor];
  const item = exercise.items[itemIndex];
  const done = cursor >= order.length;

  useEffect(() => {
    if (done) onChange({ canCheck: true, isCorrect: wrongs === 0 });
  }, [done, wrongs]);

  const bucketAt = (pageX: number, pageY: number) => {
    for (let i = 0; i < exercise.buckets.length; i++) {
      const r = bucketRects.current[i];
      if (!r) continue;
      if (pageX >= r.x && pageX <= r.x + r.width && pageY >= r.y && pageY <= r.y + r.height) return i;
    }
    return null;
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => phase === 'answering' && !done,
        onPanResponderMove: (e, g) => {
          pan.setValue({ x: g.dx, y: g.dy });
          const base = cardRect.current;
          if (base) {
            setHover(bucketAt(base.x + base.width / 2 + g.dx, base.y + base.height / 2 + g.dy));
          }
        },
        onPanResponderRelease: (e, g) => {
          const base = cardRect.current;
          const target = base
            ? bucketAt(base.x + base.width / 2 + g.dx, base.y + base.height / 2 + g.dy)
            : null;
          setHover(null);
          if (target === null) {
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
            return;
          }
          const right = target === item.bucket;
          tick(right);
          if (right) {
            setPlaced(p => [...p, target]);
            setWhy(null);
            pan.setValue({ x: 0, y: 0 });
            setCursor(c => c + 1);
          } else {
            setWrongs(w => w + 1);
            setWhy(item.why || `That one belongs in "${exercise.buckets[item.bucket]}".`);
            shake();
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          }
        },
      }),
    [phase, done, item, exercise.buckets, shake],
  );

  return (
    <View style={styles.wrap}>
      <Prompt eyebrow="Sort the signal" text={exercise.prompt} />

      <View style={styles.stage}>
        {!done && item ? (
          <Animated.View
            {...responder.panHandlers}
            ref={node => {
              cardRef.current = node as unknown as View | null;
            }}
            onLayout={() => measure(cardRef.current, r => (cardRect.current = r))}
            style={[
              styles.card,
              { transform: [{ translateX: Animated.add(pan.x, translateX) }, { translateY: pan.y }] },
            ]}
          >
            <ColorText text={item.text} style={styles.cardText} maxSentences={1} maxLength={90} />
            <Text style={styles.hint}>Drag me</Text>
          </Animated.View>
        ) : (
          <View style={styles.cardDone}>
            <Text style={styles.cardDoneText}>
              {wrongs === 0 ? 'Clean sweep — every call was right.' : 'All sorted.'}
            </Text>
          </View>
        )}
      </View>

      {!!why && <Text style={styles.why}>{why}</Text>}

      <View style={styles.buckets}>
        {exercise.buckets.map((b, i) => {
          const count = placed.filter(p => p === i).length;
          const active = hover === i;
          return (
            <View
              key={b}
              ref={node => {
                bucketRefs.current[i] = node;
              }}
              onLayout={() => measure(bucketRefs.current[i], r => (bucketRects.current[i] = r))}
              style={[styles.bucket, active && styles.bucketActive]}
            >
              <Text style={[styles.bucketLabel, active && styles.bucketLabelActive]}>{shortLabel(b)}</Text>
              <Text style={styles.bucketCount}>{count > 0 ? `${count}` : ''}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.progress}>
        {Math.min(cursor, order.length)} / {order.length} sorted
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  stage: { minHeight: 150, justifyContent: 'center' },
  card: {
    backgroundColor: tokens.color.card,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    padding: tokens.space.lg,
    gap: tokens.space.sm,
    shadowColor: '#1A1F36',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardText: { fontSize: tokens.font.body + 1, fontWeight: '700', color: tokens.color.text, lineHeight: 23 },
  hint: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: tokens.color.textMuted },
  cardDone: {
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.correctSoft,
    padding: tokens.space.lg,
  },
  cardDoneText: { fontSize: tokens.font.body, fontWeight: '800', color: tokens.color.correctDark },
  why: {
    fontSize: tokens.font.caption + 1,
    color: tokens.color.incorrectDark,
    fontWeight: '600',
    marginBottom: tokens.space.sm,
  },
  buckets: { flexDirection: 'row', gap: tokens.space.sm, marginTop: tokens.space.lg },
  bucket: {
    flex: 1,
    minHeight: 92,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: tokens.color.borderStrong,
    backgroundColor: tokens.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space.sm,
    gap: 4,
  },
  bucketActive: {
    borderColor: tokens.color.accent,
    backgroundColor: tokens.color.accentSoft,
    borderStyle: 'solid',
  },
  bucketLabel: {
    fontSize: tokens.font.caption,
    fontWeight: '800',
    color: tokens.color.textSecondary,
    textAlign: 'center',
  },
  bucketLabelActive: { color: tokens.color.accentDark },
  bucketCount: { fontSize: tokens.font.body, fontWeight: '900', color: tokens.color.accent },
  progress: {
    fontSize: tokens.font.caption,
    color: tokens.color.textMuted,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: tokens.space.md,
  },
});
