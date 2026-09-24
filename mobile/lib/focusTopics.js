/**
 * Focus topic — one optional tap, offered only after the first week.
 *
 * The learner spends their first seven days on the market's foundations. From
 * day 7 onward they may pick ONE corner of the market to lean into. It is a
 * tilt, never a filter: the daily concept still comes from the syllabus, the
 * focus decides which examples, cases and practice questions are preferred.
 *
 * Options are derived from each market's own themes so there is a single
 * source of truth for what a market is made of.
 */
import { markets } from './markets';
/** Learners must finish the foundations week before choosing. */
export const FOCUS_UNLOCK_DAY = 7;
const slug = (label) => label
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const PAYOFF_HINTS = [
    { match: /regulat|complian|fda|policy|legal/i, payoff: 'You will know who can stop a product, and on what grounds.' },
    { match: /business|strategy|gtm|model|economic|money|market/i, payoff: 'You will read the money: who pays, who margins, who quietly loses.' },
    { match: /defen[cs]e|government|public/i, payoff: 'You will follow the contracts and the programmes that decide winners.' },
    { match: /infra|manufact|supply|operation|hardware|device/i, payoff: 'You will know what is genuinely hard to build, and why that matters.' },
    { match: /safety|ethic|risk|security/i, payoff: 'You will name the failure modes before anyone asks you to.' },
    { match: /emerging|frontier|generat|research|innovat|future/i, payoff: 'You will spot the openings early, while they are still arguable.' },
];
function payoffFor(label) {
    const hit = PAYOFF_HINTS.find(h => h.match.test(label));
    return hit ? hit.payoff : `You will hold your own on ${label.toLowerCase()} specifically, not in general.`;
}
/**
 * The corners of a market a learner can lean into. The first theme is the
 * market's foundations — that is the shared first week, never a focus.
 */
export function focusOptionsFor(marketId) {
    const market = markets.find(m => m.id === marketId);
    const themes = (market?.themes ?? []).slice(1);
    return themes.map(label => ({ key: slug(label), label, payoff: payoffFor(label) }));
}
export function focusLabel(marketId, key) {
    if (!key)
        return null;
    const found = focusOptionsFor(marketId).find(o => o.key === key);
    return found?.label ?? null;
}
/** Keywords used to prefer content that actually matches the chosen corner. */
export function focusKeywords(label) {
    return label
        .toLowerCase()
        .replace(/&/g, ' ')
        .split(/[^a-z0-9]+/)
        .filter(word => word.length > 3);
}
/** Offered once the foundations week is behind them and nothing is chosen yet. */
export function canChooseFocus(availableDay, current) {
    return availableDay >= FOCUS_UNLOCK_DAY && !current;
}
