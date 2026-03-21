import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { COLORS } from '../../lib/constants';
import { WatchlistThesis } from '../../hooks/useWatchlistThesis';
import { Feather } from '@expo/vector-icons';

const LEO_STUDY = require('../../assets/mascot/leo-study.png');
const SOPHIA_AVATAR = require('../../assets/mentors/mentor-sophia.png');

interface ThesisReviewOverlayProps {
  visible: boolean;
  onClose: () => void;
  dueTheses: WatchlistThesis[];
  onReview: (thesisId: string, stillValid: boolean) => Promise<void>;
  onUpdateThesis: (companyId: string, companyName: string, thesis: string, ticker?: string) => Promise<any>;
}

export function ThesisReviewOverlay({ visible, onClose, dueTheses, onReview, onUpdateThesis }: ThesisReviewOverlayProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedThesis, setEditedThesis] = useState('');

  if (dueTheses.length === 0) return null;

  const current = dueTheses[Math.min(currentIdx, dueTheses.length - 1)];
  if (!current) return null;

  const handleReview = async (valid: boolean) => {
    await onReview(current.id, valid);
    if (currentIdx < dueTheses.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setEditMode(false);
    } else {
      onClose();
    }
  };

  const handleUpdate = async () => {
    if (!editedThesis.trim()) return;
    await onUpdateThesis(current.company_id, current.company_name, editedThesis.trim(), current.ticker || undefined);
    await onReview(current.id, true);
    setEditMode(false);
    if (currentIdx < dueTheses.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const daysSinceCreated = Math.floor((Date.now() - new Date(current.created_at).getTime()) / 86400000);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Image source={SOPHIA_AVATAR} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Thesis Review</Text>
              <Text style={styles.subtitle}>{currentIdx + 1} of {dueTheses.length} due for review</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Company info */}
            <View style={styles.companyCard}>
              <View style={styles.companyHeader}>
                <Text style={styles.companyName}>{current.company_name}</Text>
                {current.ticker && <Text style={styles.ticker}>${current.ticker}</Text>}
              </View>
              <Text style={styles.dateInfo}>
                Thesis written {daysSinceCreated} days ago
                {current.review_count > 0 ? ` · Reviewed ${current.review_count} time${current.review_count > 1 ? 's' : ''}` : ''}
              </Text>
            </View>

            {/* Original thesis */}
            <View style={styles.thesisCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Image source={LEO_STUDY} style={{ width: 20, height: 20 }} resizeMode="contain" />
                <Text style={styles.thesisLabel}>Your Investment Thesis</Text>
              </View>
              <Text style={styles.thesisText}>{current.thesis}</Text>
            </View>

            {/* Question */}
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>Does this thesis still hold true?</Text>
              <Text style={styles.questionHint}>
                Consider recent market developments, earnings reports, or changes in the competitive landscape.
              </Text>
            </View>

            {editMode ? (
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Update your thesis</Text>
                <TextInput
                  style={styles.editInput}
                  value={editedThesis}
                  onChangeText={setEditedThesis}
                  multiline
                  placeholder="Write your updated investment thesis..."
                  placeholderTextColor={COLORS.textMuted}
                  textAlignVertical="top"
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditMode(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.updateBtn, !editedThesis.trim() && { opacity: 0.5 }]}
                    disabled={!editedThesis.trim()}
                    onPress={handleUpdate}
                  >
                    <Feather name="check" size={14} color="#fff" />
                    <Text style={styles.updateBtnText}>Save Updated Thesis</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.validBtn} onPress={() => handleReview(true)}>
                  <Feather name="check-circle" size={18} color="#22C55E" />
                  <Text style={styles.validBtnText}>Still Valid</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.invalidBtn} onPress={() => handleReview(false)}>
                  <Feather name="x-circle" size={18} color="#EF4444" />
                  <Text style={styles.invalidBtnText}>No Longer Valid</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => { setEditedThesis(current.thesis); setEditMode(true); }}
                >
                  <Feather name="edit-3" size={18} color={COLORS.accent} />
                  <Text style={styles.editBtnText}>Revise</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Progress dots */}
            {dueTheses.length > 1 && (
              <View style={styles.dotsRow}>
                {dueTheses.map((_, i) => (
                  <View key={i} style={[styles.dot, i === currentIdx && styles.dotActive, i < currentIdx && styles.dotDone]} />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: COLORS.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.4)' },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textMuted },

  companyCard: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 12,
  },
  companyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  companyName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  ticker: { fontSize: 13, fontWeight: '600', color: COLORS.accent },
  dateInfo: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },

  thesisCard: {
    backgroundColor: 'rgba(139,92,246,0.06)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)', marginBottom: 12,
  },
  thesisLabel: { fontSize: 12, fontWeight: '600', color: COLORS.accent },
  thesisText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 22, fontStyle: 'italic' },

  questionCard: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
  },
  questionText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  questionHint: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },

  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  validBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 16, borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.08)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
  },
  validBtnText: { fontSize: 12, fontWeight: '600', color: '#22C55E' },
  invalidBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 16, borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  invalidBtnText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
  editBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 16, borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
  },
  editBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.accent },

  editSection: { marginBottom: 20, gap: 10 },
  editLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  editInput: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14,
    fontSize: 14, color: COLORS.textPrimary, minHeight: 100,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14,
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  updateBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.accent,
  },
  updateBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.accent, width: 20 },
  dotDone: { backgroundColor: 'rgba(34,197,94,0.5)' },
});
