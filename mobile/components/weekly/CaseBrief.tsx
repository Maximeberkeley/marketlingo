import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, TYPE } from '../../lib/constants';
import { presenter, type WeeklyCase, type WeeklyExhibit } from '../../lib/weeklyCase';

/** Text with **bold** runs, so a brief can stress its few key figures. */
function Rich({ text, style }: { text: string; style?: any }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <Text style={style}>
      {parts.map((part, i) => /^\*\*[^*]+\*\*$/.test(part)
        ? <Text key={i} style={styles.bold}>{part.slice(2, -2)}</Text>
        : <Text key={i}>{part}</Text>)}
    </Text>
  );
}

function Exhibit({ exhibit }: { exhibit: WeeklyExhibit }) {
  const rows = [exhibit.columns, ...exhibit.rows];
  return (
    <View style={styles.exhibit}>
      <Text style={styles.exhibitTitle}>{exhibit.title}</Text>
      <View>
        {rows.map((row, r) => (
          <View key={r} style={[styles.tableRow, r === 0 && styles.tableHead]}>
            {row.map((cell, c) => (
              <Text
                key={c}
                style={[styles.cell, c === 0 ? styles.cellFirst : styles.cellNum, r === 0 && styles.cellHead]}
              >
                {cell}
              </Text>
            ))}
          </View>
        ))}
      </View>
      {exhibit.note ? <Text style={styles.exhibitNote}>{exhibit.note}</Text> : null}
    </View>
  );
}

const when = (iso?: string | null): string => {
  const m = iso && /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';
};

/** The reading half of a Weekly Case: who set it, the brief, the exhibits, the question and the sources. */
export function CaseBrief({ weekly, showQuestion = true }: { weekly: WeeklyCase; showQuestion?: boolean }) {
  const by = presenter(weekly);
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.topRow}>
        <View style={styles.topicChip}><Text style={styles.topicText}>{weekly.topic}</Text></View>
        {by ? <Text style={styles.byText} numberOfLines={1}>Presented by {by}</Text> : null}
      </View>
      <Text style={styles.title}>{weekly.title}</Text>
      {weekly.hook ? <Text style={styles.hook}>{weekly.hook}</Text> : null}
      {weekly.brief.map((para, i) => <Rich key={i} text={para} style={styles.para} />)}
      {weekly.exhibits.map(exhibit => <Exhibit key={exhibit.id || exhibit.title} exhibit={exhibit} />)}
      {showQuestion ? (
        <View style={styles.question}>
          <Text style={styles.questionLabel}>YOUR QUESTION</Text>
          <Text style={styles.questionText}>{weekly.question}</Text>
        </View>
      ) : null}
      {weekly.sources.length > 0 || weekly.disclosure ? (
        <View style={styles.sources}>
          {weekly.disclosure ? <Text style={styles.sourceText}>{weekly.disclosure}</Text> : null}
          {weekly.sources.length > 0 ? <Text style={[styles.sourcesLabel, { marginTop: 6 }]}>Sources</Text> : null}
          {weekly.sources.map((s, i) => {
            const label = `${s.title}${s.published ? ` · ${when(s.published)}` : ''}`;
            return s.url ? (
              <TouchableOpacity key={s.id || i} onPress={() => Linking.openURL(s.url!).catch(() => {})} accessibilityRole="link">
                <Text style={[styles.sourceText, styles.sourceLink]}>{label}</Text>
              </TouchableOpacity>
            ) : <Text key={s.id || i} style={styles.sourceText}>{label}</Text>;
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  topicChip: { flexShrink: 1, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: COLORS.accentSoft },
  topicText: { ...TYPE.caption, color: COLORS.accent, fontSize: 12, lineHeight: 16, fontWeight: '800' },
  byText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, flexShrink: 1 },
  hook: { ...TYPE.body, fontSize: 17, lineHeight: 25, fontWeight: '600', color: COLORS.textSecondary },
  title: { ...TYPE.hero, fontSize: 26, lineHeight: 32, color: COLORS.textPrimary },
  para: { ...TYPE.body, fontSize: 16, lineHeight: 24, color: COLORS.textPrimary },
  bold: { fontWeight: '800' },
  exhibit: { padding: 14, borderRadius: 16, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
  exhibitTitle: { ...TYPE.overline, color: COLORS.textSecondary },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, gap: 8 },
  tableHead: { borderTopWidth: 0, paddingTop: 0 },
  cell: { fontSize: 13, lineHeight: 18, color: COLORS.textPrimary },
  cellFirst: { flex: 1.9, fontWeight: '600' },
  cellNum: { flex: 1, textAlign: 'right', fontVariant: ['tabular-nums'] },
  cellHead: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 0.4 },
  exhibitNote: { fontSize: 12, lineHeight: 17, color: COLORS.textMuted },
  question: { padding: 16, borderRadius: 16, backgroundColor: COLORS.accentSoft, borderLeftWidth: 4, borderLeftColor: COLORS.accent, gap: 6 },
  questionLabel: { ...TYPE.overline, color: COLORS.accent },
  questionText: { fontSize: 17, lineHeight: 24, fontWeight: '700', color: COLORS.textPrimary },
  sources: { gap: 4, paddingTop: 4 },
  sourcesLabel: { ...TYPE.overline, color: COLORS.textMuted },
  sourceText: { fontSize: 12, lineHeight: 17, color: COLORS.textMuted },
  sourceLink: { color: COLORS.accent, textDecorationLine: 'underline' },
});
