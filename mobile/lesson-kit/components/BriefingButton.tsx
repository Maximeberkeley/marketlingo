import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { briefingNote } from '../cardPresentation';

export const BRIEFING_BUTTON_TITLE = 'Read the full briefing';

/** The one way into a card's full briefing, the same on every reading card. */
export function BriefingButton({ text, onPress }: { text?: string; onPress: () => void }) {
  const note = briefingNote(text);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${BRIEFING_BUTTON_TITLE}. ${note}`}
      activeOpacity={0.82}
      style={styles.button}
      onPress={onPress}
    >
      <View style={styles.icon}><Feather name="book-open" size={15} color={tokens.color.accent} /></View>
      <View style={styles.copy}>
        <Text style={styles.title}>{BRIEFING_BUTTON_TITLE}</Text>
        <Text style={styles.note}>{note}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={tokens.color.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surface, borderWidth: 1, borderColor: tokens.color.border },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.accentSoft },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '800', color: tokens.color.text },
  note: { marginTop: 2, fontSize: 11, fontWeight: '600', color: tokens.color.textMuted },
});
