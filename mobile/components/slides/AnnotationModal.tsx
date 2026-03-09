import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../lib/constants';
import * as Haptics from 'expo-haptics';

interface AnnotationModalProps {
  visible: boolean;
  slideTitle: string;
  slideBody: string;
  onSave: (annotation: string) => void;
  onCancel: () => void;
}

export function AnnotationModal({ visible, slideTitle, slideBody, onSave, onCancel }: AnnotationModalProps) {
  const [annotation, setAnnotation] = useState('');

  const handleSave = () => {
    if (!annotation.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(annotation.trim());
    setAnnotation('');
  };

  const handleCancel = () => {
    setAnnotation('');
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleCancel}>
          <TouchableOpacity activeOpacity={1} style={styles.card}>
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Feather name="edit-3" size={18} color={COLORS.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Add Your Note</Text>
                <Text style={styles.subtitle}>Write your thoughts on this slide</Text>
              </View>
            </View>

            {/* Context preview */}
            <View style={styles.contextBox}>
              <Feather name="book-open" size={12} color={COLORS.textMuted} />
              <Text style={styles.contextTitle} numberOfLines={1}>{slideTitle}</Text>
            </View>
            <ScrollView style={styles.contextScroll} nestedScrollEnabled>
              <Text style={styles.contextBody} numberOfLines={4}>{slideBody}</Text>
            </ScrollView>

            {/* Annotation input */}
            <TextInput
              style={styles.input}
              placeholder="What's your takeaway? What connects to something you know?"
              placeholderTextColor={COLORS.textMuted}
              value={annotation}
              onChangeText={setAnnotation}
              multiline
              autoFocus
              textAlignVertical="top"
            />

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !annotation.trim() && { opacity: 0.4 }]}
                onPress={handleSave}
                disabled={!annotation.trim()}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.saveText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: COLORS.bg1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(100,116,139,0.3)',
    alignSelf: 'center', marginBottom: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  contextBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: COLORS.bg2, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 4,
  },
  contextTitle: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, flex: 1 },
  contextScroll: { maxHeight: 60, marginBottom: 14 },
  contextBody: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, paddingHorizontal: 12 },
  input: {
    minHeight: 100, padding: 16,
    backgroundColor: COLORS.bg2, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border,
    fontSize: 15, color: COLORS.textPrimary, lineHeight: 23,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 14,
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '500' },
  saveBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 14,
    backgroundColor: COLORS.accent, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
