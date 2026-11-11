/**
 * The race line on the Standings rank card. Every gap is XP EARNED this month (XP can be spent in the Shop, so
 * the line says "to pass", never "costs"); passing someone takes one more XP than they have.
 */
export interface RacePerson { name: string; xp: number }

export function raceLine(rank: number | null, me: RacePerson | null, next: RacePerson | null, second: RacePerson | null): { text: string; fill: number } {
  if (!rank || !me) return { text: 'One lesson puts you on the board.', fill: 0 };
  if (rank === 1) {
    const lead = second ? Math.max(0, me.xp - second.xp) : 0;
    return { text: second ? `You're on top · ${lead.toLocaleString('en-US')} XP ahead of ${second.name}` : "You're on top", fill: 1 };
  }
  if (!next) return { text: '', fill: 0 };
  const toPass = Math.max(1, next.xp - me.xp + 1);
  return { text: `${toPass.toLocaleString('en-US')} XP to pass ${next.name}`, fill: next.xp > 0 ? Math.min(1, me.xp / next.xp) : 0 };
}
