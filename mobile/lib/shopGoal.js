const fmt = (n) => n.toLocaleString("en-US");
function goalReminder(item, price, balance, lessonDoneToday) {
  if (balance >= price) {
    return { title: `${item.name} is yours to claim`, body: "Your goal is covered. Go claim it.", actionLabel: "Get it", action: "item", ready: true };
  }
  const left = fmt(price - balance);
  return lessonDoneToday ? { title: `${item.name}: ${left} XP to go`, body: "Today counted. Same again tomorrow.", actionLabel: "See", action: "item", ready: false } : { title: `${item.name}: ${left} XP to go`, body: "Today's lesson gets you closer.", actionLabel: "Lesson", action: "lesson", ready: false };
}
const goalReminderKey = (uid) => `ml_goal_reminder_v1/${uid}`;
export {
  goalReminder,
  goalReminderKey
};
