const OPENING_GIFT = { id: "opening-gift-2026", amount: 750, starts: "2026-12-17", ends: "2027-01-31" };
const giftOpen = (today, gift = OPENING_GIFT) => today >= gift.starts && today <= gift.ends;
const giftKey = (uid, giftId = OPENING_GIFT.id) => `ml_gift_v1/${giftId}/${uid}`;
export {
  OPENING_GIFT,
  giftKey,
  giftOpen
};
