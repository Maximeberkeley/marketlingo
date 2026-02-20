import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../lib/constants';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface TrainerOption {
  label: string;
  isCorrect: boolean;
}

interface TrainerScenario {
  id?: string;
  scenario: string;
  question: string;
  options: TrainerOption[];
  feedbackProReasoning?: string;
  feedbackCommonMistake?: string;
  feedbackMentalModel?: string;
  followUpQuestion?: string;
}

interface ServerFeedback {
  isCorrect: boolean;
  correctIndex: number;
  feedback_pro_reasoning: string | null;
  feedback_common_mistake: string | null;
  feedback_mental_model: string | null;
  follow_up_question: string | null;
}

interface TrainerCardProps {
  scenario: TrainerScenario;
  onSaveToNotebook: () => void;
  onNext: () => void;
  onAskMentor?: (question: string) => void;
  onAttemptComplete?: (isCorrect: boolean, selectedOption: number) => Promise<ServerFeedback | undefined>;
  marketId?: string;
}

// ─────────────────────────────────────────────
// Why This Scenario helper
// ─────────────────────────────────────────────
const INDUSTRY_CONTEXT: Record<string, { name: string; transfer: string }> = {
  aerospace: { name: 'aerospace', transfer: 'aerospace business contexts' },
  neuroscience: { name: 'neuroscience', transfer: 'neurotech ventures' },
  biotech: { name: 'biotech', transfer: 'life sciences decisions' },
  ai: { name: 'AI', transfer: 'AI and ML ventures' },
  fintech: { name: 'fintech', transfer: 'financial technology' },
  ev: { name: 'EV', transfer: 'electric mobility ventures' },
  cleanenergy: { name: 'clean energy', transfer: 'renewable energy' },
  healthtech: { name: 'healthtech', transfer: 'healthcare technology' },
  cybersecurity: { name: 'cybersecurity', transfer: 'security decisions' },
  robotics: { name: 'robotics', transfer: 'robotics ventures' },
  spacetech: { name: 'space tech', transfer: 'space industry decisions' },
  agtech: { name: 'agtech', transfer: 'agricultural technology' },
  climatetech: { name: 'climate tech', transfer: 'climate ventures' },
  logistics: { name: 'logistics', transfer: 'logistics decisions' },
  web3: { name: 'Web3', transfer: 'blockchain ventures' },
};

function getWhyExplanation(scenario: string, question: string, marketId?: string): string {
  const text = `${scenario} ${question}`.toLowerCase();
  const ctx = INDUSTRY_CONTEXT[marketId || 'aerospace'] || INDUSTRY_CONTEXT.aerospace;

  if (text.includes('certification') || text.includes('fda') || text.includes('regulatory')) {
    return `Regulatory strategy is a major barrier to ${ctx.name} market entry. Founders who master compliance save years of delays.`;
  }
  if (text.includes('vc') || text.includes('investor') || text.includes('fundrais')) {
    return `Investors in ${ctx.name} evaluate differently than generalist VCs. Understanding their criteria is essential for fundraising.`;
  }
  if (text.includes('supply') || text.includes('partner') || text.includes('oem')) {
    return `Strategic partnerships determine your pricing power and sales cycles in ${ctx.name}.`;
  }
  return `This scenario builds pattern recognition for ${ctx.name} situations. The mental models transfer across ${ctx.transfer}.`;
}

// ─────────────────────────────────────────────
// TrainerCard Component
// ─────────────────────────────────────────────
export function TrainerCard({
  scenario,
  onSaveToNotebook,
  onNext,
  onAskMentor,
  onAttemptComplete,
  marketId,
}: TrainerCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [serverFeedback, setServerFeedback] = useState<ServerFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);

  // Reset when scenario changes
  useEffect(() => {
    setSelectedIndex(null);
    setShowFeedback(false);
    setServerFeedback(null);
    setIsSubmitting(false);
  }, [scenario.question]);

  const whyExplanation = getWhyExplanation(scenario.scenario, scenario.question, marketId);
  const isCorrect = serverFeedback?.isCorrect ?? false;

  const handleOptionSelect = async (index: number) => {
    if (showFeedback || isSubmitting) return;
    setSelectedIndex(index);
    setIsSubmitting(true);

    try {
      const feedback = await onAttemptComplete?.(false, index);
      if (feedback) {
        setServerFeedback(feedback);
        if (feedback.isCorrect) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
      setTimeout(() => setShowFeedback(true), 300);
    } catch {
      setShowFeedback(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOptionStyle = (index: number) => {
    const isSelected = selectedIndex === index;
    const isCorrectOption = serverFeedback ? index === serverFeedback.correctIndex : false;

    if (!showFeedback) {
      return isSelected ? styles.optionSelected : styles.optionDefault;
    }
    if (isSelected && isCorrectOption) return styles.optionCorrect;
    if (isSelected && !isCorrectOption) return styles.optionWrong;
    if (isCorrectOption) return styles.optionCorrectUnselected;
    return styles.optionDefault;
  };

  const getOptionLetter = (i: number) => String.fromCharCode(65 + i);

  return (
    <View style={styles.container}>
      {/* Why button */}
      <TouchableOpacity style={styles.whyBtn} onPress={() => setShowWhyModal(true)}>
        <Text style={styles.whyBtnText}>?</Text>
      </TouchableOpacity>

      {/* Scenario */}
      <View style={styles.scenarioCard}>
        <Text style={styles.scenarioText}>{scenario.scenario}</Text>
      </View>

      {/* Question */}
      <Text style={styles.question}>{scenario.question}</Text>

      {/* Options */}
      <View style={styles.optionsList}>
        {scenario.options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.option, getOptionStyle(idx)]}
            onPress={() => handleOptionSelect(idx)}
            disabled={showFeedback || isSubmitting}
            activeOpacity={0.75}
          >
            <View style={[styles.letterBadge, showFeedback && idx === serverFeedback?.correctIndex && styles.letterBadgeCorrect, showFeedback && idx === selectedIndex && !serverFeedback?.isCorrect && idx !== serverFeedback?.correctIndex && styles.letterBadgeWrong]}>
              <Text style={styles.letterText}>{getOptionLetter(idx)}</Text>
            </View>
            <Text style={styles.optionText}>{opt.label}</Text>
            {isSubmitting && idx === selectedIndex && (
              <ActivityIndicator size="small" color={COLORS.accent} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Feedback */}
      {showFeedback && (
        <View style={styles.feedbackSection}>
          {/* Result badge */}
          <View style={[styles.resultBadge, isCorrect ? styles.resultBadgeCorrect : styles.resultBadgeWrong]}>
            <Text style={[styles.resultBadgeText, { color: isCorrect ? '#22C55E' : '#F59E0B' }]}>
              {isCorrect ? '✅ Correct!' : '⚠️ Not quite'}
            </Text>
          </View>

          {/* Pro Reasoning */}
          {(serverFeedback?.feedback_pro_reasoning || scenario.feedbackProReasoning) && (
            <View style={[styles.feedbackCard, styles.feedbackGreen]}>
              <Text style={styles.feedbackCardLabel}>📈 Pro Reasoning</Text>
              <Text style={styles.feedbackCardText}>
                {serverFeedback?.feedback_pro_reasoning || scenario.feedbackProReasoning}
              </Text>
            </View>
          )}

          {/* Common Mistake */}
          {(serverFeedback?.feedback_common_mistake || scenario.feedbackCommonMistake) && (
            <View style={[styles.feedbackCard, styles.feedbackAmber]}>
              <Text style={styles.feedbackCardLabel}>⚠️ Common Mistake</Text>
              <Text style={styles.feedbackCardText}>
                {serverFeedback?.feedback_common_mistake || scenario.feedbackCommonMistake}
              </Text>
            </View>
          )}

          {/* Mental Model */}
          {(serverFeedback?.feedback_mental_model || scenario.feedbackMentalModel) && (
            <View style={[styles.feedbackCard, styles.feedbackBlue]}>
              <Text style={styles.feedbackCardLabel}>🧠 Mental Model</Text>
              <Text style={styles.feedbackCardText}>
                {serverFeedback?.feedback_mental_model || scenario.feedbackMentalModel}
              </Text>
            </View>
          )}

          {/* Follow-up */}
          {(serverFeedback?.follow_up_question || scenario.followUpQuestion) && (
            <View style={[styles.feedbackCard, styles.feedbackPurple]}>
              <Text style={styles.feedbackCardLabel}>💼 For Your Startup</Text>
              <Text style={[styles.feedbackCardText, { fontStyle: 'italic' }]}>
                {serverFeedback?.follow_up_question || scenario.followUpQuestion}
              </Text>
            </View>
          )}

          {/* Mentor CTA */}
          {onAskMentor && (
            <View style={styles.mentorCTACard}>
              <View style={styles.mentorCTARow}>
                <Text style={styles.mentorCTAEmoji}>✨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mentorCTATitle}>Want to understand why?</Text>
                  <Text style={styles.mentorCTASubtitle}>
                    Chat with a mentor to explore the reasoning behind this scenario.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.mentorCTABtn}
                onPress={() => onAskMentor(serverFeedback?.follow_up_question || scenario.followUpQuestion || scenario.question)}
                activeOpacity={0.8}
              >
                <Text style={styles.mentorCTABtnText}>💬 Discuss with AI Mentor</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={onSaveToNotebook} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>📝 Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.8}>
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Why This Scenario Modal */}
      <Modal visible={showWhyModal} transparent animationType="fade" onRequestClose={() => setShowWhyModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowWhyModal(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconCircle}>
                <Text>❓</Text>
              </View>
              <Text style={styles.modalTitle}>Why This Scenario?</Text>
            </View>
            <Text style={styles.modalBody}>{whyExplanation}</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowWhyModal(false)}>
              <Text style={styles.modalCloseBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  whyBtn: {
    position: 'absolute',
    top: -8,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  whyBtnText: {
    fontSize: 15,
    color: COLORS.accent,
    fontWeight: '700',
  },
  scenarioCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingRight: 40,
  },
  scenarioText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  question: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 14,
    lineHeight: 24,
  },
  optionsList: {
    gap: 10,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionDefault: {
    backgroundColor: COLORS.bg2,
    borderColor: COLORS.border,
  },
  optionSelected: {
    backgroundColor: COLORS.bg2,
    borderColor: COLORS.accent,
  },
  optionCorrect: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: '#22C55E',
  },
  optionWrong: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: '#F59E0B',
  },
  optionCorrectUnselected: {
    backgroundColor: 'rgba(34,197,94,0.06)',
    borderColor: 'rgba(34,197,94,0.4)',
  },
  letterBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bg1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  letterBadgeCorrect: { backgroundColor: '#22C55E' },
  letterBadgeWrong: { backgroundColor: '#F59E0B' },
  letterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  // Feedback
  feedbackSection: { gap: 10 },
  resultBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  resultBadgeCorrect: { backgroundColor: 'rgba(34,197,94,0.15)' },
  resultBadgeWrong: { backgroundColor: 'rgba(245,158,11,0.15)' },
  resultBadgeText: { fontSize: 14, fontWeight: '700' },
  feedbackCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  feedbackGreen: { backgroundColor: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.2)' },
  feedbackAmber: { backgroundColor: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' },
  feedbackBlue: { backgroundColor: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.2)' },
  feedbackPurple: { backgroundColor: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.2)' },
  feedbackCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  feedbackCardText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  // Mentor CTA
  mentorCTACard: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    gap: 12,
  },
  mentorCTARow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  mentorCTAEmoji: { fontSize: 22 },
  mentorCTATitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 2,
  },
  mentorCTASubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  mentorCTABtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mentorCTABtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Action row
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  nextBtn: {
    flex: 2,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Why Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.bg1,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  modalIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139,92,246,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
    marginBottom: 16,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default TrainerCard;
