/**
 * Invite links and the share text, with no app dependencies so they can be
 * tested on their own. lib/invites re-exports everything here.
 */

export const INVITE_ORIGIN = 'https://market-verse.com';

const CODE_RE = /^[A-Z0-9]{4,12}$/;

export function normalizeInviteCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  return CODE_RE.test(code) ? code : null;
}

export function inviteUrl(code: string): string {
  return `${INVITE_ORIGIN}/invite/${code}`;
}

export function inviteMessage(industry: string | null | undefined, code: string): string {
  const what = industry?.trim() ? industry.trim() : 'industries';
  return `Add me on MarketLingo! I'm learning ${what}, 5 minutes a day. Tap to add me: ${inviteUrl(code)} (or enter my friend code ${code})`;
}

/**
 * What the share sheet gets. On iPhone the link goes in `url`, so Messages shows
 * a tappable card that opens the app straight to adding you (or the App Store
 * for someone without it); Android only takes text, so the link stays inline.
 */
export function inviteShareContent(industry: string | null | undefined, code: string, platform: string): { message: string; url?: string } {
  const what = industry?.trim() ? industry.trim() : 'industries';
  if (platform === 'ios') {
    return { message: `Add me on MarketLingo! I'm learning ${what}, 5 minutes a day. My friend code: ${code}`, url: inviteUrl(code) };
  }
  return { message: inviteMessage(industry, code) };
}
