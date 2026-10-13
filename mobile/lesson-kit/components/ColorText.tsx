import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { shortText } from '../text';
import { glossaryFor, cardGlossaryMatches, GlossaryEntry } from '../glossary';
import { useDeepDiveTarget } from './DeepDiveContext';
import { tokens } from '../theme/tokens';

interface Props {
  text: string;
  style?: StyleProp<TextStyle>;
  maxSentences?: number;
  maxLength?: number;
  numberOfLines?: number;
  /** Tint known industry terms and show their definition on tap. */
  glossary?: boolean;
  keyTerms?: readonly GlossaryEntry[];
  precedingText?: readonly string[];
  excludedText?: readonly string[];
}

const SIGNAL = /(\$?\d[\d,.]*(?:%|[KMBT])?)/gi;
const NUMBER = /^\$?\d/i;

function figures(text: string, keyPrefix: string) {
  return text.split(SIGNAL).map((part, index) => NUMBER.test(part)
    ? <Text key={`${keyPrefix}-${index}`} style={{ fontWeight: '800' }}>{part}</Text>
    : part);
}

/** Figures are bold and inherit their surrounding text color, including feedback. */
export function ColorText({ text, style, maxSentences = 2, maxLength = 170, numberOfLines, glossary = false, keyTerms, precedingText, excludedText }: Props) {
  const { marketId } = useDeepDiveTarget();
  const [open, setOpen] = useState<GlossaryEntry | null>(null);
  const shown = shortText(text, maxSentences, maxLength);
  const terms = useMemo(() => (glossary ? glossaryFor(marketId, keyTerms) : null), [glossary, marketId, keyTerms]);

  const content = useMemo(() => {
    if (!terms) return figures(shown, 'f');
    const out: React.ReactNode[] = [];
    let last = 0;
    for (const m of cardGlossaryMatches(shown, terms, precedingText, excludedText)) {
      const entry = m.entry;
      const at = m.index;
      out.push(...figures(shown.slice(last, at), `p${at}`));
      out.push(<Text key={`t${at}`} style={styles.term} onPress={() => setOpen(entry)} suppressHighlighting>{m.text}</Text>);
      last = at + m.text.length;
    }
    out.push(...figures(shown.slice(last), 'end'));
    return out;
  }, [shown, terms, precedingText, excludedText]);

  return (
    <>
      <Text style={style} numberOfLines={numberOfLines}>{content}</Text>
      {terms && (
        <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
          <Pressable style={styles.scrim} onPress={() => setOpen(null)} accessibilityLabel="Close definition">
            <View style={styles.sheet}>
              <Text style={styles.sheetTerm}>{open?.term}</Text>
              <Text style={styles.sheetDef}>{open?.definition}</Text>
              <Text style={styles.sheetHint}>Tap anywhere to close</Text>
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  term: { color: tokens.color.accent, fontWeight: '700', textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: tokens.color.accent },
  scrim: { flex: 1, backgroundColor: tokens.color.scrim, justifyContent: 'flex-end', padding: tokens.space.lg, paddingBottom: 40 },
  sheet: { backgroundColor: tokens.color.card, borderRadius: tokens.radius.xl, padding: tokens.space.xl, gap: tokens.space.sm, borderWidth: 1, borderColor: tokens.color.border },
  sheetTerm: { fontSize: 20, fontWeight: '800', color: tokens.color.accent },
  sheetDef: { fontSize: 17, lineHeight: 25, color: tokens.color.text },
  sheetHint: { marginTop: tokens.space.xs, fontSize: 12, fontWeight: '600', color: tokens.color.textMuted },
});
