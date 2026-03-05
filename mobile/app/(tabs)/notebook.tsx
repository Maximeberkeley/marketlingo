import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { APP_ICONS } from '../../lib/icons';

interface NoteEntry {
  id: string;
  content: string;
  linked_label: string | null;
  created_at: string;
  stack_id: string | null;
  slide_id: string | null;
}

function getLinkedType(label: string | null): 'news' | 'lesson' | 'trainer' | 'personal' {
  if (!label) return 'lesson';
  const lower = label.toLowerCase();
  if (lower.includes('news') || lower.includes('daily')) return 'news';
  if (lower.includes('trainer')) return 'trainer';
  if (lower.includes('personal')) return 'personal';
  return 'lesson';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupNotesByDate(notes: NoteEntry[]): Record<string, NoteEntry[]> {
  const groups: Record<string, NoteEntry[]> = {};
  notes.forEach((note) => {
    const key = formatDate(note.created_at);
    if (!groups[key]) groups[key] = [];
    groups[key].push(note);
  });
  return groups;
}

const typeColors: Record<string, { bg: string; text: string; label: string }> = {
  lesson: { bg: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA', label: 'Lesson' },
  news: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', label: 'News' },
  trainer: { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', label: 'Trainer' },
  personal: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ADE80', label: 'Personal' },
};

const filters = [
  { id: null, label: 'All', emoji: '📖' },
  { id: 'lesson', label: 'Lessons', emoji: '💡' },
  { id: 'news', label: 'News', emoji: '📰' },
  { id: 'trainer', label: 'Trainer', emoji: '🎯' },
];

export default function NotebookScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_market')
        .eq('id', user.id)
        .single();

      if (profile?.selected_market) {
        setSelectedMarket(profile.selected_market);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user || !selectedMarket) return;

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('market_id', selectedMarket)
        .order('created_at', { ascending: false });

      if (!error) {
        setNotes(data || []);
      }
      setLoading(false);
    };

    if (selectedMarket) fetchNotes();
  }, [user, selectedMarket]);

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('notes').delete().eq('id', noteId).eq('user_id', user.id);
          setNotes((prev) => prev.filter((n) => n.id !== noteId));
        },
      },
    ]);
  };

  const handleAddNote = async () => {
    if (!user || !newNoteContent.trim() || !selectedMarket) return;

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        content: newNoteContent.trim(),
        linked_label: 'Personal Note',
        market_id: selectedMarket,
      })
      .select()
      .single();

    if (!error && data) {
      setNotes((prev) => [data, ...prev]);
      setNewNoteContent('');
      setShowAddNote(false);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const linkedType = getLinkedType(note.linked_label);
    const matchesFilter = !selectedFilter || linkedType === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const groupedNotes = groupNotesByDate(filteredNotes);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>My Notebook</Text>
            <Text style={styles.subtitle}>{notes.length} insights captured</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddNote(true)}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Pro Tip */}
        {notes.length > 0 && notes.length < 5 && (
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Pro Tip</Text>
              <Text style={styles.tipText}>
                Add notes during lessons to reinforce learning. Studies show writing helps retention by 30%.
              </Text>
            </View>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your notes..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersRow}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id || 'all'}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={styles.filterEmoji}>{filter.emoji}</Text>
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Notes by Date */}
        {Object.keys(groupedNotes).length > 0 ? (
          <View style={{ gap: 20 }}>
            {Object.entries(groupedNotes).map(([date, dateNotes]) => (
              <View key={date}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateEmoji}>📅</Text>
                  <Text style={styles.dateText}>{date}</Text>
                </View>
                <View style={{ gap: 8 }}>
                  {dateNotes.map((note) => {
                    const linkedType = getLinkedType(note.linked_label);
                    const colors = typeColors[linkedType] || typeColors.lesson;
                    return (
                      <TouchableOpacity
                        key={note.id}
                        style={styles.noteCard}
                        activeOpacity={0.7}
                        onLongPress={() => handleDeleteNote(note.id)}
                      >
                        <Text style={styles.noteContent} numberOfLines={4}>
                          {note.content}
                        </Text>
                        <View style={styles.noteMeta}>
                          <View style={[styles.noteTag, { backgroundColor: colors.bg }]}>
                            <Text style={[styles.noteTagText, { color: colors.text }]}>
                              {note.linked_label || colors.label}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📓</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No notes found' : 'Start your notebook'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try a different search term'
                : 'Capture insights while learning to build your knowledge base'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.emptyButton} onPress={() => setShowAddNote(true)}>
                <Text style={styles.emptyButtonText}>📝 Add your first note</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
        onPress={() => setShowAddNote(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Note Modal */}
      <Modal visible={showAddNote} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>New Note</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What insight do you want to remember?"
                placeholderTextColor={COLORS.textMuted}
                value={newNoteContent}
                onChangeText={setNewNoteContent}
                multiline
                autoFocus
                textAlignVertical="top"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => {
                    setShowAddNote(false);
                    setNewNoteContent('');
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSave, !newNoteContent.trim() && { opacity: 0.5 }]}
                  onPress={handleAddNote}
                  disabled={!newNoteContent.trim()}
                >
                  <Text style={styles.modalSaveText}>Save Note</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textMuted },
  addButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  addButtonText: { fontSize: 22, color: COLORS.accent, fontWeight: '300' },
  tipCard: {
    flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.05)', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)',
    gap: 8, alignItems: 'flex-start',
  },
  tipEmoji: { fontSize: 14, marginTop: 2 },
  tipTitle: { fontSize: 12, fontWeight: '600', color: COLORS.accent, marginBottom: 2 },
  tipText: { fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg2,
    borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: COLORS.textPrimary },
  filtersRow: { marginBottom: 16, flexGrow: 0 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.3)' },
  filterEmoji: { fontSize: 12 },
  filterText: { fontSize: 12, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.accent, fontWeight: '600' },
  dateHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dateEmoji: { fontSize: 11 },
  dateText: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  noteCard: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  noteContent: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 21, marginBottom: 10 },
  noteMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noteTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  noteTagText: { fontSize: 10, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 16, paddingHorizontal: 20 },
  emptyButton: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  emptyButtonText: { fontSize: 13, color: COLORS.accent, fontWeight: '500' },
  fab: {
    position: 'absolute', right: 16, width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  fabIcon: { fontSize: 28, color: '#FFFFFF', fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(100,116,139,0.3)',
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  modalInput: {
    height: 120, padding: 14, backgroundColor: COLORS.bg2, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, fontSize: 15, color: COLORS.textPrimary, lineHeight: 22,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.bg2,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  modalCancelText: { color: COLORS.textSecondary, fontSize: 14 },
  modalSave: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.accent, alignItems: 'center' },
  modalSaveText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});
