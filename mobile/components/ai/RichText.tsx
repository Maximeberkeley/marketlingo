import React, { useMemo } from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';
import { Block, Span, parseRichText } from '../../lib/richText';

/** Draws a chat reply's markdown (bold, italic, bullets, numbered lists, headings) without showing the symbols. */
export function RichText({ text, style, color }: { text: string; style?: TextStyle; color: string }) {
  const blocks = useMemo(() => parseRichText(text), [text]);
  const base: TextStyle = { fontSize: 15, lineHeight: 22, color, ...(style || {}) };
  const spans = (list: Span[]) => list.map((s, i) => (
    <Text key={i} style={[s.bold && styles.bold, s.italic && styles.italic]}>{s.text}</Text>
  ));
  return (
    <View style={styles.wrap}>
      {blocks.map((b: Block, i) => {
        if (b.kind === 'heading') return <Text key={i} style={[base, styles.bold, { marginTop: i ? 4 : 0 }]}>{spans(b.spans)}</Text>;
        if (b.kind === 'para') return <Text key={i} style={base}>{spans(b.spans)}</Text>;
        return (
          <View key={i} style={styles.item}>
            <Text style={[base, styles.marker]}>{b.kind === 'number' ? `${b.n}.` : '•'}</Text>
            <Text style={[base, styles.itemText]}>{spans(b.spans)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  bold: { fontWeight: '800' },
  italic: { fontStyle: 'italic' },
  item: { flexDirection: 'row', gap: 8 },
  marker: { minWidth: 14, fontWeight: '800' },
  itemText: { flex: 1 },
});
