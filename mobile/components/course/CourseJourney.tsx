import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AccessibilityInfo,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { goalContentTag } from '../../lib/goals';
import { getMarketName } from '../../lib/markets';
import { dayPromise, seasonThemes, syllabusDay, TOTAL_DAYS } from '../../lib/syllabus';
import { latestAccessibleSection, resolveCourseSections, SectionAccess } from '../../lib/courseSections';
import { triggerHaptic } from '../../lib/haptics';
import { playSound } from '../../lib/sounds';
import { StreakBadge } from '../ui/StreakBadge';
import { XPBadge } from '../ui/XPBadge';
import { LeoCharacter } from '../mascot/LeoCharacter';

function MovingLessonTitle({ title, long }: { title: string; long: boolean }) {
  const sweep = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      sweep.setValue(0);
      return;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(sweep, { toValue: 1, duration: 1150, useNativeDriver: true }),
      Animated.delay(1850),
      Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, sweep]);

  return (
    <View style={styles.weekTitleWrap}>
      <Text style={[styles.weekTitle, long && styles.weekTitleLong]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>{title}</Text>
      {!reduceMotion ? (
        <Animated.View pointerEvents="none" style={[styles.titleSweep, {
          opacity: sweep.interpolate({ inputRange: [0, 0.35, 0.7, 1], outputRange: [0, 0.6, 0.25, 0] }),
          transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [250, -70] }) }],
        }]} />
      ) : null}
    </View>
  );
}

const MARKET_ILLUSTRATIONS: Record<string, any> = {
  aerospace: require('../../assets/illustrations/aerospace.png'),
  ai: require('../../assets/illustrations/ai.png'),
  biotech: require('../../assets/illustrations/biotech.png'),
  cleanenergy: require('../../assets/illustrations/cleanenergy.png'),
  fintech: require('../../assets/illustrations/fintech.png'),
  ev: require('../../assets/illustrations/ev.png'),
  cybersecurity: require('../../assets/illustrations/cybersecurity.png'),
  robotics: require('../../assets/illustrations/robotics.png'),
  spacetech: require('../../assets/illustrations/spacetech.png'),
  healthtech: require('../../assets/illustrations/healthtech.png'),
  web3: require('../../assets/illustrations/web3.png'),
  agtech: require('../../assets/illustrations/agtech.png'),
  logistics: require('../../assets/illustrations/logistics.png'),
  climatetech: require('../../assets/illustrations/climatetech.png'),
  neuroscience: require('../../assets/illustrations/neuroscience.png'),
};

interface CourseLesson {
  day: number;
  title: string;
  description: string;
  stackId?: string;
  completed: boolean;
  authored: boolean;
}

interface CourseJourneyProps {
  marketId: string;
  currentDay: number;
  learningGoal: string;
  completedStackIds: string[];
  streak: number;
  totalXp: number;
  level: number;
  lessonCompletedToday: boolean;
  arenaCompletedToday?: boolean;
  caseCompletedToday?: boolean;
  intelReadToday: number;
  intelTarget: number;
  rescueAvailable?: boolean;
  safeTop: number;
  onOpenLesson: (stackId: string) => void;
  onAskLeo: (day?: number) => void;
}

type ModuleKind = 'lesson' | 'arena' | 'case' | 'intel' | 'notes';

const MODULES: Array<{
  kind: ModuleKind;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  position: object;
}> = [
  { kind: 'lesson', label: 'Daily Lesson', icon: 'book-open', position: { top: 6, left: '50%', marginLeft: -42 } },
  { kind: 'arena', label: 'Daily Arena', icon: 'target', position: { top: 92, right: 8 } },
  { kind: 'case', label: 'Deep Case', icon: 'help-circle', position: { bottom: 6, right: 44 } },
  { kind: 'intel', label: 'Intel', icon: 'radio', position: { bottom: 6, left: 44 } },
  { kind: 'notes', label: 'Notes', icon: 'edit-3', position: { top: 92, left: 8 } },
];

function SectionHeader({
  section,
  title,
  onPress,
}: {
  section: SectionAccess;
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.sectionHeader, !section.unlocked && styles.sectionHeaderLocked]}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`Preview Section ${section.index + 1}, ${title}. ${section.completedCount} of 30 lessons complete`}
    >
      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.sectionEyebrow}>SECTION {section.index + 1}</Text>
        <Text style={styles.sectionTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.sectionProgress}>{section.completedCount} / 30 lessons</Text>
        <View style={styles.sectionTrack}>
          <View style={[styles.sectionFill, { width: `${(section.completedCount / 30) * 100}%` }]} />
        </View>
      </View>
      <View style={styles.headerArrow}>
        <Feather name="chevron-right" size={26} color={COLORS.textOnAccent} />
      </View>
    </TouchableOpacity>
  );
}

function Coin({
  label,
  icon,
  position,
  locked,
  completed,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  position: object;
  locked: boolean;
  completed: boolean;
  onPress: () => void;
}) {
  const glowIntensity = useRef(new Animated.Value(0.56)).current;

  const setPressed = (pressed: boolean) => {
    Animated.spring(glowIntensity, {
      toValue: pressed ? 1 : 0.56,
      damping: 16,
      stiffness: 240,
      mass: 0.55,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.coinPosition, position]}>
      {!locked ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[styles.coinGlowWide, { opacity: glowIntensity }]}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.coinGlowNear, { opacity: glowIntensity }]}
          />
        </>
      ) : null}
      <TouchableOpacity
        style={[styles.coinShadow, locked && styles.coinLocked]}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={`${label}${locked ? ', locked' : completed ? ', complete' : ''}`}
        accessibilityState={{ disabled: locked }}
      >
        <View style={[styles.coinFace, locked && styles.coinFaceLocked]}>
          <Feather
            name={locked ? 'lock' : completed ? 'check' : icon}
            size={locked ? 23 : 29}
            color={locked ? COLORS.textMuted : COLORS.textOnAccent}
          />
        </View>
      </TouchableOpacity>
      <Text style={[styles.coinLabel, locked && styles.lockedText]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function SectionCluster({
  section,
  lesson,
  title,
  weekTitle,
  marketName,
  activeSection,
  lessonCompletedToday,
  arenaCompletedToday,
  caseCompletedToday,
  intelDone,
  onModule,
  onLeo,
  onHeader,
}: {
  section: SectionAccess;
  lesson?: CourseLesson;
  title: string;
  weekTitle: string;
  marketName: string;
  activeSection: boolean;
  lessonCompletedToday: boolean;
  arenaCompletedToday: boolean;
  caseCompletedToday: boolean;
  intelDone: boolean;
  onModule: (kind: ModuleKind) => void;
  onLeo: () => void;
  onHeader: () => void;
}) {
  const moduleComplete = (kind: ModuleKind) => {
    if (!activeSection) return kind === 'lesson' && Boolean(lesson?.completed);
    if (kind === 'lesson') return lessonCompletedToday || Boolean(lesson?.completed);
    if (kind === 'arena') return arenaCompletedToday;
    if (kind === 'case') return caseCompletedToday;
    if (kind === 'intel') return intelDone;
    return false;
  };
  const coreCompleted = (['lesson', 'arena', 'case', 'intel'] as ModuleKind[])
    .filter(kind => moduleComplete(kind)).length;
  const orbitRadius = 132.5;
  const orbitCircumference = 2 * Math.PI * orbitRadius;
  const orbitOffset = orbitCircumference * (1 - coreCompleted / 4);
  const longTitle = weekTitle.length > 35;

  return (
    <View style={styles.sectionBlock}>
      <SectionHeader section={section} title={title} onPress={onHeader} />
      <View style={styles.weekHeading}>
        <View style={styles.weekHeadingCopy}>
          <Text style={styles.weekEyebrow}>{section.unlocked ? `DAY ${section.displayDay}` : `DAYS ${section.startDay}–${section.endDay}`}</Text>
          <MovingLessonTitle title={weekTitle} long={longTitle} />
          <Text style={styles.lessonMeta}>{marketName} · 6 min</Text>
        </View>
        {!section.unlocked ? (
          <View style={styles.lockPill}>
            <Feather name="lock" size={12} color={COLORS.textMuted} />
            <Text style={styles.lockPillText}>Finish Section {section.index}</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.cluster, !section.unlocked && styles.clusterLocked]}>
        <Svg width={268} height={268} style={styles.orbitSvg} pointerEvents="none">
          <Circle cx={134} cy={134} r={orbitRadius} fill="none" stroke={COLORS.accentMedium} strokeWidth={3} />
          <Circle
            cx={134}
            cy={134}
            r={orbitRadius}
            fill="none"
            stroke={COLORS.accent}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${orbitCircumference} ${orbitCircumference}`}
            strokeDashoffset={orbitOffset}
            rotation={-90}
            origin="134, 134"
          />
        </Svg>
        {MODULES.map((module, index) => (
          <View key={`marker-${module.kind}`} style={[styles.orbitMarker, styles[`orbitMarker${index}` as keyof typeof styles] as object, moduleComplete(module.kind) && styles.orbitMarkerComplete]} />
        ))}
        {MODULES.map(module => {
          // Notes is persistent and remains usable; the daily modules obey section access.
          const locked = !section.unlocked && module.kind !== 'notes';
          return (
            <Coin
              key={module.kind}
              label={module.label}
              icon={module.icon}
              position={module.position}
              locked={locked}
              completed={moduleComplete(module.kind)}
              onPress={() => onModule(module.kind)}
            />
          );
        })}
        <TouchableOpacity
          style={styles.leoCenter}
          onPress={onLeo}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={`Ask Leo about ${title}`}
        >
          <View style={styles.leoVisual} pointerEvents="none">
            <LeoCharacter size="course" animation="reading" still />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CurriculumPreview({
  visible,
  section,
  title,
  lessons,
  currentDay,
  onClose,
  onOpenLesson,
}: {
  visible: boolean;
  section: SectionAccess | null;
  title: string;
  lessons: CourseLesson[];
  currentDay: number;
  onClose: () => void;
  onOpenLesson: (lesson: CourseLesson) => void;
}) {
  if (!section) return null;
  const sectionLessons = lessons.filter(item => item.day >= section.startDay && item.day <= section.endDay);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.previewScreen}>
        <View style={styles.previewHeader}>
          <View style={styles.previewHeadingCopy}>
            <Text style={styles.previewEyebrow}>SECTION {section.index + 1} · 30 DAYS</Text>
            <Text style={styles.previewTitle} numberOfLines={2}>{title}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Close curriculum">
            <Feather name="x" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.previewList} showsVerticalScrollIndicator={false}>
          {!section.unlocked ? (
            <View style={styles.previewNotice}>
              <Feather name="eye" size={18} color={COLORS.courseHeader} />
              <Text style={styles.previewNoticeText}>Preview the curriculum now. Lessons open after the previous section’s 30 lessons are complete.</Text>
            </View>
          ) : null}
          {sectionLessons.map(item => {
            const calendarLocked = item.day > currentDay;
            const locked = !section.unlocked || calendarLocked || !item.stackId;
            return (
              <TouchableOpacity
                key={item.day}
                style={[styles.lessonRow, locked && styles.lessonRowLocked]}
                disabled={locked}
                onPress={() => onOpenLesson(item)}
                accessibilityRole="button"
                accessibilityLabel={`Day ${item.day}, ${item.title}${locked ? ', locked' : item.completed ? ', complete' : ''}`}
                accessibilityState={{ disabled: locked }}
              >
                <View style={[styles.dayCircle, item.completed && styles.dayCircleComplete]}>
                  {item.completed ? (
                    <Feather name="check" size={15} color={COLORS.textOnAccent} />
                  ) : (
                    <Text style={[styles.dayNumber, locked && styles.lockedText]}>{item.day}</Text>
                  )}
                </View>
                <View style={styles.lessonCopy}>
                  <Text
                    style={[styles.lessonTitle, item.title.length > 35 && styles.lessonTitleLong, locked && styles.lockedText]}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                  >{item.title}</Text>
                  <Text style={styles.lessonDescription} numberOfLines={2}>{item.description}</Text>
                </View>
                <Feather name={locked ? 'lock' : 'chevron-right'} size={17} color={locked ? COLORS.textMuted : COLORS.courseHeader} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function CourseJourney({
  marketId,
  currentDay,
  learningGoal,
  completedStackIds,
  streak,
  totalXp,
  level,
  lessonCompletedToday,
  arenaCompletedToday = false,
  caseCompletedToday = false,
  intelReadToday,
  intelTarget,
  rescueAvailable = false,
  safeTop,
  onOpenLesson,
  onAskLeo,
}: CourseJourneyProps) {
  const listRef = useRef<FlatList<SectionAccess>>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [previewSection, setPreviewSection] = useState<SectionAccess | null>(null);
  const [showIndustryName, setShowIndustryName] = useState(false);
  const industryPopoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const themes = useMemo(() => seasonThemes(marketId), [marketId]);
  const marketName = getMarketName(marketId);
  const marketIllustration = MARKET_ILLUSTRATIONS[marketId] || MARKET_ILLUSTRATIONS.aerospace;

  useEffect(() => () => {
    if (industryPopoverTimer.current) clearTimeout(industryPopoverTimer.current);
  }, []);

  const showIndustryPopover = () => {
    triggerHaptic('selection');
    setShowIndustryName(true);
    if (industryPopoverTimer.current) clearTimeout(industryPopoverTimer.current);
    industryPopoverTimer.current = setTimeout(() => setShowIndustryName(false), 2400);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError(false);
      const { data, error } = await supabase
        .from('stacks')
        .select('id, title, tags, created_at')
        .eq('market_id', marketId)
        .contains('tags', ['MICRO_LESSON'])
        .not('published_at', 'is', null)
        .order('created_at', { ascending: false });
      if (!active) return;
      if (error) {
        setLoadError(true);
        setLessons([]);
        setLoading(false);
        return;
      }
      const goalTag = goalContentTag(learningGoal);
      const byDay = new Map<number, { id: string; title: string; goalMatch: boolean }>();
      const completedByDay = new Map<number, boolean>();
      const completed = new Set(completedStackIds);
      (data || []).forEach((stack: any) => {
        const tags = Array.isArray(stack.tags) ? stack.tags : [];
        const tag = tags.find((value: string) => /^day-\d+$/.test(value));
        const day = tag ? Number(tag.slice(4)) : NaN;
        if (!Number.isFinite(day) || day < 1 || day > TOTAL_DAYS) return;
        if (completed.has(stack.id)) completedByDay.set(day, true);
        const goalMatch = tags.includes(goalTag);
        const existing = byDay.get(day);
        if (!existing || (goalMatch && !existing.goalMatch)) byDay.set(day, { id: stack.id, title: stack.title, goalMatch });
      });
      setLessons(Array.from({ length: TOTAL_DAYS }, (_, index) => {
        const day = index + 1;
        const lesson = byDay.get(day);
        const plan = syllabusDay(marketId, day);
        return {
          day,
          title: lesson?.title || dayPromise(marketId, day),
          description: plan.isConsolidation ? 'Review the week and explain one idea in your own words.' : plan.facet.promise,
          stackId: lesson?.id,
          completed: completedByDay.get(day) || false,
          authored: Boolean(lesson?.title),
        };
      }));
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [marketId, learningGoal, completedStackIds, loadKey]);

  const completedDays = useMemo(() => new Set(lessons.filter(item => item.completed).map(item => item.day)), [lessons]);
  const sections = useMemo(() => resolveCourseSections(currentDay, completedDays), [currentDay, completedDays]);
  const focusedSectionIndex = useMemo(() => {
    const calendarSection = Math.min(sections.length - 1, Math.floor((Math.max(1, currentDay) - 1) / 30));
    return sections[calendarSection]?.unlocked ? calendarSection : latestAccessibleSection(sections);
  }, [currentDay, sections]);

  useEffect(() => {
    if (loading || sections.length === 0) return;
    const timer = setTimeout(() => listRef.current?.scrollToIndex({ index: focusedSectionIndex, animated: false, viewPosition: 0.04 }), 80);
    return () => clearTimeout(timer);
  }, [focusedSectionIndex, loading, sections.length]);

  const lockedMessage = (section: SectionAccess) => {
    triggerHaptic('warning');
    Alert.alert('Section locked', `Complete all 30 lessons in Section ${section.index} to unlock this section. Your course clock and unfinished work will not reset.`);
  };

  const handleModule = (section: SectionAccess, lesson: CourseLesson | undefined, kind: ModuleKind) => {
    if (kind === 'notes') {
      triggerHaptic('selection');
      playSound('tap').catch(() => {});
      router.push('/notes');
      return;
    }
    if (!section.unlocked) {
      lockedMessage(section);
      return;
    }
    triggerHaptic('light');
    playSound('tap').catch(() => {});
    if (kind === 'lesson') {
      if (lesson?.stackId && lesson.day <= currentDay) onOpenLesson(lesson.stackId);
      else Alert.alert('Lesson unavailable', 'This lesson is not ready yet. Your progress is safe.');
    } else if (kind === 'arena') {
      router.push({ pathname: '/arena', params: { day: String(section.displayDay) } });
    } else if (kind === 'case') {
      router.push({ pathname: '/deep-case', params: { day: String(section.displayDay) } });
    } else if (kind === 'intel') {
      router.push('/(tabs)/roadmap');
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingCoin} />
        <Text style={styles.loadingText}>Building your course…</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.loading}>
        <Feather name="wifi-off" size={28} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>Your course could not load</Text>
        <Text style={styles.loadingText}>Your progress is safe. Reconnect and try again.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setLoadKey(key => key + 1)}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={sections}
        keyExtractor={item => String(item.index)}
        showsVerticalScrollIndicator={false}
        initialNumToRender={3}
        contentContainerStyle={styles.listContent}
        onScrollToIndexFailed={({ index }) => listRef.current?.scrollToOffset({ offset: Math.max(0, index * 540), animated: false })}
        ListHeaderComponent={(
          <View style={[styles.topHeader, { paddingTop: safeTop + 10 }]}>
            <View style={styles.industryBadgeWrap}>
              <TouchableOpacity
                style={styles.industryBadge}
                onPress={showIndustryPopover}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={`Current industry: ${marketName}`}
                accessibilityHint="Shows your active industry"
              >
                <Image source={marketIllustration} style={styles.industryImage} resizeMode="contain" />
              </TouchableOpacity>
              {showIndustryName ? (
                <View style={styles.industryPopover} accessibilityLiveRegion="polite">
                  <Text style={styles.industryPopoverText}>Current Industry: {marketName}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.badges}>
              <TouchableOpacity disabled={!rescueAvailable} onPress={() => router.push('/streak-rescue')}>
                <StreakBadge count={streak} />
              </TouchableOpacity>
              <XPBadge xp={totalXp} level={level} />
            </View>
          </View>
        )}
        renderItem={({ item: section }) => {
          const lesson = lessons.find(entry => entry.day === section.displayDay);
          const displayedLesson = lessons.find(entry => entry.day === section.displayDay);
          const sectionLead = lessons.find(entry => entry.day === section.startDay);
          const lockedTeasers = ['Locked Dossier', 'Uncharted Territory', 'Next Module Locked'];
          const weekTitle = section.unlocked
            ? displayedLesson?.title || `Day ${section.displayDay}`
            : sectionLead?.authored
              ? sectionLead.title
              : lockedTeasers[section.index % lockedTeasers.length];
          const activeSection = section.index === focusedSectionIndex;
          return (
            <SectionCluster
              section={section}
              lesson={lesson}
              title={themes[section.index] || `Section ${section.index + 1}`}
              weekTitle={weekTitle}
              marketName={marketName}
              activeSection={activeSection}
              lessonCompletedToday={lessonCompletedToday}
              arenaCompletedToday={arenaCompletedToday}
              caseCompletedToday={caseCompletedToday}
              intelDone={intelReadToday >= intelTarget}
              onHeader={() => setPreviewSection(section)}
              onLeo={() => onAskLeo(section.displayDay)}
              onModule={kind => handleModule(section, lesson, kind)}
            />
          );
        }}
      />
      <CurriculumPreview
        visible={Boolean(previewSection)}
        section={previewSection}
        title={previewSection ? themes[previewSection.index] || `Section ${previewSection.index + 1}` : ''}
        lessons={lessons}
        currentDay={currentDay}
        onClose={() => setPreviewSection(null)}
        onOpenLesson={lesson => {
          setPreviewSection(null);
          if (lesson.stackId) onOpenLesson(lesson.stackId);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  listContent: { paddingBottom: 110 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: COLORS.bg0, paddingHorizontal: 28 },
  loadingCoin: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.accentSoft, borderWidth: 8, borderColor: COLORS.accentMedium },
  loadingText: { ...TYPE.bodyBold, color: COLORS.textSecondary, textAlign: 'center' },
  emptyTitle: { ...TYPE.h2, color: COLORS.textPrimary },
  retryButton: { minHeight: 48, minWidth: 140, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.courseHeader },
  retryText: { ...TYPE.bodyBold, color: COLORS.textOnAccent },
  topHeader: { paddingHorizontal: 20, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  industryBadgeWrap: { position: 'relative', zIndex: 10 },
  industryBadge: {
    width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm,
  },
  industryImage: { width: 48, height: 48 },
  industryPopover: {
    position: 'absolute', top: 66, left: 0, minWidth: 220, paddingHorizontal: 13, paddingVertical: 10,
    borderRadius: 12, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.md,
  },
  industryPopoverText: { ...TYPE.caption, color: COLORS.textPrimary },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionBlock: { paddingHorizontal: 18, marginBottom: 26 },
  sectionHeader: { minHeight: 98, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.courseHeader, shadowColor: COLORS.courseHeaderDeep, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.24, shadowRadius: 14, elevation: 7 },
  sectionHeaderLocked: { opacity: 0.82 },
  sectionHeaderCopy: { flex: 1, minWidth: 0, paddingRight: 14 },
  sectionEyebrow: { ...TYPE.overline, color: 'rgba(255,255,255,0.75)' },
  sectionTitle: { fontSize: 20, lineHeight: 24, fontWeight: '800', color: COLORS.textOnAccent, marginTop: 4 },
  sectionProgress: { ...TYPE.caption, color: 'rgba(255,255,255,0.82)', marginTop: 6 },
  sectionTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 5, overflow: 'hidden' },
  sectionFill: { height: 5, borderRadius: 3, backgroundColor: COLORS.textOnAccent },
  headerArrow: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(34,28,164,0.32)', alignItems: 'center', justifyContent: 'center' },
  weekHeading: { minHeight: 112, paddingHorizontal: 7, paddingTop: 20, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  weekHeadingCopy: { flex: 1, minWidth: 0 },
  weekEyebrow: { ...TYPE.overline, color: COLORS.courseHeader },
  weekTitle: { fontSize: 28, lineHeight: 33, fontWeight: '700', color: COLORS.textPrimary, marginTop: 4, maxWidth: 300 },
  weekTitleWrap: { position: 'relative', overflow: 'hidden', maxWidth: 300 },
  weekTitleLong: { fontSize: 18, lineHeight: 23 },
  titleSweep: { position: 'absolute', top: 1, bottom: 0, width: 62, backgroundColor: COLORS.accentSoft, borderRadius: 18 },
  lessonMeta: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 5 },
  lockPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: COLORS.lockedSurface },
  lockPillText: { ...TYPE.caption, color: COLORS.textMuted, maxWidth: 110 },
  cluster: { height: 374, position: 'relative', marginTop: 6 },
  clusterLocked: { opacity: 0.66 },
  orbitSvg: { position: 'absolute', width: 268, height: 268, left: '50%', marginLeft: -134, top: 42 },
  orbitMarker: { position: 'absolute', width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.bg2, borderWidth: 2, borderColor: COLORS.accent, zIndex: 1 },
  orbitMarkerComplete: { backgroundColor: COLORS.accent },
  orbitMarker0: { top: 38, left: '50%', marginLeft: -4 },
  orbitMarker1: { top: 116, right: 30 },
  orbitMarker2: { top: 287, right: 78 },
  orbitMarker3: { top: 287, left: 78 },
  orbitMarker4: { top: 116, left: 30 },
  coinPosition: { position: 'absolute', width: 94, alignItems: 'center', zIndex: 3 },
  coinGlowWide: {
    position: 'absolute', top: -7, width: 98, height: 98, borderRadius: 49,
    backgroundColor: COLORS.accentSoft, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.34, shadowRadius: 22, elevation: 7,
  },
  coinGlowNear: {
    position: 'absolute', top: -1, width: 86, height: 86, borderRadius: 43,
    backgroundColor: COLORS.accentMedium, shadowColor: COLORS.courseCoinHighlight, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.52, shadowRadius: 11, elevation: 8,
  },
  coinShadow: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: COLORS.courseCoin,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.courseCoinHighlight,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.46, shadowRadius: 18, elevation: 10,
  },
  coinFace: { width: 81, height: 81, borderRadius: 41, backgroundColor: COLORS.courseCoin, alignItems: 'center', justifyContent: 'center' },
  coinLocked: { backgroundColor: COLORS.lockedSurface, borderColor: COLORS.border, shadowColor: COLORS.cardShadow, shadowOpacity: 0.1, elevation: 3 },
  coinFaceLocked: { backgroundColor: COLORS.lockedSurface, borderColor: COLORS.border },
  coinLabel: { ...TYPE.caption, color: COLORS.textPrimary, marginTop: 7, textAlign: 'center' },
  lockedText: { color: COLORS.textMuted },
  leoCenter: { position: 'absolute', width: 166, height: 166, left: '50%', marginLeft: -83, top: 107, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  leoVisual: { width: 144, height: 144, backfaceVisibility: 'hidden' },
  previewScreen: { flex: 1, backgroundColor: COLORS.bg0 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  previewHeadingCopy: { flex: 1, minWidth: 0 },
  previewEyebrow: { ...TYPE.overline, color: COLORS.courseHeader },
  previewTitle: { ...TYPE.h1, color: COLORS.textPrimary, marginTop: 4 },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  previewList: { padding: 18, paddingBottom: 60 },
  previewNotice: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, backgroundColor: COLORS.accentSoft, marginBottom: 12 },
  previewNoticeText: { ...TYPE.caption, color: COLORS.textSecondary, flex: 1, lineHeight: 18 },
  lessonRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  lessonRowLocked: { opacity: 0.58 },
  dayCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  dayCircleComplete: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  dayNumber: { ...TYPE.caption, color: COLORS.textPrimary },
  lessonCopy: { flex: 1, minWidth: 0 },
  lessonTitle: { ...TYPE.bodyBold, color: COLORS.textPrimary },
  lessonTitleLong: { fontSize: 14, lineHeight: 19 },
  lessonDescription: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 3 },
});
