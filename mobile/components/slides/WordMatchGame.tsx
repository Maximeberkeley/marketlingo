/**
 * WordMatchGame — Interactive term-definition matching mini-game.
 * 
 * Brilliant-style interstitial: clean two-column layout, smooth
 * animated feedback, progressive scoring, and celebration on completion.
 * Inserted mid-lesson when slides contain bold term-definition pairs.
 */
import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { triggerHaptic, triggerCelebration } from '../../lib/haptics';
import { playSound } from '../../lib/sounds';

const LEO_IMAGE = require('../../assets/mascot/leo-reference.png');

/* ── Types ─────────────────────────────────────────────────────── */

export interface WordPair {
  term: string;
  definition: string;
}

interface WordMatchGameProps {
  pairs: WordPair[];
  onComplete: (score: number, total: number) => void;
  accentColor: string;
}

/* ── Helpers ───────────────────────────────────────────────────── */

function shuffleArray<T extends { origIndex: number }>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ── Component ─────────────────────────────────────────────────── */

export function WordMatchGame({ pairs, onComplete, accentColor }: WordMatchGameProps) {
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ term: number; def: number } | null>(null);
  const [firstTryScore, setFirstTryScore] = useState(0);
  const [attemptedTerms, setAttemptedTerms] = useState<Set<number>>(new Set());

  // Animated values for matched cards
  const matchAnims = useRef(pairs.map(() => new Animated.Value(0))).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;
  const completionAnim = useRef(new Animated.Value(0)).current;

  const shuffledDefs = useMemo(
    () => shuffleArray(pairs.map((p, i) => ({ ...p, origIndex: i }))),
    [pairs],
  );

  const allDone = matched.size === pairs.length;

  /* ── Handlers ──────────────────────────────────────────────── */

  const handleTermTap = useCallback((index: number) => {
    if (matched.has(index) || allDone) return;
    triggerHaptic('selection');
    playSound('tap');
    setSelectedTerm(index);
    setWrongPair(null);
  }, [matched, allDone]);

  const animateMatch = useCallback((termIndex: number) => {
    Animated.spring(matchAnims[termIndex], {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [matchAnims]);

  const animateWrong = useCallback(() => {
    wrongAnim.setValue(0);
    Animated.sequence([
      Animated.timing(wrongAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(wrongAnim, { toValue: -1, duration: 80, useNativeDriver: true }),
      Animated.timing(wrongAnim, { toValue: 0.5, duration: 60, useNativeDriver: true }),
      Animated.timing(wrongAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [wrongAnim]);

  const animateCompletion = useCallback(() => {
    Animated.spring(completionAnim, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [completionAnim]);

  const handleDefTap = useCallback((defIdx: number) => {
    if (selectedTerm === null || allDone) return;
    const origIndex = shuffledDefs[defIdx].origIndex;

    if (origIndex === selectedTerm) {
      // ✅ Correct match
      triggerHaptic('success');
      playSound('correct');

      const newMatched = new Set(matched);
      newMatched.add(selectedTerm);
      setMatched(newMatched);
      animateMatch(selectedTerm);

      // Track first-try accuracy
      if (!attemptedTerms.has(selectedTerm)) {
        setFirstTryScore(s => s + 1);
      }

      setSelectedTerm(null);
      setWrongPair(null);

      if (newMatched.size === pairs.length) {
        const finalScore = !attemptedTerms.has(selectedTerm)
          ? firstTryScore + 1
          : firstTryScore;
        triggerCelebration();
        playSound('celebration');
        animateCompletion();
        setTimeout(() => onComplete(finalScore, pairs.length), 1800);
      }
    } else {
      // ❌ Wrong match
      triggerHaptic('warning');
      playSound('wrong');
      animateWrong();

      // Mark this term as attempted (no longer first-try eligible)
      setAttemptedTerms(prev => new Set(prev).add(selectedTerm));
      setWrongPair({ term: selectedTerm, def: defIdx });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedTerm(null);
      }, 700);
    }
  }, [selectedTerm, shuffledDefs, matched, pairs.length, attemptedTerms, firstTryScore, allDone, onComplete, animateMatch, animateWrong, animateCompletion]);

  /* ── Shake transform for wrong answers ─────────────────────── */
  const shakeTranslate = wrongAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-6, 0, 6],
  });

  /* ── Render ────────────────────────────────────────────────── */

  const progressPct = (matched.size / pairs.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={LEO_IMAGE} style={styles.leo} />
        <View style={styles.headerCenter}>
          <View style={[styles.badge, { backgroundColor: accentColor + '18' }]}>
            <Feather name="grid" size={13} color={accentColor} />
            <Text style={[styles.badgeText, { color: accentColor }]}>Match Terms</Text>
          </View>
        </View>
        <View style={styles.scoreChip}>
          <Text style={styles.scoreText}>{matched.size}/{pairs.length}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: accentColor }]} />
      </View>

      {/* Instruction */}
      <Text style={styles.instruction}>
        {allDone
          ? '🎉 All matched!'
          : selectedTerm !== null
            ? 'Now tap the matching definition →'
            : 'Tap a term on the left to begin'}
      </Text>

      {/* Two-column layout */}
      <Animated.View
        style={[
          styles.columns,
          wrongPair ? { transform: [{ translateX: shakeTranslate }] } : undefined,
        ]}
      >
        {/* Terms */}
        <View style={styles.column}>
          <Text style={styles.colLabel}>TERMS</Text>
          {pairs.map((pair, i) => {
            const isMatched = matched.has(i);
            const isSelected = selectedTerm === i;
            const isWrongTerm = wrongPair?.term === i;

            const scale = isMatched
              ? matchAnims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.05, 1] })
              : 1;

            return (
              <Animated.View key={`t-${i}`} style={{ transform: [{ scale }] }}>
                <TouchableOpacity
                  onPress={() => handleTermTap(i)}
                  disabled={isMatched}
                  activeOpacity={0.7}
                  style={[
                    styles.card,
                    isMatched && styles.cardMatched,
                    isSelected && {
                      borderColor: accentColor,
                      backgroundColor: accentColor + '10',
                      borderWidth: 2,
                    },
                    isWrongTerm && styles.cardWrong,
                  ]}
                >
                  <Text
                    style={[
                      styles.cardText,
                      styles.termText,
                      isMatched && styles.cardTextMatched,
                      isSelected && { color: accentColor },
                    ]}
                    numberOfLines={2}
                  >
                    {pair.term}
                  </Text>
                  {isMatched && (
                    <View style={styles.checkBadge}>
                      <Feather name="check" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Definitions */}
        <View style={styles.column}>
          <Text style={styles.colLabel}>DEFINITIONS</Text>
          {shuffledDefs.map((def, i) => {
            const isMatched = matched.has(def.origIndex);
            const isWrongDef = wrongPair?.def === i;
            const isSelectable = selectedTerm !== null && !isMatched;

            const scale = isMatched
              ? matchAnims[def.origIndex].interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.05, 1] })
              : 1;

            return (
              <Animated.View key={`d-${i}`} style={{ transform: [{ scale }] }}>
                <TouchableOpacity
                  onPress={() => handleDefTap(i)}
                  disabled={isMatched || selectedTerm === null}
                  activeOpacity={0.7}
                  style={[
                    styles.card,
                    isMatched && styles.cardMatched,
                    isWrongDef && styles.cardWrong,
                    isSelectable && styles.cardSelectable,
                  ]}
                >
                  <Text
                    style={[
                      styles.cardText,
                      isMatched && styles.cardTextMatched,
                    ]}
                    numberOfLines={3}
                  >
                    {def.definition}
                  </Text>
                  {isMatched && (
                    <View style={styles.checkBadge}>
                      <Feather name="check" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>

      {/* Completion banner */}
      {allDone && (
        <Animated.View
          style={[
            styles.resultBanner,
            {
              opacity: completionAnim,
              transform: [{
                translateY: completionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.resultEmoji}>
            {firstTryScore === pairs.length ? '🎯' : firstTryScore >= pairs.length * 0.6 ? '👏' : '💪'}
          </Text>
          <Text style={styles.resultTitle}>
            {firstTryScore === pairs.length
              ? 'Perfect Match!'
              : `${firstTryScore}/${pairs.length} first try`}
          </Text>
          <Text style={styles.resultSubtitle}>
            {firstTryScore === pairs.length
              ? 'You matched every term on the first try'
              : 'Keep practicing to improve your recall'}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

/* ── Content Extraction ────────────────────────────────────────── */

/** Extract term-definition pairs from slide content */
export function extractTermPairs(slideTitle: string, slideBody: string): WordPair[] {
  const pairs: WordPair[] = [];
  if (!slideBody || slideBody.length < 60) return pairs;

  const seen = new Set<string>();

  // Pattern 1: "**Term** — definition" or "**Term**: definition"
  const boldPattern = /\*\*([^*]+)\*\*\s*[—:\-–]\s*(.+?)(?:\n|$)/g;
  let match;
  while ((match = boldPattern.exec(slideBody)) !== null) {
    const term = match[1].trim();
    let def = match[2].trim();
    if (term.length >= 3 && term.length <= 35 && def.length >= 12 && !seen.has(term.toLowerCase())) {
      // Truncate long definitions cleanly at word boundary
      if (def.length > 75) {
        const cutPoint = def.lastIndexOf(' ', 72);
        def = def.substring(0, cutPoint > 40 ? cutPoint : 72) + '…';
      }
      seen.add(term.toLowerCase());
      pairs.push({ term, definition: def });
    }
  }

  // Pattern 2: "Term: definition" (capitalized line starts)
  if (pairs.length < 3) {
    const colonPattern = /^([A-Z][A-Za-z\s]{2,28}):\s+(.{15,}?)$/gm;
    while ((match = colonPattern.exec(slideBody)) !== null && pairs.length < 5) {
      const term = match[1].trim();
      let def = match[2].trim();
      if (!seen.has(term.toLowerCase())) {
        if (def.length > 75) {
          const cutPoint = def.lastIndexOf(' ', 72);
          def = def.substring(0, cutPoint > 40 ? cutPoint : 72) + '…';
        }
        seen.add(term.toLowerCase());
        pairs.push({ term, definition: def });
      }
    }
  }

  // 3–5 pairs optimal for mobile two-column layout
  return pairs.slice(0, 5);
}

/** Should we show a word match game after this slide? */
export function shouldShowWordMatch(
  slideIndex: number,
  totalSlides: number,
  extractedPairs: WordPair[],
): boolean {
  if (extractedPairs.length < 3) return false;
  if (totalSlides < 6) return false;
  if (slideIndex < 2 || slideIndex >= totalSlides - 2) return false;
  const midpoint = Math.floor(totalSlides / 2);
  return slideIndex === midpoint || slideIndex === midpoint + 1;
}

/* ── Styles ────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  leo: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scoreChip: {
    backgroundColor: COLORS.bg2 ?? COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },

  /* Progress */
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  /* Instruction */
  instruction: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },

  /* Columns */
  columns: {
    flexDirection: 'row',
    gap: 8,
  },
  column: {
    flex: 1,
    gap: 6,
  },
  colLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 4,
    textAlign: 'center',
  },

  /* Cards */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg1,
    minHeight: 46,
  },
  cardMatched: {
    backgroundColor: 'rgba(34,197,94,0.06)',
    borderColor: 'rgba(34,197,94,0.25)',
  },
  cardWrong: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: '#EF4444',
  },
  cardSelectable: {
    borderColor: COLORS.textMuted,
    borderStyle: 'dashed' as any,
  },
  cardText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 16,
    flex: 1,
  },
  termText: {
    fontWeight: '700',
  },
  cardTextMatched: {
    color: COLORS.textMuted,
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Result banner */
  resultBanner: {
    marginTop: 20,
    padding: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    alignItems: 'center',
    gap: 4,
  },
  resultEmoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.3,
  },
  resultSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
