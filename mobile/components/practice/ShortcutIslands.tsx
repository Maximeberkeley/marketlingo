import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptics';

export interface Shortcut {
  id: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  path: string;
}

export const SHORTCUTS: Shortcut[] = [
  { id: 'leo-call', title: 'Call Leo', icon: 'phone', path: '/leo-call' },
  { id: 'arena', title: 'Daily quiz', icon: 'zap', path: '/arena' },
  { id: 'leaderboard', title: 'Leaderboard', icon: 'award', path: '/leaderboard' },
  { id: 'friends', title: 'Friends', icon: 'users', path: '/friends' },
  { id: 'deep-case', title: 'Case', icon: 'briefcase', path: '/deep-case' },
  { id: 'interview-lab', title: 'Interview', icon: 'mic', path: '/interview-lab' },
  { id: 'deliverable', title: 'Brief', icon: 'file-text', path: '/deliverable' },
  { id: 'daily-leo', title: 'Leo check-in', icon: 'sun', path: '/daily-leo' },
];

const KEY = '@marketlingo/practice_shortcuts';

export function useShortcuts() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      try { if (raw) setIds(JSON.parse(raw)); } catch {}
    }).catch(() => {});
  }, []);
  const save = (next: string[]) => {
    setIds(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  };
  return {
    ids,
    add: (id: string) => { if (!ids.includes(id)) save([...ids, id]); },
    remove: (id: string) => save(ids.filter((x) => x !== id)),
  };
}

function Island({ s, size = 64 }: { s: Shortcut; size?: number }) {
  return (
    <View style={[styles.bubble, { width: size, height: size, borderRadius: size / 2 }]}>
      <Feather name={s.icon} size={size * 0.38} color={COLORS.accent} />
    </View>
  );
}

export function ShortcutRow({ ids, editing, setEditing, onRemove }: {
  ids: string[]; editing: boolean; setEditing: (v: boolean) => void; onRemove: (id: string) => void;
}) {
  const items = ids.map((id) => SHORTCUTS.find((s) => s.id === id)).filter(Boolean) as Shortcut[];
  if (!items.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} keyboardShouldPersistTaps="handled">
      {items.map((s) => (
        <TouchableOpacity
          key={s.id}
          style={styles.item}
          activeOpacity={0.8}
          onLongPress={() => { triggerHaptic('medium'); setEditing(true); }}
          onPress={() => { if (editing) { setEditing(false); return; } triggerHaptic('light'); router.push(s.path as any); }}
        >
          <Island s={s} />
          <Text style={styles.label} numberOfLines={1}>{s.title}</Text>
          {editing ? (
            <TouchableOpacity style={styles.minus} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => { triggerHaptic('light'); onRemove(s.id); }}>
              <View style={styles.minusBar} />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

export function ShortcutGallery({ visible, ids, onAdd, onClose }: {
  visible: boolean; ids: string[]; onAdd: (id: string) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Add shortcuts</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.done}>Done</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sheetSub}>Pick what you want at the top of Practice.</Text>
        <ScrollView contentContainerStyle={styles.grid}>
          {SHORTCUTS.map((s) => {
            const added = ids.includes(s.id);
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.gridItem, added && { opacity: 0.45 }]}
                disabled={added}
                onPress={() => { triggerHaptic('light'); onAdd(s.id); }}
              >
                <Island s={s} size={76} />
                <Text style={styles.label} numberOfLines={1}>{s.title}</Text>
                <Text style={styles.addText}>{added ? 'Added' : '+ Add'}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 20, paddingTop: 8, gap: 18, marginBottom: 18 },
  item: { alignItems: 'center', width: 72 },
  bubble: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accentSoft, borderWidth: 1, borderColor: COLORS.borderLight,
    shadowColor: COLORS.accent, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  label: { ...TYPE.caption, color: COLORS.textPrimary, marginTop: 6, fontSize: 12 },
  minus: {
    position: 'absolute', top: -4, right: 0, width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.error, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.bg0,
  },
  minusBar: { width: 10, height: 2, borderRadius: 1, backgroundColor: COLORS.bg0 },
  sheet: { flex: 1, backgroundColor: COLORS.bg0, paddingTop: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  sheetTitle: { ...TYPE.h2, color: COLORS.textPrimary },
  done: { ...TYPE.bodyBold, color: COLORS.accent },
  sheetSub: { ...TYPE.body, color: COLORS.textSecondary, paddingHorizontal: 20, marginTop: 6, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, rowGap: 24 },
  gridItem: { width: '33.33%', alignItems: 'center' },
  addText: { ...TYPE.caption, color: COLORS.accent, marginTop: 2 },
});
