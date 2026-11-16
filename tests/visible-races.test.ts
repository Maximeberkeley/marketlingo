import { describe, expect, it } from 'vitest';
import { visibleRaces, type FriendRace } from '../mobile/lib/friendSocial';

const race = (o: Partial<FriendRace>): FriendRace => ({
  id: 'r', friend_id: 'sophia', display_name: 'Sophillita', status: 'finished', challenged_by_me: true,
  starts_at: '2026-11-07T20:00:00Z', ends_at: '2026-11-14T20:00:00Z', my_xp: 4194, friend_xp: 4903,
  claimed: true, claimed_xp: 25, nudged_today: false, ...o,
});
const now = new Date('2026-11-16T04:00:00Z');

describe('visible races', () => {
  it('drops a collected race once the rematch with that friend is on (Max, Nov 15)', () => {
    const old = race({ id: 'old' });
    const rematch = race({ id: 'new', status: 'active', starts_at: '2026-11-16T03:00:00Z', ends_at: '2026-11-23T03:00:00Z', my_xp: 0, friend_xp: 0, claimed: false });
    expect(visibleRaces([rematch, old], now).map(r => r.id)).toEqual(['new']);
  });
  it('also when the rematch is still waiting for an answer', () => {
    expect(visibleRaces([race({ id: 'old' }), race({ id: 'p', status: 'pending', starts_at: null, ends_at: null, claimed: false })], now).map(r => r.id)).toEqual(['p']);
  });
  it('keeps an uncollected reward, whatever else is going on', () => {
    expect(visibleRaces([race({ id: 'won', friend_id: 'ibrahim', claimed: false, ends_at: '2026-11-01T00:00:00Z' })], now)).toHaveLength(1);
  });
  it('keeps a collected race for a day so the rematch offer shows, then lets it go', () => {
    expect(visibleRaces([race({ id: 'old' })], new Date('2026-11-15T10:00:00Z'))).toHaveLength(1);
    expect(visibleRaces([race({ id: 'old' })], new Date('2026-11-16T21:00:00Z'))).toHaveLength(0);
  });
});
