/**
 * The XP Shop catalog: every Leo cosmetic, the power-ups, the bundles and the perks.
 *
 * Cosmetics come from scripts/shop/ASSET_LIST.csv (the art pack); its acquisition column decides buy versus earn.
 * Prices follow the rarity tiers in the economy spec. The same ids and prices are seeded into shop_items by the
 * shop migration, and tests keep the two in step. Whether an item can be shown or bought on the phone depends on
 * its art existing (lib/shopArt.ts): items without art show a placeholder and cannot be bought yet.
 */
export type Slot = 'background' | 'cape' | 'outfit' | 'glasses' | 'hat' | 'held' | 'frame';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type Acquisition = 'purchase' | 'reward' | 'default';

export interface Requirements {
  min_streak_days?: number;
  min_xp_earned?: number;
  weekly_case_submitted_count?: number;
  min_lessons_completed?: number;
  weekly_case_top3?: boolean;
  requires_weekly_case_submission?: boolean;
  crown_live?: boolean;
  crown_keepsake?: boolean;
  /** Weekly Case placements among friends (cases at least 3 friends submitted), counted when scores are released. */
  weekly_podium_first_count?: number;
  weekly_podium_second_count?: number;
  weekly_podium_third_count?: number;
}

export type CollectionId = 'aerospace' | 'wallstreet' | 'lab' | 'startup' | 'tech' | 'field' | 'royal' | 'seasonal';

export interface Cosmetic {
  id: string;
  slot: Slot;
  name: string;
  rarity: Rarity;
  acquisition: Acquisition;
  collection?: CollectionId;
  requires?: Requirements;
  /** What unlocks an earn-only item, in the art pack's words. */
  rule?: string;
  /** Never listed in the shop grid (the live crown and its keepsake). */
  hidden?: boolean;
  /** A founder-set price that overrides the rarity tier (purchase items only). */
  price?: number;
  /** A named look this piece completes ("Goes with ..." on its try-on), ahead of its collection mates. */
  pairsWith?: string[];
  /** Months (1-12) when this piece takes over the Shop's featured card, e.g. holiday items in December. */
  featuredIn?: number[];
}

/** Bottom to top: the order layers are stacked. The base Leo sits between the cape and the outfit. */
export const SLOT_ORDER: Slot[] = ['background', 'cape', 'outfit', 'glasses', 'hat', 'held', 'frame'];
/** The six wardrobe tabs. Capes are worn behind Leo and are picked from the outfit tab. */
export const WARDROBE_SLOTS: Slot[] = ['hat', 'glasses', 'outfit', 'held', 'background', 'frame'];
export const SLOT_LABEL: Record<Slot, string> = {
  background: 'Backdrop', cape: 'Cape', outfit: 'Outfit', glasses: 'Glasses', hat: 'Hat', held: 'Held', frame: 'Frame',
};

export const RARITY_PRICE: Record<Rarity, number> = { common: 300, uncommon: 500, rare: 800, epic: 2000, legendary: 4000 };
export const RARITY_LABEL: Record<Rarity, string> = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#94A3B8', uncommon: '#22C55E', rare: '#3B82F6', epic: '#A855F7', legendary: '#F59E0B',
};

/** Everyone owns the graduation cap: Leo's signature look. */
export const DEFAULT_HAT = 'grad-cap';
export const CROWN_ID = 'monthly-crown';

export const COSMETICS: Cosmetic[] = [
  { id: 'grad-cap', slot: 'hat', name: 'Graduation cap', rarity: 'common', acquisition: 'default' },
  { id: 'founder-cap', slot: 'hat', name: 'Founder cap', rarity: 'common', acquisition: 'purchase', collection: 'startup' },
  { id: 'headphones', slot: 'hat', name: 'Study headphones', rarity: 'common', acquisition: 'purchase', collection: 'startup' },
  { id: 'beanie-startup', slot: 'hat', name: 'Startup beanie', rarity: 'common', acquisition: 'purchase', collection: 'startup' },
  { id: 'hard-hat', slot: 'hat', name: 'Hard hat', rarity: 'uncommon', acquisition: 'purchase', collection: 'field' },
  { id: 'trader-visor', slot: 'hat', name: "Trader's visor", rarity: 'uncommon', acquisition: 'purchase', collection: 'wallstreet' },
  { id: 'aero-helmet', slot: 'hat', name: 'Aerospace helmet', rarity: 'uncommon', acquisition: 'purchase', collection: 'aerospace' },
  { id: 'top-hat', slot: 'hat', name: 'Top hat', rarity: 'rare', acquisition: 'purchase', collection: 'wallstreet' },
  { id: 'party-hat', slot: 'hat', name: 'Party hat', rarity: 'common', acquisition: 'purchase', collection: 'seasonal' },
  { id: 'astro-helmet', slot: 'hat', name: 'Astronaut helmet', rarity: 'epic', acquisition: 'purchase', collection: 'aerospace' },
  { id: 'monthly-crown', slot: 'hat', name: 'The Crown', rarity: 'legendary', acquisition: 'reward', requires: { crown_live: true }, rule: "Hold this month's crown among friends", hidden: true },
  { id: 'monthly-crown-keepsake', slot: 'hat', name: 'Crown keepsake', rarity: 'legendary', acquisition: 'reward', requires: { crown_keepsake: true }, rule: 'Past monthly crown winners keep it', hidden: true },
  { id: 'santa-hat', slot: 'hat', name: 'Winter hat', rarity: 'uncommon', acquisition: 'purchase', collection: 'seasonal' },
  { id: 'flower-crown', slot: 'hat', name: 'Flower crown', rarity: 'uncommon', acquisition: 'purchase', collection: 'seasonal' },
  { id: 'holiday-antlers', slot: 'hat', name: 'Holiday antlers', rarity: 'common', acquisition: 'purchase', collection: 'seasonal', featuredIn: [12], pairsWith: ['holiday-collar', 'reindeer-nose', 'holly-wreath'] },
  { id: 'holiday-collar', slot: 'outfit', name: 'Holiday collar', rarity: 'common', acquisition: 'purchase', collection: 'seasonal', featuredIn: [12], pairsWith: ['holiday-antlers', 'reindeer-nose'] },
  { id: 'reindeer-nose', slot: 'glasses', name: 'Reindeer nose', rarity: 'common', acquisition: 'purchase', collection: 'seasonal', featuredIn: [12], pairsWith: ['holiday-antlers', 'holiday-collar'] },
  { id: 'holly-wreath', slot: 'outfit', name: 'Holly wreath', rarity: 'uncommon', acquisition: 'purchase', collection: 'seasonal', featuredIn: [12], pairsWith: ['holiday-antlers', 'reindeer-nose'] },
  { id: 'ember-band', slot: 'hat', name: 'Ember headband', rarity: 'uncommon', acquisition: 'reward', requires: { min_streak_days: 7 }, rule: '7-day streak' },
  { id: 'phoenix-feather', slot: 'hat', name: 'Phoenix feather', rarity: 'rare', acquisition: 'reward', requires: { min_streak_days: 30 }, rule: '30-day streak' },
  { id: 'eternal-flame-halo', slot: 'hat', name: 'Eternal flame halo', rarity: 'legendary', acquisition: 'reward', requires: { min_streak_days: 150 }, rule: '150-day streak' },
  { id: 'round-glasses', slot: 'glasses', name: 'Scholar glasses', rarity: 'common', acquisition: 'purchase', collection: 'lab' },
  { id: 'sunglasses', slot: 'glasses', name: 'Sunglasses', rarity: 'common', acquisition: 'purchase', collection: 'startup' },
  { id: 'aviators', slot: 'glasses', name: 'Aviators', rarity: 'uncommon', acquisition: 'purchase', collection: 'aerospace' },
  { id: 'safety-goggles', slot: 'glasses', name: 'Lab goggles', rarity: 'uncommon', acquisition: 'purchase', collection: 'lab' },
  { id: 'vr-headset', slot: 'glasses', name: 'VR headset', rarity: 'rare', acquisition: 'purchase', collection: 'tech' },
  { id: 'monocle', slot: 'glasses', name: 'Monocle', rarity: 'rare', acquisition: 'purchase', collection: 'wallstreet' },
  { id: 'pixel-shades', slot: 'glasses', name: 'Pixel shades', rarity: 'epic', acquisition: 'purchase', collection: 'tech' },
  { id: 'ar-glasses', slot: 'glasses', name: 'AR glasses', rarity: 'epic', acquisition: 'purchase', collection: 'tech' },
  { id: 'scarf', slot: 'outfit', name: 'Cozy scarf', rarity: 'common', acquisition: 'purchase', collection: 'seasonal' },
  { id: 'bowtie', slot: 'outfit', name: 'Bow tie', rarity: 'common', acquisition: 'purchase', collection: 'seasonal' },
  { id: 'startup-hoodie', slot: 'outfit', name: 'Startup hoodie', rarity: 'uncommon', acquisition: 'purchase', collection: 'startup' },
  { id: 'lab-coat', slot: 'outfit', name: 'Lab coat', rarity: 'uncommon', acquisition: 'purchase', collection: 'lab' },
  { id: 'trader-tie', slot: 'outfit', name: "Trader's tie", rarity: 'uncommon', acquisition: 'purchase', collection: 'wallstreet' },
  { id: 'hi-vis-vest', slot: 'outfit', name: 'Hi-vis vest', rarity: 'uncommon', acquisition: 'purchase', collection: 'field' },
  { id: 'flight-jacket', slot: 'outfit', name: 'Flight jacket', rarity: 'rare', acquisition: 'purchase', collection: 'aerospace' },
  { id: 'blazer', slot: 'outfit', name: 'Blazer', rarity: 'rare', acquisition: 'purchase', collection: 'wallstreet' },
  { id: 'spacesuit', slot: 'outfit', name: 'Spacesuit chest', rarity: 'epic', acquisition: 'purchase', collection: 'aerospace' },
  { id: 'tuxedo', slot: 'outfit', name: 'Tuxedo', rarity: 'legendary', acquisition: 'purchase', collection: 'wallstreet' },
  { id: 'golden-scarf', slot: 'outfit', name: 'Golden scarf', rarity: 'epic', acquisition: 'reward', requires: { min_streak_days: 100 }, rule: '100-day streak' },
  { id: 'case-blazer', slot: 'outfit', name: 'Case-cracker blazer', rarity: 'epic', acquisition: 'reward', requires: { weekly_case_submitted_count: 10 }, rule: 'Submit 10 weekly cases' },
  { id: 'hero-cape', slot: 'cape', name: 'Hero cape', rarity: 'common', acquisition: 'purchase', collection: 'seasonal' },
  { id: 'rocket-pack', slot: 'cape', name: 'Rocket backpack', rarity: 'uncommon', acquisition: 'purchase', collection: 'aerospace' },
  { id: 'angel-wings', slot: 'cape', name: 'Angel wings', rarity: 'rare', acquisition: 'purchase', collection: 'seasonal', pairsWith: ['halo', 'sun-diamond-necklace'] },
  { id: 'halo', slot: 'hat', name: 'Halo', rarity: 'rare', acquisition: 'purchase', collection: 'seasonal', pairsWith: ['angel-wings', 'sun-diamond-necklace'] },
  // Drawn as a front-worn capelet (its art redraws Leo's head over the collar), so it is an outfit, not a cape.
  { id: 'royal-mantle', slot: 'outfit', name: 'Royal mantle', rarity: 'legendary', acquisition: 'purchase', collection: 'royal' },
  // Colour variants of the same capelet: a cheaper tier than the red royal one.
  { id: 'royal-mantle-blue', slot: 'outfit', name: 'Sapphire mantle', rarity: 'rare', acquisition: 'purchase', collection: 'royal' },
  { id: 'royal-mantle-green', slot: 'outfit', name: 'Emerald mantle', rarity: 'rare', acquisition: 'purchase', collection: 'royal' },
  { id: 'sapphire-tiara', slot: 'hat', name: 'Sapphire tiara', rarity: 'legendary', acquisition: 'purchase', collection: 'royal', price: 10000, pairsWith: ['ermine-cape', 'sun-diamond-necklace'] },
  { id: 'sun-diamond-necklace', slot: 'outfit', name: 'Sun diamond necklace', rarity: 'rare', acquisition: 'purchase', collection: 'royal', pairsWith: ['sapphire-tiara'] },
  { id: 'ermine-cape', slot: 'outfit', name: 'Ermine cape', rarity: 'legendary', acquisition: 'purchase', collection: 'royal', price: 7000, pairsWith: ['sapphire-tiara'] },
  { id: 'crow-cape', slot: 'outfit', name: 'Crow cape', rarity: 'legendary', acquisition: 'purchase', collection: 'royal', price: 7000, pairsWith: ['raven-crown', 'top-hat'] },
  { id: 'raven-crown', slot: 'hat', name: 'Raven crown', rarity: 'legendary', acquisition: 'purchase', collection: 'royal', pairsWith: ['crow-cape'] },
  { id: 'commander-coat', slot: 'outfit', name: 'Commander coat', rarity: 'legendary', acquisition: 'purchase', collection: 'aerospace', price: 10000, pairsWith: ['captain-hat'] },
  { id: 'captain-hat', slot: 'hat', name: 'Captain hat', rarity: 'rare', acquisition: 'purchase', collection: 'aerospace', pairsWith: ['commander-coat'] },
  { id: 'coffee-cup', slot: 'held', name: 'Coffee cup', rarity: 'common', acquisition: 'purchase', collection: 'startup' },
  { id: 'magnifier', slot: 'held', name: 'Magnifying glass', rarity: 'common', acquisition: 'purchase', collection: 'lab' },
  { id: 'test-tube', slot: 'held', name: 'Test tubes', rarity: 'uncommon', acquisition: 'purchase', collection: 'lab' },
  { id: 'rocket-model', slot: 'held', name: 'Model rocket', rarity: 'uncommon', acquisition: 'purchase', collection: 'aerospace' },
  { id: 'microphone', slot: 'held', name: 'Microphone', rarity: 'rare', acquisition: 'purchase', collection: 'startup' },
  { id: 'token-coin', slot: 'held', name: 'Token coin', rarity: 'rare', acquisition: 'purchase', collection: 'wallstreet' },
  { id: 'flag', slot: 'held', name: 'Summit flag', rarity: 'epic', acquisition: 'purchase', collection: 'field' },
  { id: 'trophy', slot: 'held', name: 'Trophy', rarity: 'legendary', acquisition: 'purchase', collection: 'royal' },
  // Podium medals: earned once from Weekly Case placements among friends (3+ friends submitted), never sold or taken back.
  { id: 'medal-bronze', slot: 'held', name: 'Bronze medal', rarity: 'rare', acquisition: 'reward', requires: { weekly_podium_third_count: 3 }, rule: 'Finish 3rd among friends in a Weekly Case 3 times' },
  { id: 'medal-silver', slot: 'held', name: 'Silver medal', rarity: 'epic', acquisition: 'reward', requires: { weekly_podium_second_count: 5 }, rule: 'Finish 2nd among friends in a Weekly Case 5 times' },
  { id: 'medal-gold', slot: 'held', name: 'Gold medal', rarity: 'legendary', acquisition: 'reward', requires: { weekly_podium_first_count: 7 }, rule: 'Finish 1st among friends in a Weekly Case 7 times' },
  { id: 'bg-launchpad', slot: 'background', name: 'Launchpad', rarity: 'uncommon', acquisition: 'reward', requires: { min_lessons_completed: 30 }, rule: 'Finish your first industry' },
  { id: 'bg-trading-floor', slot: 'background', name: 'Trading floor', rarity: 'uncommon', acquisition: 'purchase', collection: 'wallstreet' },
  { id: 'bg-lab', slot: 'background', name: 'Research lab', rarity: 'uncommon', acquisition: 'purchase', collection: 'lab' },
  { id: 'bg-server-room', slot: 'background', name: 'Server room', rarity: 'rare', acquisition: 'purchase', collection: 'tech' },
  { id: 'bg-farm', slot: 'background', name: 'Smart farm', rarity: 'uncommon', acquisition: 'purchase', collection: 'field' },
  { id: 'bg-wind-farm', slot: 'background', name: 'Wind farm', rarity: 'uncommon', acquisition: 'purchase', collection: 'field' },
  { id: 'bg-port', slot: 'background', name: 'Port', rarity: 'rare', acquisition: 'purchase', collection: 'field' },
  { id: 'bg-workshop', slot: 'background', name: 'Robotics workshop', rarity: 'rare', acquisition: 'purchase', collection: 'tech' },
  { id: 'bg-space', slot: 'background', name: 'Space station', rarity: 'epic', acquisition: 'purchase', collection: 'aerospace' },
  { id: 'bg-campus', slot: 'background', name: 'Campus at golden hour', rarity: 'epic', acquisition: 'purchase', collection: 'startup' },
  { id: 'frame-gold', slot: 'frame', name: 'Gold ring', rarity: 'uncommon', acquisition: 'purchase', collection: 'wallstreet' },
  { id: 'frame-streak', slot: 'frame', name: 'Streak flame', rarity: 'rare', acquisition: 'purchase', collection: 'royal' },
  { id: 'frame-circuit', slot: 'frame', name: 'Circuit ring', rarity: 'rare', acquisition: 'purchase', collection: 'tech' },
  { id: 'frame-laurel', slot: 'frame', name: 'Laurel wreath', rarity: 'epic', acquisition: 'reward', requires: { min_lessons_completed: 30 }, rule: 'Complete a full 30-day course' },
  { id: 'frame-pixel', slot: 'frame', name: 'Pixel ring', rarity: 'epic', acquisition: 'purchase', collection: 'tech' },
  { id: 'frame-galaxy', slot: 'frame', name: 'Galaxy ring', rarity: 'legendary', acquisition: 'reward', requires: { min_xp_earned: 50000 }, rule: 'Reach 50,000 lifetime XP' },
  { id: 'frame-first-case', slot: 'frame', name: 'First case badge ring', rarity: 'rare', acquisition: 'reward', requires: { weekly_case_submitted_count: 1 }, rule: 'Submit your first weekly case' },
  { id: 'solar-wings', slot: 'cape', name: 'Solar wings', rarity: 'rare', acquisition: 'purchase', collection: 'aerospace' },
  { id: 'frame-10k-club', slot: 'frame', name: '10K Club ring', rarity: 'epic', acquisition: 'reward', requires: { min_xp_earned: 10000 }, rule: 'Reach 10,000 lifetime XP' },
];

export interface Collection { id: CollectionId; name: string; hook: string; tint: [string, string] }
export const COLLECTIONS: Collection[] = [
  { id: 'aerospace', name: 'Aerospace', hook: 'Built for the flight deck', tint: ['#93C5FD', '#3B82F6'] },
  { id: 'startup', name: 'Startup', hook: 'Hoodies, caps and coffee', tint: ['#FED7AA', '#FB923C'] },
  { id: 'royal', name: 'Royal', hook: 'For the one who leads', tint: ['#FECDD3', '#E11D48'] },
  { id: 'wallstreet', name: 'Wall Street', hook: 'Close the deal in style', tint: ['#FDE68A', '#D97706'] },
  { id: 'lab', name: 'Lab', hook: 'Goggles on, hypothesis ready', tint: ['#99F6E4', '#14B8A6'] },
  { id: 'tech', name: 'Tech', hook: 'Headsets, circuits and code', tint: ['#DDD6FE', '#8B5CF6'] },
  { id: 'field', name: 'Field work', hook: 'Hard hats and wind farms', tint: ['#D9F99D', '#65A30D'] },
  { id: 'seasonal', name: 'Seasonal', hook: 'Here for a limited time', tint: ['#FBCFE8', '#EC4899'] },
];

export interface Bundle { id: string; name: string; line: string; items: string[]; price: number; collection: CollectionId }
/** Full looks for less than the pieces: each saves about a quarter. */
export const BUNDLES: Bundle[] = [
  { id: 'bundle-aero', name: 'Flight deck set', line: 'Helmet, aviators, flight jacket', items: ['aero-helmet', 'aviators', 'flight-jacket'], price: 1350, collection: 'aerospace' },
  { id: 'bundle-wallstreet', name: 'Wall Street set', line: 'Power tie, monocle, top hat', items: ['trader-tie', 'monocle', 'top-hat'], price: 1575, collection: 'wallstreet' },
  { id: 'bundle-lab', name: 'Lab set', line: 'Goggles, lab coat, test tubes', items: ['safety-goggles', 'lab-coat', 'test-tube'], price: 1200, collection: 'lab' },
  { id: 'bundle-startup', name: 'Founder set', line: 'Founder cap, hoodie, coffee', items: ['founder-cap', 'startup-hoodie', 'coffee-cup'], price: 850, collection: 'startup' },
  { id: 'bundle-christmas', name: 'Christmas set', line: 'Antlers, collar and a reindeer nose', items: ['holiday-antlers', 'holiday-collar', 'reindeer-nose'], price: 680, collection: 'seasonal' },
  { id: 'bundle-angel', name: 'Angel of my Dreams', line: 'Angel wings, halo and sun diamond necklace', items: ['angel-wings', 'halo', 'sun-diamond-necklace'], price: 1500, collection: 'seasonal' },
];

export type PerkIcon = 'video' | 'file-text' | 'award' | 'cpu' | 'gift';
export interface Perk {
  id: string;
  name: string;
  /** What the learner actually gets, in one line. */
  line: string;
  kicker: string;
  price: number;
  requires?: Requirements;
  icon: PerkIcon;
  steps: [string, string, string];
}
const PERK_STEPS: [string, string, string] = [
  'Join the waitlist. Free, no XP yet.',
  'When it opens, ask for a spot. Your XP is held, not spent.',
  'Spot confirmed: XP is spent. No spot in 7 days: it comes back.',
];
/** No partners are confirmed, so every perk is Coming soon with a waitlist, and no partner is named. */
export const PERKS: Perk[] = [
  { id: 'perk-founder-call', name: '30-min call with a startup founder', line: 'Ask about hiring, ideas and how they started.', kicker: 'Expert access', price: 4000, icon: 'video', steps: PERK_STEPS },
  { id: 'perk-cv-review', name: 'Your CV reviewed by someone who hires', line: 'Line-by-line notes on your CV or LinkedIn.', kicker: 'Career', price: 2000, icon: 'file-text', steps: PERK_STEPS },
  { id: 'perk-case-badge', name: 'A verified badge for your best case', line: 'Proof of an assessed case, ready to share.', kicker: 'Skill proof', price: 1500, icon: 'award', requires: { requires_weekly_case_submission: true }, steps: PERK_STEPS },
  { id: 'perk-hackathon', name: 'Hackathon mentoring', line: 'A mentor in your corner for one event.', kicker: 'Events', price: 3000, icon: 'cpu', steps: PERK_STEPS },
  { id: 'perk-tool-credits', name: 'Premium tool credits', line: 'A month of a pro tool for your projects.', kicker: 'Digital perks', price: 2500, icon: 'gift', steps: PERK_STEPS },
];

export interface PowerUp {
  id: string; name: string; line: string; price: number | null; live: boolean; icon: 'streak-freeze' | 'streak-repair' | 'countdown';
  /** Earn-only: never sold (Double XP comes from each submitted Weekly Case). */
  earned?: boolean;
  /** Its screen. */
  route: string;
}
export const STREAK_FREEZE_ID = 'streak-freeze';
export const STREAK_FREEZE_PRICE = 400;
export const MAX_FREEZES_HELD = 2;
export const POWER_UPS: PowerUp[] = [
  { id: STREAK_FREEZE_ID, name: 'Streak Freeze', line: 'Covers one missed day. Hold 2.', price: STREAK_FREEZE_PRICE, live: true, icon: 'streak-freeze', route: '/shop-freeze' },
  { id: 'streak-repair', name: 'Streak Repair', line: 'Bring back a lost 7+ day streak.', price: 1200, live: true, icon: 'streak-repair', route: '/shop-repair' },
  { id: 'double-xp', name: 'Double XP', line: '15 minutes. Earned with each Weekly Case.', price: null, live: true, earned: true, icon: 'countdown', route: '/shop-boost' },
];

const BY_ID = new Map(COSMETICS.map(c => [c.id, c]));
export const cosmetic = (id: string | null | undefined): Cosmetic | undefined => (id ? BY_ID.get(id) : undefined);
/** Price in XP, or null for items that are earned or free. */
/** The tier price, or the item's own price when the founder set one; earn-only and free items have none. */
export const priceOf = (c: Cosmetic): number | null => (c.acquisition === 'purchase' ? c.price ?? RARITY_PRICE[c.rarity] : null);
export const bundleFullPrice = (b: Bundle): number => b.items.reduce((sum, id) => sum + (priceOf(BY_ID.get(id)!) ?? 0), 0);
export const collectionOf = (id: CollectionId) => COLLECTIONS.find(c => c.id === id)!;
