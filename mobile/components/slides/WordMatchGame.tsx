/**
 * WordMatchGame — Interactive word-definition matching mini-game.
 * Users tap a term, then tap its matching definition. 
 * Inserted mid-lesson as an interstitial.
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';

const LEO_IMAGE = require('../../assets/mascot/leo-reference.png');

export interface WordPair {
  term: string;
  definition: string;
}

interface WordMatchGameProps {
  pairs: WordPair[];
  onComplete: (score: number, total: number) => void;
  accentColor: string;
}

export function WordMatchGame({ pairs, onComplete, accentColor }: WordMatchGameProps) {
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<{ term: number; def: number } | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Shuffle definitions independently
  const shuffledDefs = useMemo(() => {
    const indexed = pairs.map((p, i) => ({ ...p, origIndex: i }));
    for (let i = indexed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }
    return indexed;
  }, [pairs]);

  const handleTermTap = (index: number) => {
    if (matched.has(index)) return;
    Haptics.selectionAsync();
    setSelectedTerm(index);
    setWrong(null);
  };

  const handleDefTap = (defIdx: number) => {
    if (selectedTerm === null) return;
    const origIndex = shuffledDefs[defIdx].origIndex;
    setAttempts(a => a + 1);

    if (origIndex === selectedTerm) {
      // Correct match
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newMatched = new Set(matched);
      newMatched.add(selectedTerm);
      setMatched(newMatched);
      setScore(s => s + 1);
      setSelectedTerm(null);
      setWrong(null);

      if (newMatched.size === pairs.length) {
        setTimeout(() => onComplete(score + 1, pairs.length), 1200);
      }
    } else {
      // Wrong
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setWrong({ term: selectedTerm, def: defIdx });
      setTimeout(() => { setWrong(null); setSelectedTerm(null); }, 800);
    }
  };

  const allDone = matched.size === pairs.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={LEO_IMAGE} style={styles.leo} />
        <View style={[styles.badge, { backgroundColor: accentColor + '18' }]}>
          <Feather name="shuffle" size={14} color={accentColor} />
          <Text style={[styles.badgeText, { color: accentColor }]}>Match Terms</Text>
        </View>
        <Text style={styles.scoreText}>{matched.size}/{pairs.length}</Text>
      </View>

      <Text style={styles.instruction}>
        {allDone ? '🎉 All matched!' : 'Tap a term, then tap its definition'}
      </Text>

      <View style={styles.columns}>
        {/* Terms column */}
        <View style={styles.column}>
          <Text style={styles.colLabel}>TERMS</Text>
          {pairs.map((pair, i) => {
            const isMatched = matched.has(i);
            const isSelected = selectedTerm === i;
            const isWrongTerm = wrong?.term === i;
            return (
              <TouchableOpacity
                key={`t-${i}`}
                onPress={() => handleTermTap(i)}
                disabled={isMatched}
                style={[
                  styles.card,
                  isMatched && styles.cardMatched,
                  isSelected && { borderColor: accentColor, backgroundColor: accentColor + '12' },
                  isWrongTerm && styles.cardWrong,
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.cardText,
                  styles.termText,
                  isMatched && styles.cardTextMatched,
                ]}>
                  {pair.term}
                </Text>
                {isMatched && <Feather name="check" size={14} color="#22C55E" />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Definitions column */}
        <View style={styles.column}>
          <Text style={styles.colLabel}>DEFINITIONS</Text>
          {shuffledDefs.map((def, i) => {
            const isMatched = matched.has(def.origIndex);
            const isWrongDef = wrong?.def === i;
            return (
              <TouchableOpacity
                key={`d-${i}`}
                onPress={() => handleDefTap(i)}
                disabled={isMatched || selectedTerm === null}
                style={[
                  styles.card,
                  isMatched && styles.cardMatched,
                  isWrongDef && styles.cardWrong,
                  selectedTerm !== null && !isMatched && styles.cardHighlight,
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.cardText,
                  isMatched && styles.cardTextMatched,
                ]} numberOfLines={3}>
                  {def.definition}
                </Text>
                {isMatched && <Feather name="check" size={14} color="#22C55E" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {allDone && (
        <View style={styles.resultBanner}>
          <Text style={styles.resultText}>
            {score === pairs.length ? 'Perfect! 🎯' : `${score}/${pairs.length} first try`}
          </Text>
        </View>
      )}
    </View>
  );
}

/** Extract term-definition pairs from slide content */
export function extractTermPairs(slideTitle: string, slideBody: string): WordPair[] {
  const pairs: WordPair[] = [];
  if (!slideBody || slideBody.length < 60) return pairs;

  // Pattern 1: "**Term** — definition" or "**Term**: definition"
  const boldPattern = /\*\*([^*]+)\*\*\s*[—:\-–]\s*(.+?)(?:\n|$)/g;
  let match;
  while ((match = boldPattern.exec(slideBody)) !== null) {
    const term = match[1].trim();
    let def = match[2].trim();
    if (term.length > 2 && term.length < 40 && def.length > 10) {
      if (def.length > 80) def = def.substring(0, 77) + '...';
      pairs.push({ term, definition: def });
    }
  }

  // Pattern 2: "Term: definition" (line starts with capitalized word)
  if (pairs.length < 3) {
    const colonPattern = /^([A-Z][A-Za-z\s]{2,30}):\s+(.{15,}?)$/gm;
    while ((match = colonPattern.exec(slideBody)) !== null && pairs.length < 5) {
      const term = match[1].trim();
      let def = match[2].trim();
      if (def.length > 80) def = def.substring(0, 77) + '...';
      if (!pairs.find(p => p.term === term)) {
        pairs.push({ term, definition: def });
      }
    }
  }

  // Return 3-5 pairs max (optimal for mobile)
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
  // Show roughly at the midpoint, offset from quiz cards
  const midpoint = Math.floor(totalSlides / 2);
  return slideIndex === midpoint || slideIndex === midpoint + 1;
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  leo: { width: 40, height: 40, resizeMode: 'contain' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  scoreText: { marginLeft: 'auto', fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  instruction: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  columns: { flexDirection: 'row', gap: 8 },
  column: { flex: 1, gap: 6 },
  colLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg1,
    minHeight: 48,
  },
  cardMatched: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.3)',
    opacity: 0.7,
  },
  cardWrong: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: '#EF4444',
  },
  cardHighlight: {
    borderColor: COLORS.textMuted,
    borderStyle: 'dashed' as any,
  },
  cardText: { fontSize: 12, color: COLORS.textPrimary, lineHeight: 17, flex: 1 },
  termText: { fontWeight: '700' },
  cardTextMatched: { color: COLORS.textMuted },
  resultBanner: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    alignItems: 'center',
  },
  resultText: { fontSize: 16, fontWeight: '700', color: '#22C55E' },
});
