import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ColorText } from './ColorText';
import { colonList } from '../cardPresentation';
import { tokens } from '../theme/tokens';
/** Shared editorial copy and list rows; receives only the card's disclosed text. */
export function ReadingCopy({ text, body = '', evidence = false, preserveCover = false }) {
    const headlineList = preserveCover ? null : colonList(text);
    const followingBody = [headlineList?.body, body].filter(Boolean).join('\n\n');
    const rows = (items) => <View>{items.map((item, index) => (<View key={`${index}-${item}`} style={[styles.row, index > 0 && styles.divider]}>
      <Feather name="check" size={15} color={tokens.color.accent} style={styles.check}/>
      <ColorText text={item} style={styles.rowText} maxSentences={10000} maxLength={1000000}/>
    </View>))}</View>;
    return <View style={styles.wrap}>
    {!!text && <ColorText text={headlineList?.headline || text} style={evidence ? styles.body : styles.headline} maxSentences={10000} maxLength={1000000}/>}
    {headlineList && rows(headlineList.items)}
    {!!followingBody && <ColorText text={followingBody} style={styles.body} maxSentences={10000} maxLength={1000000}/>}
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
});
