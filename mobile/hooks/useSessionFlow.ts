/**
 * useSessionFlow — manages the slide reader, bite mode, session completion,
 * and all lesson/bite completion handlers for the Home screen.
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { StackWithSlides } from '../lib/types';
import { getMarketName, getMarketEmoji } from '../lib/markets';
import { triggerHaptic } from '../lib/haptics';
import { trackEvent } from '../lib/analytics';

interface UseSessionFlowParams {
  user: any;
  selectedMarket: string | null;
  lessonStack: StackWithSlides | null;
  progress: any;
  xpData: any;
  lessonCompletedToday: boolean;
  currentDay: number;
  completeStack: (stackId: string) => Promise<any>;
  updateStreak: () => Promise<any>;
  completeLessonForToday: (stackId: string) => Promise<void>;
  addXP: (amount: number, type: string, sourceId?: string, description?: string) => Promise<void>;
  checkStreakMilestone: (streak: number, name: string, emoji: string) => void;
  checkLevelMilestone: (level: number, name: string, emoji: string) => void;
  xpRewardLessonComplete: number;
  xpRewardStreakBonus: number;
  onDataRefresh: () => Promise<void>;
}

export function useSessionFlow({
  user,
  selectedMarket,
  lessonStack,
  progress,
  xpData,
  lessonCompletedToday,
  currentDay,
  completeStack,
  updateStreak,
  completeLessonForToday,
  addXP,
  checkStreakMilestone,
  checkLevelMilestone,
  xpRewardLessonComplete,
  xpRewardStreakBonus,
  onDataRefresh,
}: UseSessionFlowParams) {
  const [activeStack, setActiveStack] = useState<StackWithSlides | null>(null);
  const [showReader, setShowReader] = useState(false);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [sessionXPEarned, setSessionXPEarned] = useState(0);
  const [completedBites, setCompletedBites] = useState<number[]>([]);
  const [activeBiteIndex, setActiveBiteIndex] = useState<number | null>(null);

  const handleOpenStack = useCallback((stack: StackWithSlides) => {
    triggerHaptic('light');
    trackEvent('lesson_start', { stackId: stack.id, type: stack.stack_type });
    setActiveStack(stack);
    setActiveBiteIndex(null);
    setShowReader(true);
  }, []);

  const handleOpenBite = useCallback((biteIndex: number) => {
    if (!lessonStack) return;
    triggerHaptic('light');
    const startIdx = biteIndex * 2;
    const biteSlides = lessonStack.slides.slice(startIdx, startIdx + 2);
    if (biteSlides.length === 0) return;

    const biteStack: StackWithSlides = {
      ...lessonStack,
      title: `${lessonStack.title} — Bite ${biteIndex + 1}`,
      slides: biteSlides,
    };
    setActiveStack(biteStack);
    setActiveBiteIndex(biteIndex);
    setShowReader(true);
  }, [lessonStack]);

  const handleStackComplete = useCallback(async (isReviewMode: boolean, timeSpentSeconds: number) => {
    setShowReader(false);
    if (isReviewMode) {
      Alert.alert('Great review!', 'Keep up the good work.');
      return;
    }
    if (timeSpentSeconds < 10) {
      Alert.alert('Too fast!', 'Take a moment to read through the slides.');
      return;
    }

    triggerHaptic('success');
    let earnedXP = xpRewardLessonComplete;

    if (progress && activeStack) {
      await completeStack(activeStack.id);
      const updatedProgress = await updateStreak();
      await completeLessonForToday(activeStack.id);
      if ((progress.current_streak || 0) > 0) {
        const streakBonus = xpRewardStreakBonus * (progress.current_streak || 1);
        await addXP(streakBonus, 'streak_bonus');
        earnedXP += streakBonus;
      }

      const mktName = getMarketName(selectedMarket || 'aerospace');
      const mktEmoji = getMarketEmoji(selectedMarket || 'aerospace');
      const newStreak = (updatedProgress as any)?.current_streak || progress.current_streak || 0;
      checkStreakMilestone(newStreak, mktName, mktEmoji);

      if (xpData) {
        checkLevelMilestone(xpData.current_level, mktName, mktEmoji);
      }
    }

    trackEvent('lesson_complete', { stackId: activeStack?.id || '', xp: earnedXP, market: selectedMarket || '' });
    setSessionXPEarned(earnedXP);
    setShowSessionComplete(true);
  }, [activeStack, progress, xpData, selectedMarket, completeStack, updateStreak, completeLessonForToday, addXP, checkStreakMilestone, checkLevelMilestone, xpRewardLessonComplete, xpRewardStreakBonus]);

  const handleBiteComplete = useCallback((isReviewMode: boolean, _timeSpentSeconds: number) => {
    setShowReader(false);
    if (isReviewMode || activeBiteIndex === null) return;
    triggerHaptic('success');
    if (!completedBites.includes(activeBiteIndex)) {
      setCompletedBites((prev) => [...prev, activeBiteIndex!]);
    }
    addXP(10, 'bite', undefined, `Quick Bite ${activeBiteIndex + 1}`);
    Alert.alert('Bite Complete! ⚡', '+10 XP earned');
    setActiveBiteIndex(null);
  }, [activeBiteIndex, completedBites, addXP]);

  const handleSaveInsight = useCallback(async (slideNum: number) => {
    if (!user || !activeStack) return;
    const slide = activeStack.slides.find((s) => s.slide_number === slideNum);
    if (!slide) return;
    try {
      const { error } = await supabase.from('saved_insights').insert({
        user_id: user.id,
        title: slide.title || 'Insight',
        content: slide.body,
        stack_id: activeStack.id,
        slide_id: slide.id,
      });
      if (error) throw error;
      triggerHaptic('success');
      Alert.alert('Saved!', 'Insight saved to your notebook.');
    } catch (err) {
      console.error('Save insight error:', err);
      Alert.alert('Error', 'Could not save insight. Please try again.');
    }
  }, [user, activeStack]);

  const handleAddNote = useCallback(async (slideNum: number) => {
    if (!user || !activeStack || !selectedMarket) return;
    const slide = activeStack.slides.find((s) => s.slide_number === slideNum);
    await supabase.from('notes').insert({
      user_id: user.id,
      content: slide?.body || '',
      linked_label: `Slide ${slideNum}`,
      stack_id: activeStack.id,
      market_id: selectedMarket,
    });
    triggerHaptic('light');
    Alert.alert('Note added!', 'Note saved to your notebook.');
  }, [user, activeStack, selectedMarket]);

  const dismissSessionComplete = useCallback(() => {
    setShowSessionComplete(false);
    onDataRefresh();
  }, [onDataRefresh]);

  const closeReader = useCallback(() => {
    setShowReader(false);
    setActiveBiteIndex(null);
  }, []);

  return {
    activeStack,
    showReader,
    showSessionComplete,
    sessionXPEarned,
    completedBites,
    activeBiteIndex,
    handleOpenStack,
    handleOpenBite,
    handleStackComplete,
    handleBiteComplete,
    handleSaveInsight,
    handleAddNote,
    dismissSessionComplete,
    closeReader,
  };
}
