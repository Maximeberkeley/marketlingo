/**
 * FeedbackBanner — Duolingo-style bottom feedback bar
 * Slides up from bottom after answering a question.
 * Green for correct, red for wrong. Shows explanation + Continue CTA.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeedbackBannerProps {
  visible: boolean;
  isCorrect: boolean;
  message: string;
  explanation?: string;
  xpEarned?: number;
  comboMultiplier?: number;
  onContinue: () => void;
}

const CORRECT_COLORS = {
  bg: '#DCFCE7',
  border: '#86EFAC',
  text: '#15803D',
  btnBg: '#22C55E',
};

const WRONG_COLORS = {
  bg: '#FEE2E2',
  border: '#FCA5A5',
  text: '#B91C1C',
  btnBg: '#EF4444',
};

export function FeedbackBanner({
  visible,
  isCorrect,
  message,
  explanation,
  xpEarned,
  comboMultiplier,
  onContinue,
}: FeedbackBannerProps) {
  const slideAnim = useRef(new Animated.Value(200)).current;
  const colors = isCorrect ? CORRECT_COLORS : WRONG_COLORS;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 200,
        friction: 20,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(200);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.bg, borderTopColor: colors.border, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        {/* Icon + Message row */}
        <View style={styles.messageRow}>
          <Feather
            name={isCorrect ? 'check-circle' : 'x-circle'}
            size={24}
            color={colors.text}
          />
          <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
        </View>

        {/* Explanation */}
        {explanation && (
          <Text style={[styles.explanation, { color: colors.text }]}>{explanation}</Text>
        )}

        {/* XP earned row */}
        {isCorrect && xpEarned && xpEarned > 0 && (
          <View style={styles.xpRow}>
            <Feather name="zap" size={14} color={colors.text} />
            <Text style={[styles.xpText, { color: colors.text }]}>
              +{xpEarned} XP
              {comboMultiplier && comboMultiplier > 1 ? ` (${comboMultiplier}x combo!)` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Continue CTA */}
      <TouchableOpacity
        style={[styles.continueBtn, { backgroundColor: colors.btnBg }]}
        onPress={onContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.continueBtnText}>CONTINUE</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 2,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  content: {
    marginBottom: 14,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  message: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  explanation: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    paddingLeft: 34,
    opacity: 0.85,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingLeft: 34,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '700',
  },
  continueBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
