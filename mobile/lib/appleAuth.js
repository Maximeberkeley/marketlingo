import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { supabase } from "./supabase";
import { normalizeDisplayName } from "./displayName";
function appleDisplayName(fullName) {
  const name = fullName?.givenName?.trim() || fullName?.familyName?.trim();
  return name ? normalizeDisplayName(name) : null;
}
async function appleSignInAvailable() {
  if (Platform.OS !== "ios") return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}
async function signInWithApple() {
  try {
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL
      ],
      nonce: hashedNonce
    });
    if (!credential.identityToken) return { status: "error", error: "Apple did not return a sign-in token. Try again." };
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      nonce: rawNonce
    });
    if (error || !data.user) return { status: "error", error: error?.message || "Apple sign-in failed. Try again." };
    const { data: profile } = await supabase.from("profiles").select("selected_market").eq("id", data.user.id).maybeSingle();
    return {
      status: "ok",
      userId: data.user.id,
      givenName: appleDisplayName(credential.fullName),
      isNew: !profile?.selected_market
    };
  } catch (e) {
    if (e?.code === "ERR_REQUEST_CANCELED") return { status: "canceled" };
    return { status: "error", error: e?.message || "Apple sign-in failed. Try again." };
  }
}
async function saveAppleDisplayName(userId, name) {
  const clean = name ? normalizeDisplayName(name) : "";
  if (!clean) return;
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
  if (profile?.display_name) return;
  await Promise.allSettled([
    supabase.from("profiles").update({ display_name: clean }).eq("id", userId),
    supabase.auth.updateUser({ data: { display_name: clean } })
  ]);
}
export {
  appleDisplayName,
  appleSignInAvailable,
  saveAppleDisplayName,
  signInWithApple
};
