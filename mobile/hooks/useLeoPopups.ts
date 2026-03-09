/**
 * useLeoPopups — manages a queue of Duolingo-style Leo pop-up messages.
 * Every popup is INTERACTIVE — requires user action (not just informational).
 */
import { useState, useCallback, useRef } from 'react';
import { LeoPopupMessage, LeoPopupCategory } from '../components/mascot/LeoPopup';

let messageCounter = 0;

interface UseLeoPopupsOptions {
  /** Cooldown between popups in ms (default 60000 = 1 minute) */
  cooldownMs?: number;
  /** Max popups per session (default 5) */
  maxPerSession?: number;
}

export function useLeoPopups(options: UseLeoPopupsOptions = {}) {
  const { cooldownMs = 60000, maxPerSession = 5 } = options;
  const [currentMessage, setCurrentMessage] = useState<LeoPopupMessage | null>(null);
  const queue = useRef<LeoPopupMessage[]>([]);
  const lastShown = useRef<number>(0);
  const shownCount = useRef<number>(0);
  const processingRef = useRef(false);

  const processQueue = useCallback(() => {
    if (processingRef.current) return;
    if (queue.current.length === 0) return;
    if (shownCount.current >= maxPerSession) return;

    const now = Date.now();
    if (now - lastShown.current < cooldownMs && lastShown.current > 0) {
      const delay = cooldownMs - (now - lastShown.current);
      setTimeout(() => processQueue(), delay);
      return;
    }

    processingRef.current = true;
    const next = queue.current.shift()!;
    lastShown.current = now;
    shownCount.current++;
    setCurrentMessage(next);
  }, [cooldownMs, maxPerSession]);

  const enqueue = useCallback((msg: Omit<LeoPopupMessage, 'id'>) => {
    // Every popup MUST have an action
    if (!msg.actionLabel || !msg.onAction) return;
    const id = `leo-${++messageCounter}-${Date.now()}`;
    queue.current.push({ ...msg, id });
    if (!currentMessage) processQueue();
  }, [currentMessage, processQueue]);

  const dismiss = useCallback(() => {
    setCurrentMessage(null);
    processingRef.current = false;
    setTimeout(() => processQueue(), 500);
  }, [processQueue]);

  // ── Interactive trigger helpers (all require user action) ──

  const triggerAddFriends = useCallback((onAction: () => void) => {
    enqueue({
      category: 'social',
      title: 'Learn with friends! 🤝',
      body: 'People who learn together retain 40% more. Add a friend to compete on the leaderboard.',
      actionLabel: 'Add friends',
      onAction,
      duration: 8000,
    });
  }, [enqueue]);

  const triggerInviteFriend = useCallback((onAction: () => void) => {
    enqueue({
      category: 'social',
      title: 'Share with a friend',
      body: 'Send an invite link and race each other on the leaderboard!',
      actionLabel: 'Send invite',
      onAction,
      duration: 8000,
    });
  }, [enqueue]);

  const triggerCheckLeaderboard = useCallback((rivalName: string, onAction: () => void) => {
    enqueue({
      category: 'social',
      title: `${rivalName} is catching up!`,
      body: "Don't let them pass you. Check the leaderboard and stay ahead.",
      actionLabel: 'View leaderboard',
      onAction,
      duration: 7000,
    });
  }, [enqueue]);

  const triggerStartLesson = useCallback((dayNumber: number, onAction: () => void) => {
    enqueue({
      category: 'learning',
      title: `Day ${dayNumber} is ready! 📚`,
      body: "Today's lesson is waiting. Build your expertise one day at a time.",
      actionLabel: 'Start lesson',
      onAction,
      duration: 8000,
    });
  }, [enqueue]);

  const triggerReviewDue = useCallback((dueCount: number, onAction: () => void) => {
    enqueue({
      category: 'learning',
      title: `${dueCount} concepts to review 📝`,
      body: 'Spaced repetition works best on time. Quick review now?',
      actionLabel: 'Review now',
      onAction,
      duration: 7000,
    });
  }, [enqueue]);

  const triggerWriteNote = useCallback((onAction: () => void) => {
    enqueue({
      category: 'learning',
      title: 'Capture your insights ✏️',
      body: 'Writing notes boosts retention by 30%. Save a takeaway from today.',
      actionLabel: 'Write a note',
      onAction,
      duration: 7000,
    });
  }, [enqueue]);

  const triggerTryTrainer = useCallback((onAction: () => void) => {
    enqueue({
      category: 'game',
      title: 'Test your knowledge ⚡',
      body: 'Real-world scenario challenge — can you make the right call?',
      actionLabel: 'Try trainer',
      onAction,
      duration: 7000,
    });
  }, [enqueue]);

  const triggerPlayGame = useCallback((onAction: () => void) => {
    enqueue({
      category: 'game',
      title: 'Quick challenge? 🎮',
      body: 'A 2-minute drill to sharpen your decision-making skills.',
      actionLabel: 'Play now',
      onAction,
      duration: 7000,
    });
  }, [enqueue]);

  const triggerInvestmentLab = useCallback((onAction: () => void) => {
    enqueue({
      category: 'game',
      title: 'Investment Lab unlocked 💰',
      body: 'Practice portfolio construction with real market scenarios.',
      actionLabel: 'Open lab',
      onAction,
      duration: 8000,
    });
  }, [enqueue]);

  const triggerSetGoal = useCallback((onAction: () => void) => {
    enqueue({
      category: 'achievement',
      title: 'Set your learning goal 🎯',
      body: 'Choose a focus — career, investing, or building a startup — to personalize your path.',
      actionLabel: 'Set goal',
      onAction,
      duration: 8000,
    });
  }, [enqueue]);

  const triggerStreakProtect = useCallback((streak: number, onAction: () => void) => {
    enqueue({
      category: 'streak',
      title: `Protect your ${streak}-day streak! 🔥`,
      body: "Your streak is at risk. Complete today's lesson to keep it alive.",
      actionLabel: 'Start lesson',
      onAction,
      duration: 8000,
    });
  }, [enqueue]);

  const triggerStreakCelebrate = useCallback((streak: number, onAction: () => void) => {
    enqueue({
      category: 'streak',
      title: `${streak}-day streak! 🔥`,
      body: "You're on fire! Share your progress with friends.",
      actionLabel: 'Share streak',
      onAction,
      duration: 7000,
    });
  }, [enqueue]);

  const triggerExploreMarket = useCallback((onAction: () => void) => {
    enqueue({
      category: 'tip',
      title: 'Explore a new market 🌍',
      body: 'Add another industry to your learning journey and broaden your expertise.',
      actionLabel: 'Browse markets',
      onAction,
      duration: 8000,
    });
  }, [enqueue]);

  const triggerViewProgress = useCallback((onAction: () => void) => {
    enqueue({
      category: 'achievement',
      title: 'Check your progress 📊',
      body: 'See how far you\'ve come in your learning journey.',
      actionLabel: 'View progress',
      onAction,
      duration: 7000,
    });
  }, [enqueue]);

  const triggerLessonComplete = useCallback((xpEarned: number, onAction: () => void) => {
    enqueue({
      category: 'achievement',
      title: 'Lesson complete! 🎉',
      body: `You earned ${xpEarned} XP! Share your achievement.`,
      actionLabel: 'Share',
      onAction,
      duration: 7000,
    });
  }, [enqueue]);

  return {
    currentMessage,
    dismiss,
    enqueue,
    // Social
    triggerAddFriends,
    triggerInviteFriend,
    triggerCheckLeaderboard,
    // Learning
    triggerStartLesson,
    triggerReviewDue,
    triggerWriteNote,
    // Game
    triggerTryTrainer,
    triggerPlayGame,
    triggerInvestmentLab,
    // Goals & progress
    triggerSetGoal,
    triggerViewProgress,
    triggerLessonComplete,
    // Streak
    triggerStreakProtect,
    triggerStreakCelebrate,
    // Discovery
    triggerExploreMarket,
  };
}
