/**
 * Weekly league system.
 *
 * Everyone in an industry is placed in a tier. Each week (UTC Monday → Sunday)
 * the top 30% of a tier are promoted and the bottom 20% are relegated.
 * Rewards are purely status-based — MarketLingo is entirely free.
 */

export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export const LEAGUE_TIERS: LeagueTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export interface TierMeta {
  key: LeagueTier;
  name: string;
  color: string;
  soft: string;
  blurb: string;
}

export const TIER_META: Record<LeagueTier, TierMeta> = {
  bronze: { key: 'bronze', name: 'Bronze League', color: '#B45309', soft: '#FEF3C7', blurb: 'Where every analyst starts.' },
  silver: { key: 'silver', name: 'Silver League', color: '#64748B', soft: '#F1F5F9', blurb: 'Consistency is showing.' },
  gold: { key: 'gold', name: 'Gold League', color: '#CA8A04', soft: '#FEF9C3', blurb: 'Serious weekly volume.' },
  platinum: { key: 'platinum', name: 'Platinum League', color: '#0E7490', soft: '#CFFAFE', blurb: 'Top of your industry.' },
  diamond: { key: 'diamond', name: 'Diamond League', color: '#7C3AED', soft: '#EDE9FE', blurb: 'The insider circle.' },
};

export function tierMeta(tier?: string | null): TierMeta {
  return TIER_META[(tier as LeagueTier) || 'bronze'] || TIER_META.bronze;
}

/** Start of the current league week (UTC Monday), as 'YYYY-MM-DD'. */
export function currentWeekStart(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().split('T')[0];
}

/** Milliseconds until the league week closes. */
export function msUntilWeekEnd(now: Date = new Date()): number {
  const [y, m, d] = currentWeekStart(now).split('-').map(Number);
  const end = Date.UTC(y, m - 1, d + 7, 0, 0, 0);
  return Math.max(0, end - now.getTime());
}

export function formatTimeLeft(ms: number): string {
  const totalHours = Math.floor(ms / 3600000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h left`;
  if (totalHours > 0) return `${totalHours}h left`;
  return `${Math.max(1, Math.floor(ms / 60000))}m left`;
}

/** How many members of a group get promoted / relegated. */
export function promotionCount(groupSize: number): number {
  if (groupSize <= 0) return 0;
  return Math.max(1, Math.ceil(groupSize * 0.3));
}

export function demotionCount(groupSize: number): number {
  if (groupSize < 5) return 0;
  return Math.floor(groupSize * 0.2);
}

export type ZoneKind = 'promotion' | 'safe' | 'demotion';

export function zoneForRank(rank: number, groupSize: number, tier: LeagueTier): ZoneKind {
  if (tier !== 'diamond' && rank <= promotionCount(groupSize)) return 'promotion';
  const demote = demotionCount(groupSize);
  if (tier !== 'bronze' && demote > 0 && rank > groupSize - demote) return 'demotion';
  return 'safe';
}
