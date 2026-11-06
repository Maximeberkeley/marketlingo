function friendStanding(myId, friendIds, standings) {
  const friends = [...new Set(friendIds)].filter((id) => id && id !== myId);
  if (!friends.length) return null;
  const xp = new Map(standings.map((row) => [row.user_id, Number(row.monthly_xp) || 0]));
  const mine = xp.get(myId) ?? 0;
  const ahead = friends.filter((id) => (xp.get(id) ?? 0) > mine).length;
  return { rank: ahead + 1, of: friends.length + 1 };
}
function friendStandingLabel(standing) {
  return standing ? `#${standing.rank} of ${standing.of} among friends this month` : "Race a friend this month";
}
export {
  friendStanding,
  friendStandingLabel
};
