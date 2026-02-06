import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';

interface Stage {
  id: number;
  name: string;
  weeks: number[];
  status: 'completed' | 'current' | 'locked';
}

const STAGES: Stage[] = [
  { id: 1, name: 'Foundations', weeks: [1, 2, 3, 4], status: 'current' },
  { id: 2, name: 'Commercial Aviation', weeks: [5, 6, 7, 8], status: 'locked' },
  { id: 3, name: 'Defense & Government', weeks: [9, 10, 11, 12], status: 'locked' },
  { id: 4, name: 'Space Economy', weeks: [13, 14, 15, 16], status: 'locked' },
  { id: 5, name: 'Emerging Tech', weeks: [17, 18, 19, 20], status: 'locked' },
  { id: 6, name: 'Business Strategy', weeks: [21, 22, 23, 24], status: 'locked' },
];

export default function RoadmapScreen() {
  const insets = useSafeAreaInsets();
  const [currentWeek, setCurrentWeek] = useState(2);
  const [currentDay, setCurrentDay] = useState(12);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Journey</Text>
          <Text style={styles.subtitle}>
            Day {currentDay} of 180 • Week {currentWeek}
          </Text>
        </View>

        {/* Stages */}
        <View style={styles.stagesContainer}>
          {STAGES.map((stage, index) => (
            <View key={stage.id}>
              {/* Stage Card */}
              <TouchableOpacity
                style={[
                  styles.stageCard,
                  stage.status === 'current' && styles.stageCardCurrent,
                  stage.status === 'locked' && styles.stageCardLocked,
                ]}
                activeOpacity={stage.status === 'locked' ? 1 : 0.7}
              >
                <View style={styles.stageHeader}>
                  <View
                    style={[
                      styles.stageIcon,
                      stage.status === 'current' && styles.stageIconCurrent,
                      stage.status === 'completed' && styles.stageIconCompleted,
                    ]}
                  >
                    {stage.status === 'completed' ? (
                      <Text style={styles.stageIconText}>✓</Text>
                    ) : stage.status === 'locked' ? (
                      <Text style={styles.stageIconText}>🔒</Text>
                    ) : (
                      <Text style={styles.stageIconText}>{stage.id}</Text>
                    )}
                  </View>
                  <View style={styles.stageInfo}>
                    <Text
                      style={[
                        styles.stageName,
                        stage.status === 'locked' && styles.textLocked,
                      ]}
                    >
                      Stage {stage.id}: {stage.name}
                    </Text>
                    <Text style={styles.stageWeeks}>
                      Weeks {stage.weeks[0]}-{stage.weeks[stage.weeks.length - 1]}
                    </Text>
                  </View>
                </View>

                {stage.status === 'current' && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: '25%' }]} />
                    </View>
                    <Text style={styles.progressText}>25% complete</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Connector Line */}
              {index < STAGES.length - 1 && (
                <View style={styles.connector}>
                  <View
                    style={[
                      styles.connectorLine,
                      stage.status === 'completed' && styles.connectorLineCompleted,
                    ]}
                  />
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
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
    marginBottom: 24,
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
  stagesContainer: {
    gap: 0,
  },
  stageCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stageCardCurrent: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '10',
  },
  stageCardLocked: {
    opacity: 0.5,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bg1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stageIconCurrent: {
    backgroundColor: COLORS.accent,
  },
  stageIconCompleted: {
    backgroundColor: COLORS.success,
  },
  stageIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stageInfo: {
    flex: 1,
  },
  stageName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  stageWeeks: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  textLocked: {
    color: COLORS.textMuted,
  },
  progressSection: {
    marginTop: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.bg1,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  connector: {
    alignItems: 'center',
    height: 24,
  },
  connectorLine: {
    width: 2,
    height: '100%',
    backgroundColor: COLORS.border,
  },
  connectorLineCompleted: {
    backgroundColor: COLORS.success,
  },
});
