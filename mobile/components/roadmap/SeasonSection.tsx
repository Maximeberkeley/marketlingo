import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { COLORS } from '../../lib/constants';
import { RoadmapNode, NodeStatus } from './RoadmapNode';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface Lesson {
  day: number;
  title: string;
  pattern: string;
  completed: boolean;
  current?: boolean;
}

interface Week {
  weekNumber: number;
  status: NodeStatus;
  title: string;
  objective?: string;
  dayRange: string;
  lessons?: Lesson[];
}

interface SeasonSectionProps {
  seasonNumber: number;
  title: string;
  subtitle?: string;
  weeks: Week[];
  onWeekClick: (weekNumber: number) => void;
  onLessonClick?: (day: number) => void;
  defaultExpanded?: boolean;
}

export function SeasonSection({
  seasonNumber,
  title,
  subtitle,
  weeks,
  onWeekClick,
  onLessonClick,
  defaultExpanded = false,
}: SeasonSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const rotateAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const completedWeeks = weeks.filter((w) => w.status === 'completed').length;
  const progress = Math.round((completedWeeks / weeks.length) * 100);

  const isCurrent = weeks.some((w) => w.status === 'current');
  const isAllCompleted = weeks.every((w) => w.status === 'completed');

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setIsExpanded(!isExpanded);
  };

  const handleWeekClick = (weekNumber: number, status: NodeStatus) => {
    if (status === 'locked') return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedWeek(expandedWeek === weekNumber ? null : weekNumber);
    onWeekClick(weekNumber);
  };

  const arrowRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const seasonIconStyle = isCurrent
    ? styles.seasonIconCurrent
    : isAllCompleted
    ? styles.seasonIconCompleted
    : styles.seasonIconDefault;

  return (
    <View style={styles.container}>
      {/* Season header */}
      <TouchableOpacity style={styles.seasonHeader} onPress={toggleExpand} activeOpacity={0.8}>
        <View style={styles.headerLeft}>
          <View style={[styles.seasonIcon, seasonIconStyle]}>
            <Text style={styles.seasonIconText}>{seasonNumber}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.seasonTitle}>{title}</Text>
            <Text style={styles.seasonSubtitle}>{subtitle || `${progress}% complete`}</Text>
          </View>
        </View>
        <Animated.Text style={[styles.arrow, { transform: [{ rotate: arrowRotation }] }]}>▾</Animated.Text>
      </TouchableOpacity>

      {/* Progress bar */}
      {progress > 0 && (
        <View style={styles.progressBarWrap}>
          <View style={[styles.progressBarFill, { width: `${progress}%` as any }]} />
        </View>
      )}

      {/* Weeks (collapsed/expanded) */}
      {isExpanded && (
        <View style={styles.weeksContainer}>
          {weeks.map((week, index) => (
            <View key={week.weekNumber} style={styles.weekWrapper}>
              {/* Node + title row */}
              <View style={styles.weekRow}>
                <RoadmapNode
                  weekNumber={week.weekNumber}
                  status={week.status}
                  onClick={() => handleWeekClick(week.weekNumber, week.status)}
                />

                <TouchableOpacity
                  style={[
                    styles.weekLabel,
                    week.status === 'locked' && styles.weekLabelLocked,
                    week.status === 'current' && styles.weekLabelCurrent,
                  ]}
                  onPress={() => handleWeekClick(week.weekNumber, week.status)}
                  disabled={week.status === 'locked'}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.weekTitle,
                      week.status === 'locked' && { opacity: 0.4 },
                    ]}
                    numberOfLines={1}
                  >
                    {week.title}
                  </Text>
                  <Text style={styles.weekDayRange}>{week.dayRange}</Text>
                </TouchableOpacity>

                {week.status === 'current' && (
                  <View style={styles.currentChip}>
                    <Text style={styles.currentChipText}>NOW</Text>
                  </View>
                )}
              </View>

              {/* Expanded lessons - Duolingo style */}
              {expandedWeek === week.weekNumber && week.lessons && week.lessons.length > 0 && (
                <View style={styles.lessonsContainer}>
                  {week.lessons.map((lesson, lessonIdx) => (
                    <TouchableOpacity
                      key={lesson.day}
                      style={[
                        styles.lessonRow,
                        lesson.completed && styles.lessonRowCompleted,
                        lesson.current && styles.lessonRowCurrent,
                      ]}
                      onPress={() => onLessonClick?.(lesson.day)}
                      disabled={!lesson.completed && !lesson.current}
                      activeOpacity={0.75}
                    >
                      <View style={[
                        styles.lessonIcon,
                        lesson.completed && styles.lessonIconCompleted,
                        lesson.current && styles.lessonIconCurrent,
                      ]}>
                        <Text style={{ fontSize: 13 }}>
                          {lesson.completed ? '✓' : lesson.current ? '▶' : '·'}
                        </Text>
                      </View>
                      <View style={styles.lessonText}>
                        <Text
                          style={[
                            styles.lessonTitle,
                            !lesson.completed && !lesson.current && { opacity: 0.45 },
                          ]}
                          numberOfLines={1}
                        >
                          Day {lesson.day}: {lesson.title}
                        </Text>
                        <Text style={styles.lessonPattern} numberOfLines={1}>
                          {lesson.pattern}
                        </Text>
                      </View>
                      {(lesson.completed || lesson.current) && (
                        <Text style={{ fontSize: 12, color: COLORS.textMuted }}>›</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Connector line */}
              {index < weeks.length - 1 && (
                <View style={styles.connectorWrap}>
                  <View
                    style={[
                      styles.connector,
                      week.status === 'completed' && styles.connectorCompleted,
                    ]}
                  />
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(17,28,51,0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  seasonIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonIconDefault: { backgroundColor: COLORS.bg1 },
  seasonIconCurrent: { backgroundColor: 'rgba(139,92,246,0.2)' },
  seasonIconCompleted: { backgroundColor: 'rgba(34,197,94,0.2)' },
  seasonIconText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  headerText: { flex: 1 },
  seasonTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  seasonSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  arrow: { fontSize: 20, color: COLORS.textMuted },
  progressBarWrap: {
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 14,
    borderRadius: 1,
    marginBottom: 2,
  },
  progressBarFill: {
    height: 2,
    backgroundColor: COLORS.accent,
    borderRadius: 1,
  },
  weeksContainer: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 8 },
  weekWrapper: { width: '100%' },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weekLabel: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  weekLabelLocked: { opacity: 0.5 },
  weekLabelCurrent: { backgroundColor: 'rgba(139,92,246,0.08)' },
  weekTitle: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  weekDayRange: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  currentChip: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  currentChipText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  connectorWrap: { alignItems: 'flex-start', paddingLeft: 23 },
  connector: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.border,
    borderRadius: 1,
    marginVertical: 2,
  },
  connectorCompleted: { backgroundColor: COLORS.accent },
  lessonsContainer: {
    marginLeft: 58,
    marginTop: 4,
    marginBottom: 6,
    gap: 4,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.bg1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lessonRowCompleted: {
    backgroundColor: 'rgba(34,197,94,0.06)',
    borderColor: 'rgba(34,197,94,0.2)',
  },
  lessonRowCurrent: {
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderColor: 'rgba(139,92,246,0.3)',
  },
  lessonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lessonIconCompleted: { backgroundColor: 'rgba(34,197,94,0.2)' },
  lessonIconCurrent: { backgroundColor: 'rgba(139,92,246,0.2)' },
  lessonText: { flex: 1, minWidth: 0 },
  lessonTitle: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary },
  lessonPattern: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
});
