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
import { log } from '../lib/logger';

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
      setActiveStack(null);
      Alert.alert('Great review!', 'Keep up the good work.');
      return;
    }
    if (timeSpentSeconds < 10) {
      Alert.alert('Too fast!', 'Take a moment to read through the slides.');
      return;
    }

    triggerHaptic('success');
    let earnedXP = xpRewardLessonComplete;

    try {
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
    } catch (err) {
      log.error('Lesson completion error:', err);
      Alert.alert(
        'Saved locally',
        'We had trouble syncing your progress. It will retry the next time you are online.',
      );
    }

    trackEvent('lesson_complete', { stackId: activeStack?.id || '', xp: earnedXP, market: selectedMarket || '' });
    setSessionXPEarned(earnedXP);
    setShowSessionComplete(true);
  }, [activeStack, progress, xpData, selectedMarket, completeStack, updateStreak, completeLessonForToday, addXP, checkStreakMilestone, checkLevelMilestone, xpRewardLessonComplete, xpRewardStreakBonus]);

  const handleBiteComplete = useCallback(async (isReviewMode: boolean, _timeSpentSeconds: number) => {
    setShowReader(false);
    if (isReviewMode || activeBiteIndex === null) return;
    const biteIndex = activeBiteIndex;
    setActiveBiteIndex(null);

    // Only award XP the first time a given bite is completed.
    if (completedBites.includes(biteIndex)) {
      Alert.alert('Bite reviewed', 'You already earned XP for this one.');
      return;
    }

    triggerHaptic('success');
    setCompletedBites((prev) => (prev.includes(biteIndex) ? prev : [...prev, biteIndex]));
    try {
      await addXP(10, 'bite', undefined, `Quick Bite ${biteIndex + 1}`);
      Alert.alert('Bite Complete! ⚡', '+10 XP earned');
    } catch (err) {
      log.error('Bite XP error:', err);
      Alert.alert('Bite Complete!', 'XP could not be saved right now.');
    }
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
        slide_id: slide.id ?? null,
      });
      if (error) throw error;
      triggerHaptic('success');
      Alert.alert('Saved!', 'Insight saved to your notebook.');
    } catch (err) {
      log.error('Save insight error:', err);
      Alert.alert('Error', 'Could not save insight. Please try again.');
    }
  }, [user, activeStack]);

  const handleAddNote = useCallback(async (slideNum: number, customContent?: string) => {
    if (!user || !activeStack || !selectedMarket) return;
    const slide = activeStack.slides.find((s) => s.slide_number === slideNum);
    if (!slide) return;
    try {
      const noteContent = customContent || slide.body || '';
      const { error } = await supabase.from('notes').insert({
        user_id: user.id,
        content: noteContent,
        linked_label: activeStack.title || `Slide ${slideNum}`,
        stack_id: activeStack.id,
        slide_id: slide.id ?? null,
        market_id: selectedMarket,
      });
      if (error) throw error;
      triggerHaptic('success');
      Alert.alert('Note added!', 'Your annotation has been saved.');
    } catch (err) {
      log.error('Add note error:', err);
      Alert.alert('Error', 'Could not save note. Please try again.');
    }
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
