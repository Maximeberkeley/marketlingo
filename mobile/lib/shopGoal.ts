import type { Cosmetic } from './shopCatalog';

const fmt = (n: number) => n.toLocaleString('en-US');

export interface GoalReminder {
  title: string;
  body: string;
  actionLabel: string;
  /** 'item' opens the goal's page; 'lesson' opens today's lesson. */
  action: 'item' | 'lesson';
  ready: boolean;
}

/**
 * The small reminder Leo gives about the item a learner is saving for, at most once a day: "you can get it now"
 * once the balance covers it, otherwise how far is left, pointing at today's lesson until it is done.
 */
export function goalReminder(item: Cosmetic, price: number, balance: number, lessonDoneToday: boolean): GoalReminder {
  if (balance >= price) {
    return { title: `${item.name} is yours to claim`, body: 'Your goal is covered. Go claim it.', actionLabel: 'Get it', action: 'item', ready: true };
  }
  const left = fmt(price - balance);
  return lessonDoneToday
    ? { title: `${item.name}: ${left} XP to go`, body: 'Today counted. Same again tomorrow.', actionLabel: 'See', action: 'item', ready: false }
    : { title: `${item.name}: ${left} XP to go`, body: "Today's lesson gets you closer.", actionLabel: 'Lesson', action: 'lesson', ready: false };
}

export const goalReminderKey = (uid: string) => `ml_goal_reminder_v1/${uid}`;
