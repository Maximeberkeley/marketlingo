/**
 * Where the learner sits among friends this month, for the Home chip. Ranked
 * exactly like the Friends board (XP earned this month in every industry; on a
 * tie the learner stays ahead), so the chip and the board always agree.
 */
export interface FriendStanding {
  rank: number;
  of: number;
}

export function friendStanding(
  myId: string,
  friendIds: string[],
  standings: { user_id: string; monthly_xp: number }[],
): FriendStanding | null {
  const friends = [...new Set(friendIds)].filter(id => id && id !== myId);
  if (!friends.length) return null;
  const xp = new Map(standings.map(row => [row.user_id, Number(row.monthly_xp) || 0]));
  const mine = xp.get(myId) ?? 0;
  const ahead = friends.filter(id => (xp.get(id) ?? 0) > mine).length;
  return { rank: ahead + 1, of: friends.length + 1 };
}

export function friendStandingLabel(standing: FriendStanding | null): string {
  return standing ? `#${standing.rank} of ${standing.of} among friends this month` : 'Race a friend this month';
}

/** The friend race month starts at 00:00 UTC on the 1st, exactly like get_friends_overview's month_xp. */
export function friendRaceMonthStart(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
