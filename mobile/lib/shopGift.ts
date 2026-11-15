/**
 * The shop opening gift: 750 XP to spend, claimable once from the shop launch (Dec 17, 2026) to Jan 31, 2027.
 * The server row (0073_opening_gift.sql) is the truth; these constants only keep the phone from asking outside
 * the window and the tests in agreement with the migration.
 */
export const OPENING_GIFT = { id: 'opening-gift-2026', amount: 750, starts: '2026-12-17', ends: '2027-01-31' } as const;

/** Whether a local calendar day (YYYY-MM-DD) falls inside the gift window. */
export const giftOpen = (today: string, gift: { starts: string; ends: string } = OPENING_GIFT) => today >= gift.starts && today <= gift.ends;

export const giftKey = (uid: string, giftId: string = OPENING_GIFT.id) => `ml_gift_v1/${giftId}/${uid}`;
