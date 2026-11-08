/**
 * This month's crown among friends: who wears it and how far you are from it.
 * The board is sorted by monthly XP, highest first, and includes you.
 */
export interface CrownRow { name: string; xp: number; isMe: boolean }

export type Crown =
  | { kind: 'open' }
  | { kind: 'mine'; chaser: string; gap: number }
  | { kind: 'theirs'; leader: string; gap: number };

const firstWord = (name: string) => name.trim().split(/\s+/)[0] || name;

export function crownStatus(board: CrownRow[]): Crown | null {
  if (board.length < 2) return null;
  const top = board[0];
  if (top.xp <= 0) return { kind: 'open' };
  if (top.isMe) {
    const next = board[1];
    return { kind: 'mine', chaser: firstWord(next.name), gap: Math.max(0, top.xp - next.xp) };
  }
  const me = board.find(r => r.isMe);
  return { kind: 'theirs', leader: firstWord(top.name), gap: Math.max(0, top.xp - (me?.xp ?? 0)) };
}

export function crownCopy(crown: Crown): { title: string; line: string; action: string } {
  if (crown.kind === 'open') return { title: 'The crown is up for grabs', line: 'First lesson this month takes it.', action: 'Take the crown' };
  if (crown.kind === 'mine') {
    return {
      title: 'You wear the crown',
      line: crown.gap > 0 ? `${crown.chaser} is ${crown.gap.toLocaleString()} XP behind you` : `${crown.chaser} is tied with you`,
      action: 'Defend it',
    };
  }
  return {
    title: `${crown.leader} wears the crown`,
    line: crown.gap > 0 ? `${crown.gap.toLocaleString()} XP ahead of you` : "You're tied. One lesson takes it.",
    action: 'Take the crown',
  };
}
