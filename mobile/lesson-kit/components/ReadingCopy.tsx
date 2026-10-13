import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorText } from './ColorText';
import { colonList } from '../cardPresentation';
import { interviewQA, GlossaryEntry } from '../glossary';
import { tokens } from '../theme/tokens';

const ALL = { maxSentences: 10000, maxLength: 1000000, glossary: true } as const;

/** Shared editorial copy and list rows; receives only the card's disclosed text. */
export function ReadingCopy({ text, body = '', evidence = false, preserveCover = false, keyTerms }: {
  text: string; body?: string; evidence?: boolean; preserveCover?: boolean; keyTerms?: readonly GlossaryEntry[];
}) {
  const copyProps = { ...ALL, keyTerms };
  const qa = interviewQA([text, body].filter(Boolean).join(' '));
  if (qa) {
    return <View style={styles.wrap}>
      {!!qa.before && <ColorText text={qa.before} style={styles.body} {...copyProps} />}
      <View style={styles.qCard}>
        <Text style={styles.chip}>INTERVIEW QUESTION</Text>
        <ColorText text={qa.question} style={styles.question} {...copyProps} />
      </View>
      <View style={styles.aCard}>
        <Text style={[styles.chip, styles.aChip]}>SAMPLE ANSWER</Text>
        <ColorText text={qa.answer} style={styles.answer} {...copyProps} />
      </View>
    </View>;
  }
  const headlineList = preserveCover ? null : colonList(text);
  const followingBody = [headlineList?.body, body].filter(Boolean).join('\n\n');
  const rows = (items: string[]) => <View>{items.map((item, index) => (
    <View key={`${index}-${item}`} style={[styles.row, index > 0 && styles.divider]}>
      <Feather name="check" size={15} color={tokens.color.accent} style={styles.check} />
      <ColorText text={item} style={styles.rowText} {...copyProps} />
    </View>
  ))}</View>;
  return <View style={styles.wrap}>
    {!!text && <ColorText text={headlineList?.headline || text} style={evidence ? styles.body : styles.headline} {...copyProps} />}
    {headlineList && rows(headlineList.items)}
    {!!followingBody && <ColorText text={followingBody} style={styles.body} {...copyProps} />}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.space.lg, minWidth: 0 },
  headline: { fontSize: 32, lineHeight: 38, fontWeight: '800', color: tokens.color.text },
  body: { fontSize: 19, lineHeight: 28, fontWeight: '400', color: tokens.color.text, opacity: 0.8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space.md, paddingVertical: tokens.space.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: tokens.color.border },
  check: { marginTop: 6 },
  rowText: { flex: 1, minWidth: 0, fontSize: 19, lineHeight: 28, color: tokens.color.text, opacity: 0.8 },
  qCard: { gap: tokens.space.sm, padding: tokens.space.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.color.surface, borderWidth: 1, borderColor: tokens.color.border },
  aCard: { marginTop: tokens.space.xs, gap: tokens.space.sm, padding: tokens.space.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.color.accentSoft, borderLeftWidth: 3, borderLeftColor: tokens.color.accent },
  chip: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8, color: tokens.color.textSecondary },
  aChip: { color: tokens.color.accent },
  question: { fontSize: 20, lineHeight: 27, fontWeight: '800', color: tokens.color.text },
  answer: { fontSize: 17, lineHeight: 26, color: tokens.color.text },
});
