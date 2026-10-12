import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { InterviewTarget, parseInterviewDate, roleTrack, shortDate, TRACK_LABEL } from '../../lib/interviewPrep';
import { triggerHaptic } from '../../lib/haptics';

interface Props {
  target: InterviewTarget | null;
  onSave: (t: InterviewTarget | null) => Promise<void> | void;
  /** Start with the fields showing (used by the "Add it" link). */
  initiallyOpen?: boolean;
  /** Called when the open form is cancelled. */
  onCancel?: () => void;
}

/** "Got an interview?" — company, role, and a date (or "no date yet"). */
export function InterviewTargetForm({ target, onSave, initiallyOpen = false, onCancel }: Props) {
  const [open, setOpen] = useState(initiallyOpen);
  const [company, setCompany] = useState(target?.company || '');
  const [role, setRole] = useState(target?.role || '');
  const [date, setDate] = useState(target?.date || '');
  const [noDate, setNoDate] = useState(target ? !target.date : false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCompany(target?.company || '');
    setRole(target?.role || '');
    setDate(target?.date || '');
    setNoDate(target ? !target.date : false);
  }, [target?.updatedAt]);

  const save = async () => {
    const iso = noDate ? null : parseInterviewDate(date);
    if (!company.trim() || !role.trim()) { setError('Add the company and the role.'); return; }
    if (!noDate && !iso) { setError('Use a date like 2026-10-24, or pick "No date yet".'); return; }
    setError('');
    triggerHaptic('success');
    await onSave({ company: company.trim(), role: role.trim(), date: iso, updatedAt: new Date().toISOString() });
    setOpen(false);
  };

  if (!open) {
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={() => { triggerHaptic('light'); setOpen(true); }}>
        <View style={styles.icon}><Feather name="briefcase" size={20} color={COLORS.accent} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{target ? `${target.role} · ${target.company}` : 'Got an interview?'}</Text>
          <Text style={styles.sub}>
            {target ? `${target.date ? shortDate(target.date) : 'No date yet'} · ${TRACK_LABEL[roleTrack(target.role)]}` : 'Add the company, role and date. We’ll plan your prep.'}
          </Text>
        </View>
        <Feather name={target ? 'edit-2' : 'plus'} size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      <View style={{ flex: 1, gap: 10 }}>
        <Text style={styles.title}>Got an interview?</Text>
        <TextInput value={company} onChangeText={setCompany} placeholder="Company" placeholderTextColor={COLORS.textMuted} style={styles.input} />
        <TextInput value={role} onChangeText={setRole} placeholder="Role (e.g. Tech Lead, Recruiter, Consultant)" placeholderTextColor={COLORS.textMuted} style={styles.input} />
        {!noDate && (
          <TextInput value={date} onChangeText={setDate} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={COLORS.textMuted} style={styles.input} keyboardType="numbers-and-punctuation" />
        )}
        <TouchableOpacity style={styles.toggle} onPress={() => setNoDate(v => !v)}>
          <Feather name={noDate ? 'check-square' : 'square'} size={18} color={COLORS.accent} />
          <Text style={styles.toggleText}>No date yet</Text>
        </TouchableOpacity>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.row}>
          {target && (
            <TouchableOpacity onPress={async () => { await onSave(null); setOpen(false); }}>
              <Text style={styles.remove}>Remove</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => { setOpen(false); onCancel?.(); }}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={styles.save} onPress={save}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg2 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accentSoft },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  sub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 16, color: COLORS.textPrimary, backgroundColor: COLORS.bg0 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  error: { fontSize: 13, color: COLORS.error },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  remove: { fontSize: 14, color: COLORS.error, fontWeight: '700' },
  cancel: { fontSize: 14, color: COLORS.textMuted, fontWeight: '700' },
  save: { backgroundColor: COLORS.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  saveText: { color: COLORS.textOnAccent, fontWeight: '800', fontSize: 14 },
});
