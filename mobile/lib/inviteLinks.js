const INVITE_ORIGIN = "https://market-verse.com";
const CODE_RE = /^[A-Z0-9]{4,12}$/;
function normalizeInviteCode(raw) {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return CODE_RE.test(code) ? code : null;
}
function inviteUrl(code) {
  return `${INVITE_ORIGIN}/invite/${code}`;
}
function inviteMessage(industry, code) {
  const what = industry?.trim() ? industry.trim() : "industries";
  return `Add me on MarketLingo! I'm learning ${what}, 5 minutes a day. Tap to add me: ${inviteUrl(code)} (or enter my friend code ${code})`;
}
function inviteShareContent(industry, code, platform) {
  const what = industry?.trim() ? industry.trim() : "industries";
  if (platform === "ios") {
    return { message: `Add me on MarketLingo! I'm learning ${what}, 5 minutes a day. My friend code: ${code}`, url: inviteUrl(code) };
  }
  return { message: inviteMessage(industry, code) };
}
export {
  INVITE_ORIGIN,
  inviteMessage,
  inviteShareContent,
  inviteUrl,
  normalizeInviteCode
};
