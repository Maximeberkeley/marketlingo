import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../lib/constants';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function OnboardingProgress({ currentStep, totalSteps, labels }: OnboardingProgressProps) {
  const progress = currentStep / totalSteps;

  return (
    <View style={styles.container}>
      {/* Step dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View key={i} style={styles.stepContainer}>
            <View
              style={[
                styles.dot,
                i < currentStep && styles.dotCompleted,
                i === currentStep && styles.dotActive,
              ]}
            >
              {i < currentStep ? (
                <Text style={styles.checkText}>✓</Text>
              ) : (
                <Text style={styles.dotNumber}>{i + 1}</Text>
              )}
            </View>
            {labels && labels[i] && (
              <Text
                style={[
                  styles.stepLabel,
                  i <= currentStep && styles.stepLabelActive,
                ]}
              >
                {labels[i]}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg2,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  dotActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '20',
  },
  dotNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  checkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  barTrack: {
    height: 4,
    backgroundColor: COLORS.bg2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
});
