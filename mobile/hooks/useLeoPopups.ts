/**
 * useLeoPopups — manages a queue of Duolingo-style Leo pop-up messages.
 * Triggers contextual messages based on user actions and app state.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { LeoPopupMessage, LeoPopupCategory } from '../components/mascot/LeoPopup';

// ── Predefined message pools ──
const MESSAGE_POOLS: Record<LeoPopupCategory, { title: string; body: string }[]> = {
  social: [
    { title: 'Your friend is learning!', body: "Someone on your leaderboard just completed a lesson. Don't fall behind!" },
    { title: 'Challenge a friend! 🤝', body: 'Invite a friend to join your market and race to the top.' },
    { title: 'Leaderboard update', body: "You're close to moving up! One more lesson could do it." },
    { title: 'Learning together = faster', body: 'People who learn with friends retain 40% more.' },
  ],
  game: [
    { title: 'Trainer unlocked! ⚡', body: 'Test your knowledge with a real-world scenario challenge.' },
    { title: 'New scenarios available', body: 'Fresh industry scenarios are waiting for you in Practice.' },
    { title: 'Quick challenge?', body: 'A 2-minute trainer drill can sharpen your decision-making.' },
    { title: 'Level up your skills', body: 'Try the Investment Lab for hands-on portfolio practice.' },
  ],
  learning: [
    { title: 'Knowledge compounds 📈', body: 'Every lesson you complete builds on the last one.' },
    { title: 'Pro tip from Leo', body: 'Try explaining what you learned to someone — it doubles retention!' },
    { title: 'New content today!', body: "Today's lesson has been curated for your learning path." },
    { title: 'Review time?', body: 'Spaced repetition says you should review yesterday's concepts.' },
    { title: 'You're building expertise', body: 'Professionals in your field study these exact concepts.' },
  ],
  streak: [
    { title: 'Streak on fire! 🔥', body: 'Keep it going — consistency is the key to mastery.' },
    { title: "Don't break the chain!", body: 'Complete today\'s lesson to keep your streak alive.' },
    { title: 'Streak milestone!', body: 'You\'re building an incredible habit. Leo is proud!' },
  ],
  achievement: [
    { title: 'Achievement unlocked! 🏆', body: 'You\'ve reached a new milestone in your learning journey.' },
    { title: 'Level up!', body: 'Your XP just pushed you to the next level. Amazing progress!' },
    { title: 'New badge earned!', body: 'Check your profile to see your latest achievement.' },
  ],
  tip: [
    { title: 'Did you know?', body: 'You can save insights from any lesson by tapping the bookmark icon.' },
    { title: 'Notebook power-up ✏️', body: 'Writing notes during lessons boosts retention by 30%.' },
    { title: 'Explore more', body: 'Tap the Practice tab to discover trainers, games, and deep dives.' },
    { title: 'Voice narration 🔊', body: 'Tap the speaker icon in lessons to hear AI mentor narration.' },
  ],
};

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
  const shownIds = useRef<Set<string>>(new Set());
  const processingRef = useRef(false);

  const processQueue = useCallback(() => {
    if (processingRef.current) return;
    if (queue.current.length === 0) return;
    if (shownCount.current >= maxPerSession) return;

    const now = Date.now();
    if (now - lastShown.current < cooldownMs && lastShown.current > 0) {
      // Schedule retry after cooldown
      const delay = cooldownMs - (now - lastShown.current);
      setTimeout(() => processQueue(), delay);
      return;
    }

    processingRef.current = true;
    const next = queue.current.shift()!;
    lastShown.current = now;
    shownCount.current++;
    shownIds.current.add(next.id);
    setCurrentMessage(next);
  }, [cooldownMs, maxPerSession]);

  const enqueue = useCallback((msg: Omit<LeoPopupMessage, 'id'>) => {
    const id = `leo-${++messageCounter}-${Date.now()}`;
    queue.current.push({ ...msg, id });
    if (!currentMessage) processQueue();
  }, [currentMessage, processQueue]);

  const dismiss = useCallback(() => {
    setCurrentMessage(null);
    processingRef.current = false;
    // Process next after a short delay
    setTimeout(() => processQueue(), 500);
  }, [processQueue]);

  // ── Contextual trigger helpers ──

  const triggerSocial = useCallback((overrides?: Partial<LeoPopupMessage>) => {
    const pool = MESSAGE_POOLS.social;
    const msg = pool[Math.floor(Math.random() * pool.length)];
    enqueue({ category: 'social', ...msg, ...overrides });
  }, [enqueue]);

  const triggerGame = useCallback((overrides?: Partial<LeoPopupMessage>) => {
    const pool = MESSAGE_POOLS.game;
    const msg = pool[Math.floor(Math.random() * pool.length)];
    enqueue({ category: 'game', ...msg, ...overrides });
  }, [enqueue]);

  const triggerLearning = useCallback((overrides?: Partial<LeoPopupMessage>) => {
    const pool = MESSAGE_POOLS.learning;
    const msg = pool[Math.floor(Math.random() * pool.length)];
    enqueue({ category: 'learning', ...msg, ...overrides });
  }, [enqueue]);

  const triggerStreak = useCallback((streak: number) => {
    if (streak >= 7) {
      enqueue({ category: 'streak', title: `${streak}-day streak! 🔥`, body: "You're on fire! Consistency is your superpower.", duration: 6000 });
    } else if (streak >= 3) {
      enqueue({ category: 'streak', title: `${streak} days strong!`, body: 'Great habit building. Keep the momentum going!' });
    } else {
      const pool = MESSAGE_POOLS.streak;
      const msg = pool[Math.floor(Math.random() * pool.length)];
      enqueue({ category: 'streak', ...msg });
    }
  }, [enqueue]);

  const triggerAchievement = useCallback((title: string, body: string) => {
    enqueue({ category: 'achievement', title, body, duration: 7000 });
  }, [enqueue]);

  const triggerTip = useCallback((overrides?: Partial<LeoPopupMessage>) => {
    const pool = MESSAGE_POOLS.tip;
    const msg = pool[Math.floor(Math.random() * pool.length)];
    enqueue({ category: 'tip', ...msg, ...overrides });
  }, [enqueue]);

  const triggerLessonComplete = useCallback((xpEarned: number) => {
    enqueue({
      category: 'learning',
      title: 'Lesson complete! 🎉',
      body: `You earned ${xpEarned} XP. Knowledge compounds — come back tomorrow!`,
      duration: 6000,
    });
  }, [enqueue]);

  const triggerWelcomeBack = useCallback((streak: number, dayNumber: number) => {
    const greetings = [
      { title: 'Welcome back! 👋', body: `Day ${dayNumber} of your journey. Let's keep building expertise.` },
      { title: 'Leo missed you!', body: `Ready for today's lesson? You're on day ${dayNumber}.` },
      { title: 'Time to learn! 📚', body: streak > 1 ? `${streak}-day streak active. Let's add another!` : "Let's start building your streak today!" },
    ];
    const msg = greetings[Math.floor(Math.random() * greetings.length)];
    enqueue({ category: 'learning', ...msg, duration: 5000 });
  }, [enqueue]);

  return {
    currentMessage,
    dismiss,
    enqueue,
    triggerSocial,
    triggerGame,
    triggerLearning,
    triggerStreak,
    triggerAchievement,
    triggerTip,
    triggerLessonComplete,
    triggerWelcomeBack,
  };
}
