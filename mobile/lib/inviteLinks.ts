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

/**
 * What the QR holds. The iPhone camera hands marketlingo:// straight to the app
 * ("Open in MarketLingo"), so adding a friend in person never touches the website.
 * Links sent in messages keep the https form, which also works without the app.
 */
export function inviteAppUrl(code: string): string {
  return `marketlingo://invite/${code}`;
}

const SCANNED_LINK_RE = /^(?:marketlingo:\/\/|https?:\/\/(?:www\.)?market-verse\.com\/)invite\/([A-Za-z0-9]{4,12})\/?(?:[?#].*)?$/i;

/**
 * The friend code inside whatever a QR held: the app link, the website link
 * (older QRs), or a bare code. Anything else, including other sites, is null.
 */
export function codeFromScan(data: unknown): string | null {
  if (typeof data !== 'string') return null;
  const text = data.trim();
  const link = SCANNED_LINK_RE.exec(text);
  if (link) return normalizeInviteCode(link[1]);
  return text.includes('/') || text.includes(':') ? null : normalizeInviteCode(text);
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
