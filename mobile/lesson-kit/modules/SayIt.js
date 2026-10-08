import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { tokens } from '../theme/tokens';
import { PrimaryButton } from '../components/PrimaryButton';
import { useDeliverable } from '../../hooks/useDeliverable';
/**
 * Last beat of a lesson: the learner writes one sentence into a dossier
 * section, then checks it against the lesson's takeaway. No grading.
 */
export function SayIt({ exercise, marketId, onDone }) {
    const dossier = useDeliverable(marketId, exercise.learningGoal);
    const { template, firstOpenSection, loading } = dossier;
    const [sectionKey, setSectionKey] = useState(null);
    const [picking, setPicking] = useState(false);
    const [text, setText] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(null);
    const [failed, setFailed] = useState(false);
    // Respect the reader's lesson match; changing sections remains a learner choice.
    useEffect(() => {
        if (!sectionKey && !loading) {
            const matched = template.sections.find(s => s.key === exercise.sectionKey);
            setSectionKey((matched ?? firstOpenSection ?? template.sections[0]).key);
        }
    }, [sectionKey, loading, firstOpenSection, template.sections, exercise.sectionKey]);
    const section = template.sections.find(s => s.key === sectionKey) ?? template.sections[0];
    const canAdd = text.trim().length >= 3 && !saving && !!marketId;
    const add = async () => {
        if (!canAdd)
            return;
        Keyboard.dismiss();
        setSaving(true);
        setFailed(false);
        const ok = await dossier.addLine(section.key, text, exercise.dayNumber, 'learner');
        setSaving(false);
        if (ok)
            setSaved(text.trim());
        else
            setFailed(true);
    };
    if (saved) {
        return (<View style={styles.wrap}>
        <Text style={styles.eyebrow}>ADDED TO {template.title.toUpperCase()} · {section.title.toUpperCase()}</Text>
        <View style={styles.mine}>
          <Text style={styles.mineText}>{saved}</Text>
        </View>
        {!!exercise.takeaway?.trim() && (<View style={styles.compare}>
            <Text style={styles.compareLabel}>Compare with the lesson</Text>
            <Text style={styles.compareText}>{exercise.takeaway.trim()}</Text>
          </View>)}
        <PrimaryButton label="Continue" onPress={onDone}/>
      </View>);
    }
    return (<View style={styles.wrap}>
      <Text style={styles.title}>Say it in one sentence</Text>
      <Text style={styles.prompt}>{section.prompt}</Text>

      <TouchableOpacity onPress={() => setPicking(p => !p)} style={styles.sectionChip} accessibilityRole="button">
        <Text style={styles.sectionChipText} numberOfLines={1}>
          {template.title} · {section.title}
        </Text>
        <Text style={styles.sectionChipAction}>{picking ? 'Close' : 'Change'}</Text>
      </TouchableOpacity>

      {picking && (<View style={styles.list}>
          {template.sections.map(s => {
                const written = (dossier.bySection[s.key]?.length ?? 0) > 0;
                const active = s.key === section.key;
                return (<TouchableOpacity key={s.key} style={[styles.listItem, active && styles.listItemActive]} onPress={() => { setSectionKey(s.key); setPicking(false); }}>
                <Text style={[styles.listText, active && styles.listTextActive]}>{s.title}</Text>
                {written && <Text style={styles.listMeta}>written</Text>}
              </TouchableOpacity>);
            })}
        </View>)}

      <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Write it the way you would say it out loud…" placeholderTextColor={tokens.color.textMuted} multiline maxLength={280} blurOnSubmit/>
      {failed && <Text style={styles.error}>Couldn't save that. Try again, or skip for now.</Text>}

      <PrimaryButton label={saving ? 'Saving…' : `Add to my ${template.title}`} onPress={add} variant={canAdd ? 'primary' : 'disabled'}/>
      <TouchableOpacity onPress={onDone} style={styles.skip} hitSlop={10} accessibilityRole="link" disabled={saving}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>);
}
const styles = StyleSheet.create({
    wrap: { gap: tokens.space.md },
    title: { fontSize: tokens.font.prompt, fontWeight: '800', color: tokens.color.text },
    prompt: { fontSize: tokens.font.body, color: tokens.color.textSecondary, lineHeight: 22 },
    eyebrow: { fontSize: tokens.font.caption, fontWeight: '800', color: tokens.color.accent, letterSpacing: 0.6 },
    sectionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: tokens.space.sm,
        paddingHorizontal: tokens.space.md,
        paddingVertical: 10,
        borderRadius: tokens.radius.md,
        backgroundColor: tokens.color.accentSoft,
    },
    sectionChipText: { flex: 1, fontSize: tokens.font.caption + 1, fontWeight: '700', color: tokens.color.text },
    sectionChipAction: { fontSize: tokens.font.caption, fontWeight: '800', color: tokens.color.accent },
    list: { gap: 6 },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: tokens.space.md,
        paddingVertical: 10,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: tokens.color.border,
        backgroundColor: tokens.color.card,
    },
    listItemActive: { borderColor: tokens.color.accent },
    listText: { flex: 1, fontSize: tokens.font.caption + 1, color: tokens.color.text },
    listTextActive: { fontWeight: '800' },
    listMeta: { fontSize: tokens.font.caption, color: tokens.color.textMuted },
    input: {
        minHeight: 96,
        borderRadius: tokens.radius.md,
        borderWidth: 2,
        borderColor: tokens.color.border,
        backgroundColor: tokens.color.card,
        padding: tokens.space.md,
        fontSize: tokens.font.body,
        color: tokens.color.text,
        textAlignVertical: 'top',
    },
    error: { fontSize: tokens.font.caption, color: tokens.color.incorrect },
    skip: { alignSelf: 'center', paddingVertical: 4 },
    skipText: { fontSize: tokens.font.caption, color: tokens.color.textSecondary },
    mine: {
        borderLeftWidth: 3,
        borderLeftColor: tokens.color.accent,
        paddingLeft: tokens.space.md,
        paddingVertical: 4,
    },
    mineText: { fontSize: tokens.font.body, color: tokens.color.text, lineHeight: 24, fontWeight: '600' },
    compare: {
        borderRadius: tokens.radius.md,
        backgroundColor: tokens.color.surface,
        padding: tokens.space.md,
        gap: 4,
    },
    compareLabel: { fontSize: tokens.font.caption, fontWeight: '800', color: tokens.color.textSecondary },
    compareText: { fontSize: tokens.font.body, color: tokens.color.text, lineHeight: 22 },
});
