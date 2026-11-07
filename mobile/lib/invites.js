import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { log } from "./logger";
const PENDING_INVITE_KEY = "@marketlingo/pending_invite";
import { INVITE_ORIGIN, normalizeInviteCode, inviteUrl, inviteMessage, inviteShareContent } from "./inviteLinks";
import { normalizeInviteCode as normalizeInviteCode2 } from "./inviteLinks";
async function savePendingInvite(code) {
  try {
    await AsyncStorage.setItem(PENDING_INVITE_KEY, code);
  } catch (err) {
    log.warn("Could not save invite code", err);
  }
}
async function acceptInvite(code) {
  const { data, error } = await supabase.rpc("accept_invite", { p_code: code });
  if (error || !data) {
    log.warn("accept_invite failed", error);
    return { status: "error" };
  }
  const res = data;
  if (res.status === "connected" && res.friendship_id) {
    supabase.functions.invoke("friend-request-notify", { body: { friendshipId: res.friendship_id, kind: "invite" } }).catch((err) => log.warn("Invite push failed", err));
  }
  if (res.status === "connected" || res.status === "already") {
    return { status: res.status, name: res.name || "your friend" };
  }
  return { status: res.status === "own_code" ? "own_code" : "invalid" };
}
async function applyPendingInvite() {
  let code = null;
  try {
    code = normalizeInviteCode2(await AsyncStorage.getItem(PENDING_INVITE_KEY));
  } catch {
    return null;
  }
  if (!code) return null;
  const result = await acceptInvite(code);
  if (result.status !== "error") {
    await AsyncStorage.removeItem(PENDING_INVITE_KEY).catch(() => {
    });
  }
  return result;
}
function inviteToast(result) {
  if (!result) return null;
  switch (result.status) {
    case "connected":
      return `You and ${result.name} are now friends`;
    case "already":
      return `You and ${result.name} are already friends`;
    case "own_code":
      return "That's your own code";
    case "invalid":
      return "That invite code isn't valid";
    default:
      return "Invite not applied. Please try again.";
  }
}
export {
  INVITE_ORIGIN,
  PENDING_INVITE_KEY,
  acceptInvite,
  applyPendingInvite,
  inviteMessage,
  inviteShareContent,
  inviteToast,
  inviteUrl,
  normalizeInviteCode,
  savePendingInvite
};
