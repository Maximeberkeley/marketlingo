const firstWord = (name) => name.trim().split(/\s+/)[0] || name;
function crownStatus(board) {
  if (board.length < 2) return null;
  const top = board[0];
  if (top.xp <= 0) return { kind: "open" };
  if (top.isMe) {
    const next = board[1];
    return { kind: "mine", chaser: firstWord(next.name), gap: Math.max(0, top.xp - next.xp) };
  }
  const me = board.find((r) => r.isMe);
  return { kind: "theirs", leader: firstWord(top.name), gap: Math.max(0, top.xp - (me?.xp ?? 0)) };
}
function crownCopy(crown) {
  if (crown.kind === "open") return { title: "The crown is up for grabs", line: "First lesson this month takes it.", action: "Take the crown" };
  if (crown.kind === "mine") {
    return {
      title: "You wear the crown",
      line: crown.gap > 0 ? `${crown.chaser} is ${crown.gap.toLocaleString()} XP behind you` : `${crown.chaser} is tied with you`,
      action: "Defend it"
    };
  }
  return {
    title: `${crown.leader} wears the crown`,
    line: crown.gap > 0 ? `${crown.gap.toLocaleString()} XP ahead of you` : "You're tied. One lesson takes it.",
    action: "Take the crown"
  };
}
export {
  crownCopy,
  crownStatus
};
