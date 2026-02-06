import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';

interface Note {
  id: string;
  content: string;
  linkedTo?: string;
  createdAt: Date;
}

const SAMPLE_NOTES: Note[] = [
  {
    id: '1',
    content: 'Boeing 737 MAX - MCAS system was the cause of two fatal crashes. Now redesigned with redundant sensors.',
    linkedTo: 'Commercial Aviation',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    content: 'Lockheed Martin F-35 program is the most expensive weapons system in history at $1.7T lifetime cost.',
    linkedTo: 'Defense Systems',
    createdAt: new Date('2024-01-14'),
  },
  {
    id: '3',
    content: 'SpaceX Starship - Fully reusable rocket system designed for Mars colonization.',
    linkedTo: 'Space Economy',
    createdAt: new Date('2024-01-13'),
  },
];

export default function NotebookScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState<Note[]>(SAMPLE_NOTES);

  const filteredNotes = notes.filter((note) =>
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <View style={styles.header}>
          <Text style={styles.title}>My Notebook</Text>
          <Text style={styles.subtitle}>{notes.length} insights captured</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📓</Text>
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptySubtitle}>
              Save insights from lessons to build your knowledge base
            </Text>
          </View>
        ) : (
          <View style={styles.notesList}>
            {filteredNotes.map((note) => (
              <TouchableOpacity key={note.id} style={styles.noteCard} activeOpacity={0.7}>
                <Text style={styles.noteContent}>{note.content}</Text>
                {note.linkedTo && (
                  <View style={styles.noteMeta}>
                    <View style={styles.noteTag}>
                      <Text style={styles.noteTagText}>{note.linkedTo}</Text>
                    </View>
                    <Text style={styles.noteDate}>
                      {note.createdAt.toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Note FAB */}
      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 80 }]}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg0,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg2,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  notesList: {
    gap: 12,
  },
  noteCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteContent: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 12,
  },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteTag: {
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  noteTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.accent,
  },
  noteDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
