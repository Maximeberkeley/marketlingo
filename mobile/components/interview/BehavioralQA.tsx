import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useInterviewNotebook } from '../../hooks/useInterviewNotebook';

interface BehavioralQAProps {
  marketName: string;
  marketId: string;
}

interface BehavioralQuestion {
  id: string;
  question: string;
  category: string;
  tip: string;
  suggestedAnswer: string;
  frameworks?: string[];
}

const BEHAVIORAL_QUESTIONS: BehavioralQuestion[] = [
  {
    id: 'strengths',
    question: 'What are your strengths?',
    category: 'Self-Assessment',
    tip: 'Pick 2-3 strengths backed by specific examples. Avoid generic answers.',
    suggestedAnswer: '"One of my key strengths is analytical problem-solving. For example, at [company], I identified a 15% inefficiency in our supply chain by analyzing 3 months of data, leading to $200K in annual savings."',
    frameworks: ['STAR Method'],
  },
  {
    id: 'weaknesses',
    question: 'What is your biggest weakness?',
    category: 'Self-Assessment',
    tip: 'Be honest but strategic. Show self-awareness and how you\'re improving.',
    suggestedAnswer: '"I used to struggle with delegating tasks because I wanted everything done perfectly. I\'ve worked on this by implementing weekly check-ins with my team, which has improved both productivity and team morale."',
    frameworks: ['Growth Mindset'],
  },
  {
    id: 'tell_me',
    question: 'Tell me about yourself.',
    category: 'Introduction',
    tip: 'Use Present → Past → Future format. Keep it under 2 minutes.',
    suggestedAnswer: '"Currently, I\'m a [role] at [company] where I [key achievement]. Previously, I [relevant experience]. I\'m excited about this opportunity because [connection to role]."',
    frameworks: ['Present-Past-Future'],
  },
  {
    id: 'why_company',
    question: 'Why do you want to work here?',
    category: 'Motivation',
    tip: 'Research the company deeply. Connect their mission to your goals.',
    suggestedAnswer: '"Three things excite me: First, your [specific initiative]. Second, your culture of [value]. Third, the opportunity to [specific contribution I can make]."',
    frameworks: ['Rule of Three'],
  },
  {
    id: 'conflict',
    question: 'Tell me about a time you handled a conflict.',
    category: 'Behavioral',
    tip: 'Focus on resolution, not the conflict itself. Show emotional intelligence.',
    suggestedAnswer: '"In my last role, two team members disagreed on the technical approach. I facilitated a meeting where each presented their solution with data. We built a hybrid approach that combined the best elements, completing the project 2 weeks early."',
    frameworks: ['STAR Method', 'Conflict Resolution'],
  },
  {
    id: 'leadership',
    question: 'Describe a time you led a team through a challenge.',
    category: 'Leadership',
    tip: 'Quantify the outcome. Show how you motivated others.',
    suggestedAnswer: '"When our key supplier failed mid-project, I assembled a tiger team, split into 3 workstreams, and personally called 12 alternative suppliers. We secured a new partner within 48 hours and delivered the project on time, saving the $500K contract."',
    frameworks: ['STAR Method', 'Crisis Management'],
  },
  {
    id: 'failure',
    question: 'Tell me about a time you failed.',
    category: 'Behavioral',
    tip: 'Own the failure completely, then focus 80% of your answer on what you learned.',
    suggestedAnswer: '"I once launched a product feature without sufficient user testing. Usage was 60% below projections. I took responsibility, implemented a rigorous A/B testing process, and the next feature launch exceeded targets by 40%."',
    frameworks: ['STAR Method', 'Growth Mindset'],
  },
  {
    id: 'ambiguity',
    question: 'How do you handle ambiguity?',
    category: 'Problem-Solving',
    tip: 'Show structured thinking even when information is incomplete.',
    suggestedAnswer: '"I start by defining what I do and don\'t know, then prioritize the 2-3 most impactful unknowns. I create hypotheses, identify the fastest way to test them, and iterate. For example..."',
    frameworks: ['Hypothesis-Driven', 'MECE'],
  },
];

const CATEGORIES = ['All', ...new Set(BEHAVIORAL_QUESTIONS.map(q => q.category))];

export function BehavioralQA({ marketName, marketId }: BehavioralQAProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [answeredCount, setAnsweredCount] = useState(0);

  // Load notes from storage
  React.useEffect(() => {
    AsyncStorage.getItem(`interview_notes_${marketId}`).then(data => {
      if (data) {
        const parsed = JSON.parse(data);
        setNotes(parsed);
        setAnsweredCount(Object.keys(parsed).length);
      }
    }).catch(() => {});
  }, [marketId]);

  const saveNote = useCallback(async (questionId: string) => {
    if (!noteText.trim()) return;
    const updated = { ...notes, [questionId]: noteText.trim() };
    setNotes(updated);
    setAnsweredCount(Object.keys(updated).length);
    setEditingNote(null);
    setNoteText('');
    triggerHaptic('success');
    try {
      await AsyncStorage.setItem(`interview_notes_${marketId}`, JSON.stringify(updated));
    } catch {}
  }, [notes, noteText, marketId]);

  const deleteNote = useCallback(async (questionId: string) => {
    Alert.alert('Delete Note?', 'This will remove your personalized answer.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = { ...notes };
          delete updated[questionId];
          setNotes(updated);
          setAnsweredCount(Object.keys(updated).length);
          triggerHaptic('light');
          try { await AsyncStorage.setItem(`interview_notes_${marketId}`, JSON.stringify(updated)); } catch {}
        }
      },
    ]);
  }, [notes, marketId]);

  const filteredQuestions = selectedCategory === 'All'
    ? BEHAVIORAL_QUESTIONS
    : BEHAVIORAL_QUESTIONS.filter(q => q.category === selectedCategory);

  return (
    <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={st.sectionHeader}>
        <View style={[st.sectionIconBg, { backgroundColor: '#10B981' }]}>
          <Feather name="message-circle" size={18} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.sectionTitle}>Behavioral Q&A</Text>
          <Text style={st.sectionSubtitle}>{marketName} • Interview prep</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={st.statsCard}>
        <View style={st.statItem}>
          <Text style={st.statValue}>{answeredCount}</Text>
          <Text style={st.statLabel}>Notes Added</Text>
        </View>
        <View style={st.statDivider} />
        <View style={st.statItem}>
          <Text style={st.statValue}>{BEHAVIORAL_QUESTIONS.length}</Text>
          <Text style={st.statLabel}>Questions</Text>
        </View>
        <View style={st.statDivider} />
        <View style={st.statItem}>
          <Text style={[st.statValue, { color: '#7C3AED' }]}>{Math.round((answeredCount / BEHAVIORAL_QUESTIONS.length) * 100)}%</Text>
          <Text style={st.statLabel}>Prepared</Text>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.categoryScroll} contentContainerStyle={st.categoryContent}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => { setSelectedCategory(cat); triggerHaptic('light'); }}
            style={[st.categoryBtn, selectedCategory === cat && st.categoryBtnActive]}
          >
            <Text style={[st.categoryBtnText, selectedCategory === cat && st.categoryBtnTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Questions */}
      {filteredQuestions.map((q) => {
        const isExpanded = expanded === q.id;
        const hasNote = !!notes[q.id];
        const isEditing = editingNote === q.id;

        return (
          <View key={q.id} style={[st.qaCard, hasNote && st.qaCardAnswered]}>
            <TouchableOpacity onPress={() => { setExpanded(isExpanded ? null : q.id); triggerHaptic('light'); }} style={st.qaHeader}>
              <View style={st.qaLeft}>
                <View style={[st.qaCategoryBadge, { backgroundColor: hasNote ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)' }]}>
                  <Text style={[st.qaCategoryText, { color: hasNote ? '#10B981' : '#7C3AED' }]}>{q.category}</Text>
                </View>
                <Text style={st.qaQuestion}>{q.question}</Text>
              </View>
              <View style={st.qaRight}>
                {hasNote && <Feather name="check-circle" size={16} color="#10B981" style={{ marginRight: 8 }} />}
                <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View style={st.qaBody}>
                {/* Tip */}
                <View style={st.tipBox}>
                  <Feather name="zap" size={14} color="#F59E0B" />
                  <Text style={st.tipText}>{q.tip}</Text>
                </View>

                {/* Frameworks */}
                {q.frameworks && (
                  <View style={st.fwRow}>
                    {q.frameworks.map(fw => (
                      <View key={fw} style={st.fwTag}>
                        <Text style={st.fwTagText}>{fw}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Suggested Answer */}
                <View style={st.suggestedBox}>
                  <Text style={st.suggestedLabel}>💡 Suggested Approach</Text>
                  <Text style={st.suggestedText}>{q.suggestedAnswer}</Text>
                </View>

                {/* User Note */}
                {hasNote && !isEditing && (
                  <View style={st.noteBox}>
                    <View style={st.noteHeader}>
                      <Feather name="edit-3" size={12} color="#7C3AED" />
                      <Text style={st.noteLabel}>Your Answer</Text>
                      <View style={{ flex: 1 }} />
                      <TouchableOpacity onPress={() => { setEditingNote(q.id); setNoteText(notes[q.id]); }} style={st.noteActionBtn}>
                        <Feather name="edit-2" size={12} color="#7C3AED" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteNote(q.id)} style={st.noteActionBtn}>
                        <Feather name="trash-2" size={12} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={st.noteText}>{notes[q.id]}</Text>
                  </View>
                )}

                {/* Add/Edit Note */}
                {isEditing ? (
                  <View style={st.noteEditBox}>
                    <TextInput
                      style={st.noteInput}
                      multiline
                      placeholder="Write your personalized answer..."
                      placeholderTextColor={COLORS.textMuted}
                      value={noteText}
                      onChangeText={setNoteText}
                      autoFocus
                    />
                    <View style={st.noteEditActions}>
                      <TouchableOpacity onPress={() => { setEditingNote(null); setNoteText(''); }} style={st.cancelBtn}>
                        <Text style={st.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => saveNote(q.id)} style={st.saveBtn}>
                        <Feather name="check" size={14} color="#FFF" />
                        <Text style={st.saveBtnText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : !hasNote ? (
                  <TouchableOpacity
                    onPress={() => { setEditingNote(q.id); setNoteText(''); triggerHaptic('light'); }}
                    style={st.addNoteBtn}
                  >
                    <Feather name="plus" size={14} color="#7C3AED" />
                    <Text style={st.addNoteBtnText}>Add Your Answer</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sectionIconBg: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...TYPE.h2, color: COLORS.textPrimary },
  sectionSubtitle: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 11, marginTop: 1 },

  statsCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, ...SHADOWS.sm },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { ...TYPE.h2, color: COLORS.textPrimary },
  statLabel: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  categoryScroll: { marginBottom: 16 },
  categoryContent: { gap: 8 },
  categoryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  categoryBtnActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  categoryBtnText: { ...TYPE.bodyBold, color: COLORS.textMuted, fontSize: 12 },
  categoryBtnTextActive: { color: '#FFF' },

  qaCard: { borderRadius: 16, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10, overflow: 'hidden', ...SHADOWS.sm },
  qaCardAnswered: { borderColor: 'rgba(16,185,129,0.2)' },
  qaHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  qaLeft: { flex: 1 },
  qaRight: { flexDirection: 'row', alignItems: 'center' },
  qaCategoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
  qaCategoryText: { ...TYPE.caption, fontSize: 9, fontWeight: '700' },
  qaQuestion: { ...TYPE.bodyBold, color: COLORS.textPrimary, fontSize: 14, lineHeight: 20 },

  qaBody: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, gap: 12 },

  tipBox: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.06)' },
  tipText: { ...TYPE.caption, color: '#D97706', flex: 1, lineHeight: 18, fontSize: 12 },

  fwRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  fwTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(124,58,237,0.08)' },
  fwTagText: { ...TYPE.caption, color: '#7C3AED', fontSize: 10 },

  suggestedBox: { padding: 14, borderRadius: 12, backgroundColor: COLORS.bg1 },
  suggestedLabel: { ...TYPE.bodyBold, color: COLORS.textPrimary, fontSize: 13, marginBottom: 6 },
  suggestedText: { ...TYPE.body, color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  noteBox: { padding: 14, borderRadius: 12, backgroundColor: 'rgba(124,58,237,0.04)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.12)' },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  noteLabel: { ...TYPE.bodyBold, color: '#7C3AED', fontSize: 12 },
  noteActionBtn: { padding: 4 },
  noteText: { ...TYPE.body, color: COLORS.textPrimary, fontSize: 13, lineHeight: 20 },

  noteEditBox: { gap: 10 },
  noteInput: { ...TYPE.body, color: COLORS.textPrimary, minHeight: 100, padding: 14, borderRadius: 12, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, lineHeight: 22, textAlignVertical: 'top' },
  noteEditActions: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  cancelBtnText: { ...TYPE.bodyBold, color: COLORS.textMuted, fontSize: 13 },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#7C3AED' },
  saveBtnText: { ...TYPE.bodyBold, color: '#FFF', fontSize: 13 },

  addNoteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#7C3AED', borderStyle: 'dashed' },
  addNoteBtnText: { ...TYPE.bodyBold, color: '#7C3AED', fontSize: 13 },
});
